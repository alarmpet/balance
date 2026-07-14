import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import QuestionDetailRoute from '../../app/question/[id]';
import { AskScreen } from '@/src/features/ask/ui/AskScreen';
import { QuestionRepositoryContext, SessionContext } from '@/src/providers/AppProviders';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';
import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import type { Question } from '@/src/features/play/domain/question';

const question: Question = {
  id: '60000000-0000-0000-0000-000000000130', optionA: 'Alpha', optionB: 'Beta',
  description: null, category: 'life', visibility: 'public', closesAt: null,
  isDaily: true, stage: 'active', weightsA: {}, weightsB: {},
};

function repository(): jest.Mocked<QuestionRepository> {
  return {
    getDaily: jest.fn().mockResolvedValue(question),
    getFeed: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getById: jest.fn().mockResolvedValue(question), getVoteEvidence: jest.fn(),
    vote: jest.fn(), skip: jest.fn(), create: jest.fn(), report: jest.fn(),
    reactReason: jest.fn(), blockQuestionAuthor: jest.fn(),
  } as jest.Mocked<QuestionRepository>;
}

test('blocks ask creation when the session mutation guard is closed', async () => {
  const target = repository();
  const view = await render(<AskScreen canMutate={false} repository={target} userId="server-user" />);
  await fireEvent.changeText(view.getByPlaceholderText('선택지 A'), 'Alpha');
  await fireEvent.changeText(view.getByPlaceholderText('선택지 B'), 'Beta');
  const submit = view.getByRole('button', { name: '게시하기' });

  expect(submit).toBeDisabled();
  await fireEvent.press(submit);
  expect(target.create).not.toHaveBeenCalled();
});

test('blocks question reason, report, and block calls when the session mutation guard is closed', async () => {
  const target = repository();
  const queue = createPendingActionQueue(new Map<string, string>());
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={target}>
        <SessionContext.Provider value={{
          status: 'ready', userId: 'server-user', canMutate: false, pendingActionQueue: queue,
        }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }
  await renderRouter({ 'question/[id]': QuestionDetailRoute }, {
    initialUrl: `/question/${question.id}`, wrapper: Wrapper,
  });
  await waitFor(() => expect(screen.getByRole('header', { name: 'Alpha vs Beta' })).toBeTruthy());

  await fireEvent.press(screen.getByLabelText('신고하기'));
  await fireEvent.press(screen.getByLabelText('작성자 차단하기'));
  expect(screen.queryByRole('button', { name: /돈/ })).toBeNull();

  expect(target.report).not.toHaveBeenCalled();
  expect(target.blockQuestionAuthor).not.toHaveBeenCalled();
  expect(target.reactReason).not.toHaveBeenCalled();
});
