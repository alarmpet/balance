import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import QuestionDetailRoute from '../../app/question/[id]';
import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import type { Question } from '@/src/features/play/domain/question';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';
import { QuestionRepositoryContext, SessionContext } from '@/src/providers/AppProviders';

const question: Question = {
  id: '60000000-0000-0000-0000-000000000401',
  optionA: '친구 5명 깊게 사귀기',
  optionB: '지인 100명 넓게 알기',
  description: '관계에서 더 중요한 것을 골라 보세요.',
  category: '관계',
  visibility: 'public',
  closesAt: null,
  isDaily: false,
  stage: 'active',
  weightsA: { relationship: 1 },
  weightsB: { freedom: 1 },
};

function createRepository(overrides: Partial<QuestionRepository> = {}): QuestionRepository {
  return {
    getDaily: jest.fn(),
    getFeed: jest.fn(),
    getById: jest.fn().mockResolvedValue(question),
    getVoteEvidence: jest.fn().mockResolvedValue([]),
    vote: jest.fn(),
    skip: jest.fn(),
    create: jest.fn(),
    report: jest.fn().mockResolvedValue(undefined),
    blockQuestionAuthor: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as QuestionRepository;
}

async function renderDetail(overrides: Partial<QuestionRepository> = {}) {
  const repository = createRepository(overrides);
  const pendingActionQueue = createPendingActionQueue(new Map());
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={repository}>
        <SessionContext.Provider value={{
          status: 'ready',
          userId: '71000000-0000-0000-0000-000000000401',
          canMutate: true,
          pendingActionQueue,
        }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }
  await renderRouter({ 'question/[id]': QuestionDetailRoute }, {
    initialUrl: `/question/${question.id}`,
    wrapper: Wrapper,
  });
  return repository;
}

test('shows the approved detail hierarchy and only implemented phase-one actions', async () => {
  await renderDetail();

  await waitFor(() => expect(screen.getByLabelText('밸런스 상세')).toBeTruthy());
  expect(screen.getByRole('header', {
    name: `${question.optionA} vs ${question.optionB}`,
  })).toBeTruthy();
  expect(screen.getByLabelText('한 줄 인사이트')).toHaveTextContent(
    /이 질문은 관계에 관한 선택이에요\./,
  );
  expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '공유하기' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '신고하기' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '작성자 차단하기' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /댓글|공감|저장|비슷한 사람/ })).toBeNull();
  expect(screen.queryByTestId('vote-split-bar')).toBeNull();
});

test('groups active options as read-only content rather than fake buttons', async () => {
  await renderDetail();

  await waitFor(() => expect(screen.getByLabelText(
    `질문: ${question.description}, A: ${question.optionA}, B: ${question.optionB}, 카테고리: ${question.category}`,
  )).toBeTruthy());
  expect(screen.queryByRole('button', { name: /A 선택|B 선택/ })).toBeNull();
});

test('renders an empty closed result without a broken zero-to-zero bar', async () => {
  const closedQuestion = { ...question, closesAt: '2026-07-14T00:00:00.000Z' };
  await renderDetail({
    getById: jest.fn().mockResolvedValue(null),
    getClosedResult: jest.fn().mockResolvedValue({
      question: closedQuestion,
      countA: 0,
      countB: 0,
      percentA: 0,
      percentB: 0,
      label: '결과 없음',
    }),
  });

  await waitFor(() => expect(screen.getByText('아직 투표가 없어요')).toBeTruthy());
  expect(screen.queryByTestId('vote-split-bar')).toBeNull();
});
