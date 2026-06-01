import { create } from 'zustand';
import {
  fetchFeedQuestions,
  submitReaction,
  submitVote,
  type FeedQuestion,
  type FeedSort,
  type OptionSide,
  type ReactionType
} from '../services/questionService';
import { useGamificationStore } from './gamificationStore';

type FeedState = {
  questions: FeedQuestion[];
  currentSort: FeedSort;
  isLoading: boolean;
  error: string | null;
  loadFeedQuestions: (sort?: FeedSort) => Promise<void>;
  voteOnQuestion: (questionId: string, selectedOption: OptionSide) => Promise<void>;
  reactToQuestion: (questionId: string, reactionType: ReactionType) => Promise<void>;
  clearError: () => void;
};

export const useFeedStore = create<FeedState>((set, get) => ({
  questions: [],
  currentSort: 'popular',
  isLoading: false,
  error: null,

  async loadFeedQuestions(sort = get().currentSort) {
    set({ isLoading: true, error: null, currentSort: sort });

    try {
      const questions = await fetchFeedQuestions(sort);
      set({ questions, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '피드를 불러오지 못했습니다.'
      });
    }
  },

  async voteOnQuestion(questionId, selectedOption) {
    const previousQuestions = get().questions;
    const previousQuestion = previousQuestions.find((question) => question.id === questionId);
    const nextQuestions = previousQuestions.map((question) => {
      if (question.id !== questionId || question.userVote) return question;
      return {
        ...question,
        userVote: selectedOption,
        vote_count_a: selectedOption === 'A' ? question.vote_count_a + 1 : question.vote_count_a,
        vote_count_b: selectedOption === 'B' ? question.vote_count_b + 1 : question.vote_count_b
      };
    });

    set({ questions: nextQuestions, error: null });

    try {
      await submitVote(questionId, selectedOption);
      void useGamificationStore.getState().loadSnapshot();
    } catch (error) {
      set({
        questions: previousQuestion
          ? get().questions.map((question) => (question.id === questionId ? previousQuestion : question))
          : get().questions,
        error: error instanceof Error ? error.message : '투표 저장에 실패했습니다.'
      });
    }
  },

  async reactToQuestion(questionId, reactionType) {
    const previousQuestions = get().questions;
    const previousQuestion = previousQuestions.find((question) => question.id === questionId);
    const nextQuestions = previousQuestions.map((question) => {
      if (question.id !== questionId || question.userReaction === reactionType) return question;

      return {
        ...question,
        userReaction: reactionType,
        reaction_like_count: question.reaction_like_count + (reactionType === 'like' ? 1 : 0),
        reaction_fun_count: question.reaction_fun_count + (reactionType === 'fun' ? 1 : 0),
        reaction_hard_count: question.reaction_hard_count + (reactionType === 'hard' ? 1 : 0)
      };
    });

    set({ questions: nextQuestions, error: null });

    try {
      await submitReaction(questionId, reactionType);
    } catch (error) {
      set({
        questions: previousQuestion
          ? get().questions.map((question) => (question.id === questionId ? previousQuestion : question))
          : get().questions,
        error: error instanceof Error ? error.message : '리액션 저장에 실패했습니다.'
      });
    }
  },

  clearError() {
    set({ error: null });
  }
}));
