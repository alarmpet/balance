import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from './env';
import type { Database } from '../types/database.types';

const supabaseUrl = getPublicEnv('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
const SECURE_CHUNK_SIZE = 1800;

function chunkKey(key: string, index: number) {
  return `${key}:chunk:${index}`;
}

function metaKey(key: string) {
  return `${key}:chunk_count`;
}

async function removeSecureChunks(key: string) {
  const rawCount = await SecureStore.getItemAsync(metaKey(key));
  const count = rawCount ? Number(rawCount) : 0;

  for (let index = 0; index < count; index += 1) {
    await SecureStore.deleteItemAsync(chunkKey(key, index));
  }

  await SecureStore.deleteItemAsync(metaKey(key));
  await SecureStore.deleteItemAsync(key);
}

const authStorageAdapter = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);

    const rawCount = await SecureStore.getItemAsync(metaKey(key));
    const count = rawCount ? Number(rawCount) : 0;

    if (!count) {
      return SecureStore.getItemAsync(key);
    }

    const parts: string[] = [];
    for (let index = 0; index < count; index += 1) {
      parts.push((await SecureStore.getItemAsync(chunkKey(key, index))) ?? '');
    }

    return parts.join('');
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);

    await removeSecureChunks(key);

    if (value.length <= SECURE_CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = value.match(new RegExp(`.{1,${SECURE_CHUNK_SIZE}}`, 'g')) ?? [];
    await SecureStore.setItemAsync(metaKey(key), String(chunks.length));
    for (let index = 0; index < chunks.length; index += 1) {
      await SecureStore.setItemAsync(chunkKey(key, index), chunks[index]);
    }
  },

  async removeItem(key: string) {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    await removeSecureChunks(key);
  }
};

export const supabase: SupabaseClient<Database> | null = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: authStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null;
