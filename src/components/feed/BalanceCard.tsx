import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedQuestion, OptionSide, ReactionType } from '../../services/questionService';

type Props = {
  question: FeedQuestion;
  onVote: (questionId: string, option: OptionSide) => void;
  onReaction: (questionId: string, reaction: ReactionType) => void;
  onOpenComments?: (questionId: string) => void;
};

function percent(count: number, total: number) {
  if (total <= 0) return 50;
  return Math.round((count / total) * 100);
}

function formatCount(count: number) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`;
  return String(count);
}

export default function BalanceCard({ question, onVote, onReaction, onOpenComments }: Props) {
  const totalVotes = question.vote_count_a + question.vote_count_b;
  const aPercent = percent(question.vote_count_a, totalVotes);
  const bPercent = percent(question.vote_count_b, totalVotes);
  const hasVoted = Boolean(question.userVote);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.category}>{question.category?.name ?? '밸런스'}</Text>
          <Text style={styles.title}>{question.title}</Text>
        </View>
        <Text style={styles.voteTotal}>{formatCount(totalVotes)} votes</Text>
      </View>

      {question.description ? <Text style={styles.description}>{question.description}</Text> : null}

      <View style={styles.options}>
        <OptionPanel
          side="A"
          title={question.option_a_title}
          description={question.option_a_description}
          imageUrl={question.option_a_image_url}
          selected={question.userVote === 'A'}
          disabled={hasVoted}
          percentValue={aPercent}
          showResult={hasVoted}
          onPress={() => onVote(question.id, 'A')}
        />
        <OptionPanel
          side="B"
          title={question.option_b_title}
          description={question.option_b_description}
          imageUrl={question.option_b_image_url}
          selected={question.userVote === 'B'}
          disabled={hasVoted}
          percentValue={bPercent}
          showResult={hasVoted}
          onPress={() => onVote(question.id, 'B')}
        />
      </View>

      <View style={styles.actions}>
        <ActionButton
          icon="heart"
          label={formatCount(question.reaction_like_count)}
          active={question.userReaction === 'like'}
          onPress={() => onReaction(question.id, 'like')}
        />
        <ActionButton
          icon="happy"
          label={formatCount(question.reaction_fun_count)}
          active={question.userReaction === 'fun'}
          onPress={() => onReaction(question.id, 'fun')}
        />
        <ActionButton
          icon="help-circle"
          label={formatCount(question.reaction_hard_count)}
          active={question.userReaction === 'hard'}
          onPress={() => onReaction(question.id, 'hard')}
        />
        <ActionButton
          icon="chatbubble-ellipses"
          label={formatCount(question.comment_count)}
          active={false}
          onPress={() => onOpenComments?.(question.id)}
        />
      </View>
    </View>
  );
}

type OptionPanelProps = {
  side: OptionSide;
  title: string;
  description: string | null;
  imageUrl: string | null;
  selected: boolean;
  disabled: boolean;
  percentValue: number;
  showResult: boolean;
  onPress: () => void;
};

function OptionPanel({
  side,
  title,
  description,
  imageUrl,
  selected,
  disabled,
  percentValue,
  showResult,
  onPress
}: OptionPanelProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${side} 선택지 ${title}`}
      disabled={disabled}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.optionImage} contentFit="cover" /> : null}
      <View style={styles.optionOverlay} />
      <View style={styles.optionContent}>
        <Text style={styles.optionSide}>Option {side}</Text>
        <Text style={styles.optionTitle}>{title}</Text>
        {description ? <Text style={styles.optionDescription}>{description}</Text> : null}
        {showResult ? (
          <View style={styles.resultTrack}>
            <View style={[styles.resultFill, { width: `${percentValue}%` }]} />
            <Text style={styles.resultText}>{percentValue}%</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
};

function ActionButton({ icon, label, active, onPress }: ActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.action, active && styles.actionActive]}>
      <Ionicons name={icon} size={18} color={active ? '#0f766e' : '#5f7f7a'} />
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: '#e8fbf7',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 42
  },
  actionActive: {
    backgroundColor: '#ccfbf1'
  },
  actionText: {
    color: '#5f7f7a',
    fontSize: 12,
    fontWeight: '800'
  },
  actionTextActive: {
    color: '#0f766e'
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 14
  },
  card: {
    backgroundColor: '#f8fffb',
    borderRadius: 24,
    elevation: 4,
    margin: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18
  },
  category: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800'
  },
  description: {
    color: '#52716d',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  headerText: {
    flex: 1
  },
  option: {
    backgroundColor: '#d7f4ef',
    borderRadius: 20,
    minHeight: 210,
    overflow: 'hidden'
  },
  optionContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18
  },
  optionDescription: {
    color: '#e6fffb',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  optionImage: {
    ...StyleSheet.absoluteFillObject
  },
  optionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 39, 36, 0.38)'
  },
  optionSelected: {
    borderColor: '#14b8a6',
    borderWidth: 3
  },
  optionSide: {
    color: '#ccfbf1',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  optionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6
  },
  options: {
    gap: 12,
    marginTop: 16
  },
  resultFill: {
    backgroundColor: '#5eead4',
    borderRadius: 999,
    height: '100%'
  },
  resultText: {
    alignSelf: 'center',
    color: '#073b35',
    fontSize: 13,
    fontWeight: '900',
    position: 'absolute',
    top: 6
  },
  resultTrack: {
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderRadius: 999,
    height: 30,
    marginTop: 14,
    overflow: 'hidden'
  },
  title: {
    color: '#12312f',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginTop: 4
  },
  voteTotal: {
    color: '#6b8b87',
    fontSize: 12,
    fontWeight: '800'
  }
});
