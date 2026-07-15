import type { VoteChoice, VoteResult } from './question';

export function buildVoteResult(
  selected: VoteChoice,
  countA: number,
  countB: number,
): VoteResult {
  const total = countA + countB;
  const percentA = total === 0 ? 50 : Math.round((countA / total) * 100);
  const percentB = 100 - percentA;
  const selectedPercent = selected === 'A' ? percentA : percentB;
  const label =
    percentA >= 48 && percentA <= 52
      ? '초접전'
      : selectedPercent >= 50
        ? '다수파'
        : '소수파';

  return { selected, countA, countB, percentA, percentB, label };
}
