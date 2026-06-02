import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  createSessionFromUrl,
  fetchCurrentProfile,
  getInitialLinkingUrl,
  sendMagicLink,
  signInWithSocialProvider,
  signOutCurrentUser,
  type AuthProfile,
  type SocialProvider
} from '../services/authService';

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
  sendMagicLinkEmail: (email: string) => Promise<void>;
  handleAuthCallback: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
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
      const initialUrl = await getInitialLinkingUrl();
      if (initialUrl) {
        await createSessionFromUrl(initialUrl);
      }

      const { data } = await supabase.auth.getSession();
      const profile = data.session?.user ? await fetchCurrentProfile() : null;
      set({ user: data.session?.user ?? null, profile, isLoading: false });

      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
        const profile = session?.user ? await fetchCurrentProfile() : null;
        set({ user: session?.user ?? null, profile });
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
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'Could not send email login link.'
      });
    }
  },

  async handleAuthCallback(url) {
    set({ isLoading: true, error: null });

    try {
      await createSessionFromUrl(url);
      const profile = await fetchCurrentProfile();
      const { data } = await supabase!.auth.getUser();
      set({ user: data.user ?? null, profile, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Could not complete login.'
      });
    }
  },

  async signOut() {
    set({ isMutating: true, error: null });

    try {
      await signOutCurrentUser();
      set({ user: null, profile: null, isMutating: false });
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
