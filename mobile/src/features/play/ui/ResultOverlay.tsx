import type { VoteResult } from '../domain/question';
import { VoteSplitBar } from './VoteSplitBar';

export function ResultOverlay({ result }: { result: VoteResult }) {
  return (
    <VoteSplitBar
      label={result.label}
      percentA={result.percentA}
      percentB={result.percentB}
      selected={result.selected}
    />
  );
}
