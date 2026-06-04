import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedQuestion, OptionSide, ReactionType } from '../../services/questionService';
import { THEME } from '../../theme/styles';
import GlassView from '../common/GlassView';

type Props = {
  question: FeedQuestion;
  onVote: (questionId: string, option: OptionSide) => void;
  onReaction: (questionId: string, reaction: ReactionType) => void;
  onOpenComments?: (questionId: string) => void;
};

const LOCAL_FEED_IMAGES: Record<string, any> = {
  'fried-chicken': require('../../../assets/feed/fried-chicken.png'),
  'shaved-ice': require('../../../assets/feed/shaved-ice.png')
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

function getOptionImage(imageUrl: string | null, title: string, side: 'A' | 'B') {
  if (imageUrl) {
    const lowerUrl = imageUrl.toLowerCase();
    if (lowerUrl.includes('fried-chicken') || lowerUrl.includes('chicken')) {
      return LOCAL_FEED_IMAGES['fried-chicken'];
    }
    if (lowerUrl.includes('shaved-ice') || lowerUrl.includes('ice')) {
      return LOCAL_FEED_IMAGES['shaved-ice'];
    }
    return { uri: imageUrl };
  }

  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('chicken') || lowerTitle.includes('fried') || lowerTitle.includes('치킨')) {
    return LOCAL_FEED_IMAGES['fried-chicken'];
  }
  if (lowerTitle.includes('ice') || lowerTitle.includes('shaved') || lowerTitle.includes('빙수')) {
    return LOCAL_FEED_IMAGES['shaved-ice'];
  }

  return side === 'A' ? LOCAL_FEED_IMAGES['fried-chicken'] : LOCAL_FEED_IMAGES['shaved-ice'];
}

export default function BalanceCard({ question, onVote, onReaction, onOpenComments }: Props) {
  const totalVotes = question.vote_count_a + question.vote_count_b;
  const aPercent = percent(question.vote_count_a, totalVotes);
  const bPercent = percent(question.vote_count_b, totalVotes);
  const hasVoted = Boolean(question.userVote);
  const aWins = question.vote_count_a >= question.vote_count_b;

  return (
    <GlassView style={styles.card} intensity={20} borderRadius={28}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.category} numberOfLines={1}>{question.category?.name ?? '밸런스'}</Text>
          <Text style={styles.title} numberOfLines={2}>{question.title}</Text>
        </View>
        <Text style={styles.voteTotal} numberOfLines={1}>{formatCount(totalVotes)}명 참여</Text>
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
          onPress={() => onVote(question.id, 'A')}
        />

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
          onPress={() => onVote(question.id, 'B')}
        />
      </View>

      {hasVoted ? (
        <View style={styles.resultsWrapper}>
          <View style={styles.resultsHeaderRow}>
            <View style={styles.goldVsBadge}>
              <Text style={styles.goldVsText}>VS</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFillA,
                  { width: `${aPercent}%` },
                  aWins ? styles.progressBarFillWin : null
                ]}
              />
              <View
                style={[
                  styles.progressBarFillB,
                  { width: `${bPercent}%` },
                  !aWins ? styles.progressBarFillWin : null
                ]}
              />
              <Text style={[styles.percentLabelA, aWins ? styles.percentLabelWin : null]}>{aPercent}%</Text>
              <Text style={[styles.percentLabelB, !aWins ? styles.percentLabelWin : null]}>{bPercent}%</Text>
            </View>
          </View>

          <View style={styles.resultsInfoRow}>
            <Text style={[styles.votesInfoText, aWins ? styles.votesInfoWin : null]}>
              {question.vote_count_a.toLocaleString('ko-KR')}표
            </Text>
            <Text style={[styles.votesInfoText, !aWins ? styles.votesInfoWin : null]}>
              {question.vote_count_b.toLocaleString('ko-KR')}표
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.votePromptContainer}>
          <View style={styles.voteNowButton}>
            <Text style={styles.voteNowButtonText}>선택하면 결과가 열려요</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <ActionButton
          icon="heart"
          label={formatCount(question.reaction_like_count)}
          accessibilityLabel={`좋아요 ${formatCount(question.reaction_like_count)}개`}
          active={question.userReaction === 'like'}
          onPress={() => onReaction(question.id, 'like')}
        />
        <ActionButton
          icon="happy"
          label={formatCount(question.reaction_fun_count)}
          accessibilityLabel={`재밌어요 ${formatCount(question.reaction_fun_count)}개`}
          active={question.userReaction === 'fun'}
          onPress={() => onReaction(question.id, 'fun')}
        />
        <ActionButton
          icon="help-circle"
          label={formatCount(question.reaction_hard_count)}
          accessibilityLabel={`고민돼요 ${formatCount(question.reaction_hard_count)}개`}
          active={question.userReaction === 'hard'}
          onPress={() => onReaction(question.id, 'hard')}
        />
        <ActionButton
          icon="chatbubble-ellipses"
          label={formatCount(question.comment_count)}
          accessibilityLabel={`댓글 ${formatCount(question.comment_count)}개`}
          active={false}
          onPress={() => onOpenComments?.(question.id)}
        />
      </View>
    </GlassView>
  );
}

