import { GRADIENTS } from './gradients';
import { MOTION } from './motion';
import { SURFACES } from './surfaces';

export const THEME = {
  motion: MOTION,
  surfaces: SURFACES,
  gradients: GRADIENTS,
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
  // 인사이트 클러스터별 네온 글로우(주황/민트/자홍). SVG feGaussianBlur 색과 매칭.
  glowByCluster: {
    food: { shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 6 },
    life: { shadowColor: '#14b8a6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 6 },
    romance: { shadowColor: '#d946ef', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 6 }
  },
  // 3D 깊이 위계(카드 → 패널 → 플로팅)
  elevation: {
    e1: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
    e2: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    e3: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.16, shadowRadius: 30, elevation: 9 }
  },
  accentColors: {
    gold: '#f59e0b',
    goldSoft: '#fde68a'
  },
  typography: {
    kicker: { fontSize: 12, fontWeight: '900' as const, letterSpacing: 0, textTransform: 'uppercase' as const },
    display: { fontSize: 34, fontWeight: '900' as const, lineHeight: 40, letterSpacing: -0.5 },
    heading: { fontSize: 28, fontWeight: '900' as const, lineHeight: 36 },
    title: { fontSize: 20, fontWeight: '900' as const, lineHeight: 26 },
    stat: { fontSize: 18, fontWeight: '900' as const, lineHeight: 22 },
    badge: { fontSize: 10, fontWeight: '900' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
    body: { fontSize: 14, fontWeight: '600' as const, lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 18 }
  },
  shapes: {
    borderRadiusCard: SURFACES.radius.panel,
    borderRadiusPill: SURFACES.radius.pill,
    borderRadiusSheet: SURFACES.radius.sheet
  }
};
