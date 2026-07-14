import { create } from 'zustand';

interface DeckState {
  index: number;
  advance: () => void;
  reset: () => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  index: 0,
  advance: () => set((state) => ({ index: state.index + 1 })),
  reset: () => set({ index: 0 }),
}));
