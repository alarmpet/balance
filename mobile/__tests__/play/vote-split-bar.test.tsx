import { render } from '@testing-library/react-native';

import { VoteSplitBar } from '@/src/features/play/ui/VoteSplitBar';

test('announces an exact selected result', async () => {
  const view = await render(
    <VoteSplitBar percentA={64} percentB={36} selected="A" label="다수파" />,
  );

  expect(view.getByLabelText(
    'A 64퍼센트, B 36퍼센트, 내가 선택한 답 A',
  )).toBeTruthy();
  expect(view.getByText('64%')).toBeTruthy();
  expect(view.getByText('36%')).toBeTruthy();
  expect(view.getByText('다수파')).toBeTruthy();
});

test('accepts a valid zero-to-one-hundred split', async () => {
  const view = await render(<VoteSplitBar percentA={0} percentB={100} />);

  expect(view.getByLabelText('A 0퍼센트, B 100퍼센트')).toBeTruthy();
});

test('stretches to the available card width', async () => {
  const view = await render(<VoteSplitBar percentA={50} percentB={50} />);

  expect(view.getByTestId('vote-split-bar')).toHaveStyle({ alignSelf: 'stretch' });
});

test.each([
  [50, 49],
  [-1, 101],
  [50.5, 49.5],
])('does not normalize an invalid pair %p/%p', async (percentA, percentB) => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const view = await render(<VoteSplitBar percentA={percentA} percentB={percentB} />);

  expect(view.getByText('결과를 표시할 수 없어요').props.accessibilityRole).toBe('text');
  expect(view.queryByLabelText(/^A \d+퍼센트, B \d+퍼센트/)).toBeNull();
  expect(warning).toHaveBeenCalledWith('Invalid vote split', { percentA, percentB });
  warning.mockRestore();
});
