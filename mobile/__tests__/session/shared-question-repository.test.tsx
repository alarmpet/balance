import { render, waitFor } from '@testing-library/react-native';

import AskRoute from '../../app/(tabs)/ask';
import PlayRoute from '../../app/(tabs)/index';
import { AppProviders } from '@/src/providers/AppProviders';
import { AskScreen } from '@/src/features/ask/ui/AskScreen';
import { LocalQuestionRepository } from '@/src/features/play/data/LocalQuestionRepository';
import { PlayScreen } from '@/src/features/play/ui/PlayScreen';
import { createPendingActionQueue } from '@/src/features/session/data/pendingActions';

jest.mock('@/src/features/ask/ui/AskScreen', () => ({
  AskScreen: jest.fn(() => null),
}));
jest.mock('@/src/features/play/ui/PlayScreen', () => ({
  PlayScreen: jest.fn(() => null),
}));

const MockAskScreen = AskScreen as jest.MockedFunction<typeof AskScreen>;
const MockPlayScreen = PlayScreen as jest.MockedFunction<typeof PlayScreen>;

test('shares route-created questions while excluding link-only questions from play feed', async () => {
  const repository = new LocalQuestionRepository([]);
  const queue = createPendingActionQueue(new Map<string, string>());

  await render(
    <AppProviders
      loadSession={async () => ({ userId: 'guest-shared' })}
      pendingActionQueue={queue}
      questionRepository={repository}
    >
      <AskRoute />
      <PlayRoute />
    </AppProviders>,
  );

  await waitFor(() => {
    expect(MockAskScreen).toHaveBeenCalled();
    expect(MockPlayScreen).toHaveBeenCalled();
  });

  const askRepository = MockAskScreen.mock.calls.at(-1)?.[0].repository;
  const playRepository = MockPlayScreen.mock.calls.at(-1)?.[0].repository;
  expect(askRepository).toBe(repository);
  expect(playRepository).toBe(repository);

  const sharedInput = {
    authorId: 'guest-shared',
    optionA: '바다',
    optionB: '산',
    description: null,
    category: '일상',
    closesAt: null,
  };
  const publicQuestion = await askRepository!.create({
    ...sharedInput,
    visibility: 'public',
  });
  const linkQuestion = await askRepository!.create({
    ...sharedInput,
    visibility: 'link',
  });
  const feed = await playRepository!.getFeed({
    userId: 'guest-reader',
    cursor: null,
    limit: 20,
  });

  expect(feed.items.map((item) => item.id)).toContain(publicQuestion.id);
  expect(feed.items.map((item) => item.id)).not.toContain(linkQuestion.id);
});