type OptionPanelProps = {
  side: 'A' | 'B';
  title: string;
  description: string | null;
  imageUrl: string | null;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

function OptionPanel({
  side,
  title,
  description,
  imageUrl,
  selected,
  disabled,
  onPress
}: OptionPanelProps) {
  const optionImage = getOptionImage(imageUrl, title, side);
  // 외부(예: Unsplash) 이미지 로딩 실패 시 카드가 깨지지 않도록 카테고리 톤 placeholder로 폴백한다.
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${side} 선택지 ${title}`}
      disabled={disabled}
      onPress={onPress}
      style={styles.optionPressable}
    >
      <GlassView
        style={[
          styles.option,
          selected && styles.optionSelected,
          disabled && !selected && styles.optionUnselectedDisabled
        ]}
        intensity={15}
        borderRadius={24}
        backgroundColor={selected ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.35)'}
      >
        <View style={styles.optionImageContainer}>
          {imageFailed ? (
            <View style={[styles.optionImage, styles.optionImageFallback]}>
              <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.75)" />
            </View>
          ) : (
            <Image
              source={optionImage}
              style={styles.optionImage}
              contentFit="cover"
              transition={200}
              onError={() => setImageFailed(true)}
            />
          )}
        </View>
        <View style={styles.optionInfoArea}>
          <Text style={styles.optionTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.optionDescription} numberOfLines={1}>
            {description || '선택 후 내 성향 지도에 반영됩니다'}
          </Text>
        </View>
      </GlassView>
    </Pressable>
  );
}

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accessibilityLabel: string;
  active: boolean;
  onPress: () => void;
};

function ActionButton({ icon, label, accessibilityLabel, active, onPress }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.action, active && styles.actionActive]}
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
    borderRadius: 14,
    borderWidth: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 28,
    borderWidth: 1,
    margin: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20
  },
  category: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900'
  },
  description: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 8
  },
  goldVsBadge: {
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  goldVsText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '900'
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  headerText: {
    flex: 1
  },
  option: {
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 230,
    padding: 6
  },
  optionImage: {
    height: '100%',
    width: '100%'
  },
  optionImageFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center'
  },
  optionImageContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    height: 130,
    overflow: 'hidden',
    width: '100%'
  },
  optionInfoArea: {
    paddingBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 10
  },
  optionPressable: {
    flex: 1
  },
  optionSelected: {
    borderColor: 'rgba(251, 146, 60, 0.8)',
    borderWidth: 1.5
  },
  optionTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18
  },
  optionDescription: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3
  },
  optionUnselectedDisabled: {
    opacity: 0.65
  },
  options: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
    position: 'relative'
  },
  percentLabelA: {
    alignSelf: 'center',
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
    left: 14,
    position: 'absolute'
  },
  percentLabelB: {
    alignSelf: 'center',
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
    position: 'absolute',
    right: 14
  },
  percentLabelWin: {
    color: '#ffffff',
    fontSize: 13
  },
  progressBarFillA: {
    backgroundColor: '#ffffff',
    height: '100%',
    opacity: 0.85
  },
  progressBarFillB: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    height: '100%',
    opacity: 0.4
  },
  progressBarFillWin: {
    backgroundColor: THEME.accentColors.gold,
    opacity: 1
  },
  progressBarTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 32,
    overflow: 'hidden',
    position: 'relative'
  },
  resultsHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingLeft: 40,
    paddingRight: 10
  },
  resultsWrapper: {
    marginTop: 16
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginTop: 2
  },
  voteNowButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  voteNowButtonText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900'
  },
  votePromptContainer: {
    alignItems: 'center',
    marginTop: 18
  },
  votesInfoText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800'
  },
  votesInfoWin: {
    color: '#b45309',
    fontWeight: '900'
  },
  voteTotal: {
    color: '#475569',
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '800'
  },
  vsCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    marginVertical: 6,
    width: 28
  },
  vsContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -16,
    position: 'absolute',
    top: 0,
    width: 32,
    zIndex: 10
  },
  vsLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    flex: 1,
    width: 1
  },
  vsText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '900'
  }
});
