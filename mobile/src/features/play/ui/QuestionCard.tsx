import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';
import type { Question, VoteChoice } from '../domain/question';

interface QuestionCardProps {
  question: Question;
  onVote: (choice: VoteChoice) => boolean;
  onSkip: () => void;
  disabled: boolean;
}

export function QuestionCard({ question, onVote, onSkip, disabled }: QuestionCardProps) {
  const choose = (choice: VoteChoice) => {
    if (disabled) return;
    if (onVote(choice)) void Haptics.selectionAsync();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.category}>{question.category}</Text>
      {question.description ? <Text style={styles.description}>{question.description}</Text> : null}
      <Pressable
        accessibilityLabel={`A 선택: ${question.optionA}`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => choose('A')}
        style={[styles.choice, styles.optionA, disabled && styles.disabled]}
      >
        <Text style={styles.choiceText}>{question.optionA}</Text>
      </Pressable>
      <Text style={styles.versus}>VS</Text>
      <Pressable
        accessibilityLabel={`B 선택: ${question.optionB}`}
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => choose('B')}
        style={[styles.choice, styles.optionB, disabled && styles.disabled]}
      >
        <Text style={styles.choiceText}>{question.optionB}</Text>
      </Pressable>
      <Pressable accessibilityLabel="질문 패스" accessibilityRole="button" disabled={disabled} onPress={onSkip} style={styles.skip}>
        <Text style={styles.skipText}>패스</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  category: { color: colors.muted, textAlign: 'center' },
  description: { color: colors.text, textAlign: 'center' },
  choice: {
    minHeight: 180,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  optionA: { backgroundColor: colors.optionA },
  optionB: { backgroundColor: colors.optionB },
  choiceText: { color: colors.surface, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  versus: { color: colors.muted, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.55 },
  skip: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44, paddingHorizontal: spacing.md },
  skipText: { color: colors.muted, fontSize: 16 },
});
