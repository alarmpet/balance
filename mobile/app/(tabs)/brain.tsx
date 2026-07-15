import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';

import { useQuestionRepository, useSession } from '@/src/providers/AppProviders';
import type { BrainVote } from '@/src/features/brain/domain/brain';
import { BrainScreen } from '@/src/features/brain/ui/BrainScreen';
import { track } from '@/src/features/analytics/analytics';

export default function BrainRoute() {
  const repository = useQuestionRepository();
  const { canMutate, userId } = useSession();
  const [evidence, setEvidence] = useState<BrainVote[] | null>(null);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setEvidence(null);
      setFailed(false);
      if (!userId) {
        return () => {
          active = false;
        };
      }
      void repository.getVoteEvidence(userId).then(
        (votes) => {
          if (active) setEvidence(votes);
        },
        () => {
          if (active) setFailed(true);
        },
      );
      return () => {
        active = false;
      };
    }, [repository, userId]),
  );

  if (failed) {
    return <Text accessibilityRole="alert">나의 뇌를 불러오지 못했어요.</Text>;
  }
  if (!userId || evidence === null) {
    return <ActivityIndicator accessibilityLabel="나의 뇌 불러오는 중" />;
  }
  return <BrainScreen votes={evidence} userId={canMutate ? userId : undefined} trackEvent={track} />;
}
