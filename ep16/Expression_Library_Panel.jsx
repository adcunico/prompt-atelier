/**********************************************************************
 * Expression_Library_Panel.jsx  —  ScriptUI panel
 * -------------------------------------------------------------------
 * 27 motion-design expressions with editable parameters, applied to a
 * chosen property on the selected layers.
 *
 * TO RUN ONCE:  File > Scripts > Run Script File...
 * TO DOCK IT:   copy into
 *                 <AE install>/Support Files/Scripts/ScriptUI Panels/
 *               restart AE, then Window > Expression_Library_Panel.jsx
 *
 * 1-14   single-property modifiers — take a value, change it
 * 15-27  rigging — layers that read each other, or read the comp
 *
 * Where it makes sense, parameters live on Slider Controls instead of
 * being baked into the text, so you keep tweaking in Effect Controls
 * and can keyframe them.
 *********************************************************************/

(function expressionLibrary(thisObj) {

    /*==================================================================
      1. TARGETS
    ==================================================================*/

    var TARGETS = [
        { n: "Scale",               m: "ADBE Scale",          lvl: "xf" },
        { n: "Position",            m: "ADBE Position",       lvl: "xf" },
        { n: "Rotation",            m: "ADBE Rotate Z",       lvl: "xf" },
        { n: "Orientation",         m: "ADBE Orientation",    lvl: "xf" },
        { n: "Opacity",             m: "ADBE Opacity",        lvl: "xf" },
        { n: "Anchor Point",        m: "ADBE Anchor Point",   lvl: "xf" },
        { n: "Source Text",         m: "ADBE Text Document",  lvl: "text" },
        { n: "Time Remap",          m: "ADBE Time Remapping", lvl: "layer" },
        { n: "Selected properties", m: null,                  lvl: "sel" }
    ];

    function targetIndex(name) {
        for (var i = 0; i < TARGETS.length; i++) if (TARGETS[i].n === name) return i;
        return 0;
    }
    function targetByMatch(m) {
        for (var i = 0; i < TARGETS.length; i++) if (TARGETS[i].m === m) return TARGETS[i];
        return TARGETS[0];
    }

    /*==================================================================
      2. FORMATTING
    ==================================================================*/

    function num(n) {
        var s = (Math.round(n * 10000) / 10000).toString();
        return (s.indexOf(".") === -1) ? s + ".0" : s;
    }
    /* NB: not called "int" - that is a FutureReservedWord in ECMAScript 3,
       which is what ExtendScript parses, so it fails with "Expected :". */
    function intStr(n) { return String(Math.round(n)); }
    function q(s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; }
    function L(name) { return "thisComp.layer(" + q(name) + ")"; }

    function head(entry, v, linked) {
        var s = "";
        for (var i = 0; i < entry.nums.length; i++) {
            var p = entry.nums[i];
            var rhs = (linked && p.link)
                ? 'effect("' + p.link + '")("Slider")'
                : (p.isInt ? intStr(v[p.k]) : num(v[p.k]));
            s += p.k + " = " + rhs + ";\n";
        }
        return s;
    }

    var BOUNCE_BODY =
        "\nn = 0;\n" +
        "if (numKeys > 0) {\n" +
        "  n = nearestKey(time).index;\n" +
        "  if (key(n).time > time) n--;\n" +
        "}\n\n" +
        "if (n == 0) {\n  value;\n} else {\n" +
        "  t = time - key(n).time;\n" +
        "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\n" +
        "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\n}";


    /*==================================================================
      3. THE LIBRARY
      nums    — numeric params   {k,label,min,max,def,isInt,link}
      choices — dropdowns        {k,label,opts[]}
      texts   — free text        {k,label,def}
      layers  — layer pickers    {k,label}
      multi   — writes several properties at once: [{t:matchName,build}]
    ==================================================================*/

    var LIB = [

    /* ─────────────  1–14  single-property modifiers  ───────────── */

    { name: "Bounce",
      desc: "Overshoot after each keyframe. UI pops, logos, text, buttons.",
      nums: [ {k:"amp",min:0,max:0.6,def:0.1,label:"Amp",link:"Bounce Amp"},
              {k:"freq",min:0.1,max:8,def:3,label:"Freq",link:"Bounce Freq"},
              {k:"decay",min:0.1,max:12,def:4,label:"Decay",link:"Bounce Decay"} ],
      presets: [ {n:"Default",       v:{amp:0.10, freq:3.0, decay:4}},
                 {n:"Gentle settle", v:{amp:0.06, freq:1.8, decay:5}},
                 {n:"Springy",       v:{amp:0.15, freq:3.0, decay:1.5}},
                 {n:"Heavy",         v:{amp:0.22, freq:1.2, decay:1}},
                 {n:"Long ring",     v:{amp:0.12, freq:2.6, decay:0.8}} ],
      linkable:true, needsKeys:true, target:"Scale",
      build: function (v, k) { return head(this, v, k) + BOUNCE_BODY; } },

    { name: "Loop",
      desc: "Repeat the keyframed animation forever.",
      nums: [ {k:"keys",label:"Keyframes",min:0,max:20,def:0,isInt:true} ],
      choices: [ {k:"type",label:"Type",opts:["cycle","pingpong","offset","continue"]},
                 {k:"dir",label:"Direction",opts:["Out (after)","In (before)","Both"]} ],
      needsKeys:true, target:"Position",
      build: function (v) {
          if (v.type === "continue") {
              if (v.dir === "In (before)") return 'loopIn("continue")';
              if (v.dir === "Both") return 'loopIn("continue") + loopOut("continue") - value';
              return 'loopOut("continue")';
          }
          var a = q(v.type) + ", " + intStr(v.keys);
          if (v.dir === "In (before)") return "loopIn(" + a + ")";
          if (v.dir === "Both") return "// Numeric properties only — the -value cancels the doubled base.\n" +
                                       "loopIn(" + a + ") + loopOut(" + a + ") - value";
          return "loopOut(" + a + ")";
      } },

    { name: "Wiggle",
      desc: "Organic random movement. Handheld feel, floating objects.",
      nums: [ {k:"freq",label:"Freq",min:0.1,max:20,def:2,link:"Wiggle Freq"},
              {k:"amp",label:"Amount",min:0,max:400,def:20,link:"Wiggle Amount"} ],
      presets: [ {n:"Handheld camera", v:{freq:1,   amp:10}},
                 {n:"Floaty",          v:{freq:0.6, amp:26}},
                 {n:"Energetic",       v:{freq:5,   amp:30}},
                 {n:"Glitch",          v:{freq:14,  amp:12}} ],
      linkable:true, target:"Position",
      build: function (v, k) { return head(this, v, k) + "\nwiggle(freq, amp)"; } },

    { name: "Smooth",
      desc: "Averages out jitter. Tracked footage, noisy keyframes.",
      nums: [ {k:"width",label:"Width",min:0.01,max:2,def:0.2,link:"Smooth Width"},
              {k:"samples",label:"Samples",min:2,max:30,def:5,isInt:true,link:"Smooth Samples"} ],
      linkable:true, needsKeys:true, target:"Position",
      build: function (v, k) { return head(this, v, k) + "\nsmooth(width, samples)"; } },

    { name: "Posterize Time",
      desc: "Steps the property to a lower frame rate. Stop-motion feel.",
      nums: [ {k:"fps",label:"FPS",min:1,max:30,def:12,isInt:true} ],
      target:"Position",
      build: function (v) { return "posterizeTime(" + intStr(v.fps) + ");\nvalue;"; } },

    { name: "Random",
      desc: "Random value in a range. Re-rolls every frame — it flickers.",
      nums: [ {k:"lo",label:"Min",min:-1000,max:1000,def:0},
              {k:"hi",label:"Max",min:-1000,max:1000,def:100} ],
      target:"Opacity",
      build: function (v) { return "// Flickers by design. For one stable value use Seed Random.\n" +
                                   "random(" + num(v.lo) + ", " + num(v.hi) + ")"; } },

    { name: "Seed Random",
      desc: "One stable random value per layer index. Grids, staggers.",
      nums: [ {k:"lo",label:"Min",min:-1000,max:1000,def:0},
              {k:"hi",label:"Max",min:-1000,max:1000,def:100} ],
      choices: [ {k:"seed",label:"Seed from",opts:["Layer index","Layer index + 1","Custom"]},
                 {k:"timeless",label:"Over time",opts:["Frozen (timeless)","Changes each frame"]} ],
      target:"Opacity",
      build: function (v) {
          var s = (v.seed === "Custom") ? "7" : (v.seed === "Layer index + 1" ? "index + 1" : "index");
          return "seedRandom(" + s + ", " + (v.timeless === "Frozen (timeless)" ? "true" : "false") + ");\n" +
                 "random(" + num(v.lo) + ", " + num(v.hi) + ")";
      } },

    { name: "Delay (follow layer above)",
      desc: "Each layer trails the one above it. Staggered reveals.",
      nums: [ {k:"delay",label:"Delay s",min:0.01,max:2,def:0.1,link:"Follow Delay"} ],
      choices: [ {k:"prop",label:"Follow",opts:["position","scale","rotation","opacity","anchorPoint"]} ],
      linkable:true, target:"Position",
      build: function (v, k) {
          return head(this, v, k) + "idx = index - 1;\n\n" +
                 "// Guard: the topmost layer has nothing above it.\n" +
                 "if (idx < 1) {\n  value;\n} else {\n" +
                 "  thisComp.layer(idx).transform." + v.prop + ".valueAtTime(time - delay);\n}";
      } },

    { name: "Time Remap Loop",
      desc: "Loops footage or a precomp. Panel enables Time Remapping.",
      choices: [ {k:"type",label:"Type",opts:["cycle","pingpong","offset"]} ],
      needsKeys:true, target:"Time Remap",
      build: function (v) { return "loopOut(" + q(v.type) + ")"; } },

    { name: "Auto-Orient to Motion",
      desc: "Points a layer along its direction of travel.",
      nums: [ {k:"d",label:"Sample s",min:0.001,max:0.2,def:0.01} ],
      choices: [ {k:"mode",label:"Mode",opts:["2D rotation","3D lookAt"]},
                 {k:"flip",label:"Facing",opts:["Forward","Flipped 180"]} ],
      target:"Rotation",
      build: function (v) {
          var d = num(v.d);
          if (v.mode === "3D lookAt")
              return "// 3D layer + Orientation only.\nd = " + d + ";\n" +
                     "lookAt(position.valueAtTime(time - d), position)";
          return "d = " + d + ";\np1 = position.valueAtTime(time - d);\np2 = position;\n" +
                 "radiansToDegrees(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]))" +
                 (v.flip === "Flipped 180" ? " + 180" : "");
      } },

    { name: "Slider Control link",
      desc: "Point a property at one slider, so it can drive many things.",
      texts: [ {k:"sname",label:"Slider",def:"Master"} ],
      target:"Scale", makesSlider:true,
      build: function (v) { return 'effect(' + q(v.sname) + ')("Slider")'; } },

    { name: "Linear map",
      desc: "Straight-line remap of one range onto another.",
      nums: [ {k:"inMin",label:"In min",min:-2000,max:2000,def:0},
              {k:"inMax",label:"In max",min:-2000,max:2000,def:100},
              {k:"outMin",label:"Out min",min:-2000,max:2000,def:0},
              {k:"outMax",label:"Out max",min:-2000,max:2000,def:500} ],
      choices: [ {k:"src",label:"Input",opts:["This property's value","Slider Control"]} ],
      texts: [ {k:"sname",label:"Slider",def:"Master"} ],
      target:"Scale", makesSlider:true,
      build: function (v) {
          var s = (v.src === "Slider Control") ? 'effect(' + q(v.sname) + ')("Slider")' : "value";
          return "linear(" + s + ", " + num(v.inMin) + ", " + num(v.inMax) + ", " +
                 num(v.outMin) + ", " + num(v.outMax) + ")";
      } },

    { name: "Ease map",
      desc: "Same as Linear map but eased at both ends.",
      nums: [ {k:"inMin",label:"In min",min:-2000,max:2000,def:0},
              {k:"inMax",label:"In max",min:-2000,max:2000,def:100},
              {k:"outMin",label:"Out min",min:-2000,max:2000,def:0},
              {k:"outMax",label:"Out max",min:-2000,max:2000,def:500} ],
      choices: [ {k:"src",label:"Input",opts:["This property's value","Slider Control"]} ],
      texts: [ {k:"sname",label:"Slider",def:"Master"} ],
      target:"Scale", makesSlider:true,
      build: function (v) {
          var s = (v.src === "Slider Control") ? 'effect(' + q(v.sname) + ')("Slider")' : "value";
          return "ease(" + s + ", " + num(v.inMin) + ", " + num(v.inMax) + ", " +
                 num(v.outMin) + ", " + num(v.outMax) + ")";
      } },

    { name: "Clamp",
      desc: "Stops a value leaving its range. Counters, progress bars.",
      nums: [ {k:"lo",label:"Min",min:-2000,max:2000,def:0},
              {k:"hi",label:"Max",min:-2000,max:2000,def:100} ],
      target:"Opacity",
      build: function (v) { return "clamp(value, " + num(v.lo) + ", " + num(v.hi) + ")"; } },

    /* ─────────────  15–27  rigging  ───────────── */

    { name: "Auto-size box behind text",
      desc: "A shape that resizes itself to fit a text layer, plus padding. Lower thirds, tags, buttons.",
      hint: "Select the Rectangle Path's SIZE (or Position) in the timeline, then Apply.",
      nums: [ {k:"padX",label:"Pad X",min:0,max:300,def:40,link:"Box Pad X"},
              {k:"padY",label:"Pad Y",min:0,max:300,def:24,link:"Box Pad Y"} ],
      choices: [ {k:"out",label:"Writes",opts:["Rect Size","Rect Position (centre)"]} ],
      layers: [ {k:"txt",label:"Text layer"} ],
      linkable:true, target:"Selected properties",
      build: function (v, k) {
          var pre = "t = " + L(v.txt) + ";\nr = t.sourceRectAtTime(time, false);\n";
          if (v.out === "Rect Position (centre)")
              return pre + "\n// Centres the rectangle on the text's own bounds.\n" +
                     "[r.left + r.width/2, r.top + r.height/2]";
          return head(this, v, k) + pre + "\n[r.width + padX*2, r.height + padY*2]";
      } },

    { name: "Number counter",
      desc: "A slider driving formatted numbers — separators, decimals, prefix and suffix.",
      hint: "Apply to a text layer's Source Text. Drives off a Slider Control.",
      nums: [ {k:"dec",label:"Decimals",min:0,max:4,def:0,isInt:true},
              {k:"pad",label:"Min digits",min:0,max:8,def:0,isInt:true} ],
      choices: [ {k:"sep",label:"Separator",opts:["Comma","Space","None"]} ],
      texts: [ {k:"sname",label:"Slider",def:"Counter"},
               {k:"pre",label:"Prefix",def:""} ],
      target:"Source Text", makesSlider:true,
      build: function (v) {
          var sepChar = (v.sep === "Comma") ? '","' : (v.sep === "Space" ? '" "' : '""');
          var s = "v   = effect(" + q(v.sname) + ')("Slider");\n' +
                  "dec = " + intStr(v.dec) + ";\n" +
                  "pad = " + intStr(v.pad) + ";\n" +
                  "sep = " + sepChar + ";\n\n" +
                  "neg = v < 0;\n" +
                  "s = Math.abs(v).toFixed(dec);\n" +
                  "parts = s.split(\".\");\n" +
                  "w = parts[0];\n" +
                  "while (w.length < pad) w = \"0\" + w;\n\n" +
                  "// group the whole part from the right\n" +
                  "out = \"\";\n" +
                  "while (w.length > 3 && sep != \"\") {\n" +
                  "  out = sep + w.substr(w.length - 3) + out;\n" +
                  "  w = w.substr(0, w.length - 3);\n" +
                  "}\n" +
                  "out = w + out;\n" +
                  "if (parts.length > 1) out = out + \".\" + parts[1];\n\n" +
                  "(neg ? \"-\" : \"\") + " + q(v.pre) + " + out";
          return s;
      } },

    { name: "Connector line (A to B)",
      desc: "A bar that stretches and rotates to join two layers, and stays attached when either moves.",
      hint: "Use a SOLID or shape whose anchor point sits on its LEFT edge. Writes Position, Rotation and Scale.",
      layers: [ {k:"la",label:"From layer"}, {k:"lb",label:"To layer"} ],
      target:"Position",
      multi: [
        { t:"ADBE Position", build: function (v) {
            return "a = " + L(v.la) + ";\na.toComp(a.anchorPoint)"; } },
        { t:"ADBE Rotate Z", build: function (v) {
            return "a = " + L(v.la) + ";\nb = " + L(v.lb) + ";\n" +
                   "p1 = a.toComp(a.anchorPoint);\np2 = b.toComp(b.anchorPoint);\n" +
                   "radiansToDegrees(Math.atan2(p2[1] - p1[1], p2[0] - p1[0]))"; } },
        { t:"ADBE Scale", build: function (v) {
            return "a = " + L(v.la) + ";\nb = " + L(v.lb) + ";\n" +
                   "p1 = a.toComp(a.anchorPoint);\np2 = b.toComp(b.anchorPoint);\n" +
                   "d = length(p1, p2);\n" +
                   "w = thisLayer.sourceRectAtTime(time, false).width;\n" +
                   "if (w == 0) w = 1;\n[d / w * 100, value[1]]"; } }
      ],
      build: function (v) {
          var s = "";
          for (var i = 0; i < this.multi.length; i++) {
              s += "// → " + targetByMatch(this.multi[i].t).n + "\n" +
                   this.multi[i].build(v) + (i < this.multi.length - 1 ? "\n\n" : "");
          }
          return s;
      } },

    { name: "Inertia (velocity spring)",
      desc: "Springs on past the keyframe and settles. Better-behaved than Bounce — amplitude scales with the curve.",
      nums: [ {k:"freq",label:"Freq",min:0.2,max:8,def:3,link:"Inertia Freq"},
              {k:"decay",label:"Decay",min:0.5,max:20,def:5,link:"Inertia Decay"} ],
      presets: [ {n:"Default", v:{freq:3, decay:5}},
                 {n:"Tight",   v:{freq:4, decay:9}},
                 {n:"Loose",   v:{freq:2, decay:2.5}} ],
      linkable:true, needsKeys:true, target:"Position",
      build: function (v, k) {
          return head(this, v, k) +
                 "\nn = 0;\n" +
                 "if (numKeys > 0) {\n  n = nearestKey(time).index;\n" +
                 "  if (key(n).time > time) n--;\n}\n\n" +
                 "if (n == 0) {\n  value;\n} else {\n" +
                 "  t = time - key(n).time;\n" +
                 "  amp = velocityAtTime(key(n).time - thisComp.frameDuration/10);\n" +
                 "  w = freq * Math.PI * 2;\n" +
                 "  value + amp * (Math.sin(t*w) / Math.exp(decay*t) / w);\n}";
      } },

    { name: "Wiggle (axis + gate)",
      desc: "Wiggle one axis only, and only between two times. What plain wiggle() can't do.",
      nums: [ {k:"freq",label:"Freq",min:0.1,max:20,def:2,link:"Wiggle Freq"},
              {k:"amp",label:"Amount",min:0,max:400,def:30,link:"Wiggle Amount"},
              {k:"t0",label:"Start s",min:0,max:60,def:0},
              {k:"t1",label:"End s",min:0,max:60,def:10} ],
      choices: [ {k:"axis",label:"Axis",opts:["Both","X only","Y only"]} ],
      linkable:true, target:"Position",
      build: function (v, k) {
          var pick = (v.axis === "X only") ? "[w[0], value[1]]"
                   : (v.axis === "Y only") ? "[value[0], w[1]]" : "w";
          // t0 / t1 are declared by head() — they are numeric params.
          return head(this, v, k) +
                 "\nif (time < t0 || time > t1) {\n  value;\n} else {\n" +
                 "  w = wiggle(freq, amp);\n" +
                 (v.axis === "Both" ? "  w;\n}" :
                  "  // single axis — 2D/3D properties only\n  " + pick + ";\n}");
      } },

    { name: "Checkbox toggle",
      desc: "A Checkbox Control switching a property between two values.",
      nums: [ {k:"on",label:"When on",min:-2000,max:2000,def:100},
              {k:"off",label:"When off",min:-2000,max:2000,def:0} ],
      texts: [ {k:"cname",label:"Checkbox",def:"Toggle"} ],
      target:"Opacity", makesCheckbox:true,
      build: function (v) {
          return "on = effect(" + q(v.cname) + ')("Checkbox");\n\n' +
                 "on == 1 ? " + num(v.on) + " : " + num(v.off);
      } },

    { name: "Dropdown switch",
      desc: "A Dropdown Menu Control picking between three values. The basis of a reusable template.",
      hint: "Add Effect > Expression Controls > Dropdown Menu Control and rename its items yourself.",
      nums: [ {k:"v1",label:"Item 1",min:-2000,max:2000,def:100},
              {k:"v2",label:"Item 2",min:-2000,max:2000,def:50},
              {k:"v3",label:"Item 3",min:-2000,max:2000,def:0} ],
      texts: [ {k:"dname",label:"Dropdown",def:"Mode"} ],
      target:"Opacity",
      build: function (v) {
          return "m = effect(" + q(v.dname) + ')("Menu");\n\n' +
                 "if (m == 1) " + num(v.v1) + "\n" +
                 "else if (m == 2) " + num(v.v2) + "\n" +
                 "else " + num(v.v3);
      } },

    { name: "Attach to 3D layer (toComp)",
      desc: "Pins a 2D layer to a point on a 3D layer, so callouts follow objects through a camera move.",
      nums: [ {k:"ox",label:"Offset X",min:-800,max:800,def:0},
              {k:"oy",label:"Offset Y",min:-800,max:800,def:0} ],
      layers: [ {k:"tgt",label:"3D layer"} ],
      target:"Position",
      build: function (v) {
          return "t = " + L(v.tgt) + ";\n" +
                 "p = t.toComp(t.anchorPoint);\n\n" +
                 "[p[0] + " + num(v.ox) + ", p[1] + " + num(v.oy) + "]";
      } },

    { name: "Time offset by index",
      desc: "Self-contained stagger — each layer plays its own animation late. Survives reordering, unlike Delay.",
      nums: [ {k:"delay",label:"Delay s",min:0.01,max:2,def:0.1,link:"Stagger Delay"} ],
      choices: [ {k:"dir",label:"Order",opts:["Top down","Bottom up"]} ],
      linkable:true, needsKeys:true, target:"Position",
      build: function (v, k) {
          var idx = (v.dir === "Bottom up")
              ? "(thisComp.numLayers - index)"
              : "(index - 1)";
          return head(this, v, k) +
                 "off = " + idx + " * delay;\n\n" +
                 "valueAtTime(time - off)";
      } },

    { name: "Audio amplitude driver",
      desc: "Drives a property from an audio layer's amplitude. Music-led graphics.",
      hint: "Select the audio layer first and run Animation > Keyframe Assistant > Convert Audio to Keyframes.",
      nums: [ {k:"inMax",label:"Amp max",min:1,max:100,def:30},
              {k:"outMin",label:"Out min",min:-2000,max:2000,def:100},
              {k:"outMax",label:"Out max",min:-2000,max:2000,def:140} ],
      choices: [ {k:"chan",label:"Channel",opts:["Both Channels","Left Channel","Right Channel"]} ],
      layers: [ {k:"aud",label:"Amplitude layer"} ],
      target:"Scale",
      build: function (v) {
          return "a = " + L(v.aud) + ".effect(" + q(v.chan) + ')("Slider");\n\n' +
                 "s = linear(a, 0, " + num(v.inMax) + ", " + num(v.outMin) + ", " + num(v.outMax) + ");\n" +
                 "[s, s]";
      } },

    { name: "Snap to increments",
      desc: "Quantises a value to a step. Grid-aligned motion, stepped counters.",
      nums: [ {k:"step",label:"Step",min:0.01,max:200,def:10,link:"Snap Step"} ],
      linkable:true, target:"Position",
      build: function (v, k) {
          return head(this, v, k) +
                 "\nif (step == 0) {\n  value;\n} else if (value.length) {\n" +
                 "  r = [];\n  for (i = 0; i < value.length; i++) r[i] = Math.round(value[i]/step)*step;\n  r;\n" +
                 "} else {\n  Math.round(value/step)*step;\n}";
      } },

    { name: "Timecode / countdown",
      desc: "Live clock, elapsed timer or countdown as text.",
      hint: "Apply to a text layer's Source Text.",
      nums: [ {k:"dur",label:"From s",min:1,max:3600,def:60},
              {k:"dec",label:"Decimals",min:0,max:2,def:0,isInt:true} ],
      choices: [ {k:"mode",label:"Mode",opts:["Countdown mm:ss","Elapsed mm:ss","Seconds only","Timecode"]} ],
      target:"Source Text",
      build: function (v) {
          if (v.mode === "Timecode") return "timeToTimecode(time, 0, false)";
          if (v.mode === "Seconds only")
              return "dur = " + num(v.dur) + ";\n" +
                     "Math.max(0, dur - time).toFixed(" + intStr(v.dec) + ")";
          var src = (v.mode === "Countdown mm:ss")
              ? "dur = " + num(v.dur) + ";\nr = Math.max(0, dur - time);\n"
              : "r = time;\n";
          return src +
                 "m = Math.floor(r / 60);\n" +
                 "s = Math.floor(r % 60);\n\n" +
                 'm + ":" + (s < 10 ? "0" + s : "" + s)';
      } },

    { name: "Sample colour (sampleImage)",
      desc: "Reads a pixel from another layer and uses it as a colour. Data-driven fills, gradient pickers.",
      hint: "Apply to a Fill effect's Color, or any colour property. The source layer must be visible.",
      nums: [ {k:"rad",label:"Sample px",min:1,max:40,def:2} ],
      layers: [ {k:"src",label:"Source layer"} ],
      target:"Selected properties",
      build: function (v) {
          return "s = " + L(v.src) + ";\n" +
                 "r = " + num(v.rad) + ";\n" +
                 "p = thisLayer.toComp(thisLayer.anchorPoint);\n\n" +
                 "// sampleImage wants comp-space coords and returns [r,g,b,a]\n" +
                 "s.sampleImage(p, [r, r], true, time)";
      } },

    { name: "Text bounce per character",
      desc: "Every character springs in on its own delay, from the layer's in point. No keyframes needed.",
      hint: "Select a TEXT layer. Apply builds the whole rig: a Text Animator, the property, and an Expression Selector.",
      nums: [ {k:"delay",label:"Per char s",min:0.005,max:0.4,def:0.05},
              {k:"a",label:"Amount",min:10,max:200,def:100},
              {k:"f",label:"Freq",min:0.2,max:8,def:2.1},
              {k:"d",label:"Decay",min:1,max:24,def:8} ],
      choices: [ {k:"prop",label:"Animate",opts:["Scale","Position","Opacity"]},
                 {k:"dims",label:"Returns",opts:["Both axes [s,s]","Single value s"]} ],
      presets: [ {n:"Default",   v:{delay:0.05, a:100, f:2.1, d:8}},
                 {n:"Snappy",    v:{delay:0.03, a:100, f:3.2, d:12}},
                 {n:"Loose wave",v:{delay:0.09, a:120, f:1.6, d:5}} ],
      target:"Selected properties", buildsTextRig:true,
      build: function (v) {
          var ret = (v.dims === "Single value s" || v.prop === "Opacity") ? "s;" : "[s, s];";
          return "delay = " + num(v.delay) + ";\n" +
                 "t = time - inPoint - textIndex*delay;\n\n" +
                 "if (t < 0) {\n  value;\n} else {\n" +
                 "  a = " + num(v.a) + ";\n" +
                 "  f = " + num(v.f) + ";\n" +
                 "  d = " + num(v.d) + ";\n" +
                 "  s = a*Math.cos(f*t*2*Math.PI)/Math.exp(d*t);\n" +
                 "  " + ret + "\n}";
      } }

    ];


    /*==================================================================
      4. AE HELPERS
    ==================================================================*/

    function ensureEffect(layer, matchName, name, value, valueMatch) {
        var fx = layer.property("ADBE Effect Parade"), found = null;
        for (var i = 1; i <= fx.numProperties; i++) {
            if (fx.property(i).name === name) { found = fx.property(i); break; }
        }
        if (!found) { found = fx.addProperty(matchName); found.name = name; }
        if (value !== undefined && value !== null && valueMatch) {
            try { found.property(valueMatch).setValue(value); } catch (e) {}
        }
        return found;
    }
    function ensureSlider(layer, name, value) {
        return ensureEffect(layer, "ADBE Slider Control", name, value, "ADBE Slider Control-0001");
    }
    function ensureCheckbox(layer, name) {
        return ensureEffect(layer, "ADBE Checkbox Control", name, null, null);
    }

    function propFor(layer, tgt) {
        var out = [];
        if (tgt.lvl === "sel") {
            var sel = layer.selectedProperties;
            for (var i = 0; i < sel.length; i++) {
                try {
                    if (sel[i].propertyType === PropertyType.PROPERTY && sel[i].canSetExpression) out.push(sel[i]);
                } catch (e) {}
            }
            return out;
        }
        if (tgt.lvl === "text") {
            try {
                var tp = layer.property("ADBE Text Properties");
                var td = tp ? tp.property("ADBE Text Document") : null;
                if (td && td.canSetExpression) out.push(td);
            } catch (e2) {}
            return out;
        }
        if (tgt.lvl === "layer") {
            try {
                if (tgt.m === "ADBE Time Remapping" && !layer.timeRemapEnabled) layer.timeRemapEnabled = true;
                var lp = layer.property(tgt.m);
                if (lp && lp.canSetExpression) out.push(lp);
            } catch (e3) {}
            return out;
        }
        try {
            var tg = layer.property("ADBE Transform Group");
            var p = tg ? tg.property(tgt.m) : null;
            if (p && p.canSetExpression) out.push(p);
        } catch (e4) {}
        return out;
    }

    /**
     * Builds a per-character text rig and hands back the property the
     * expression belongs on.
     *
     * `textIndex` only exists inside a Text Animator's EXPRESSION SELECTOR,
     * so this creates: Animator -> the animated property -> Expression
     * Selector, and returns the selector's Amount. The default Range
     * Selector that AE adds with every new animator is removed, or it
     * would combine with the expression selector and double the effect.
     *
     * Returns null (rather than throwing) if the layer is not text.
     */
    function makeTextRig(layer, which) {
        var tp;
        try { tp = layer.property("ADBE Text Properties"); } catch (e) { return null; }
        if (!tp) return null;

        var animators = tp.property("ADBE Text Animators");
        if (!animators) return null;

        var RIG = "Bounce Rig", anim = null, i;
        for (i = 1; i <= animators.numProperties; i++) {
            if (animators.property(i).name === RIG) { anim = animators.property(i); break; }
        }
        if (!anim) { anim = animators.addProperty("ADBE Text Animator"); anim.name = RIG; }

        /* the animated property */
        var props = anim.property("ADBE Text Animator Properties");
        var mn = (which === "Position") ? "ADBE Text Position 3D"
               : (which === "Opacity")  ? "ADBE Text Opacity"
               : "ADBE Text Scale 3D";
        var tgt = null;
        for (i = 1; i <= props.numProperties; i++) {
            if (props.property(i).matchName === mn) { tgt = props.property(i); break; }
        }
        if (!tgt) tgt = props.addProperty(mn);

        /* Sensible starting offsets: the selector modulates these. Scale 0
           means characters grow from nothing, and the cosine dipping below
           zero is what produces the overshoot past 100%. */
        try {
            if (which === "Position")     tgt.setValue([0, -60, 0]);
            else if (which === "Opacity") tgt.setValue(0);
            else                          tgt.setValue([0, 0, 100]);
        } catch (e2) {
            try { tgt.setValue([0, 0]); } catch (e3) {}
        }

        /* selectors */
        var sels = anim.property("ADBE Text Selectors"), sel = null;
        for (i = 1; i <= sels.numProperties; i++) {
            if (sels.property(i).matchName === "ADBE Text Expressible Selector") { sel = sels.property(i); break; }
        }
        if (!sel) sel = sels.addProperty("ADBE Text Expressible Selector");

        /* drop AE's default Range Selector so the two don't compound */
        for (i = sels.numProperties; i >= 1; i--) {
            try {
                if (sels.property(i).matchName === "ADBE Text Selector") sels.property(i).remove();
            } catch (e4) {}
        }

        try { return sel.property("ADBE Text Expressible Amount"); } catch (e5) { return null; }
    }

    function guard(expr) {
        var body = expr.replace(/\n/g, "\n  ");
        return "try {\n  " + body + "\n} catch (err) {\n  value;\n}";
    }


    /*==================================================================
      5. UI
    ==================================================================*/

    var MAX_NUMS = 4, MAX_CHOICES = 2, MAX_TEXTS = 2, MAX_LAYERS = 2;

    function build(thisObj) {

        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Expression Library", undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 7;
        win.margins = 11;

        /* picker */
        var pickRow = win.add("group");
        pickRow.orientation = "row";
        pickRow.add("statictext", undefined, "Expression:");
        var libNames = [];
        for (var i = 0; i < LIB.length; i++) {
            var tag = (i === 14) ? "" : "";
            libNames.push((i + 1 < 10 ? "0" : "") + (i + 1) + "  " + LIB[i].name + tag);
        }
        var ddExpr = pickRow.add("dropdownlist", undefined, libNames);
        ddExpr.selection = 0;
        ddExpr.preferredSize.width = 250;

        var descTxt = win.add("statictext", undefined, "", { multiline: true });
        descTxt.preferredSize.height = 30;
        var hintTxt = win.add("statictext", undefined, "", { multiline: true });
        hintTxt.preferredSize.height = 28;

        /* presets — only shown for entries that declare any */
        var presetRow = win.add("group");
        presetRow.orientation = "row";
        presetRow.alignChildren = ["left", "center"];
        presetRow.add("statictext", undefined, "Preset:");
        var ddPreset = presetRow.add("dropdownlist", undefined, ["—"]);
        ddPreset.preferredSize.width = 190;

        /* parameters */
        var pPanel = win.add("panel", undefined, "Parameters");
        pPanel.orientation = "column";
        pPanel.alignChildren = ["fill", "top"];
        pPanel.margins = [10, 15, 10, 9];
        pPanel.spacing = 5;

        function numRow(parent) {
            var g = parent.add("group"); g.orientation = "row"; g.alignChildren = ["left", "center"];
            var lbl = g.add("statictext", undefined, ""); lbl.preferredSize.width = 72;
            var sld = g.add("slider", undefined, 0, 0, 1); sld.preferredSize.width = 132;
            var txt = g.add("edittext", undefined, "0"); txt.preferredSize.width = 56; txt.justify = "center";
            var row = { group:g, spec:null, onChange:null };
            sld.onChanging = function () {
                var v = sld.value; if (row.spec && row.spec.isInt) v = Math.round(v);
                txt.text = String(Math.round(v * 10000) / 10000);
                if (row.onChange) row.onChange();
            };
            txt.onChange = function () {
                var v = parseFloat(txt.text);
                if (isNaN(v)) { txt.text = String(sld.value); return; }
                if (row.spec) v = Math.max(row.spec.min, Math.min(row.spec.max, v));
                if (row.spec && row.spec.isInt) v = Math.round(v);
                sld.value = v; txt.text = String(v);
                if (row.onChange) row.onChange();
            };
            row.load = function (s) {
                row.spec = s; lbl.text = s.label + ":";
                sld.minvalue = s.min; sld.maxvalue = s.max; sld.value = s.def; txt.text = String(s.def);
            };
            row.get = function () {
                var v = parseFloat(txt.text);
                if (isNaN(v)) v = row.spec ? row.spec.def : 0;
                return (row.spec && row.spec.isInt) ? Math.round(v) : v;
            };
            return row;
        }

        function ddRow(parent, w) {
            var g = parent.add("group"); g.orientation = "row"; g.alignChildren = ["left", "center"];
            var lbl = g.add("statictext", undefined, ""); lbl.preferredSize.width = 72;
            var dd = g.add("dropdownlist", undefined, ["—"]); dd.preferredSize.width = w || 196;
            var row = { group:g, dd:dd, spec:null, onChange:null };
            dd.onChange = function () { if (row.onChange) row.onChange(); };
            row.load = function (s) {
                row.spec = s; lbl.text = s.label + ":";
                dd.removeAll();
                for (var i = 0; i < s.opts.length; i++) dd.add("item", s.opts[i]);
                dd.selection = 0;
            };
            row.setItems = function (label, items) {
                lbl.text = label + ":";
                dd.removeAll();
                for (var i = 0; i < items.length; i++) dd.add("item", items[i]);
                if (items.length) dd.selection = 0;
            };
            row.get = function () { return dd.selection ? dd.selection.text : ""; };
            return row;
        }

        function txtRow(parent) {
            var g = parent.add("group"); g.orientation = "row"; g.alignChildren = ["left", "center"];
            var lbl = g.add("statictext", undefined, ""); lbl.preferredSize.width = 72;
            var t = g.add("edittext", undefined, ""); t.preferredSize.width = 196;
            var row = { group:g, spec:null, onChange:null };
            t.onChange = function () { if (row.onChange) row.onChange(); };
            row.load = function (s) { row.spec = s; lbl.text = s.label + ":"; t.text = s.def; };
            row.get = function () { return t.text; };
            return row;
        }

        var numRows = [], choiceRows = [], textRows = [], layerRows = [];
        for (var a = 0; a < MAX_NUMS; a++)    numRows.push(numRow(pPanel));
        for (var b = 0; b < MAX_CHOICES; b++) choiceRows.push(ddRow(pPanel));
        for (var c = 0; c < MAX_TEXTS; c++)   textRows.push(txtRow(pPanel));
        for (var d = 0; d < MAX_LAYERS; d++)  layerRows.push(ddRow(pPanel));

        var refreshRow = pPanel.add("group");
        refreshRow.orientation = "row";
        var btnRefresh = refreshRow.add("button", undefined, "↻ Refresh layer list");
        btnRefresh.preferredSize.width = 150;

        var noParams = pPanel.add("statictext", undefined, "No parameters — apply as is.");

        /* target */
        var tPanel = win.add("panel", undefined, "Apply to");
        tPanel.orientation = "column"; tPanel.alignChildren = ["fill", "top"];
        tPanel.margins = [10, 15, 10, 9]; tPanel.spacing = 5;
        var tRow = tPanel.add("group"); tRow.orientation = "row";
        tRow.add("statictext", undefined, "Property:");
        var tNames = [];
        for (var t2 = 0; t2 < TARGETS.length; t2++) tNames.push(TARGETS[t2].n);
        var ddTarget = tRow.add("dropdownlist", undefined, tNames);
        ddTarget.selection = 0; ddTarget.preferredSize.width = 180;
        var cbAll = tPanel.add("checkbox", undefined, "All selected layers"); cbAll.value = true;

        /* mode */
        var mPanel = win.add("panel", undefined, "Options");
        mPanel.orientation = "column"; mPanel.alignChildren = ["left", "top"];
        mPanel.margins = [10, 15, 10, 9]; mPanel.spacing = 4;
        var modeRow = mPanel.add("group"); modeRow.orientation = "row";
        var rbLinked = modeRow.add("radiobutton", undefined, "Sliders on layer");
        var rbBaked  = modeRow.add("radiobutton", undefined, "Baked in");
        rbLinked.value = true;
        var cbGuard = mPanel.add("checkbox", undefined, "Wrap in try/catch (survives a deleted layer)");

        /* preview */
        var xPanel = win.add("panel", undefined, "Expression");
        xPanel.orientation = "column"; xPanel.alignChildren = ["fill", "top"];
        xPanel.margins = [10, 15, 10, 9];
        var preview = xPanel.add("edittext", undefined, "", { multiline:true, readonly:true, scrolling:true });
        preview.preferredSize.height = 155;

        var bRow = win.add("group"); bRow.orientation = "row"; bRow.alignChildren = ["fill", "center"];
        var btnApply  = bRow.add("button", undefined, "Apply");
        var btnRemove = bRow.add("button", undefined, "Remove");

        var status = win.add("statictext", undefined, "Pick an expression, select a layer, Apply.", { multiline:true });
        status.preferredSize.height = 34;

        /* ---- state ---- */
        function entry() { return LIB[ddExpr.selection.index]; }

        function compLayerNames() {
            var comp = app.project ? app.project.activeItem : null;
            var out = [];
            if (comp instanceof CompItem) {
                for (var i = 1; i <= comp.numLayers; i++) out.push(comp.layer(i).name);
            }
            return out.length ? out : ["(no comp open)"];
        }

        function fillLayerRows() {
            var e = entry(), ls = e.layers || [], names = compLayerNames();
            for (var i = 0; i < MAX_LAYERS; i++) {
                var on = i < ls.length;
                layerRows[i].group.visible = on;
                if (on) layerRows[i].setItems(ls[i].label, names);
            }
            btnRefresh.visible = ls.length > 0;
        }

        function values() {
            var e = entry(), v = {};
            var i;
            for (i = 0; i < (e.nums || []).length; i++)    v[e.nums[i].k]    = numRows[i].get();
            for (i = 0; i < (e.choices || []).length; i++) v[e.choices[i].k] = choiceRows[i].get();
            for (i = 0; i < (e.texts || []).length; i++)   v[e.texts[i].k]   = textRows[i].get();
            for (i = 0; i < (e.layers || []).length; i++)  v[e.layers[i].k]  = layerRows[i].get();
            return v;
        }

        function currentExpr() {
            var e = entry();
            var x = e.build(values(), rbLinked.value && e.linkable);
            return cbGuard.value ? guard(x) : x;
        }
        function refreshPreview() { preview.text = currentExpr(); }

        function loadEntry() {
            var e = entry(), i;
            descTxt.text = e.desc || "";
            hintTxt.text = e.hint || "";

            for (i = 0; i < MAX_NUMS; i++) {
                var onN = i < (e.nums || []).length;
                numRows[i].group.visible = onN;
                if (onN) numRows[i].load(e.nums[i]);
            }
            for (i = 0; i < MAX_CHOICES; i++) {
                var onC = i < (e.choices || []).length;
                choiceRows[i].group.visible = onC;
                if (onC) choiceRows[i].load(e.choices[i]);
            }
            for (i = 0; i < MAX_TEXTS; i++) {
                var onT = i < (e.texts || []).length;
                textRows[i].group.visible = onT;
                if (onT) textRows[i].load(e.texts[i]);
            }
            fillLayerRows();

            var ps = e.presets || [];
            presetRow.visible = ps.length > 0;
            ddPreset.removeAll();
            for (i = 0; i < ps.length; i++) ddPreset.add("item", ps[i].n);
            if (ps.length) ddPreset.selection = 0;

            noParams.visible = !(e.nums || []).length && !(e.choices || []).length &&
                               !(e.texts || []).length && !(e.layers || []).length;

            rbLinked.enabled = rbBaked.enabled = !!e.linkable;
            if (!e.linkable) rbBaked.value = true;

            // A multi entry writes several properties — the picker doesn't apply.
            ddTarget.enabled = !e.multi;
            ddTarget.selection = targetIndex(e.target || "Scale");

            refreshPreview();
            try { win.layout.layout(true); win.layout.resize(); } catch (err) {}
        }

        for (var q1 = 0; q1 < MAX_NUMS; q1++)    numRows[q1].onChange    = refreshPreview;
        for (var q2 = 0; q2 < MAX_CHOICES; q2++) choiceRows[q2].onChange = refreshPreview;
        for (var q3 = 0; q3 < MAX_TEXTS; q3++)   textRows[q3].onChange   = refreshPreview;
        for (var q4 = 0; q4 < MAX_LAYERS; q4++)  layerRows[q4].onChange  = refreshPreview;
        rbLinked.onClick = rbBaked.onClick = cbGuard.onClick = refreshPreview;
        ddExpr.onChange = loadEntry;
        btnRefresh.onClick = function () { fillLayerRows(); refreshPreview(); };

        // A preset just pushes values into the numeric rows it names.
        ddPreset.onChange = function () {
            var e = entry(), ps = e.presets || [];
            if (!ddPreset.selection || !ps.length) return;
            var vals = ps[ddPreset.selection.index].v;
            for (var i = 0; i < (e.nums || []).length; i++) {
                var k = e.nums[i].k;
                if (vals[k] !== undefined) {
                    var spec = e.nums[i];
                    numRows[i].load({ label: spec.label, min: spec.min, max: spec.max,
                                      def: vals[k], isInt: spec.isInt });
                }
            }
            refreshPreview();
        };

        function say(m) { status.text = m; }
        function chosen(comp) {
            var s = comp.selectedLayers;
            if (!s.length) return [];
            return cbAll.value ? s : [s[0]];
        }

        btnApply.onClick = function () {
            var comp = app.project ? app.project.activeItem : null;
            if (!(comp instanceof CompItem)) { say("Open a composition first."); return; }
            var layers = chosen(comp);
            if (!layers.length) { say("Select at least one layer in the timeline."); return; }

            var e = entry(), v = values();
            var linked = rbLinked.value && e.linkable;

            app.beginUndoGroup("Apply expression: " + e.name);
            var applied = 0, skipped = 0, noKeys = 0, touched = 0;

            try {
                for (var Li = 0; Li < layers.length; Li++) {
                    var lay = layers[Li];

                    if (linked) {
                        for (var s = 0; s < (e.nums || []).length; s++) {
                            if (e.nums[s].link) ensureSlider(lay, e.nums[s].link, v[e.nums[s].k]);
                        }
                    }
                    if (e.makesSlider && v.sname) ensureSlider(lay, v.sname, null);
                    if (e.makesCheckbox && v.cname) ensureCheckbox(lay, v.cname);

                    var jobs = [];
                    if (e.buildsTextRig) {
                        // The rig decides the property, not the dropdown.
                        var amount = makeTextRig(lay, v.prop);
                        if (!amount) {
                            skipped++;
                            say("\"" + lay.name + "\" is not a text layer — this one needs one.");
                            continue;
                        }
                        jobs.push({ props: [amount], expr: e.build(v, linked) });
                    } else if (e.multi) {
                        for (var mi = 0; mi < e.multi.length; mi++) {
                            jobs.push({ tgt: targetByMatch(e.multi[mi].t),
                                        expr: e.multi[mi].build(v) });
                        }
                    } else {
                        jobs.push({ tgt: TARGETS[ddTarget.selection.index],
                                    expr: e.build(v, linked) });
                    }

                    var did = false;
                    for (var ji = 0; ji < jobs.length; ji++) {
                        var props = jobs[ji].props || propFor(lay, jobs[ji].tgt);
                        if (!props.length) { skipped++; continue; }
                        var ex = cbGuard.value ? guard(jobs[ji].expr) : jobs[ji].expr;
                        for (var p = 0; p < props.length; p++) {
                            try {
                                props[p].expression = ex;
                                applied++; did = true;
                                if (e.needsKeys && props[p].numKeys === 0) noKeys++;
                            } catch (err) { skipped++; }
                        }
                    }
                    if (did) touched++;
                }
            } catch (e2) {
                say("Failed: " + e2.toString());
            } finally {
                app.endUndoGroup();
            }

            var msg = e.name + " → " + applied + " propert" + (applied === 1 ? "y" : "ies")
                    + " on " + touched + " layer" + (touched === 1 ? "" : "s") + ".";
            if (linked && applied) msg += " Sliders are in Effect Controls.";
            if (noKeys) msg += "  " + noKeys + " had NO keyframes — this one needs them.";
            if (skipped) msg += "  " + skipped + " skipped (property missing or won't take an expression).";
            say(msg);
        };

        btnRemove.onClick = function () {
            var comp = app.project ? app.project.activeItem : null;
            if (!(comp instanceof CompItem)) { say("Open a composition first."); return; }
            var layers = chosen(comp);
            if (!layers.length) { say("Select at least one layer."); return; }

            var e = entry(), cleared = 0;
            var tgts = [];
            if (e.multi) { for (var mi = 0; mi < e.multi.length; mi++) tgts.push(targetByMatch(e.multi[mi].t)); }
            else tgts.push(TARGETS[ddTarget.selection.index]);

            app.beginUndoGroup("Remove expression");
            try {
                for (var Li = 0; Li < layers.length; Li++) {
                    for (var ti = 0; ti < tgts.length; ti++) {
                        var props = propFor(layers[Li], tgts[ti]);
                        for (var p = 0; p < props.length; p++) {
                            try { if (props[p].expression !== "") { props[p].expression = ""; cleared++; } }
                            catch (err) {}
                        }
                    }
                }
            } finally { app.endUndoGroup(); }
            say("Cleared " + cleared + " expression" + (cleared === 1 ? "" : "s")
                + ". Controls were left alone — other properties may still use them.");
        };

        loadEntry();

        win.onResizing = win.onResize = function () { this.layout.resize(); };
        if (win instanceof Window) { win.center(); win.show(); }
        else { win.layout.layout(true); win.layout.resize(); }
        return win;
    }

    build(thisObj);

})(this);
