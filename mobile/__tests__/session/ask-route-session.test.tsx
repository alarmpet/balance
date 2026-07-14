import { render, waitFor } from '@testing-library/react-native';

import AskRoute from '../../app/(tabs)/ask';
import { AppProviders } from '@/src/providers/AppProviders';
import { AskScreen } from '@/src/features/ask/ui/AskScreen';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

jest.mock('@/src/features/ask/ui/AskScreen', () => ({
  AskScreen: jest.fn(() => null),
}));

const MockAskScreen = AskScreen as jest.MockedFunction<typeof AskScreen>;

test('passes the persistent guest identity and question repository to the ask screen', async () => {
  const queue = createPendingActionQueue(new Map<string, string>());
  await render(
    <AppProviders
      loadSession={async () => ({ userId: 'guest-author' })}
      pendingActionQueue={queue}
    >
      <AskRoute />
    </AppProviders>,
  );

  await waitFor(() => {
    expect(MockAskScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        repository: expect.objectContaining({ create: expect.any(Function) }),
        userId: 'guest-author',
      }),
      undefined,
    );
  });
});
