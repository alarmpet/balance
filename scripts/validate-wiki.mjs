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
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /service[_-]?role/i,
  /client[_-]?secret/i,
  /api[_-]?key\s*[:=]/i,
  /password\s*[:=]/i
];

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

// 5-filter 설명 포함 여부를 유연하게 검증 (한글/영문 대응)
assertRegex('CLAUDE.md', /5가지|5[ -]?Filter/i);
assertRegex('AGENTS.md', /5가지|5[ -]?Filter/i);

assertIncludes('index.md', ['[[prompts/save]]', '[[prompts/ingest]]', '[[prompts/query]]', '[[prompts/reference]]', '[[prompts/lint]]']);

for (const file of listMarkdownFiles('AI-Sessions/wiki')) {
  const content = readFileSync(file, 'utf8');
  if (!content.startsWith('---\n')) {
    failures.push(`Wiki file missing YAML frontmatter: ${file}`);
  }
}

for (const file of listMarkdownFiles('.')) {
  const normFile = file.replaceAll('\\', '/');
  if (normFile.includes('node_modules') || normFile.includes('.git') || normFile.includes('dist') || normFile.includes('.expo')) continue;
  if (normFile.includes('AI-Sessions/raw')) continue;
  
  // 규칙 파일, 프롬프트 파일, 기존 계획서, 리서치 및 타임라인 본문 내 가이드는 Secret 오탐(False Positive) 방지를 위해 제외
  if (
    normFile === 'CLAUDE.md' || 
    normFile === 'AGENTS.md' || 
    normFile === 'research.md' ||
    normFile === 'timeline.md' ||
    normFile.startsWith('prompts/') || 
    normFile.startsWith('docs/')
  ) continue;

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

function assertRegex(path, regex) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  if (!regex.test(content)) {
    failures.push(`${path} missing required pattern: ${regex.source}`);
  }
}

function listMarkdownFiles(root) {
  const results = [];
  walk(root);
  return results;

  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const rel = relative('.', path).replaceAll('\\\\', '/');
      if (rel.startsWith('node_modules/') || rel.startsWith('.git/') || rel.startsWith('dist/') || rel.startsWith('.expo/')) continue;
      const stat = statSync(path);
      if (stat.isDirectory()) {
        walk(path);
      } else if (path.endsWith('.md')) {
        results.push(path);
      }
    }
  }
}
