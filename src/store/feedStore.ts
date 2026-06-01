import { create } from 'zustand';
import type { OptionSide, Question, QuestionReactionType } from '../types/database.types';
import type {
  FetchFeedQuestionsParams,
  SubmitReactionParams,
  SubmitVoteParams,
} from '../services/questionService';
import {
  fetchFeedQuestions,
  submitReaction,
  submitVote,
} from '../services/questionService';

type UserVotes = Record<string, OptionSide>;
type UserReactions = Record<string, QuestionReactionType[]>;

interface FeedState {
  questions: Question[];
  userVotes: UserVotes;
  userReactions: UserReactions;
  isLoading: boolean;
  error: string | null;
  setQuestions: (questions: Question[]) => void;
  clearError: () => void;
  loadFeedQuestions: (params?: FetchFeedQuestionsParams) => Promise<void>;
  castVoteLocal: (questionId: string, option: OptionSide) => void;
  voteOnQuestion: (params: SubmitVoteParams) => Promise<void>;
  reactToQuestion: (params: SubmitReactionParams) => Promise<void>;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return 'Request failed. Please try again.';
};

const increaseVoteCount = (question: Question, option: OptionSide): Question => ({
  ...question,
  total_votes: question.total_votes + 1,
  option_a_votes: option === 'A' ? question.option_a_votes + 1 : question.option_a_votes,
  option_b_votes: option === 'B' ? question.option_b_votes + 1 : question.option_b_votes,
  heat_score: question.heat_score + 1,
});

const increaseReactionCount = (question: Question, reactionType: QuestionReactionType): Question => {
  if (reactionType === 'like') {
    return { ...question, like_count: question.like_count + 1, heat_score: question.heat_score + 0.25 };
  }

  if (reactionType === 'fun') {
    return { ...question, fun_count: question.fun_count + 1, heat_score: question.heat_score + 0.25 };
  }

  return { ...question, hard_count: question.hard_count + 1, heat_score: question.heat_score + 0.25 };
};

export const useFeedStore = create<FeedState>((set, get) => ({
  questions: [],
  userVotes: {},
  userReactions: {},
  isLoading: false,
  error: null,

  setQuestions: (questions) => set({ questions, error: null }),

  clearError: () => set({ error: null }),

  loadFeedQuestions: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const questions = await fetchFeedQuestions(params);
      set({ questions, isLoading: false, error: null });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) });
    }
  },

  castVoteLocal: (questionId, option) =>
    set((state) => {
      if (state.userVotes[questionId]) {
        return state;
      }

      return {
        questions: state.questions.map((question) =>
          question.id === questionId ? increaseVoteCount(question, option) : question,
        ),
        userVotes: { ...state.userVotes, [questionId]: option },
        error: null,
      };
    }),

  voteOnQuestion: async (params) => {
    const { questionId, selectedOption } = params;
    const previousQuestions = get().questions;
    const previousUserVotes = get().userVotes;

    if (previousUserVotes[questionId]) {
      return;
    }

    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === questionId ? increaseVoteCount(question, selectedOption) : question,
      ),
      userVotes: { ...state.userVotes, [questionId]: selectedOption },
      error: null,
    }));

    try {
      await submitVote(params);
    } catch (error) {
      set({
        questions: previousQuestions,
        userVotes: previousUserVotes,
        error: getErrorMessage(error),
      });
    }
  },

  reactToQuestion: async (params) => {
    const { questionId, reactionType } = params;
    const previousQuestions = get().questions;
    const previousUserReactions = get().userReactions;
    const existingReactions = previousUserReactions[questionId] ?? [];

    if (existingReactions.includes(reactionType)) {
      return;
    }

    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === questionId ? increaseReactionCount(question, reactionType) : question,
      ),
      userReactions: {
        ...state.userReactions,
        [questionId]: [...(state.userReactions[questionId] ?? []), reactionType],
      },
      error: null,
    }));

    try {
      const result = await submitReaction(params);

      if (result.alreadyReacted) {
        set({
          questions: previousQuestions,
          userReactions: previousUserReactions,
          error: null,
        });
        return;
      }

      if (result.question) {
        set((state) => ({
          questions: state.questions.map((question) =>
            question.id === questionId ? result.question : question,
          ),
          error: null,
        }));
      }
    } catch (error) {
      set({
        questions: previousQuestions,
        userReactions: previousUserReactions,
        error: getErrorMessage(error),
      });
    }
  },
}));
