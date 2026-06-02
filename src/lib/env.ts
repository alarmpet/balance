type PublicEnvName = 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY';

declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};

export function getPublicEnv(name: PublicEnvName): string | undefined {
  const value = name === 'EXPO_PUBLIC_SUPABASE_URL'
    ? process.env.EXPO_PUBLIC_SUPABASE_URL
    : process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!value || value.includes('your-project-id') || value.includes('...')) {
    return undefined;
  }

  return value;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(getPublicEnv('EXPO_PUBLIC_SUPABASE_URL') && getPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
}
