import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { OptionSide, Question, QuestionReactionType } from '../../types/database.types';

interface BalanceCardProps {
  question: Question;
  hasVoted: boolean;
  selectedOption?: OptionSide;
  selectedReactions?: QuestionReactionType[];
  onVote: (option: OptionSide) => void;
  onReaction: (reactionType: QuestionReactionType) => void;
  onOpenComments: () => void;
}

interface OptionCardProps {
  side: OptionSide;
  title: string;
  description: string | null;
  imageUrl: string;
  percent: number;
  hasVoted: boolean;
  isSelected: boolean;
  onPress: () => void;
}

const formatCount = (count: number) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }

  return String(count);
};

const OptionCard: React.FC<OptionCardProps> = ({
  side,
  title,
  description,
  imageUrl,
  percent,
  hasVoted,
  isSelected,
  onPress,
}) => {
  const animatedPercent = useRef(new Animated.Value(hasVoted ? percent : 0)).current;

  useEffect(() => {
    Animated.timing(animatedPercent, {
      toValue: hasVoted ? percent : 0,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [animatedPercent, hasVoted, percent]);

  const barWidth = animatedPercent.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      disabled={hasVoted}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        isSelected && styles.selectedCard,
        pressed && !hasVoted && styles.pressedCard,
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        contentFit="cover"
        transition={180}
        cachePolicy="memory-disk"
      />
      <View style={[styles.optionTint, side === 'A' ? styles.optionATint : styles.optionBTint]} />
      {!hasVoted && <View style={styles.optionIdleOverlay} />}

      {hasVoted && (
        <View style={styles.resultLayer}>
          <Animated.View
            style={[
              styles.resultBar,
              side === 'A' ? styles.resultBarA : styles.resultBarB,
              { width: barWidth },
            ]}
          />
        </View>
      )}

      <View style={styles.optionContent}>
        <View style={styles.optionHeader}>
          <View style={[styles.sideBadge, side === 'A' ? styles.sideBadgeA : styles.sideBadgeB]}>
            <Text style={styles.sideBadgeText}>{side}</Text>
          </View>
          {hasVoted && (
            <View style={styles.percentPill}>
              <Text style={styles.percentText}>{percent}%</Text>
            </View>
          )}
        </View>
        <View>
          <Text style={styles.optionTitle}>{title}</Text>
          {description ? <Text style={styles.optionDescription}>{description}</Text> : null}
        </View>
      </View>

      {isSelected && (
        <View style={styles.choiceBadge}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  question,
  hasVoted,
  selectedOption,
  selectedReactions = [],
  onVote,
  onReaction,
  onOpenComments,
}) => {
  const { height } = useWindowDimensions();
  const cardMinHeight = Math.max(620, height - 120);
  const total = Math.max(question.option_a_votes + question.option_b_votes, 1);
  const percentA = Math.round((question.option_a_votes / total) * 100);
  const percentB = 100 - percentA;

  const tags = useMemo(() => question.tags.slice(0, 3), [question.tags]);

  const reactionItems: Array<{
    type: QuestionReactionType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    count: number;
  }> = [
    { type: 'like', label: '좋아요', icon: 'heart', count: question.like_count },
    { type: 'fun', label: '재밌다', icon: 'sparkles', count: question.fun_count },
    { type: 'hard', label: '어렵다', icon: 'help-circle', count: question.hard_count },
  ];

  return (
    <View style={[styles.container, { minHeight: cardMinHeight }]}>
      <View style={styles.header}>
        <View style={styles.officialBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#0369A1" />
          <Text style={styles.officialText}>{question.is_official ? '밸런스 공식' : '유저 질문'}</Text>
        </View>
        <Text style={styles.voteCount}>{formatCount(question.total_votes)} votes</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.titleText}>{question.title}</Text>
        {question.description ? <Text style={styles.descriptionText}>{question.description}</Text> : null}
      </View>

      <View style={styles.tagsRow}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tagPill}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardsWrapper}>
        <OptionCard
          side="A"
          title={question.option_a_title}
          description={question.option_a_description}
          imageUrl={question.option_a_image_url}
          percent={percentA}
          hasVoted={hasVoted}
          isSelected={selectedOption === 'A'}
          onPress={() => onVote('A')}
        />

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        <OptionCard
          side="B"
          title={question.option_b_title}
          description={question.option_b_description}
          imageUrl={question.option_b_image_url}
          percent={percentB}
          hasVoted={hasVoted}
          isSelected={selectedOption === 'B'}
          onPress={() => onVote('B')}
        />
      </View>

      <View style={styles.actionsRow}>
        {reactionItems.map((item) => {
          const isActive = selectedReactions.includes(item.type);

          return (
            <Pressable
              key={item.type}
              onPress={() => onReaction(item.type)}
              style={({ pressed }) => [
                styles.actionButton,
                isActive && styles.actionButtonActive,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Ionicons name={item.icon} size={18} color={isActive ? '#FFFFFF' : '#475569'} />
              <Text style={[styles.actionText, isActive && styles.actionTextActive]}>{item.label}</Text>
              <Text style={[styles.actionCount, isActive && styles.actionTextActive]}>
                {formatCount(item.count)}
              </Text>
            </Pressable>
          );
        })}

        <Pressable onPress={onOpenComments} style={({ pressed }) => [styles.commentButton, pressed && styles.actionButtonPressed]}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#0F172A" />
          <Text style={styles.commentText}>댓글</Text>
          <Text style={styles.commentCount}>{formatCount(question.comment_count)}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
  },
  officialText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  voteCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  titleBlock: {
    gap: 8,
    marginBottom: 12,
  },
  titleText: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    color: '#0F172A',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#64748B',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cardsWrapper: {
    flex: 1,
    minHeight: 420,
    gap: 12,
    position: 'relative',
  },
  optionCard: {
    flex: 1,
    minHeight: 196,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  selectedCard: {
    borderColor: '#38BDF8',
  },
  pressedCard: {
    transform: [{ scale: 0.99 }],
    opacity: 0.94,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  optionTint: {
    ...StyleSheet.absoluteFillObject,
  },
  optionATint: {
    backgroundColor: 'rgba(14, 165, 233, 0.16)',
  },
  optionBTint: {
    backgroundColor: 'rgba(244, 114, 182, 0.16)',
  },
  optionIdleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  resultLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.64)',
  },
  resultBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  resultBarA: {
    backgroundColor: 'rgba(14, 165, 233, 0.72)',
  },
  resultBarB: {
    backgroundColor: 'rgba(236, 72, 153, 0.72)',
  },
  optionContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sideBadgeA: {
    backgroundColor: '#0284C7',
  },
  sideBadgeB: {
    backgroundColor: '#DB2777',
  },
  sideBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  percentPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  percentText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  optionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  optionDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.86)',
  },
  choiceBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0EA5E9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  vsBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  vsText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
  },
  actionButtonActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  actionButtonPressed: {
    opacity: 0.76,
  },
  actionText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  actionCount: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  actionTextActive: {
    color: '#FFFFFF',
  },
  commentButton: {
    flex: 1.2,
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 6,
  },
  commentText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
  },
  commentCount: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
});
