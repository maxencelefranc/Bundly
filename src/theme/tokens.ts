export type ColorScheme = 'light' | 'dark';

const palette = {
  // Neutral grayscale tuned for clean UI
  white: '#FFFFFF',
  black: '#0B0F14',
  gray100: '#F7F5FA', // page background (light tint)
  gray150: '#F1EEF5',
  gray200: '#E7E3EC', // borders
  gray300: '#D9D4DF',
  gray600: '#6B6F76',
  gray800: '#1E2126',

  // Accent (single brand color) + supportive
  accent: '#000000', // primary now black
  accent700: '#222222',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444'
};

export const tokens = (mode: ColorScheme) => {
  const isDark = mode === 'dark';
  const bg = isDark ? '#0E1116' : palette.gray100;
  const surface = isDark ? '#12161D' : palette.white;
  const card = isDark ? '#1A1F27' : palette.white;
  const text = isDark ? '#E6E8EC' : '#151A21';
  const muted = isDark ? '#A0A6AE' : '#6A7280';
  const primary = palette.accent;

  return {
    mode,
    color: {
      bg,
      surface,
      card,
      text,
      muted,
      primary,
      success: palette.green,
      warning: palette.amber,
      danger: palette.red,
      border: isDark ? '#27303A' : palette.gray200
    },
    radius: {
      sm: 10,
      md: 14,
      lg: 16,
      xl: 22
    },
    spacing: {
      xs: 6,
      sm: 10,
      md: 14,
      lg: 18,
      xl: 24,
      xxl: 32
    },
    shadow: {
      card: isDark
        ? { shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 10, elevation: 6 }
        : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }
    },
    gradient: {
      appBg: isDark ? ['#0E1116', '#0E1116'] : [palette.gray100, palette.gray150],
      primary: [palette.accent, palette.accent700]
    },
    typography: {
      h1: { fontSize: 24, fontWeight: '700' as const, fontFamily: 'Poppins_600SemiBold' },
      h2: { fontSize: 18, fontWeight: '600' as const, fontFamily: 'Poppins_500Medium' },
      body: { fontSize: 15, fontWeight: '500' as const, fontFamily: 'Poppins_400Regular' },
      small: { fontSize: 12, fontWeight: '500' as const, fontFamily: 'Poppins_400Regular' }
    }
  };
};

export type Tokens = ReturnType<typeof tokens>;
