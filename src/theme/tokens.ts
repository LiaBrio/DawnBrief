export const tokens = {
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 },
  radius: { card: 24, button: 18, pill: 999 },
  light: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#111113',
    secondary: '#6E6E73',
    accent: '#FF9500',
    onAccent: '#FFFFFF',
    switchThumb: '#FFFFFF',
    separator: '#E5E5EA',
  },
  dark: {
    background: '#000000',
    card: '#1C1C1E',
    text: '#F5F5F7',
    secondary: '#98989D',
    accent: '#FF9F0A',
    onAccent: '#FFFFFF',
    switchThumb: '#FFFFFF',
    separator: '#2C2C2E',
  },
};

export type ColorMode = 'light' | 'dark';

export function palette(mode: ColorMode) {
  return tokens[mode];
}
