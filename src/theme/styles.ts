import { MOTION } from './motion';
import { SURFACES } from './surfaces';

export const THEME = {
  motion: MOTION,
  surfaces: SURFACES,
  colors: {
    backgrounds: {
      feed: ['#e9fbf6', '#f0fdfa'],
      island: ['#ecfeff', '#e0f2fe'],
      insight: ['#0f172a', '#1e293b']
    },
    accent: SURFACES.accent,
    ui: {
      glassBackground: SURFACES.background.panel,
      glassBorder: SURFACES.border.light,
      darkGlassBackground: SURFACES.background.darkPanel,
      darkGlassBorder: 'rgba(255, 255, 255, 0.12)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textDarkPrimary: '#f8fafc',
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
