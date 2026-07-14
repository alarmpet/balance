import { cleanup, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';
import { Share, Text } from 'react-native';

import ShareRoute, { isShareQuestionAvailable } from '../../app/share/[id]';
import QuestionDetailRoute, { createQuestionShareUrl, isQuestionDetailAvailable } from '../../app/question/[id]';
import { QuestionRepositoryContext, SessionContext } from '@/src/providers/AppProviders';
import { RetryableTransportError, type QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import type { Question } from '@/src/features/play/domain/question';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';
import { track } from '@/src/features/analytics/analytics';

jest.mock('@/src/features/analytics/analytics', () => ({
  ...jest.requireActual('@/src/features/analytics/analytics'),
  track: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '10000000-0000-4000-8000-000000000077'),
}));

const question: Question = {
  id: '60000000-0000-0000-0000-000000000001',
  optionA: '평생 여름',
  optionB: '평생 겨울',
  description: '하나만 고른다면?',
  category: '일상',
  visibility: 'link',
  closesAt: null,
  isDaily: false,
  stage: 'pending',
  weightsA: {},
  weightsB: {},
};

function repository(overrides: Partial<QuestionRepository> = {}): QuestionRepository {
  return {
    getDaily: jest.fn(),
    getFeed: jest.fn(),
    getById: jest.fn().mockResolvedValue(question),
    getVoteEvidence: jest.fn(),
    vote: jest.fn().mockResolvedValue({
      applyStatus: 'applied',
      selected: 'A',
      countA: 7,
      countB: 3,
      percentA: 70,
      percentB: 30,
      label: '다수파',
      axisScores: {},
    }),
    skip: jest.fn(),
    create: jest.fn(),
    report: jest.fn(),
    ...overrides,
  } as QuestionRepository;
}

async function renderShare(target: QuestionRepository) {
  const pendingActionQueue = createPendingActionQueue(new Map<string, string>());
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={target}>
        <SessionContext.Provider value={{
          status: 'ready',
          userId: '71000000-0000-0000-0000-000000000001',
          canMutate: true,
          pendingActionQueue,
        }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }

  const view = await renderRouter(
    {
      'share/[id]': ShareRoute,
      index: jest.fn(() => <Text>플레이로 이동</Text>),
    },
    { initialUrl: `/share/${question.id}`, wrapper: Wrapper },
  );
  return { view, pendingActionQueue };
}

afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  (track as jest.Mock).mockClear();
});

test('shows a clear shared-balance hierarchy without fake social controls or early results', async () => {
  await renderShare(repository());

  await waitFor(() => expect(screen.getByRole('header', { name: '공유된 밸런스' })).toBeTruthy());
  expect(screen.getByRole('header', { name: `${question.optionA} vs ${question.optionB}` })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /댓글|공감|저장|비슷한 사람/ })).toBeNull();
  expect(screen.queryByText(/%/)).toBeNull();
});

test('reuses one persisted action id after a lost response and shows the result before upgrade', async () => {
  const target = repository();
  (target.vote as jest.Mock)
    .mockRejectedValueOnce(new RetryableTransportError('Network request failed after commit'))
    .mockResolvedValueOnce({
      applyStatus: 'already_applied', selected: 'A', countA: 7, countB: 3,
      percentA: 70, percentB: 30, label: '다수파', axisScores: {},
    });
  const { pendingActionQueue } = await renderShare(target);

  await waitFor(() => expect(screen.getByText('평생 여름')).toBeTruthy());
  expect(screen.queryByText(/가입|로그인|계정/)).toBeNull();
  await fireEvent.press(screen.getByLabelText('A 선택: 평생 여름'));

  await waitFor(() => expect(screen.getByText('저장한 투표 다시 시도')).toBeTruthy());
  const queued = await pendingActionQueue.list();
  expect(queued).toHaveLength(1);
  await fireEvent.press(screen.getByText('저장한 투표 다시 시도'));

  await waitFor(() => expect(screen.getByText('70% vs 30%')).toBeTruthy());
  expect(target.vote).toHaveBeenCalledWith(expect.objectContaining({
    questionId: question.id,
    userId: '71000000-0000-0000-0000-000000000001',
    choice: 'A',
  }));
  expect(target.vote).toHaveBeenCalledTimes(2);
  expect(track).toHaveBeenCalledWith({
    name: 'shared_question_voted', userId: '71000000-0000-0000-0000-000000000001',
    questionId: question.id, source: 'share',
  });
  expect((target.vote as jest.Mock).mock.calls[0][0].actionId)
    .toBe((target.vote as jest.Mock).mock.calls[1][0].actionId);
  expect((target.vote as jest.Mock).mock.calls[0][0].actionId).toBe(queued[0].id);
  expect(await pendingActionQueue.list()).toEqual([]);
  expect(screen.getByText('다른 밸런스도 보기')).toBeTruthy();
  expect(screen.queryByText(/가입|로그인|계정/)).toBeNull();
  await fireEvent.press(screen.getByText('다른 밸런스도 보기'));
  await waitFor(() => expect(screen.getByText('플레이로 이동')).toBeTruthy());
});

