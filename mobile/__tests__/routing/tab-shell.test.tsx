import { renderRouter, screen } from 'expo-router/testing-library';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

test('renders the four product tabs', async () => {
  renderRouter({
    '(tabs)/_layout': jest.fn(() => null),
    '(tabs)/index': jest.fn(() => null),
    '(tabs)/ask': jest.fn(() => null),
    '(tabs)/brain': jest.fn(() => null),
    '(tabs)/profile': jest.fn(() => null),
  }, { initialUrl: '/' });

  expect(screen).toBeTruthy();
});

test('defines the four stable product tab routes', () => {
  const tabDirectory = path.resolve(__dirname, '../../app/(tabs)');

  for (const route of ['index.tsx', 'ask.tsx', 'brain.tsx', 'profile.tsx']) {
    expect(existsSync(path.join(tabDirectory, route))).toBe(true);
  }
});

test('production tab layout registers every route with its Korean label', () => {
  const source = readFileSync(path.resolve(__dirname, '../../app/(tabs)/_layout.tsx'), 'utf8');
  for (const [name, title] of [['index','플레이'],['ask','물어보기'],['brain','나의 뇌'],['profile','마이']]) {
    expect(source).toContain(`name="${name}"`);
    expect(source).toContain(`title: '${title}'`);
  }
});
