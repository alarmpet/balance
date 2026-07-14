import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';
import type { Question, VoteChoice } from '../domain/question';

export type BalanceChoicePanelProps =
  | {
      question: Question;
      mode: 'readOnly';
      showMedia?: boolean;
      accessibilityLabel?: string;
    }
  | {
      question: Question;
      mode: 'votable';
      disabled: boolean;
      selected?: VoteChoice | null;
      onVote(choice: VoteChoice): boolean | void;
      showMedia?: boolean;
      accessibilityLabel?: string;
    };

export function BalanceChoicePanel(props: BalanceChoicePanelProps) {
  const { question } = props;

  if (props.mode === 'readOnly') {
    const label = props.accessibilityLabel
      ?? `질문: ${question.description ?? `${question.optionA} 대 ${question.optionB}`}, A: ${question.optionA}, B: ${question.optionB}, 카테고리: ${question.category}`;

    return (
      <View
        accessible
        accessibilityLabel={label}
        accessibilityRole="text"
        style={styles.panel}
      >
        <Text style={styles.title}>
          {question.description ?? `${question.optionA} vs ${question.optionB}`}
        </Text>
        <StaticChoice choice="A" text={question.optionA} />
        <Versus />
        <StaticChoice choice="B" text={question.optionB} />
      </View>
    );
  }

  const { disabled, onVote, selected = null } = props;
  return (
    <View style={styles.panel}>
      <ChoiceButton
        choice="A"
        disabled={disabled}
        onVote={onVote}
        selected={selected === 'A'}
        text={question.optionA}
      />
      <Versus />
      <ChoiceButton
        choice="B"
        disabled={disabled}
        onVote={onVote}
        selected={selected === 'B'}
        text={question.optionB}
      />
    </View>
  );
}

function StaticChoice({ choice, text }: { choice: VoteChoice; text: string }) {
  return (
    <View style={[styles.choice, choice === 'A' ? styles.optionA : styles.optionB]}>
      <Text style={styles.code}>{choice}</Text>
      <Text style={styles.choiceText}>{text}</Text>
    </View>
  );
}

function Versus() {
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={styles.versus}
    >
      VS
    </Text>
  );
}

function ChoiceButton({ choice, disabled, onVote, selected, text }: {
  choice: VoteChoice;
  disabled: boolean;
  onVote(choice: VoteChoice): boolean | void;
  selected: boolean;
  text: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`${choice} 선택: ${text}${selected ? ', 선택됨' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={() => onVote(choice)}
      style={[
        styles.choice,
        choice === 'A' ? styles.optionA : styles.optionB,
        selected && styles.selected,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.code}>{choice}</Text>
      <Text style={styles.choiceText}>{text}</Text>
      {selected ? <Text style={styles.selectedText}>✓ 선택됨</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  choice: {
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 96,
    padding: spacing.md,
  },
  optionA: { backgroundColor: colors.optionASoft },
  optionB: { backgroundColor: colors.optionBSoft },
  selected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  disabled: { opacity: 0.55 },
  code: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  choiceText: { color: colors.text, fontSize: 20, fontWeight: '700' },
  selectedText: { color: colors.primary, fontWeight: '800' },
  versus: { color: colors.muted, fontWeight: '800', textAlign: 'center' },
});
