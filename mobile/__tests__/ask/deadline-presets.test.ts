import { deadlineToIso } from '@/src/features/ask/domain/deadlinePresets';

const now = Date.parse('2026-07-15T00:00:00.000Z');

test.each([
  ['none', null],
  ['24h', '2026-07-16T00:00:00.000Z'],
  ['3d', '2026-07-18T00:00:00.000Z'],
  ['7d', '2026-07-22T00:00:00.000Z'],
] as const)('converts %s into the expected close time', (preset, expected) => {
  expect(deadlineToIso(preset, now)).toBe(expected);
});
