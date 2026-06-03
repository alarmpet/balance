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
    <View 
      style={styles.card}
      // @ts-ignore
      htmlAttribute={{ style: 'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);' }}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.category}>{question.category?.name ?? '밸런스'}</Text>
          <Text style={styles.title}>{question.title}</Text>
        </View>
        <Text style={styles.voteTotal}>{formatCount(totalVotes)}명 참여</Text>
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

        {/* Central VS Divider */}
        <View style={styles.vsContainer} pointerEvents="none">
          <View style={styles.vsLine} />
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.vsLine} />
        </View>

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

      {/* Progress Bar / Vote Button */}
      {hasVoted ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsBarTrack}>
            <View style={[styles.resultsBarFillA, { width: `${aPercent}%` }]} />
            <View style={[styles.resultsBarFillB, { width: `${bPercent}%` }]} />
            
            <Text style={styles.percentTextA}>{aPercent}%</Text>
            <Text style={styles.percentTextB}>{bPercent}%</Text>
          </View>
          <View style={styles.resultsLabelRow}>
            <Text style={styles.votesLabel}>{formatCount(question.vote_count_a)}표</Text>
            <Text style={styles.votesLabel}>{formatCount(question.vote_count_b)}표</Text>
          </View>
        </View>
      ) : (
        <View style={styles.votePromptContainer}>
          <View style={styles.votePromptButton}>
            <Text style={styles.votePromptButtonText}>원하는 선택지를 터치해 투표하세요</Text>
          </View>
        </View>
      )}

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
      style={[
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled
      ]}
      // @ts-ignore
      htmlAttribute={{ style: 'backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);' }}
    >
      <View style={styles.optionImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.optionImage} contentFit="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={28} color="rgba(15, 118, 110, 0.3)" />
          </View>
        )}
      </View>
      <View style={styles.optionInfoArea}>
        <Text style={styles.optionSideLabel}>{side} 선택</Text>
        <Text style={styles.optionTitle} numberOfLines={2}>{title}</Text>
        {description ? <Text style={styles.optionDescription} numberOfLines={1}>{description}</Text> : null}
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
    <Pressable 
      onPress={onPress} 
      style={[styles.action, active && styles.actionActive]}
      // @ts-ignore
      htmlAttribute={{ style: 'backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);' }}
    >
      <Ionicons name={icon} size={16} color={active ? '#0f766e' : '#5f7f7a'} />
      <Text style={[styles.actionText, active && styles.actionTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 38
  },
  actionActive: {
    backgroundColor: 'rgba(204, 251, 241, 0.65)',
    borderColor: 'rgba(15, 118, 110, 0.25)'
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
    marginTop: 16
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 28,
    borderWidth: 1,
    margin: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4
  },
  category: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  description: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontWeight: '500'
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerText: {
    flex: 1
  },
  options: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
    position: 'relative',
    alignItems: 'stretch'
  },
  option: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 22,
    borderWidth: 1,
    padding: 8,
    minHeight: 230,
    justifyContent: 'space-between'
  },
  optionDisabled: {
    opacity: 0.92
  },
  optionSelected: {
    borderColor: '#f97316',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)'
  },
  optionImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)'
  },
  optionImage: {
    width: '100%',
    height: '100%'
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 118, 110, 0.04)'
  },
  optionInfoArea: {
    paddingTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 2
  },
  optionSideLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800'
  },
  optionTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
    lineHeight: 18
  },
  optionDescription: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  vsContainer: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 32,
    marginLeft: -16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  vsLine: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    flex: 1
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ebdcc9',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  vsText: {
    color: '#5c4d3c',
    fontSize: 10,
    fontWeight: '900'
  },
  resultsContainer: {
    marginTop: 16
  },
  resultsBarTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 999,
    height: 36,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1
  },
  resultsBarFillA: {
    backgroundColor: '#38bdf8',
    height: '100%',
    opacity: 0.65
  },
  resultsBarFillB: {
    backgroundColor: '#fdba74',
    height: '100%',
    opacity: 0.65
  },
  percentTextA: {
    position: 'absolute',
    left: 14,
    alignSelf: 'center',
    color: '#0369a1',
    fontSize: 13,
    fontWeight: '900'
  },
  percentTextB: {
    position: 'absolute',
    right: 14,
    alignSelf: 'center',
    color: '#c2410c',
    fontSize: 13,
    fontWeight: '900'
  },
  resultsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4
  },
  votesLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800'
  },
  votePromptContainer: {
    marginTop: 16
  },
  votePromptButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderRadius: 999,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  votePromptButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800'
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginTop: 2
  },
  voteTotal: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800'
  }
});

