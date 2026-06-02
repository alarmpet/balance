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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
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
      const profile = data.session?.user ? await fetchCurrentProfile() : null;
      set({ user: data.session?.user ?? null, profile, isLoading: false });

      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
        const profile = session?.user ? await fetchCurrentProfile() : null;
        const previousUserId = get().user?.id ?? null;
        const nextUserId = session?.user?.id ?? null;
        set({ user: session?.user ?? null, profile });
        if (previousUserId !== nextUserId) {
          resetGamificationSnapshot();
        }
      });
      authUnsubscribe = () => listener.subscription.unsubscribe();
    } catch (error) {
      didBootstrap = false;
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Could not check login state.'
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

      const profile = await fetchCurrentProfile();
      const { data } = await supabase!.auth.getUser();
      set({ user: data.user ?? null, profile, isMutating: false });
      resetGamificationSnapshot();
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'Social login failed.'
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
        error: error instanceof Error ? error.message : 'Could not send email login link.'
      });
      return false;
    }
  },

  async handleAuthCallback(url) {
    set({ isLoading: true, error: null });

    try {
      await createSessionFromUrl(url);
      const profile = await fetchCurrentProfile();
      const { data } = await supabase!.auth.getUser();
      if (!data.user) {
        throw new Error('Login link did not create a session.');
      }
      set({ user: data.user ?? null, profile, isLoading: false });
      resetGamificationSnapshot();
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Could not complete login.'
      });
      return false;
    }
  },

  async signOut() {
    set({ isMutating: true, error: null });

    try {
      await signOutCurrentUser();
      set({ user: null, profile: null, isMutating: false });
      resetGamificationSnapshot();
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'Logout failed.'
      });
    }
  },

  clearError() {
    set({ error: null });
  }
}));
