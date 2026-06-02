type PublicEnvName =
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  | 'EXPO_PUBLIC_SITE_URL';

declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_SITE_URL?: string;
  };
};

export function getPublicEnv(name: PublicEnvName): string | undefined {
  const value = process.env[name];

  if (
    !value ||
    value.includes('your-project-id') ||
    value.includes('your-key') ||
    value.includes('replace_with') ||
    value.includes('...')
  ) {
    return undefined;
  }

  return value;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(getPublicEnv('EXPO_PUBLIC_SUPABASE_URL') && getPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'));
}

export function getPublicSiteUrl(): string {
  return getPublicEnv('EXPO_PUBLIC_SITE_URL') ?? 'https://balance-vert.vercel.app';
}
