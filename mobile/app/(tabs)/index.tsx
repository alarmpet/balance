import { Text } from 'react-native';

import { PlayScreen } from '@/src/features/play/ui/PlayScreen';
import { useQuestionRepository, useSession } from '@/src/providers/AppProviders';
import { track } from '@/src/features/analytics/analytics';

export default function PlayRoute() {
  const { canMutate, pendingActionQueue, reconciliationNotice, userId } = useSession();
  const repository = useQuestionRepository();
  if (!userId) return null;
  return (
    <>
      <PlayScreen
        canMutate={canMutate}
        pendingActionQueue={pendingActionQueue}
        repository={repository}
        sourceId="local"
        trackEvent={track}
        userId={userId}
      />
      {reconciliationNotice ? (
        <Text accessibilityLabel="pending-action-reconciliation" accessibilityRole="alert">
          {reconciliationNotice}
        </Text>
      ) : null}
    </>
  );
}
