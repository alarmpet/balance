import { create } from 'zustand';
import {
  careAvatar,
  claimDailyCheckin,
  fetchGamificationSnapshot,
  signOut,
  type CareType,
  type GamificationSnapshot
} from '../services/gamificationService';

type GamificationState = {
  snapshot: GamificationSnapshot | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  loadSnapshot: () => Promise<void>;
  claimCheckin: () => Promise<void>;
  careForAvatar: (careType: CareType) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  snapshot: null,
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
        error: error instanceof Error ? error.message : '캐릭터를 돌볼 수 없습니다.'
      });
    }
  },

  async signOutUser() {
    await signOut();
    set({ snapshot: null, error: null });
  },

  clearError() {
    set({ error: null });
  }
}));
