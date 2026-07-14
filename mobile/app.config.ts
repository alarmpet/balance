import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'mobile',
  slug: config.slug ?? 'mobile',
  plugins: [
    ...(config.plugins ?? []).filter((plugin) => plugin !== 'expo-notifications'),
    'expo-notifications',
  ],
});
