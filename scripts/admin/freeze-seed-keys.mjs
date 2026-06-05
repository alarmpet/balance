// One-off: 각 뱅크 질문에 현재 위치 기반 seed_key를 명시적 `key`로 박아 넣는다(freeze).
// 이후 JSON 중간 항목을 지워도 다른 질문의 key(→ md5 id)가 바뀌지 않는다.
// 멱등: 이미 key가 있으면 건드리지 않는다.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'question-bank');
const files = (await readdir(DIR)).filter((f) => f.endsWith('.json') && !f.startsWith('.'));

for (const f of files) {
  const path = join(DIR, f);
  const data = JSON.parse(await readFile(path, 'utf8'));
  const cat = data.category;
  let added = 0;
  data.questions = data.questions.map((q, i) => {
    if (q.key) return q;
    added++;
    // 기존 시더와 동일한 위치 기반 키(= 현재 라이브 id의 출처). 순서 보존.
    return { key: `bank-${cat}-${String(i + 1).padStart(3, '0')}`, ...q };
  });
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  process.stdout.write(`${cat}: froze ${added} keys (total ${data.questions.length})\n`);
}
