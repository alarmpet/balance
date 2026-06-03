import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const expectedCommon = [
  'american-shorthair',
  'bichon',
  'chameleon',
  'chihuahua',
  'deer',
  'elephant',
  'frog',
  'giraffe',
  'goldfish',
  'hamster'
];

const expectedLegend = ['dragon', 'phoenix', 'unicorn'];

const appSource = readFileSync('src/app/(tabs)/island.tsx', 'utf8');
const migrationSource = readdirSync('supabase/migrations')
  .filter((file) => file.endsWith('.sql'))
  .map((file) => readFileSync(join('supabase/migrations', file), 'utf8'))
  .join('\n');

const failures = [];

for (const slug of expectedCommon) {
  assertFile(`assets/pets/alarmpetgo/common/${slug}.png`);
  assertFile(`assets/pets/alarmpetgo/rare/${slug}.png`);
  assertIncludes(appSource, `common/${slug}.png`, `resolver common ${slug}`);
  assertIncludes(appSource, `rare/${slug}.png`, `resolver rare ${slug}`);
  assertIncludes(migrationSource, `'${slug}'`, `migration species ${slug}`);
}

for (const slug of expectedLegend) {
  assertFile(`assets/pets/alarmpetgo/legend/${slug}.png`);
  assertIncludes(appSource, `legend/${slug}.png`, `resolver legend ${slug}`);
  assertIncludes(migrationSource, `asset://alarmpetgo/legend/${slug}.png`, `migration legend ${slug}`);
}

if (failures.length > 0) {
  console.error(`Pet asset validation failed (${failures.length}):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Pet asset validation passed: ${expectedCommon.length} common, ${expectedCommon.length} rare, ${expectedLegend.length} legend.`);

function assertFile(path) {
  if (!existsSync(path)) {
    failures.push(`missing file ${path}`);
  }
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    failures.push(`missing ${label}: ${needle}`);
  }
}
