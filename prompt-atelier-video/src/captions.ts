// Caption cues — seconds, **word** = gold highlight.
// v1 timings are estimates; tweak start/end after previewing against the audio.
export type Cue = {start: number; end: number; text: string};

export const CUES: Cue[] = [
  // Scene 1 — intro
  {start: 0.2, end: 2.6, text: 'Hi! My name is **Sofia** — welcome to my channel!'},
  {start: 2.6, end: 6.4, text: "Today I'm going to show you how I created this exact video"},
  {start: 6.4, end: 9.6, text: "that you're watching right now — using only **free AI tools**."},
  {start: 9.6, end: 13.8, text: 'Yes — everything here, **including me**, was made with AI.'},
  {start: 13.8, end: 17.4, text: 'Let me break it down for you.'},
  // Scene 2 — the image
  {start: 17.6, end: 20.2, text: 'First, my look.'},
  {start: 20.2, end: 25.2, text: 'This image was generated with the latest **ChatGPT model**'},
  {start: 25.2, end: 28.4, text: 'from a simple prompt — my hair, my glasses, even this jacket.'},
  {start: 28.4, end: 30.4, text: 'One prompt — and I was **born**!'},
  // Scene 3 — the voice
  {start: 30.6, end: 33.0, text: 'Then, the words.'},
  {start: 33.0, end: 37.4, text: 'This script was written with the help of **Claude Code**'},
  {start: 37.4, end: 40.6, text: "and turned into the voice you're hearing with **ElevenLabs** —"},
  {start: 40.6, end: 43.8, text: 'an AI that can speak in any voice, in any language.'},
  // Scene 4 — the animation
  {start: 44.0, end: 46.6, text: 'Next, the magic part: making me **move**.'},
  {start: 46.6, end: 51.4, text: 'A free, open-source model called **SadTalker** took my photo and my voiceover'},
  {start: 51.4, end: 55.0, text: 'and animated my face — the lips, the blinks, all of it —'},
  {start: 55.0, end: 57.8, text: 'running on a **free Google Colab GPU**.'},
  // Scene 5 — assembly
  {start: 58.0, end: 61.4, text: 'And finally, **Claude Code** put the whole thing together —'},
  {start: 61.4, end: 64.8, text: "the animation, the graphics you're seeing, the full edit."},
  // Scene 6 — outro
  {start: 65.0, end: 68.2, text: 'Want to try it yourself? The full guide is in the **description**.'},
  {start: 68.2, end: 70.0, text: 'See you in the next one!'},
];
