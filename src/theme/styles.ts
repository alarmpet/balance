import { MOTION } from './motion';
import { SURFACES } from './surfaces';

export const THEME = {
  motion: MOTION,
  surfaces: SURFACES,
  colors: {
    backgrounds: {
      feed: ['#FFF0F5', '#E6F3FF', '#F0E6FF', '#FFFFE0'],
      island: ['#ecfeff', '#e0f2fe'],
      insight: ['#070b19', '#0b132b', '#1c2541']
    },
    accent: SURFACES.accent,
    ui: {
      glassBackground: 'rgba(255, 255, 255, 0.45)',
      glassBorder: 'rgba(255, 255, 255, 0.5)',
      darkGlassBackground: 'rgba(15, 23, 42, 0.55)',
      darkGlassBorder: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textDarkPrimary: '#ffffff',
      textDarkSecondary: '#cbd5e1'
    }
  },
  shadows: {
    glow: {
      shadowColor: '#0ea5e9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 5
    },
    glass: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4
    }
  },
  typography: {
    kicker: { fontSize: 12, fontWeight: '900' as const, letterSpacing: 0, textTransform: 'uppercase' as const },
    heading: { fontSize: 28, fontWeight: '900' as const, lineHeight: 36 },
    title: { fontSize: 20, fontWeight: '900' as const, lineHeight: 26 },
    body: { fontSize: 14, fontWeight: '600' as const, lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 18 }
  },
  shapes: {
    borderRadiusCard: SURFACES.radius.panel,
    borderRadiusPill: SURFACES.radius.pill,
    borderRadiusSheet: SURFACES.radius.sheet
  }
};
