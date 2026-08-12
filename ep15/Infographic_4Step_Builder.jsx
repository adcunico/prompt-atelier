/**********************************************************************
 * Infographic_4Step_Builder.jsx
 * -------------------------------------------------------------------
 * Builds a 4-step horizontal infographic as native After Effects
 * layers (shape layers + text layers), then animates it.
 *
 * Run via:  File > Scripts > Run Script File...
 *
 * The outer badge is a TRUE CIRCLE split across a diameter: a full
 * white disc with a colored half-disc (real bezier semicircle path)
 * laid on top. No offset discs, so no crescent/moon silhouette.
 *
 * Structure per node (N = 1..4):
 *   NodeN_OuterCircle   white disc + colored half-disc, drop shadow
 *   NodeN_RingCircle    white disc, drop shadow
 *   NodeN_InnerCircle   colored disc (or white + colored stroke)
 *   NodeN_StepText      the word "STEP"
 *   NodeN_StepNumber    "01".."04"
 *   NodeN_PinLine       stroked path, draws on via Trim Paths
 *   NodeN_PinDot        small hollow circle
 *   NodeN_Heading       "INFODATA"
 *   NodeN_Body          gray placeholder body copy
 * Plus optional Connector_N bars behind the badge row.
 *********************************************************************/

(function buildInfographic() {

    /*==================================================================
      1. CONFIG - everything you'd normally want to tweak lives here
    ==================================================================*/

    // ---- Comp ----
    var COMP_NAME     = "Infographic Animation";
    var COMP_W        = 1920;
    var COMP_H        = 1080;
    var COMP_FPS      = 30;
    var COMP_DUR      = 6;                 // seconds
    var COMP_BG       = [1, 1, 1];         // white

    // ---- Layout ----
    // Sized to match the reference artwork: badges are large and nearly
    // touching. For the smaller 160px badges from the original spec use
    // OUTER_D 160 / RING_D 120 / INNER_D 90 / NODE_SPACING 360 and the
    // "spec type sizes" noted beside each font size below.
    var NODE_COUNT    = 4;
    var NODE_SPACING  = 300;               // horizontal gap between node centers
    var NODE_Y        = 450;               // vertical center of the badge row
    var CENTER_X      = COMP_W / 2;

    var OUTER_D       = 260;               // outer badge diameter (spec: 160)
    var RING_D        = 200;               // white ring disc  (spec: 120)
    var INNER_D       = 150;               // inner disc       (spec: 90)
    var INNER_FILLED  = true;              // true = colored fill + white text (matches reference)
                                           // false = white fill + colored stroke + colored text
    var INNER_STROKE  = 5;                 // stroke width when INNER_FILLED is false

    // Angle of the split across the outer badge, in degrees.
    // 0 = colored bottom half / white top half. Positive tilts clockwise.
    // Give one value per node to tilt them individually.
    var SPLIT_ANGLES  = [0, 0, 0, 0];

    var LINE_LEN      = 210;               // pin line length (spec: 90)
    var LINE_WIDTH    = 3;
    var PIN_DOT_D     = 20;
    var PIN_DOT_STROKE= 4;

    var HEADING_GAP   = 85;                // pin dot -> heading center
    var BODY_GAP      = 34;                // heading center -> body box top
    var BODY_BOX_W    = 278;               // paragraph text box width
    var BODY_BOX_H    = 150;

    // ---- Connector bars behind the badge row ----
    // The reference chains its badges with a horizontal color band. That
    // only works there because the band is continuous and its white
    // segments vanish into the background; here the few colored stubs read
    // as stray blocks, so this is OFF by default. Set true to get them --
    // they are aligned to the split line and fully rounded so each one
    // continues the colored half of its badge.
    // Each entry: node index (0-based), direction (-1 left / +1 right),
    // length in px, and which color to use.
    var BUILD_CONNECTORS = false;
    var CONNECTOR_H      = 44;
    var CONNECTORS       = [
        { node: 0, dir: -1, len: 170, color: 0 },
        { node: 2, dir:  1, len: 300, color: 2 }
    ];

    // ---- Type ----
    var FONT_BOLD     = "Arial-BoldMT";    // PostScript names; AE substitutes if missing
    var FONT_REG      = "ArialMT";
    var SIZE_STEP     = 20;                // "STEP"      (spec: 14)
    var SIZE_NUMBER   = 56;                // "01"        (spec: 28)
    var SIZE_HEADING  = 28;                // "INFODATA"  (spec: 20)
    var SIZE_BODY     = 16;                //             (spec: 13)
    var BODY_LEADING  = 23;
    var STEP_TRACKING = 80;
    var STEP_Y_OFF    = -26;               // "STEP" center, relative to NODE_Y
    var NUM_Y_OFF     = 14;                // number center, relative to NODE_Y

    var BODY_GRAY     = "#888888";

    // ---- Per-step colors, left to right ----
    var STEP_COLORS   = ["#E8503E", "#F5B335", "#29ABE0", "#1B4870"];
    var STEP_LABELS   = ["01", "02", "03", "04"];
    var HEADING_TEXT  = "INFODATA";
    var BODY_TEXT     = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
                      + "sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim.";

    // ---- Background texture ----
    var BUILD_BG_TEXTURE = true;
    var BG_DOT_OPACITY   = 9;              // percent
    var BG_DOT_SIZE      = 6;
    var BG_DOT_GAP       = 46;

    // ---- Animation timing (seconds) ----
    var START_TIME    = 0.20;              // when node 1 begins
    var STAGGER       = 0.18;              // delay between Node1 -> Node2 -> ...
    var CIRCLE_DUR    = 0.50;              // scale-in duration per circle
    var CIRCLE_INNER_STAGGER = 0.06;       // outer -> ring -> inner offset
    var OVERSHOOT     = 112;               // scale % at the overshoot key
    var TEXT_OFFSET   = 0.35;              // step text starts after circle lands
    var TEXT_DUR      = 0.35;
    var LINE_OFFSET   = 0.55;              // pin line draw start
    var LINE_DUR      = 0.35;
    var DOT_OFFSET    = 0.85;              // pin dot pop start
    var DOT_DUR       = 0.30;
    var HEAD_OFFSET   = 1.00;              // heading fade/slide start
    var HEAD_DUR      = 0.40;
    var BODY_OFFSET   = 1.12;              // body fade/slide start
    var BODY_DUR      = 0.40;
    var SLIDE_UP      = 18;                // px the text rises into place
    var CONN_DUR      = 0.50;              // connector bar grow duration

    // ---- Easing influence (0-100) ----
    var EASE_OUT_INF  = 75;                // ease leaving a key
    var EASE_IN_INF   = 70;                // ease arriving at a key
    var OVERSHOOT_INF = 18;                // low influence at the overshoot key, so
                                           // the bounce passes through instead of
                                           // stalling at its peak

    var FPS = COMP_FPS;                    // replaced with the real comp fps below

    var KAPPA = 0.5523;                    // circle-to-bezier constant


    /*==================================================================
      2. SMALL HELPERS
    ==================================================================*/

    function hex(h) {
        h = h.replace("#", "");
        return [parseInt(h.substr(0, 2), 16) / 255,
                parseInt(h.substr(2, 2), 16) / 255,
                parseInt(h.substr(4, 2), 16) / 255];
    }

    // Snaps a time to the comp's frame grid. Off-grid keys make the timing
    // read soft, since AE only samples values on whole frames.
    function snap(t) { return Math.round(t * FPS) / FPS; }

    // Sets an eased keyframe. Two things matter here:
    //  - Temporal eases are ignored on linear keys, and setValueAtTime creates
    //    linear (or auto-bezier) keys, so the interpolation type has to be
    //    forced to Bezier first or the motion comes out dead linear.
    //  - The ease array length must match the property: 1 for spatial props,
    //    N for other multidimensional ones. That differs by property and AE
    //    version, so try each length until one is accepted.
    function ease(prop, keyIndex, inInf, outInf) {
        var eIn  = new KeyframeEase(0, (inInf  === undefined) ? EASE_IN_INF  : inInf);
        var eOut = new KeyframeEase(0, (outInf === undefined) ? EASE_OUT_INF : outInf);

        try {
            prop.setInterpolationTypeAtKey(keyIndex,
                KeyframeInterpolationType.BEZIER,
                KeyframeInterpolationType.BEZIER);
        } catch (e) { /* some property types reject this; eases still apply */ }

        var lengths = [1, 2, 3];
        for (var i = 0; i < lengths.length; i++) {
            var a = [], b = [];
            for (var j = 0; j < lengths[i]; j++) { a.push(eIn); b.push(eOut); }
            try { prop.setTemporalEaseAtKey(keyIndex, a, b); return; } catch (e2) { /* try next */ }
        }
    }

    // Adds keys from an array of [time, value] pairs and eases them all.
    // Optional `inf` gives per-key [inInfluence, outInfluence] overrides.
    function keys(prop, pairs, inf) {
        var idx = [], t;
        for (var i = 0; i < pairs.length; i++) {
            t = snap(pairs[i][0]);
            prop.setValueAtTime(t, pairs[i][1]);
            idx.push(prop.nearestKeyIndex(t));
        }
        for (var k = 0; k < idx.length; k++) {
            var e = inf && inf[k];
            ease(prop, idx[k], e ? e[0] : undefined, e ? e[1] : undefined);
        }
        return idx;
    }

    // Influence pattern for a 3-key pop: ease out of the start, pass through
    // the overshoot, settle into the end.
    var POP_INF = [[EASE_IN_INF, EASE_OUT_INF],
                   [OVERSHOOT_INF, OVERSHOOT_INF],
                   [EASE_IN_INF, EASE_OUT_INF]];

    function xf(layer) { return layer.property("ADBE Transform Group"); }

    function dropShadow(layer, opacity, distance, softness) {
        var ds = layer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
        ds.property("ADBE Drop Shadow-0001").setValue([0, 0, 0]);   // color
        ds.property("ADBE Drop Shadow-0002").setValue(opacity);     // opacity (0-255)
        ds.property("ADBE Drop Shadow-0003").setValue(180);         // direction (down)
        ds.property("ADBE Drop Shadow-0004").setValue(distance);
        ds.property("ADBE Drop Shadow-0005").setValue(softness);
        return ds;
    }

    // Full ellipse group. Groups added FIRST render on top.
    function addEllipse(contents, name, diameter, fillColor, strokeColor, strokeW) {
        var grp = contents.addProperty("ADBE Vector Group");
        grp.name = name;
        var v = grp.property("ADBE Vectors Group");

        var el = v.addProperty("ADBE Vector Shape - Ellipse");
        el.property("ADBE Vector Ellipse Size").setValue([diameter, diameter]);
        el.property("ADBE Vector Ellipse Position").setValue([0, 0]);

        if (strokeColor) {
            var st = v.addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue(strokeColor);
            st.property("ADBE Vector Stroke Width").setValue(strokeW || 2);
        }
        if (fillColor) {
            var fl = v.addProperty("ADBE Vector Graphic - Fill");
            fl.property("ADBE Vector Fill Color").setValue(fillColor);
        }
        return grp;
    }

    // Half-disc: a real bezier semicircle (flat side along the diameter,
    // bulge pointing down) of the SAME radius as the badge, so stacking it
    // on the white disc keeps a perfect circular silhouette.
    function addHalfDisc(contents, name, diameter, fillColor, rotationDeg) {
        var r = diameter / 2, k = KAPPA * r;

        var grp = contents.addProperty("ADBE Vector Group");
        grp.name = name;
        var v = grp.property("ADBE Vectors Group");

        var pathProp = v.addProperty("ADBE Vector Shape - Group");
        var sh = new Shape();
        sh.vertices    = [[-r, 0], [0, r], [r, 0]];
        sh.inTangents  = [[0, 0], [-k, 0], [0, k]];
        sh.outTangents = [[0, k], [k, 0], [0, 0]];
        sh.closed      = true;               // closing segment is the flat diameter
        pathProp.property("ADBE Vector Shape").setValue(sh);

        var fl = v.addProperty("ADBE Vector Graphic - Fill");
        fl.property("ADBE Vector Fill Color").setValue(fillColor);

        if (rotationDeg) {
            grp.property("ADBE Vector Transform Group")
               .property("ADBE Vector Rotation").setValue(rotationDeg);
        }
        return grp;
    }

    // Point/box text layer with consistent character styling.
    function makeText(comp, name, str, font, size, color, boxW, boxH) {
        var lay = (boxW)
            ? comp.layers.addBoxText([boxW, boxH], str)
            : comp.layers.addText(str);
        lay.name = name;

        var tp = lay.property("ADBE Text Properties").property("ADBE Text Document");
        var td = tp.value;
        td.font          = font;
        td.fontSize      = size;
        td.fillColor     = color;
        td.applyFill     = true;
        td.applyStroke   = false;
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        if (boxW) td.leading = BODY_LEADING;
        tp.setValue(td);
        return lay;
    }

    // Re-anchors a text layer using its real rendered bounds so that
    // positioning and scale-from-center are predictable.
    // mode: "center" (default) or "top"
    function anchorText(lay, mode) {
        var r = lay.sourceRectAtTime(0, false);
        var ax = r.left + r.width / 2;
        var ay = (mode === "top") ? r.top : r.top + r.height / 2;
        xf(lay).property("ADBE Anchor Point").setValue([ax, ay]);
    }

    function tracking(lay, amount) {
        var tp = lay.property("ADBE Text Properties").property("ADBE Text Document");
        var td = tp.value;
        td.tracking = amount;
        tp.setValue(td);
    }


    /*==================================================================
      3. COMP - reuse the active comp, otherwise create one
    ==================================================================*/

    if (!app.project) app.newProject();

    var comp = null;
    if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
        comp = app.project.activeItem;
    }
    var createdComp = false;
    if (!comp) {
        comp = app.project.items.addComp(COMP_NAME, COMP_W, COMP_H, 1, COMP_DUR, COMP_FPS);
        createdComp = true;
    }
    comp.bgColor = COMP_BG;
    // Work in the comp's real size and rate so the script also behaves
    // correctly on a reused comp.
    COMP_W   = comp.width;
    COMP_H   = comp.height;
    CENTER_X = COMP_W / 2;
    FPS      = comp.frameRate;

    app.beginUndoGroup("Build 4-Step Infographic");

    try {

        var layerCount = 0;
        var firstX = CENTER_X - ((NODE_COUNT - 1) * NODE_SPACING) / 2;

        /*==============================================================
          4. BACKGROUND
        ==============================================================*/

        var bgSolid = comp.layers.addSolid(COMP_BG, "BG_White", COMP_W, COMP_H, 1, comp.duration);
        bgSolid.moveToEnd();
        bgSolid.locked = true;
        layerCount++;

        if (BUILD_BG_TEXTURE) {
            // TODO: swap this dot grid for a real faint world-map asset
            //       (import a PNG/AI map, set opacity ~8-10%, and delete this layer).
            var bgTex = comp.layers.addShape();
            bgTex.name = "BG_MapTexture_Placeholder";
            var bgC = bgTex.property("ADBE Root Vectors Group");

            var dotGrp = bgC.addProperty("ADBE Vector Group");
            dotGrp.name = "DotGrid";
            var dotV = dotGrp.property("ADBE Vectors Group");

            var dot = dotV.addProperty("ADBE Vector Shape - Ellipse");
            dot.property("ADBE Vector Ellipse Size").setValue([BG_DOT_SIZE, BG_DOT_SIZE]);

            var dotFill = dotV.addProperty("ADBE Vector Graphic - Fill");
            dotFill.property("ADBE Vector Fill Color").setValue([0.35, 0.35, 0.35]);

            var repX = dotV.addProperty("ADBE Vector Filter - Repeater");
            repX.property("ADBE Vector Repeater Copies").setValue(Math.ceil(COMP_W / BG_DOT_GAP) + 2);
            repX.property("ADBE Vector Repeater Transform")
                .property("ADBE Vector Repeater Position").setValue([BG_DOT_GAP, 0]);

            var repY = dotV.addProperty("ADBE Vector Filter - Repeater");
            repY.property("ADBE Vector Repeater Copies").setValue(Math.ceil(COMP_H / BG_DOT_GAP) + 2);
            repY.property("ADBE Vector Repeater Transform")
                .property("ADBE Vector Repeater Position").setValue([0, BG_DOT_GAP]);

            xf(bgTex).property("ADBE Position").setValue([-BG_DOT_GAP, -BG_DOT_GAP]);
            xf(bgTex).property("ADBE Opacity").setValue(BG_DOT_OPACITY);
            bgTex.moveBefore(bgSolid);
            bgTex.locked = true;
            layerCount++;
        }


        /*==============================================================
          5. CONNECTOR BARS
          Built before the nodes so every badge sits on top of them.
        ==============================================================*/

        var connectors = [];
        if (BUILD_CONNECTORS) {
            for (var ci = 0; ci < CONNECTORS.length; ci++) {
                var cfg  = CONNECTORS[ci];
                var barX = firstX + cfg.node * NODE_SPACING;

                var bar = comp.layers.addShape();
                bar.name = "Connector_" + (ci + 1);
                var barGrp = bar.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                barGrp.name = "Bar";
                var barV = barGrp.property("ADBE Vectors Group");

                var rect = barV.addProperty("ADBE Vector Shape - Rect");
                rect.property("ADBE Vector Rect Size").setValue([cfg.len, CONNECTOR_H]);
                // Horizontally: inner edge on the layer anchor, so the scale-X
                // grow reads as the bar extending out of the node.
                // Vertically: top edge on the split line, so the bar continues
                // the badge's colored half instead of cutting across its middle.
                rect.property("ADBE Vector Rect Position")
                    .setValue([cfg.dir * cfg.len / 2, CONNECTOR_H / 2]);
                rect.property("ADBE Vector Rect Roundness").setValue(CONNECTOR_H / 2);

                var barFill = barV.addProperty("ADBE Vector Graphic - Fill");
                barFill.property("ADBE Vector Fill Color").setValue(hex(STEP_COLORS[cfg.color]));

                xf(bar).property("ADBE Position").setValue([barX, NODE_Y]);
                connectors.push({ layer: bar, node: cfg.node });
                layerCount++;
            }
        }


        /*==============================================================
          6. LAYER CREATION - one pass per node, left to right
        ==============================================================*/

        var nodes = [];   // keeps references for the animation pass

        for (var i = 0; i < NODE_COUNT; i++) {

            var n      = i + 1;
            var col    = hex(STEP_COLORS[i]);
            var txtCol = INNER_FILLED ? [1, 1, 1] : col;
            var x      = firstX + i * NODE_SPACING;
            var lineY0 = NODE_Y + OUTER_D / 2;            // top of the pin line
            var dotY   = lineY0 + LINE_LEN;               // pin dot center
            var headY  = dotY + HEADING_GAP;              // heading center
            var bodyY  = headY + BODY_GAP;                // body box top

            var node = { color: col, x: x };

            // --- 6a. Outer badge: white disc + colored half-disc on top ---
            // Both share the same radius and center, so the silhouette is a
            // perfect circle split across a diameter.
            var outer = comp.layers.addShape();
            outer.name = "Node" + n + "_OuterCircle";
            var oC = outer.property("ADBE Root Vectors Group");
            addHalfDisc(oC, "ColoredHalf", OUTER_D, col, SPLIT_ANGLES[i] || 0);
            addEllipse(oC, "WhiteDisc",    OUTER_D, [1, 1, 1], null, 0);
            xf(outer).property("ADBE Position").setValue([x, NODE_Y]);
            dropShadow(outer, 45, 8, 22);
            node.outer = outer;
            layerCount++;

            // --- 6b. White ring disc with a soft drop shadow ---
            var ring = comp.layers.addShape();
            ring.name = "Node" + n + "_RingCircle";
            addEllipse(ring.property("ADBE Root Vectors Group"),
                       "WhiteRing", RING_D, [1, 1, 1], null, 0);
            xf(ring).property("ADBE Position").setValue([x, NODE_Y]);
            dropShadow(ring, 60, 8, 18);
            node.ring = ring;
            layerCount++;

            // --- 6c. Inner disc: colored fill (reference) or white + stroke ---
            var inner = comp.layers.addShape();
            inner.name = "Node" + n + "_InnerCircle";
            if (INNER_FILLED) {
                addEllipse(inner.property("ADBE Root Vectors Group"),
                           "InnerDisc", INNER_D, col, null, 0);
            } else {
                addEllipse(inner.property("ADBE Root Vectors Group"),
                           "InnerDisc", INNER_D, [1, 1, 1], col, INNER_STROKE);
            }
            xf(inner).property("ADBE Position").setValue([x, NODE_Y]);
            dropShadow(inner, 40, 5, 10);
            node.inner = inner;
            layerCount++;

            // --- 6d. "STEP" + number, stacked and centered in the inner disc ---
            var stepTxt = makeText(comp, "Node" + n + "_StepText",
                                   "STEP", FONT_BOLD, SIZE_STEP, txtCol);
            tracking(stepTxt, STEP_TRACKING);
            anchorText(stepTxt, "center");
            xf(stepTxt).property("ADBE Position").setValue([x, NODE_Y + STEP_Y_OFF]);
            node.stepTxt = stepTxt;
            layerCount++;

            var numTxt = makeText(comp, "Node" + n + "_StepNumber",
                                  STEP_LABELS[i], FONT_BOLD, SIZE_NUMBER, txtCol);
            anchorText(numTxt, "center");
            xf(numTxt).property("ADBE Position").setValue([x, NODE_Y + NUM_Y_OFF]);
            node.numTxt = numTxt;
            layerCount++;

            // --- 6e. Pin line: a real 2-point path + stroke + Trim Paths ---
            var line = comp.layers.addShape();
            line.name = "Node" + n + "_PinLine";
            var lGrp = line.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            lGrp.name = "LinePath";
            var lV = lGrp.property("ADBE Vectors Group");

            var pathProp = lV.addProperty("ADBE Vector Shape - Group");
            var sh = new Shape();
            sh.vertices    = [[0, 0], [0, LINE_LEN]];
            sh.inTangents  = [[0, 0], [0, 0]];
            sh.outTangents = [[0, 0], [0, 0]];
            sh.closed      = false;
            pathProp.property("ADBE Vector Shape").setValue(sh);

            var lStroke = lV.addProperty("ADBE Vector Graphic - Stroke");
            lStroke.property("ADBE Vector Stroke Color").setValue(col);
            lStroke.property("ADBE Vector Stroke Width").setValue(LINE_WIDTH);

            // Trim Paths must sit BELOW the path in the group to affect it.
            var trim = lV.addProperty("ADBE Vector Filter - Trim");
            xf(line).property("ADBE Position").setValue([x, lineY0]);
            node.trimEnd = trim.property("ADBE Vector Trim End");
            layerCount++;

            // --- 6f. Hollow pin dot ---
            var dotL = comp.layers.addShape();
            dotL.name = "Node" + n + "_PinDot";
            addEllipse(dotL.property("ADBE Root Vectors Group"),
                       "Dot", PIN_DOT_D, [1, 1, 1], col, PIN_DOT_STROKE);
            xf(dotL).property("ADBE Position").setValue([x, dotY]);
            node.dot = dotL;
            layerCount++;

            // --- 6g. Heading ---
            var head = makeText(comp, "Node" + n + "_Heading",
                                HEADING_TEXT, FONT_BOLD, SIZE_HEADING, col);
            anchorText(head, "center");
            xf(head).property("ADBE Position").setValue([x, headY]);
            node.head  = head;
            node.headY = headY;
            layerCount++;

            // --- 6h. Body copy (paragraph text box) ---
            var body = makeText(comp, "Node" + n + "_Body",
                                BODY_TEXT, FONT_REG, SIZE_BODY, hex(BODY_GRAY),
                                BODY_BOX_W, BODY_BOX_H);
            anchorText(body, "top");
            xf(body).property("ADBE Position").setValue([x, bodyY]);
            node.body  = body;
            node.bodyY = bodyY;
            layerCount++;

            nodes.push(node);
        }


        /*==============================================================
          7. ANIMATION - staggered left to right
        ==============================================================*/

        // --- 7a. Connector bars grow outward with their node ---
        for (var cb = 0; cb < connectors.length; cb++) {
            var cn = connectors[cb];
            var cbT = START_TIME + cn.node * STAGGER;
            keys(xf(cn.layer).property("ADBE Scale"), [
                [cbT,            [0, 100]],
                [cbT + CONN_DUR, [100, 100]]
            ]);
        }

        for (var a = 0; a < nodes.length; a++) {

            var nd = nodes[a];
            var t0 = START_TIME + a * STAGGER;

            // --- 7b. Circles scale in 0 -> overshoot -> 100 ---
            var circles = [nd.outer, nd.ring, nd.inner];
            for (var c = 0; c < circles.length; c++) {
                var cs = xf(circles[c]).property("ADBE Scale");
                var ct = t0 + c * CIRCLE_INNER_STAGGER;
                keys(cs, [
                    [ct,                        [0, 0]],
                    [ct + CIRCLE_DUR * 0.70,    [OVERSHOOT, OVERSHOOT]],
                    [ct + CIRCLE_DUR,           [100, 100]]
                ], POP_INF);
            }

            // --- 7c. STEP + number fade and scale in once the circle lands ---
            var texts = [nd.stepTxt, nd.numTxt];
            for (var q = 0; q < texts.length; q++) {
                var tt = t0 + TEXT_OFFSET + q * 0.05;
                keys(xf(texts[q]).property("ADBE Opacity"), [
                    [tt, 0], [tt + TEXT_DUR, 100]
                ]);
                keys(xf(texts[q]).property("ADBE Scale"), [
                    [tt,                    [60, 60]],
                    [tt + TEXT_DUR * 0.75,  [108, 108]],
                    [tt + TEXT_DUR,         [100, 100]]
                ], POP_INF);
            }

            // --- 7d. Pin line draws downward via Trim Paths ---
            var lt = t0 + LINE_OFFSET;
            keys(nd.trimEnd, [
                [lt,            0],
                [lt + LINE_DUR, 100]
            ]);

            // --- 7e. Pin dot pops in ---
            var dt = t0 + DOT_OFFSET;
            keys(xf(nd.dot).property("ADBE Scale"), [
                [dt,                  [0, 0]],
                [dt + DOT_DUR * 0.65, [OVERSHOOT + 20, OVERSHOOT + 20]],
                [dt + DOT_DUR,        [100, 100]]
            ], POP_INF);

            // --- 7f. Heading fades in and slides up ---
            var ht = t0 + HEAD_OFFSET;
            keys(xf(nd.head).property("ADBE Opacity"), [[ht, 0], [ht + HEAD_DUR, 100]]);
            keys(xf(nd.head).property("ADBE Position"), [
                [ht,            [nd.x, nd.headY + SLIDE_UP]],
                [ht + HEAD_DUR, [nd.x, nd.headY]]
            ]);

            // --- 7g. Body copy fades in and slides up ---
            var bt = t0 + BODY_OFFSET;
            keys(xf(nd.body).property("ADBE Opacity"), [[bt, 0], [bt + BODY_DUR, 100]]);
            keys(xf(nd.body).property("ADBE Position"), [
                [bt,            [nd.x, nd.bodyY + SLIDE_UP]],
                [bt + BODY_DUR, [nd.x, nd.bodyY]]
            ]);
        }


        /*==============================================================
          8. WRAP UP
        ==============================================================*/

        comp.time = 0;
        comp.openInViewer();

        var totalTime = START_TIME + (NODE_COUNT - 1) * STAGGER + BODY_OFFSET + BODY_DUR;

        // A reused comp may be shorter than the animation needs.
        var tooShort = (totalTime > comp.duration);

        alert("Done.\n\n"
            + (createdComp ? "Created comp: " : "Used active comp: ") + comp.name + "\n"
            + comp.width + "x" + comp.height + " @ " + comp.frameRate + "fps, "
            + comp.duration + "s\n\n"
            + NODE_COUNT + " step nodes built (" + layerCount + " layers total).\n"
            + "Badges are true circles, split across a diameter.\n"
            + "Animation runs " + START_TIME.toFixed(2) + "s -> "
            + totalTime.toFixed(2) + "s, staggered " + STAGGER + "s per node."
            + (tooShort
                ? "\n\nWARNING: the animation ends at " + totalTime.toFixed(2)
                  + "s but the comp is only " + comp.duration
                  + "s long. Lengthen the comp to see all of it."
                : ""));

    } catch (err) {
        alert("Infographic build failed:\n" + err.toString()
            + (err.line ? "\nLine: " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }

})();
