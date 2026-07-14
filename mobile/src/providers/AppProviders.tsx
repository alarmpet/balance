import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  getOrCreateOnlineFirstSession,
  type CaptchaTokenProvider,
  type SessionIdentity,
} from '@/src/features/session/data/session';
import {
  createPendingActionSender,
  pendingActionQueue as defaultPendingActionQueue,
  type PendingAction,
  type PendingActionQueue,
} from '@/src/features/session/data/pendingActions';
import { LocalQuestionRepository } from '@/src/features/play/data/LocalQuestionRepository';
import {
  isDuplicateVoteError,
  type QuestionRepository,
} from '@/src/features/play/data/QuestionRepository';

export type SessionState = {
  status: 'loading' | 'ready' | 'error';
  userId: string | null;
  canMutate: boolean;
  pendingActionQueue: PendingActionQueue;
  source?: 'anonymous' | 'permanent' | 'offline';
  reconciliationNotice?: string | null;
  errorMessage?: string | null;
  continuityConflict?: string | null;
};

export const SessionContext = createContext<SessionState | undefined>(undefined);
export const QuestionRepositoryContext = createContext<QuestionRepository | undefined>(undefined);

function createDefaultQuestionRepository(): QuestionRepository {
  if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const { SupabaseQuestionRepository } = require('@/src/features/play/data/SupabaseQuestionRepository');
    return new SupabaseQuestionRepository();
  }
  return new LocalQuestionRepository();
}

const defaultQuestionRepository = createDefaultQuestionRepository();

export function useSession(): SessionState {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used within AppProviders');
  return session;
}

export function useQuestionRepository(): QuestionRepository {
  const repository = useContext(QuestionRepositoryContext);
  if (!repository) {
    throw new Error('useQuestionRepository must be used within AppProviders');
  }
  return repository;
}

interface AppProvidersProps extends PropsWithChildren {
  loadSession?: () => Promise<{ userId: string; isAnonymous?: boolean; source?: 'anonymous' | 'permanent' | 'offline' }>;
  promoteSession?: () => Promise<SessionIdentity>;
  subscribeSessionRetry?: (listener: (identity?: SessionIdentity | null) => void) => () => void;
  captchaTokenProvider?: CaptchaTokenProvider;
  captchaRequired?: boolean;
  pendingActionQueue?: PendingActionQueue;
  questionRepository?: QuestionRepository;
}

function subscribeDefaultSessionRetry(listener: (identity?: SessionIdentity | null) => void): () => void {
  const Network = require('expo-network') as typeof import('expo-network');
  const networkSubscription = Network.addNetworkStateListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) listener();
  });
  let unsubscribeAuth = () => undefined;
  if (process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const { supabase } = require('@/src/lib/supabase');
    const result = supabase.auth.onAuthStateChange((event: string, session: { user?: { id: string; is_anonymous?: boolean } } | null) => {
      if (session?.user) {
        listener({ userId: session.user.id, isAnonymous: session.user.is_anonymous === true });
      } else if (event === 'SIGNED_OUT') {
        listener(null);
      }
    });
    unsubscribeAuth = () => result.data.subscription.unsubscribe();
  }
  return () => {
    (networkSubscription as { remove?: () => void } | undefined)?.remove?.();
    unsubscribeAuth();
  };
}

function ownershipConflict(actions: PendingAction[], userId: string): string | null {
  const quarantined = actions.filter((action) => action.ownerId !== userId);
  if (quarantined.length === 0) return null;
  return quarantined.some((action) => !action.ownerId)
    ? '소유자를 확인할 수 없는 대기 활동이 있어 자동 처리하지 않았어요.'
    : '다른 계정의 대기 활동이 있어 자동으로 합칠 수 없어요.';
}

