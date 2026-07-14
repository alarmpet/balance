import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { Question } from '@/src/features/play/domain/question';
import { BalanceChoicePanel } from '@/src/features/play/ui/BalanceChoicePanel';

const question: Question = {
  id: '00000000-0000-4000-8000-000000000001',
  optionA: '바로 자기',
  optionB: '두 시간 쉬기',
  description: '퇴근 후 선택',
  category: '일상',
  visibility: 'public',
  closesAt: null,
  isDaily: true,
  stage: 'active',
  weightsA: {},
  weightsB: {},
};

test('groups a read-only question without exposing fake buttons', async () => {
  const view = await render(<BalanceChoicePanel question={question} mode="readOnly" />);

  expect(view.getByLabelText(
    '질문: 퇴근 후 선택, A: 바로 자기, B: 두 시간 쉬기, 카테고리: 일상',
  )).toBeTruthy();
  expect(view.queryAllByRole('button')).toHaveLength(0);
});

test('marks the selected choice with semantic and visible state', async () => {
  const onVote = jest.fn();
  const view = await render(
    <BalanceChoicePanel
      question={question}
      mode="votable"
      disabled
      selected="A"
      onVote={onVote}
    />,
  );

  const selected = view.getByRole('button', { name: 'A 선택: 바로 자기, 선택됨' });
  expect(selected.props.accessibilityState).toEqual({ disabled: true, selected: true });
  expect(StyleSheet.flatten(selected.props.style)).not.toMatchObject({ opacity: 0.55 });
  expect(view.getByText('✓ 선택됨')).toBeTruthy();
  fireEvent.press(selected);
  expect(onVote).not.toHaveBeenCalled();
});

test('keeps enabled choices interactive and ordered A then B', async () => {
  const onVote = jest.fn(() => true);
  const view = await render(
    <BalanceChoicePanel
      question={question}
      mode="votable"
      disabled={false}
      onVote={onVote}
    />,
  );

  const buttons = view.getAllByRole('button');
  expect(buttons.map((button) => button.props.accessibilityLabel)).toEqual([
    'A 선택: 바로 자기',
    'B 선택: 두 시간 쉬기',
  ]);
  fireEvent.press(buttons[1]);
  expect(onVote).toHaveBeenCalledWith('B');
});
