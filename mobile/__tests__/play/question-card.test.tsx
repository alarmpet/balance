import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { Question } from '@/src/features/play/domain/question';
import { QuestionCard } from '@/src/features/play/ui/QuestionCard';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

const question: Question = {
  id: 'q1',
  optionA: 'Keep the plan',
  optionB: 'Take the chance',
  description: null,
  category: 'daily',
  visibility: 'public',
  closesAt: null,
  isDaily: true,
  stage: 'active',
  weightsA: {},
  weightsB: {},
};

test('sends one explicit choice and supports pass', async () => {
  const onVote = jest.fn().mockReturnValue(true);
  const onSkip = jest.fn();
  const view = await render(
    <QuestionCard
      question={question}
      onVote={onVote}
      onSkip={onSkip}
      disabled={false}
    />,
  );

  await fireEvent.press(view.getByLabelText('A 선택: Keep the plan'));
  expect(onVote).toHaveBeenCalledWith('A');
  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

  await fireEvent.press(view.getByText('패스'));
  expect(onSkip).toHaveBeenCalledTimes(1);
});

test('rejects choices and haptics while disabled', async () => {
  const onVote = jest.fn();
  const view = await render(
    <QuestionCard
      question={question}
      onVote={onVote}
      onSkip={jest.fn()}
      disabled
    />,
  );

  await fireEvent.press(view.getByText('Take the chance'));

  expect(onVote).not.toHaveBeenCalled();
  expect(Haptics.selectionAsync).not.toHaveBeenCalled();
});

test('fires haptics only when the parent synchronously accepts a choice', async () => {
  const onVote = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
  const view = await render(
    <QuestionCard
      question={question}
      onVote={onVote}
      onSkip={jest.fn()}
      disabled={false}
    />,
  );
  const choice = view.getByLabelText('A 선택: Keep the plan');

  await fireEvent.press(choice);
  await fireEvent.press(choice);

  expect(onVote).toHaveBeenCalledTimes(2);
  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
});

test('exposes the expected screen-reader order and touch targets', async () => {
  const view = await render(
    <QuestionCard question={question} onVote={jest.fn()} onSkip={jest.fn()} disabled={false} />,
  );
  const controls = view.getAllByRole('button');

  expect(controls.map((control) => control.props.accessibilityLabel)).toEqual([
    'A 선택: Keep the plan',
    'B 선택: Take the chance',
    '질문 패스',
  ]);
  for (const control of controls) {
    const style = StyleSheet.flatten(control.props.style) as { minHeight?: number };
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  }
});
