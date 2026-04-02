// Medical-grade design tokens
export const C = {
  // Primary — clinical blue
  brand: '#1B6EF3',
  brandDark: '#1458C2',
  brandLight: '#EBF3FE',
  brandMuted: '#D4E4FC',

  // Semantic
  green: '#12B76A',
  greenDark: '#0E9A58',
  greenLight: '#ECFDF3',

  red: '#F04438',
  redLight: '#FEF3F2',

  amber: '#F79009',
  amberLight: '#FFFAEB',

  purple: '#6941C6',
  purpleLight: '#F4F3FF',

  // Surface
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#EAECF0',
  borderDark: '#D0D5DD',

  // Text
  text: '#101828',
  textSecondary: '#344054',
  textTertiary: '#98A2B3',
  textInverse: '#FFFFFF',

  // Header
  dark: '#101828',
  darkSecondary: '#1D2939',
  darkTertiary: '#344054',
} as const;

export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
} as const;

export const SHADOW = {
  sm: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 } as { width: number; height: number },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 } as { width: number; height: number },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 } as { width: number; height: number },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// Spacing scale
export const SP = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
