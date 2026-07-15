describe('RootLayout notification auth guard', () => {
  const previousUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  afterEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = previousUrl;
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
    jest.resetModules();
  });

  test('local repository mode never loads the Supabase client', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    jest.doMock('@/src/lib/supabase', () => { throw new Error('Supabase client must stay unloaded'); });
    const { subscribeNotificationAuthChanges } = require('../../app/_layout');
    const unsubscribe = subscribeNotificationAuthChanges(jest.fn());
    expect(unsubscribe).toEqual(expect.any(Function));
    expect(() => unsubscribe()).not.toThrow();
  });
});
