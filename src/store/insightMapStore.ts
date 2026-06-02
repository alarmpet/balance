import { create } from 'zustand';
import {
  fetchInsightCards,
  fetchInsightGraph,
  markInsightRead
} from '../services/insightMapService';
import type { InsightGraphSnapshot, UserInsightCardRow } from '../types/database.types';

type InsightMapState = {
  snapshot: InsightGraphSnapshot | null;
  cards: UserInsightCardRow[];
  focusNodeId: string | null;
  selectedNodeId: string | null;
  depth: number;
  isLoading: boolean;
  isLoadingCards: boolean;
  error: string | null;
  loadGraph: (focusNodeId?: string | null, depth?: number) => Promise<void>;
  loadCards: () => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  setDepth: (depth: number) => Promise<void>;
  markCardRead: (insightId: string) => Promise<void>;
  clearError: () => void;
};

export const useInsightMapStore = create<InsightMapState>((set, get) => ({
  snapshot: null,
  cards: [],
  focusNodeId: null,
  selectedNodeId: null,
  depth: 1,
  isLoading: false,
  isLoadingCards: false,
  error: null,

  async loadGraph(focusNodeId = get().focusNodeId, depth = get().depth) {
    const nextDepth = Math.min(2, Math.max(1, depth));
    set({ isLoading: true, error: null, focusNodeId, depth: nextDepth });

    try {
      const snapshot = await fetchInsightGraph(focusNodeId, nextDepth);
      set({ snapshot, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '선택 지도를 불러오지 못했어요.'
      });
    }
  },

  async loadCards() {
    set({ isLoadingCards: true, error: null });

    try {
      const cards = await fetchInsightCards();
      set({ cards, isLoadingCards: false });
    } catch (error) {
      set({
        isLoadingCards: false,
        error: error instanceof Error ? error.message : '오늘의 발견을 불러오지 못했어요.'
      });
    }
  },

  selectNode(nodeId) {
    set({ selectedNodeId: nodeId, focusNodeId: nodeId });
  },

  async setDepth(depth) {
    const nextDepth = Math.min(2, Math.max(1, depth));
    await get().loadGraph(get().focusNodeId, nextDepth);
  },

  async markCardRead(insightId) {
    try {
      const updated = await markInsightRead(insightId);
      set({
        cards: get().cards.map((card) => (card.id === insightId ? updated : card))
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '발견 카드를 읽음 처리하지 못했어요.'
      });
    }
  },

  clearError() {
    set({ error: null });
  }
}));
