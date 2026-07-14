import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import QuestionDetailRoute from '../../app/question/[id]';
import { LocalQuestionRepository } from '@/src/features/play/data/LocalQuestionRepository';
import { QuestionRepositoryContext, SessionContext } from '@/src/providers/AppProviders';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';
import type { Question } from '@/src/features/play/domain/question';

const question: Question = {
  id: '60000000-0000-0000-0000-000000000120', optionA: 'A', optionB: 'B',
  description: null, category: 'life', visibility: 'public', closesAt: null,
  isDaily: false, stage: 'active', weightsA: {}, weightsB: {},
};

test('clearly disables author blocking when the local repository cannot provide parity', async () => {
  const repository = new LocalQuestionRepository([question]);
  const queue = createPendingActionQueue(new Map<string, string>());
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={repository}>
        <SessionContext.Provider value={{ status: 'ready', userId: 'local-user', canMutate: true, pendingActionQueue: queue }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }

  await renderRouter({ 'question/[id]': QuestionDetailRoute }, {
    initialUrl: `/question/${question.id}`, wrapper: Wrapper,
  });

  await waitFor(() => expect(screen.getByLabelText('로컬 모드에서는 차단 불가')).toBeDisabled());
});
