import { fireEvent, render } from '@testing-library/react-native';

import type { BrainVote } from '@/src/features/brain/domain/brain';
import { BrainScreen } from '@/src/features/brain/ui/BrainScreen';

function votes(count: number): BrainVote[] {
  return Array.from({ length: count }, (_, index) => ({
    questionId: `q${index}`,
    choice: 'A',
    weights: { freedom: 2, relationship: 1 },
  }));
}

test('shows awakening progress and the non-diagnostic disclaimer before 10 votes', async () => {
  const view = await render(<BrainScreen votes={votes(9)} />);

  expect(view.getByText('9/10 선택')).toBeTruthy();
  expect(
    view.getByText('최근 선택에서 보인 경향이며 전문 심리 진단이 아닙니다.'),
  ).toBeTruthy();
  expect(view.queryByTestId('brain-axis-bars')).toBeNull();
});

test('shows the top three axes and opens recorded evidence from 10 votes', async () => {
  const view = await render(<BrainScreen votes={votes(10)} />);

  expect(view.getByTestId('brain-axis-bars')).toBeTruthy();
  expect(view.getAllByText('이 성향을 만든 선택')).toHaveLength(3);

  await fireEvent.press(view.getByLabelText('자유 이 성향을 만든 선택'));

  expect(view.getByLabelText('자유 선택 근거')).toHaveTextContent(/q0.*q9/);
});

test('reveals the archetype and all eight radial nodes from 20 votes', async () => {
  const view = await render(<BrainScreen votes={votes(20)} />);

  expect(view.getByText('자유·관계 선택가')).toBeTruthy();
  expect(view.getByTestId('brain-radial-layout')).toBeTruthy();
  expect(view.getAllByTestId('brain-radial-node')).toHaveLength(8);
});

test('reveals category comparison from 50 votes', async () => {
  const categorizedVotes: BrainVote[] = [
    ...Array.from({ length: 20 }, (_, index) => ({
      questionId: `daily-${index}`,
      choice: 'A' as const,
      category: '일상',
      weights: { freedom: 2, relationship: 1 },
    })),
    ...Array.from({ length: 20 }, (_, index) => ({
      questionId: `hobby-${index}`,
      choice: 'B' as const,
      category: '취향',
      weights: { stability: 3, emotion: 1 },
    })),
    ...Array.from({ length: 10 }, (_, index) => ({
      questionId: `focus-${index}`,
      choice: 'A' as const,
      category: '집중',
      weights: { freedom: 4, fun: 2 },
    })),
  ];
  const view = await render(<BrainScreen votes={categorizedVotes} />);

  expect(view.getByText('카테고리별 비교')).toBeTruthy();
  expect(view.getByText('일상: 자유 2.00 · 관계 1.00')).toBeTruthy();
  expect(view.getByText('취향: 안정 3.00 · 감성 1.00')).toBeTruthy();
  expect(view.getByText('집중: 자유 4.00 · 재미 2.00')).toBeTruthy();
});

test('tracks brain progress and one type unlock without evidence IDs', async () => {
  const trackEvent = jest.fn().mockResolvedValue(undefined);
  const view = await render(
    <BrainScreen votes={votes(20)} userId="71000000-0000-0000-0000-000000000001" trackEvent={trackEvent} />,
  );
  await view.findByTestId('brain-radial-layout');
  expect(trackEvent).toHaveBeenCalledWith({
    name: 'brain_progress_viewed', userId: '71000000-0000-0000-0000-000000000001', source: 'brain',
  });
  expect(trackEvent).toHaveBeenCalledWith({
    name: 'brain_type_unlocked', userId: '71000000-0000-0000-0000-000000000001', source: 'brain',
  });
  expect(JSON.stringify(trackEvent.mock.calls)).not.toContain('q0');
  await view.rerender(<BrainScreen votes={votes(20)} userId="71000000-0000-0000-0000-000000000001" trackEvent={trackEvent} />);
  expect(trackEvent).toHaveBeenCalledTimes(2);
});