export function AppProviders({
  children,
  loadSession,
  promoteSession,
  subscribeSessionRetry = subscribeDefaultSessionRetry,
  captchaTokenProvider,
  captchaRequired = process.env.EXPO_PUBLIC_AUTH_CAPTCHA_REQUIRED === 'true',
  pendingActionQueue = defaultPendingActionQueue,
  questionRepository = defaultQuestionRepository,
}: AppProvidersProps) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));
  const [session, setSession] = useState<SessionState>({
    status: 'loading',
    userId: null,
    canMutate: false,
    pendingActionQueue,
  });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => undefined;
    let promoting = false;
    let identityConflict = false;
    let mutationAllowed = false;
    let currentSource: 'anonymous' | 'permanent' | 'offline' | null = null;
    let currentUserId: string | null = null;
    const load = loadSession ?? (() => getOrCreateOnlineFirstSession({
      captchaRequired,
      captchaTokenProvider,
    }));
    const promote = promoteSession ?? (async () => {
      const result = await getOrCreateOnlineFirstSession({ captchaRequired, captchaTokenProvider });
      return { userId: result.userId, isAnonymous: result.isAnonymous };
    });

    const flush = async (userId: string) => {
      if (!mutationAllowed || identityConflict) return;
      const expectedUserId = userId;
      try {
        await pendingActionQueue.flush(
          createPendingActionSender(questionRepository, userId),
          userId,
          () => mutationAllowed && !identityConflict && currentUserId === expectedUserId,
        );
      } catch (error) {
        if (active && isDuplicateVoteError(error)) {
          setSession((value) => ({ ...value, reconciliationNotice: '이미 처리된 질문의 투표를 정리했어요.' }));
        }
      }
    };
    const retryPromotion = (authIdentity?: SessionIdentity | null) => {
      if (!active || promoting) return;
      if (authIdentity === null) {
        identityConflict = true;
        mutationAllowed = false;
        currentSource = null;
        currentUserId = null;
        setSession({
          status: 'error', userId: null, canMutate: false, pendingActionQueue,
          errorMessage: '로그아웃되어 변경 작업을 중지했어요.',
        });
        return;
      }
      if (currentSource !== 'offline' && currentUserId) {
        if (authIdentity && authIdentity.userId !== currentUserId) {
          identityConflict = true;
          mutationAllowed = false;
          currentSource = authIdentity.isAnonymous ? 'anonymous' : 'permanent';
          currentUserId = authIdentity.userId;
          setSession((value) => ({
            ...value,
            userId: authIdentity.userId,
            source: authIdentity.isAnonymous ? 'anonymous' : 'permanent',
            canMutate: false,
            continuityConflict: '서버 계정이 변경되어 대기 활동을 자동으로 합칠 수 없어요.',
          }));
          return;
        }
        if (authIdentity && !authIdentity.isAnonymous) {
          currentSource = 'permanent';
          setSession((value) => ({ ...value, userId: authIdentity.userId, source: 'permanent', canMutate: mutationAllowed }));
        } else if (authIdentity?.isAnonymous) {
          currentSource = 'anonymous';
          setSession((value) => ({ ...value, userId: authIdentity.userId, source: 'anonymous', canMutate: mutationAllowed }));
        }
        if (mutationAllowed) void flush(currentUserId);
        return;
      }
      if (currentSource !== 'offline') return;
      if (identityConflict) return;
      promoting = true;
      void Promise.resolve(authIdentity ?? promote()).then(async (identity) => {
        if (!active) return;
        if (!identity.isAnonymous) {
          identityConflict = true;
          mutationAllowed = false;
          currentSource = 'permanent';
          currentUserId = identity.userId;
          setSession((value) => ({
            ...value,
            userId: identity.userId,
            source: 'permanent',
            canMutate: false,
            continuityConflict: '기존 계정과 오프라인 활동을 자동으로 합칠 수 없어요.',
          }));
          return;
        }
        const guestId = currentUserId;
        if (!guestId) return;
        await pendingActionQueue.claimOwner(guestId, identity.userId);
        const claimedActions = await pendingActionQueue.list();
        const conflict = ownershipConflict(claimedActions, identity.userId);
        mutationAllowed = conflict === null;
        currentSource = 'anonymous';
        currentUserId = identity.userId;
        setSession({
          status: 'ready', userId: identity.userId, source: 'anonymous', canMutate: mutationAllowed,
          pendingActionQueue, continuityConflict: conflict,
        });
        await flush(identity.userId);
      }).catch((error: unknown) => {
        if (active) {
          setSession((value) => ({
            ...value,
            errorMessage: error instanceof Error ? error.message : '익명 세션 연결에 실패했어요.',
          }));
        }
      }).finally(() => {
        promoting = false;
      });
    };

    void Promise.all([load(), pendingActionQueue.list()]).then(
      async ([loaded, actions]) => {
        if (!active) return;
        currentSource = loaded.source ?? 'anonymous';
        currentUserId = loaded.userId;
        const conflict = ownershipConflict(actions, loaded.userId);
        mutationAllowed = currentSource === 'offline' ? true : conflict === null;
        setSession({
          status: 'ready',
          userId: loaded.userId,
          canMutate: mutationAllowed,
          source: currentSource,
          pendingActionQueue,
          continuityConflict: conflict,
        });
        if (active && loaded.source) unsubscribe = subscribeSessionRetry(retryPromotion);
        if (currentSource !== 'offline') await flush(loaded.userId);
      },
      (error: unknown) => {
        if (active) {
          setSession({
            status: 'error',
            userId: null,
            canMutate: false,
            pendingActionQueue,
            errorMessage: error instanceof Error ? error.message : '세션을 시작하지 못했어요.',
          });
        }
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [captchaRequired, captchaTokenProvider, loadSession, pendingActionQueue, promoteSession, questionRepository, retryKey, subscribeSessionRetry]);

  let content = children;
  if (session.status === 'loading') {
    content = <ActivityIndicator accessibilityLabel="session-loading" />;
  } else if (session.status === 'error') {
    content = (
      <View accessibilityLabel="session-error" style={{ alignItems: 'center', gap: 12 }}>
        <Text>{session.errorMessage ?? '세션을 시작하지 못했어요.'}</Text>
        <Pressable
          accessibilityLabel="세션 다시 시도"
          accessibilityRole="button"
          onPress={() => {
            setSession({ status: 'loading', userId: null, canMutate: false, pendingActionQueue });
            setRetryKey((value) => value + 1);
          }}
          style={{ alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44, paddingHorizontal: 16 }}
        >
          <Text>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <QueryClientProvider client={client}>
      <QuestionRepositoryContext.Provider value={questionRepository}>
        <SessionContext.Provider value={session}>{content}</SessionContext.Provider>
      </QuestionRepositoryContext.Provider>
    </QueryClientProvider>
  );
}
