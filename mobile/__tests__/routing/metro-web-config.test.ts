import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('bundles the expo-sqlite wasm asset on web', () => {
  const configPath = resolve(process.cwd(), 'metro.config.js');

  expect(existsSync(configPath)).toBe(true);
  if (!existsSync(configPath)) return;

  const assetExts = JSON.parse(execFileSync(process.execPath, [
    '-e',
    `const config = require(${JSON.stringify(configPath)}); process.stdout.write(JSON.stringify(config.resolver.assetExts));`,
  ], { encoding: 'utf8' })) as string[];
  expect(assetExts).toContain('wasm');
});
