import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { ProfileRow } from '../types/database.types';

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'google' | 'kakao' | 'custom:naver';

export type AuthProfile = Pick<
  ProfileRow,
  'id' | 'nickname' | 'avatar_url' | 'shell_balance' | 'streak_count' | 'total_participation_count' | 'today_participation_count'
>;

export function getAuthRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  return AuthSession.makeRedirectUri({
    scheme: 'balanceisland',
    path: 'auth/callback'
  });
}

export async function signInWithSocialProvider(provider: SocialProvider): Promise<boolean> {
  if (!supabase) throw new Error('Supabase config is required.');

  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) throw error;
  if (!data.url) throw new Error('Could not create auth URL.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') {
    await createSessionFromUrl(result.url);
    return true;
  }

  return false;
}

export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase config is required.');

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: getAuthRedirectUrl()
    }
  });

  if (error) throw error;
}

export async function createSessionFromUrl(url: string): Promise<Session | null> {
  if (!supabase) throw new Error('Supabase config is required.');

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const code = params.code;

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) throw error;
    return data.session;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  return null;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function fetchCurrentProfile(): Promise<AuthProfile | null> {
  if (!supabase) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,nickname,avatar_url,shell_balance,streak_count,total_participation_count,today_participation_count')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as AuthProfile | null;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getInitialLinkingUrl() {
  return Linking.getInitialURL();
}
