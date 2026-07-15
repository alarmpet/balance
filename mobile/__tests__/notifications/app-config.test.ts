import appConfig from '../../app.config';
import type { ConfigContext } from 'expo/config';

test('configures the Expo notifications native plugin', () => {
  const config = appConfig({ config: { name: 'mobile', slug: 'mobile' } } as ConfigContext);
  expect(config.plugins).toContain('expo-notifications');
});
