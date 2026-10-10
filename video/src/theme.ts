/** Brand tokens mirrored from apps/web globals (setup-color-system spec). */
export const C = {
  canvas: '#010911',
  deep: '#000510',
  card: '#070D0E',
  raised: '#101716',
  tint: '#16221D',
  border: '#505555',
  inputBorder: '#2A3533',
  text1: '#E5E5E7',
  text2: '#9DA3A8',
  text3: '#6E7074',
  green1: '#99E39E',
  green2: '#63C16B',
  green3: '#55B75E',
  greenText: '#7BC882',
  mint: '#A9CDB1',
  purple1: '#7C72FE',
  purple2: '#6B62E0',
  purple3: '#544CBB',
  primaryLabel: '#092011',
  yellow: '#FFDE8C',
  danger: '#F0605D',
  hairline: 'rgba(171, 194, 181, 0.17)',
} as const;

export const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const primaryGradient = `linear-gradient(180deg, ${C.green1}, ${C.green2} 55%, ${C.green3})`;
export const accentGradient = `linear-gradient(180deg, ${C.purple1}, ${C.purple2} 55%, ${C.purple3})`;