test('offers retry for a missing or closed shared question', async () => {
  const closed = { ...question, closesAt: '2020-01-01T00:00:00.000Z' };
  const target = repository({
    getById: jest.fn()
      .mockResolvedValueOnce(closed)
      .mockResolvedValueOnce(question),
  });
  await renderShare(target);

  await waitFor(() => expect(screen.getByText('질문을 찾을 수 없어요.')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: '공유 질문 다시 시도' }));

  await waitFor(() => expect(screen.getByLabelText(`A 선택: ${question.optionA}`)).toBeTruthy());
  expect(target.getById).toHaveBeenCalledTimes(2);
});

test.each([
  ['missing', null],
  ['hidden', { ...question, stage: 'hidden' as const }],
  ['closed', { ...question, closesAt: '2020-01-01T00:00:00.000Z' }],
])('does not expose a %s shared question', async (_case, value) => {
  expect(isShareQuestionAvailable(value, Date.parse('2026-07-14T00:00:00.000Z'))).toBe(false);
  expect(isQuestionDetailAvailable(value, Date.parse('2026-07-14T00:00:00.000Z'))).toBe(false);
});

test('builds the platform URL through Expo Linking', () => {
  expect(createQuestionShareUrl(question.id)).toContain(`/share/${question.id}`);
});

test('notification detail renders an authorized closed result instead of unavailable', async () => {
  const closed = { ...question, closesAt: '2026-07-13T00:00:00.000Z', stage: 'active' as const };
  const target = repository({
    getById: jest.fn().mockResolvedValue(null),
    getClosedResult: jest.fn().mockResolvedValue({
      question: closed, countA: 1, countB: 0, percentA: 100, percentB: 0, label: 'A 우세',
    }),
  });
  const pendingActionQueue = createPendingActionQueue(new Map());
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={target}>
        <SessionContext.Provider value={{ status: 'ready', userId: '71000000-0000-0000-0000-000000000001', canMutate: true, pendingActionQueue }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }
  await renderRouter({ 'question/[id]': QuestionDetailRoute }, {
    initialUrl: `/question/${question.id}?source=notification`, wrapper: Wrapper,
  });
  await waitFor(() => expect(screen.getByLabelText('A 100퍼센트, B 0퍼센트')).toBeTruthy());
  expect(screen.getByText('A 우세')).toBeTruthy();
  expect(screen.queryByText(/찾을 수 없/)).toBeNull();
});

test('renders the primary detail when auxiliary vote evidence is offline', async () => {
  const target = repository({ getVoteEvidence: jest.fn().mockRejectedValue(new TypeError('fetch failed')) });
  const pendingActionQueue = createPendingActionQueue(new Map());
  function Wrapper({ children }: PropsWithChildren) {
    return <QuestionRepositoryContext.Provider value={target}>
      <SessionContext.Provider value={{ status: 'ready', userId: '71000000-0000-0000-0000-000000000001', canMutate: true, pendingActionQueue }}>
        {children}
      </SessionContext.Provider>
    </QuestionRepositoryContext.Provider>;
  }
  await renderRouter({ 'question/[id]': QuestionDetailRoute }, { initialUrl: `/question/${question.id}`, wrapper: Wrapper });
  await waitFor(() => expect(screen.getByRole('header', { name: `${question.optionA} vs ${question.optionB}` })).toBeTruthy());
  expect(screen.queryByRole('button', { name: /돈/ })).toBeNull();
  expect(screen.queryByText('질문을 불러오지 못했어요.')).toBeNull();
});

test('tracks successful share and report with identifiers only', async () => {
  const target = repository({ report: jest.fn().mockResolvedValue(undefined) });
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
  const pendingActionQueue = createPendingActionQueue(new Map());
  function Wrapper({ children }: PropsWithChildren) {
    return <QuestionRepositoryContext.Provider value={target}>
      <SessionContext.Provider value={{ status: 'ready', userId: '71000000-0000-0000-0000-000000000001', canMutate: true, pendingActionQueue }}>
        {children}
      </SessionContext.Provider>
    </QuestionRepositoryContext.Provider>;
  }
  await renderRouter({ 'question/[id]': QuestionDetailRoute }, { initialUrl: `/question/${question.id}`, wrapper: Wrapper });
  await waitFor(() => expect(screen.getByLabelText('공유하기')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('공유하기'));
  await fireEvent.press(screen.getByLabelText('신고하기'));
  await waitFor(() => expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: 'report_submitted' })));
  expect(track).toHaveBeenCalledWith({ name: 'question_shared', userId: '71000000-0000-0000-0000-000000000001', questionId: question.id, source: 'share' });
  for (const [event] of (track as jest.Mock).mock.calls) {
    expect(event).not.toHaveProperty('optionA');
    expect(event).not.toHaveProperty('reason');
  }
  (track as jest.Mock).mockClear();
  (Share.share as jest.Mock).mockResolvedValueOnce({ action: Share.dismissedAction });
  await fireEvent.press(screen.getByLabelText('공유하기'));
  await Promise.resolve();
  expect(track).not.toHaveBeenCalled();

  (Share.share as jest.Mock).mockResolvedValueOnce({ action: Share.sharedAction });
  (track as jest.Mock).mockRejectedValueOnce(new Error('analytics offline'));
  await fireEvent.press(screen.getByLabelText('공유하기'));
  await Promise.resolve();
  expect(screen.queryByText('공유하지 못했어요. 다시 시도해 주세요.')).toBeNull();
});
