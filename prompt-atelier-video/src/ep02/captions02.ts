// Case Study 02 captions — times in seconds of COMPOSITION time.
// Part A: VO time = comp time. Part C: VO resumes after the 126.5s episode,
// so comp time = VO time + 126.5.
export type Cue = {start: number; end: number; text: string};

const EP = 126.5; // episode duration inserted between VO 109s and the CTA

export const CUES02: Cue[] = [
  // ── Part A — intro (over the episode's first seconds)
  {start: 0.2, end: 2.0, text: 'Welcome back to **Prompt Atelier**.'},
  {start: 2.0, end: 6.0, text: "Today we'll show you how we created this **Pixar-style animated podcast** —"},
  {start: 6.0, end: 11.0, text: 'a chibi **Albert Einstein** telling the story of numbers, for the kids’ channel **Chubletz Tales** —'},
  {start: 11.0, end: 17.0, text: 'using **Nano Banana**, **Veo** and **ElevenLabs** — orchestrated by **Claude Code** from a single spreadsheet.'},
  {start: 17.0, end: 19.0, text: "Here's how it works."},
  // ── Step 01
  {start: 19.0, end: 21.0, text: '**Step 1:** the world.'},
  {start: 21.0, end: 24.0, text: 'Every frame started as an image generated with **Nano Banana**:'},
  {start: 24.0, end: 29.0, text: 'Einstein in his studio, ancient Egypt, Rome, even a bedtime scene for counting sheep.'},
  {start: 29.0, end: 31.0, text: "And here's a lesson we learned the hard way."},
  {start: 31.0, end: 37.0, text: 'Our first takes were all front-facing — and honestly, they looked **flat**. Like a slideshow.'},
  {start: 37.0, end: 40.0, text: 'So we went back and treated it like **real cinematography**:'},
  {start: 40.0, end: 43.0, text: 'front shots, side profiles, full views of the set.'},
  {start: 43.0, end: 46.0, text: '**Same character**, held consistent in every single one.'},
  {start: 46.0, end: 50.0, text: "That's what makes it feel **filmed** instead of generated."},
  // ── Step 02
  {start: 50.0, end: 54.0, text: '**Step 2** — and this is the clever part — the studio is a **spreadsheet**.'},
  {start: 54.0, end: 56.0, text: 'Every row is one shot:'},
  {start: 56.0, end: 61.0, text: 'the dialogue, the image to animate, the video prompt, the camera direction, and a status column.'},
  {start: 61.0, end: 66.0, text: "That sheet isn't documentation — it's the **render queue**."},
  // ── Step 03
  {start: 66.0, end: 68.0, text: '**Step 3:** motion and voice.'},
  {start: 68.0, end: 73.0, text: '**Veo** animated each still into a moving clip, following the camera direction written in its row.'},
  {start: 73.0, end: 78.0, text: "And Einstein's voice? That's **ElevenLabs**, generated from the same row's dialogue."},
  {start: 78.0, end: 82.0, text: 'So the visuals and the speech always come from **one source of truth**.'},
  // ── Step 04
  {start: 82.0, end: 86.0, text: 'And **Step 4**, the part that ties it all together: **Claude Code**.'},
  {start: 86.0, end: 89.0, text: "The agent reads the sheet, finds every row that isn't done,"},
  {start: 89.0, end: 92.0, text: 'sends the image to **Veo**, generates the voice line,'},
  {start: 92.0, end: 99.0, text: 'checks the result, and writes the output back — row after row, until the status column says **done**.'},
  {start: 99.0, end: 102.0, text: '**One spreadsheet in — a finished episode out.**'},
  // ── transition
  {start: 102.0, end: 108.0, text: 'Enough behind the scenes. Here’s the finished episode: **Why Zero is the Real Superhero**.'},
  {start: 108.0, end: 109.0, text: 'Enjoy!'},
  // ── Part C — CTA (after the episode)
  {start: 109.0 + EP, end: 117.0 + EP, text: 'The full case study — the template, the tools, and **everything that went wrong** — is linked in the description.'},
  {start: 117.0 + EP, end: 119.2 + EP, text: '**Subscribe** for a new build every week.'},
  {start: 119.2 + EP, end: 124.0 + EP, text: 'And remember: **the tools are free — the taste is the craft.**'},
];
