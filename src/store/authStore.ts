import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  createSessionFromUrl,
  fetchCurrentProfile,
  sendMagicLink,
  signInWithSocialProvider,
  signOutCurrentUser,
  type AuthProfile,
  type SocialProvider
} from '../services/authService';
import { useGamificationStore } from './gamificationStore';

let authUnsubscribe: (() => void) | null = null;
let didBootstrap = false;

type AuthState = {
  user: User | null;
  profile: AuthProfile | null;
  profileError: string | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  magicLinkSentTo: string | null;
  bootstrap: () => Promise<void>;
  signInSocial: (provider: SocialProvider) => Promise<void>;
  sendMagicLinkEmail: (email: string) => Promise<boolean>;
  handleAuthCallback: (url: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

function resetGamificationSnapshot() {
  void useGamificationStore.getState().signOutUser();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function fetchProfileSafely(): Promise<{ profile: AuthProfile | null; profileError: string | null }> {
  try {
    return {
      profile: await fetchCurrentProfile(),
      profileError: null
    };
  } catch (error) {
    return {
      profile: null,
      profileError: getErrorMessage(error, 'Could not load profile.')
    };
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  profileError: null,
  isLoading: false,
  isMutating: false,
  error: null,
  magicLinkSentTo: null,

  async bootstrap() {
    if (!supabase) return;
    if (didBootstrap) return;
    didBootstrap = true;

    set({ isLoading: true, error: null });

    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      const { profile, profileError } = user ? await fetchProfileSafely() : { profile: null, profileError: null };
      set({ user, profile, profileError, isLoading: false });

      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
        const { profile, profileError } = session?.user ? await fetchProfileSafely() : { profile: null, profileError: null };
        const previousUserId = get().user?.id ?? null;
        const nextUserId = session?.user?.id ?? null;
        set({ user: session?.user ?? null, profile, profileError });
        if (previousUserId !== nextUserId) {
          resetGamificationSnapshot();
        }
      });
      authUnsubscribe = () => listener.subscription.unsubscribe();
    } catch (error) {
      didBootstrap = false;
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Could not check login state.')
      });
    }
  },

  async signInSocial(provider) {
    set({ isMutating: true, error: null });

    try {
      const completed = await signInWithSocialProvider(provider);
      if (!completed) {
        set({ isMutating: false });
        return;
      }

      const { data } = await supabase!.auth.getUser();
      const user = data.user ?? null;
      const { profile, profileError } = user ? await fetchProfileSafely() : { profile: null, profileError: null };
      set({ user, profile, profileError, isMutating: false });
      resetGamificationSnapshot();
    } catch (error) {
      set({
        isMutating: false,
        error: getErrorMessage(error, 'Social login failed.')
      });
    }
  },

  async sendMagicLinkEmail(email) {
    set({ isMutating: true, error: null });

    try {
      await sendMagicLink(email);
      set({ isMutating: false, magicLinkSentTo: email.trim().toLowerCase() });
      return true;
    } catch (error) {
      set({
        isMutating: false,
        error: getErrorMessage(error, 'Could not send email login link.')
      });
      return false;
    }
  },

  async handleAuthCallback(url) {
    set({ isLoading: true, error: null });

    try {
      await createSessionFromUrl(url);
      const { data } = await supabase!.auth.getUser();
      if (!data.user) {
        throw new Error('Login link did not create a session.');
      }
      const { profile, profileError } = await fetchProfileSafely();
      set({ user: data.user, profile, profileError, isLoading: false });
      resetGamificationSnapshot();
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Could not complete login.')
      });
      return false;
    }
  },

  async signOut() {
    set({ isMutating: true, error: null });

    try {
      await signOutCurrentUser();
      set({ user: null, profile: null, profileError: null, isMutating: false });
      resetGamificationSnapshot();
    } catch (error) {
      set({
        isMutating: false,
        error: getErrorMessage(error, 'Logout failed.')
      });
    }
  },

  clearError() {
    set({ error: null });
  }
}));
