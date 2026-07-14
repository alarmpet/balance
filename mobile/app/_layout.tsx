import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import '@/global.css';
import { AppProviders, useSession } from '@/src/providers/AppProviders';
import { isAnalyticsUuid, track } from '@/src/features/analytics/analytics';
import {
  subscribeToNotificationResponses,
  subscribeToPushTokenChanges,
  reconcileNotificationInstallation,
} from '@/src/features/notifications/notifications';

export function subscribeNotificationAuthChanges(onUser: (userId: string | null) => void): () => void {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return () => undefined;
  const { supabase } = require('@/src/lib/supabase');
  const result = supabase.auth.onAuthStateChange((_event: string, session: { user?: { id: string } } | null) => {
    onUser(session?.user?.id ?? null);
  });
  return () => result.data.subscription.unsubscribe();
}

function NotificationResponseBridge() {
  const { canMutate, source, userId } = useSession();
  const identityRef = useRef({ canMutate, source, userId });
  const openedUsers = useRef(new Set<string>());
  useEffect(() => {
    identityRef.current = { canMutate, source, userId };
  }, [canMutate, source, userId]);
  useEffect(() => {
    const subscription = subscribeToNotificationResponses({
      onOpen({ questionId, source }) {
        const current = identityRef.current;
        if (!current.canMutate || !current.userId) return;
        void track({
          name: 'notification_opened',
          userId: current.userId,
          questionId,
          source,
          timestamp: new Date().toISOString(),
        }).catch(() => undefined);
      },
    });
    const identity = userId && source ? { userId, source } : null;
    void reconcileNotificationInstallation(identity && identity.source !== 'offline' ? identity.userId : null, undefined, canMutate)
      .catch(() => undefined);
    const tokenSubscription = identity && identity.source !== 'offline'
      ? subscribeToPushTokenChanges({
        identity,
        shouldContinue: () => identityRef.current.canMutate
          && identityRef.current.userId === identity.userId
          && identityRef.current.source === identity.source,
      })
      : null;
    return () => {
      subscription.remove();
      tokenSubscription?.remove();
    };
  }, [canMutate, source, userId]);
  useEffect(() => {
    if (!canMutate || !isAnalyticsUuid(userId)
      || openedUsers.current.has(userId)) return;
    openedUsers.current.add(userId);
    void track({ name: 'app_opened', userId, timestamp: new Date().toISOString() }).catch(() => {
      openedUsers.current.delete(userId);
    });
  }, [canMutate, userId]);
  useEffect(() => {
    return subscribeNotificationAuthChanges((nextUserId) => {
      void reconcileNotificationInstallation(nextUserId).catch(() => undefined);
    });
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <NotificationResponseBridge />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
