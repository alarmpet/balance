import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { AskScreen } from '@/src/features/ask/ui/AskScreen';
import { BrainScreen } from '@/src/features/brain/ui/BrainScreen';
import { ResultOverlay } from '@/src/features/play/ui/ResultOverlay';
import type { QuestionRepository } from '@/src/features/play/data/QuestionRepository';
import { colors } from '@/src/design/tokens';
import type { VoteReceipt } from '@/src/features/play/domain/question';

const repository = {
  create: jest.fn(),
} as unknown as QuestionRepository;

function minHeight(node: { props: { style?: unknown } }) {
  const style = StyleSheet.flatten(node.props.style as object) as { minHeight?: number } | undefined;
  return style?.minHeight ?? 0;
}

test('ask controls expose Korean names, state, and 44 point touch targets', async () => {
  const view = await render(<AskScreen repository={repository} userId="guest-accessibility" />);
  expect(minHeight(view.getByLabelText('선택지 A'))).toBeGreaterThanOrEqual(44);
  expect(minHeight(view.getByLabelText('선택지 B'))).toBeGreaterThanOrEqual(44);
  for (const name of ['일상', '전체 공개', '링크로만 공개', '게시하기']) {
    expect(minHeight(view.getByRole(name === '게시하기' ? 'button' : 'radio', { name })))
      .toBeGreaterThanOrEqual(44);
  }
  expect(view.getByRole('radio', { name: '전체 공개' })).toHaveProp(
    'accessibilityState', { checked: true, disabled: false },
  );
  expect(view.getByText('✓ 전체 공개')).toBeTruthy();
});

test('brain evidence controls expose expanded state and 44 point touch targets', async () => {
  const votes = Array.from({ length: 10 }, (_, index) => ({
    questionId: `q${index}`, choice: 'A' as const, weights: { freedom: 2 },
  }));
  const view = await render(<BrainScreen votes={votes} />);
  const evidence = view.getByRole('button', { name: '자유 이 성향을 만든 선택' });

  expect(minHeight(evidence)).toBeGreaterThanOrEqual(44);
  expect(evidence).toHaveProp('accessibilityState', { expanded: false });
  await fireEvent.press(evidence);
  expect(view.getByRole('button', { name: '자유 선택 근거 닫기' })).toHaveProp(
    'accessibilityState', { expanded: true },
  );
});

function luminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)!.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test('normal text tokens meet WCAG AA contrast on their surfaces', () => {
  expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.muted, colors.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.primary, colors.surface)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.warning, colors.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.surface, colors.optionA)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.surface, colors.optionB)).toBeGreaterThanOrEqual(4.5);
});

test('brain nodes and result feedback avoid fixed-height clipping at 200% font scale', async () => {
  const votes = Array.from({ length: 20 }, (_, index) => ({
    questionId: `q${index}`, choice: 'A' as const, weights: { freedom: 2 },
  }));
  const brain = await render(<BrainScreen votes={votes} />);
  const layout = StyleSheet.flatten(brain.getByTestId('brain-radial-layout').props.style) as {
    height?: number; flexWrap?: string;
  };
  expect(layout.height).toBeUndefined();
  expect(layout.flexWrap).toBe('wrap');
  for (const node of brain.getAllByTestId('brain-radial-node')) {
    const style = StyleSheet.flatten(node.props.style) as { height?: number; minHeight?: number; position?: string };
    expect(style.height).toBeUndefined();
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.position).not.toBe('absolute');
  }

  const result: VoteReceipt = {
    selected: 'A', countA: 1, countB: 0, percentA: 100, percentB: 0,
    label: '다수파', applyStatus: 'applied',
    axisScores: { freedom: 0, stability: 0, relationship: 0, reality: 0, emotion: 0, growth: 0, efficiency: 0, fun: 0 },
  };
  const overlay = await render(<ResultOverlay result={result} />);
  const overlayTree = overlay.toJSON() as { props: { style?: object } };
  expect(StyleSheet.flatten(overlayTree.props.style))
    .not.toHaveProperty('position', 'absolute');
});

test('web controls have a visible keyboard focus treatment', () => {
  const css = readFileSync(join(process.cwd(), 'src', 'global.css'), 'utf8');
  const rootLayout = readFileSync(join(process.cwd(), 'app', '_layout.tsx'), 'utf8');
  expect(css).toContain(':focus-visible');
  expect(css).toContain("[role='tab']:focus-visible");
  expect(css).toContain('a[href]:focus-visible');
  expect(css).toMatch(/outline:\s*3px solid/);
  expect(rootLayout).toMatch(/import ['"]@\/global\.css['"];?/);
});
