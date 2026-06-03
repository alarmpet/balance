import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const requiredFiles = [
  'README.md',
  'START_HERE.md',
  'CLAUDE.md',
  'AGENTS.md',
  'index.md',
  'log.md',
  'VERSION',
  'LICENSE.md',
  'TEMPLATE_MANIFEST.md',
  'prompts/save.md',
  'prompts/ingest.md',
  'prompts/query.md',
  'prompts/reference.md',
  'prompts/lint.md'
];

const requiredDirs = [
  'AI-Sessions/raw',
  'AI-Sessions/conversations',
  'AI-Sessions/wiki/sources',
  'AI-Sessions/wiki/concepts',
  'AI-Sessions/wiki/decisions',
  'AI-Sessions/wiki/errors',
  'AI-Sessions/wiki/projects',
  'AI-Sessions/wiki/design',
  'AI-Sessions/wiki/dev-tasks',
  'prompts',
  'scripts'
];

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /sbp_[A-Za-z0-9_-]{20,}/,
  /sb_secret_[A-Za-z0-9_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  /(?:api[_-]?key|client[_-]?secret|password|token)\s*[:=]\s*["'][^"']{16,}["']/i
];

const fiveFilterPattern = /5\uac00\uc9c0|5[ -]?Filter/i;
const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

for (const dir of requiredDirs) {
  if (!existsSync(dir)) failures.push(`Missing required directory: ${dir}`);
}

assertIncludes('CLAUDE.md', ['save', 'ingest', 'query', 'reference', 'lint']);
assertIncludes('AGENTS.md', ['save', 'ingest', 'query', 'reference', 'lint']);
assertIncludes('CLAUDE.md', ['AI-Sessions/raw/', 'AI-Sessions/wiki/']);
assertIncludes('AGENTS.md', ['AI-Sessions/raw/', 'AI-Sessions/wiki/']);
assertAnyMatch('CLAUDE.md', fiveFilterPattern, '5-filter rule');
assertAnyMatch('AGENTS.md', fiveFilterPattern, '5-filter rule');
assertIncludes('index.md', ['[[prompts/save]]', '[[prompts/ingest]]', '[[prompts/query]]', '[[prompts/reference]]', '[[prompts/lint]]']);

for (const file of listMarkdownFiles('AI-Sessions/wiki')) {
  const content = readFileSync(file, 'utf8');
  if (!content.startsWith('---\n')) {
    failures.push(`Wiki file missing YAML frontmatter: ${file}`);
    continue;
  }

  const frontmatterEnd = content.indexOf('\n---\n', 4);
  if (frontmatterEnd === -1) {
    failures.push(`Wiki file missing closing YAML frontmatter marker: ${file}`);
    continue;
  }

  const sourceMatch = content.slice(4, frontmatterEnd).match(/^source:\s*(.+)$/m);
  if (sourceMatch) {
    const sourcePath = sourceMatch[1].trim();
    if (isPathLikeSource(sourcePath) && !existsSync(sourcePath)) {
      failures.push(`Wiki file source path does not exist: ${file} -> ${sourcePath}`);
    }
  }
}

for (const file of listMarkdownFiles('.')) {
  if (!isSecretScanTarget(file)) continue;
  const content = readFileSync(file, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      failures.push(`Potential secret-like text in ${file}: ${pattern}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Wiki validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Wiki validation passed.');

function assertIncludes(path, needles) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const needle of needles) {
    if (!content.includes(needle)) {
      failures.push(`${path} missing required text: ${needle}`);
    }
  }
}

function assertAnyMatch(path, pattern, label) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  if (!pattern.test(content)) {
    failures.push(`${path} missing required pattern: ${label}`);
  }
}

function isSecretScanTarget(file) {
  const rel = file.replaceAll('\\', '/');
  if (rel.startsWith('node_modules/') || rel.startsWith('.git/') || rel.startsWith('dist/')) return false;
  if (rel.startsWith('AI-Sessions/raw/')) return false;
  if (rel.startsWith('AI-Sessions/conversations/')) return false;
  if (rel === 'CLAUDE.md' || rel === 'AGENTS.md') return false;
  if (rel.startsWith('prompts/') || rel.startsWith('docs/')) return false;
  if (['README.md', 'START_HERE.md', 'TEMPLATE_MANIFEST.md', 'LICENSE.md'].includes(rel)) return false;
  return true;
}

function isPathLikeSource(source) {
  if (!source || source === 'optional') return false;
  return source.includes('/') || source.includes('\\') || source.endsWith('.md');
}

function listMarkdownFiles(root) {
  const results = [];
  walk(root);
  return results;

  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const rel = relative('.', path).replaceAll('\\', '/');
      if (rel.startsWith('node_modules/') || rel.startsWith('.git/') || rel.startsWith('dist/')) continue;
      const stat = statSync(path);
      if (stat.isDirectory()) {
        walk(path);
      } else if (path.endsWith('.md')) {
        results.push(path);
      }
    }
  }
}
