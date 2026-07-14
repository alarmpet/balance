import { fireEvent, render } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import type { Question, VoteResult } from '@/src/features/play/domain/question';
import { HeroBalanceCard } from '@/src/features/play/ui/HeroBalanceCard';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));

const daily: Question = {
  id: 'daily', optionA: '바로 자기', optionB: '두 시간 쉬기', description: null,
  category: '일상', visibility: 'public', closesAt: null, isDaily: true,
  stage: 'active', weightsA: {}, weightsB: {},
};
const result: VoteResult = {
  selected: 'A', countA: 7, countB: 3, percentA: 70, percentB: 30, label: '다수파',
};

beforeEach(() => jest.clearAllMocks());

test('shows daily badge and pass before voting without early results', async () => {
  const view = await render(
    <HeroBalanceCard
      disabled={false}
      onNext={jest.fn()}
      onSkip={jest.fn()}
      onVote={jest.fn()}
      question={daily}
      result={null}
    />,
  );

  expect(view.getByLabelText('오늘의 밸런스')).toBeTruthy();
  expect(view.getByRole('button', { name: '질문 패스' })).toBeTruthy();
  expect(view.queryByTestId('vote-split-bar')).toBeNull();
});

test('locks choices but keeps an explicit next action after voting', async () => {
  const onNext = jest.fn();
  const view = await render(
    <HeroBalanceCard
      disabled={false}
      onNext={onNext}
      onSkip={jest.fn()}
      onVote={jest.fn()}
      question={daily}
      result={result}
    />,
  );

  expect(view.getByLabelText('A 70퍼센트, B 30퍼센트, 내가 선택한 답 A')).toBeTruthy();
  expect(view.getByRole('button', { name: 'A 선택: 바로 자기, 선택됨' })).toBeDisabled();
  expect(view.queryByRole('button', { name: '질문 패스' })).toBeNull();
  await fireEvent.press(view.getByRole('button', { name: '다음 질문' }));
  expect(onNext).toHaveBeenCalledTimes(1);
});

test('does not label an ordinary feed question as daily', async () => {
  const view = await render(
    <HeroBalanceCard
      disabled={false}
      onNext={jest.fn()}
      onSkip={jest.fn()}
      onVote={jest.fn()}
      question={{ ...daily, id: 'feed', isDaily: false }}
      result={null}
    />,
  );

  expect(view.queryByLabelText('오늘의 밸런스')).toBeNull();
});

test('keeps an ordinary question category and context visible', async () => {
  const view = await render(
    <HeroBalanceCard
      disabled={false}
      onNext={jest.fn()}
      onSkip={jest.fn()}
      onVote={jest.fn()}
      question={{
        ...daily,
        id: 'contextual-feed',
        isDaily: false,
        category: '연애',
        description: '친구와 의견이 갈려서 물어봐요.',
      }}
      result={null}
    />,
  );

  expect(view.getByText('연애')).toBeTruthy();
  expect(view.getByText('친구와 의견이 갈려서 물어봐요.')).toBeTruthy();
});

test('fires haptics only when the vote is synchronously accepted', async () => {
  const onVote = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
  const view = await render(
    <HeroBalanceCard
      disabled={false}
      onNext={jest.fn()}
      onSkip={jest.fn()}
      onVote={onVote}
      question={daily}
      result={null}
    />,
  );
  const choice = view.getByRole('button', { name: 'A 선택: 바로 자기' });

  await fireEvent.press(choice);
  await fireEvent.press(choice);

  expect(onVote).toHaveBeenCalledTimes(2);
  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
});
