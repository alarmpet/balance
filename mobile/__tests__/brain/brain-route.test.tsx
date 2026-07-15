import { act, render, waitFor } from '@testing-library/react-native';

type FocusCallback = () => void | (() => void);
let mockFocusCallback: FocusCallback | undefined;
let mockBlur: (() => void) | undefined;

jest.mock('expo-router', () => {
  const React = jest.requireActual('react') as typeof import('react');
  return {
    useFocusEffect: (callback: FocusCallback) => {
      mockFocusCallback = callback;
      React.useEffect(() => {
        const cleanup = callback();
        mockBlur = typeof cleanup === 'function' ? cleanup : undefined;
        return cleanup;
      }, [callback]);
    },
  };
});

import BrainRoute from '../../app/(tabs)/brain';
import { AppProviders } from '@/src/providers/AppProviders';
import { LocalQuestionRepository } from '@/src/features/play/data/LocalQuestionRepository';
import type { Question } from '@/src/features/play/domain/question';
import { BrainScreen } from '@/src/features/brain/ui/BrainScreen';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

jest.mock('@/src/features/brain/ui/BrainScreen', () => ({
  BrainScreen: jest.fn(() => null),
}));

const MockBrainScreen = BrainScreen as jest.MockedFunction<typeof BrainScreen>;

const question: Question = {
  id: 'brain-q1',
  optionA: '자유롭게 선택',
  optionB: '안정적으로 선택',
  description: null,
  category: '일상',
  visibility: 'public',
  closesAt: null,
  isDaily: true,
  stage: 'active',
  weightsA: { freedom: 2 },
  weightsB: { stability: 1 },
};

const secondQuestion: Question = {
  ...question,
  id: 'brain-q2',
  isDaily: false,
  category: '취향',
  weightsA: { growth: 2 },
};

beforeEach(() => {
  MockBrainScreen.mockClear();
  mockFocusCallback = undefined;
  mockBlur = undefined;
});

test('loads only the current user vote evidence into the brain screen', async () => {
  const repository = new LocalQuestionRepository([question]);
  await repository.vote({
    questionId: question.id,
    userId: 'current-user',
    choice: 'A',
    actionId: 'current-action',
  });
  await repository.vote({
    questionId: question.id,
    userId: 'other-user',
    choice: 'B',
    actionId: 'other-action',
  });

  await render(
    <AppProviders
      loadSession={async () => ({ userId: 'current-user' })}
      pendingActionQueue={createPendingActionQueue(new Map<string, string>())}
      questionRepository={repository}
    >
      <BrainRoute />
    </AppProviders>,
  );

  await waitFor(() => expect(MockBrainScreen).toHaveBeenCalled());
  expect(MockBrainScreen.mock.calls.at(-1)?.[0].votes).toEqual([
    { questionId: 'brain-q1', choice: 'A', weights: { freedom: 2 }, category: '일상' },
  ]);
});

test('reloads new vote evidence when the mounted brain tab regains focus', async () => {
  const repository = new LocalQuestionRepository([question, secondQuestion]);
  const getVoteEvidence = jest.spyOn(repository, 'getVoteEvidence');
  await repository.vote({
    questionId: question.id,
    userId: 'current-user',
    choice: 'A',
    actionId: 'first-action',
  });

  await render(
    <AppProviders
      loadSession={async () => ({ userId: 'current-user' })}
      pendingActionQueue={createPendingActionQueue(new Map<string, string>())}
      questionRepository={repository}
    >
      <BrainRoute />
    </AppProviders>,
  );

  await waitFor(() => {
    expect(MockBrainScreen.mock.calls.at(-1)?.[0].votes).toHaveLength(1);
  });
  expect(mockFocusCallback).toBeDefined();

  await act(async () => {
    mockBlur?.();
    await repository.vote({
      questionId: secondQuestion.id,
      userId: 'current-user',
      choice: 'A',
      actionId: 'second-action',
    });
    const cleanup = mockFocusCallback?.();
    mockBlur = typeof cleanup === 'function' ? cleanup : undefined;
  });

  await waitFor(() => {
    expect(MockBrainScreen.mock.calls.at(-1)?.[0].votes).toHaveLength(2);
  });
  expect(getVoteEvidence).toHaveBeenCalledTimes(2);
  expect(MockBrainScreen.mock.calls.at(-1)?.[0].votes[1]).toMatchObject({
    questionId: 'brain-q2',
    category: '취향',
  });
});
