// Prompt Atelier — design tokens (from design-system.html v1.0)
import {loadFont as loadFraunces} from '@remotion/google-fonts/Fraunces';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

const fraunces = loadFraunces();
const inter = loadInter();

export const T = {
  // surfaces
  porcelain: '#FBF8F2',
  ivory: '#F2ECE1',
  linen: '#E9E1D2',
  ink: '#1B1813',
  espresso: '#26221A',
  umber: '#3A3428',
  // text
  textInk: '#211D15',
  textSoft: '#6B6355',
  textCream: '#F6F0E4',
  textFog: '#B5AC9C',
  // accents
  gold: '#C19A3D',
  goldDeep: '#8A6A24',
  goldBright: '#DCBC69',
  teal: '#33625C',
  tealBright: '#8FC2BA',
  stone: '#A99D88',
  // glass
  glassDarkFill: 'rgba(24,20,14,0.46)',
  glassDarkBorder: 'rgba(255,255,255,0.26)',
  glassLightFill: 'rgba(255,252,245,0.58)',
  glassLightBorder: 'rgba(255,255,255,0.72)',
  glassBlur: 18,
  glassRadius: 20,
  glassShadow: '0 12px 40px rgba(15,12,6,0.28)',
  // fonts
  serif: fraunces.fontFamily,
  sans: inter.fontFamily,
} as const;

// The dark atelier stage (scene background)
export const stageBackground = [
  'radial-gradient(50% 65% at 82% 18%, rgba(193,154,61,0.28) 0%, transparent 60%)',
  'radial-gradient(60% 75% at 8% 90%, rgba(51,98,92,0.45) 0%, transparent 60%)',
  'linear-gradient(155deg, #16130E, #2B2418)',
].join(', ');
