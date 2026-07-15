import type { Question, VoteChoice } from '../domain/question';
import { HeroBalanceCard } from './HeroBalanceCard';

interface QuestionCardProps {
  question: Question;
  onVote: (choice: VoteChoice) => boolean;
  onSkip: () => void;
  disabled: boolean;
}

export function QuestionCard({ question, onVote, onSkip, disabled }: QuestionCardProps) {
  return (
    <HeroBalanceCard
      disabled={disabled}
      onNext={onSkip}
      onSkip={onSkip}
      onVote={onVote}
      question={question}
      result={null}
    />
  );
}
