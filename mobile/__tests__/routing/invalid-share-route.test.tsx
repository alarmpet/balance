import { renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import ShareRoute from '../../app/share/[id]';
import { QuestionRepositoryContext, SessionContext } from '@/src/providers/AppProviders';
import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

test('rejects a non-UUID share parameter without calling the repository', async () => {
  const getById = jest.fn();
  const repository = { getById } as unknown as QuestionRepository;
  const queue = createPendingActionQueue(new Map<string, string>());
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QuestionRepositoryContext.Provider value={repository}>
        <SessionContext.Provider value={{ status: 'ready', userId: 'u1', canMutate: true, pendingActionQueue: queue }}>
          {children}
        </SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    );
  }

  await renderRouter({ 'share/[id]': ShareRoute }, {
    initialUrl: '/share/not-a-uuid',
    wrapper: Wrapper,
  });

  await waitFor(() => expect(screen.getByText('질문을 찾을 수 없어요.')).toBeTruthy());
  expect(getById).not.toHaveBeenCalled();
});
