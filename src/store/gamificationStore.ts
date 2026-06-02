import { create } from 'zustand';
import {
  assignPersonalityPet,
  careAvatar,
  claimDailyCheckin,
  claimDailyThemeDraw,
  drawThemePack,
  fetchGamificationSnapshot,
  signOut,
  type CareType,
  type GamificationSnapshot
} from '../services/gamificationService';
import type { ThemeDrawResultRow } from '../types/database.types';

type GamificationState = {
  snapshot: GamificationSnapshot | null;
  lastThemeDrawResults: ThemeDrawResultRow[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  loadSnapshot: () => Promise<void>;
  claimCheckin: () => Promise<void>;
  careForAvatar: (careType: CareType) => Promise<void>;
  assignPet: () => Promise<void>;
  claimTheme: () => Promise<void>;
  drawTheme: (poolSlug?: string, drawCount?: number) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearThemeDrawResults: () => void;
  clearError: () => void;
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  snapshot: null,
  lastThemeDrawResults: [],
  isLoading: false,
  isMutating: false,
  error: null,

  async loadSnapshot() {
    set({ isLoading: true, error: null });

    try {
      const snapshot = await fetchGamificationSnapshot();
      set({ snapshot, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '게임화 정보를 불러오지 못했습니다.'
      });
    }
  },

  async claimCheckin() {
    set({ isMutating: true, error: null });

    try {
      await claimDailyCheckin();
      const snapshot = await fetchGamificationSnapshot();
      set({ snapshot, isMutating: false });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : '출석 보상을 받을 수 없습니다.'
      });
    }
  },

  async careForAvatar(careType) {
    set({ isMutating: true, error: null });

    try {
      const avatarState = await careAvatar(careType);
      const currentSnapshot = get().snapshot;
      const snapshot = await fetchGamificationSnapshot();

      set({
        snapshot: currentSnapshot ? { ...snapshot, avatarState } : snapshot,
        isMutating: false
      });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : '펫을 케어할 수 없습니다.'
      });
    }
  },

  async assignPet() {
    set({ isMutating: true, error: null });

    try {
      await assignPersonalityPet();
      const snapshot = await fetchGamificationSnapshot();
      set({ snapshot, isMutating: false });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : '성향 펫을 배정할 수 없습니다.'
      });
    }
  },

  async claimTheme() {
    set({ isMutating: true, error: null });

    try {
      const lastThemeDrawResults = await claimDailyThemeDraw();
      const snapshot = await fetchGamificationSnapshot();
      set({ snapshot, lastThemeDrawResults, isMutating: false });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : '오늘의 무료 테마를 받을 수 없습니다.'
      });
    }
  },

  async drawTheme(poolSlug = 'standard-theme', drawCount = 1) {
    set({ isMutating: true, error: null });

    try {
      const lastThemeDrawResults = await drawThemePack(poolSlug, drawCount);
      const snapshot = await fetchGamificationSnapshot();
      set({ snapshot, lastThemeDrawResults, isMutating: false });
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : '테마 뽑기를 진행할 수 없습니다.'
      });
    }
  },

  async signOutUser() {
    await signOut();
    set({ snapshot: null, lastThemeDrawResults: [], error: null });
  },

  clearThemeDrawResults() {
    set({ lastThemeDrawResults: [] });
  },

  clearError() {
    set({ error: null });
  }
}));
