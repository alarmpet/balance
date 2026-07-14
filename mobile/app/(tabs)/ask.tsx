import { useQuestionRepository, useSession } from '@/src/providers/AppProviders';
import { AskScreen } from '@/src/features/ask/ui/AskScreen';
import { registerNotifications } from '@/src/features/notifications/notifications';
import { track } from '@/src/features/analytics/analytics';

export default function AskRoute() {
  const { canMutate, source = 'anonymous', userId } = useSession();
  const repository = useQuestionRepository();
  if (!userId) return null;
  return (
    <AskScreen
      canMutate={canMutate}
      registerNotifications={registerNotifications}
      repository={repository}
      source={source}
      trackEvent={track}
      userId={userId}
    />
  );
}
