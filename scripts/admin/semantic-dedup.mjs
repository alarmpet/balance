// 의미 기반 중복 탐지 (최소비용). OpenAI text-embedding-3-small로 제목을 임베딩해
// 코사인 유사도로 "의미상 거의 같은" 질문 쌍을 찾는다. pg_trgm이 못 잡는 동의어/재서술 중복 대응.
//
// 비용 최소화:
//  - 임베딩은 1배치 호출(입력 배열)로 한 번에. text-embedding-3-small = $0.02/1M 토큰.
//  - 결과(벡터)는 _tmp/embeddings-cache.json에 캐시 → 재실행 시 신규 제목만 임베딩(거의 0원).
//  - 벡터를 DB에 저장하지 않는다(서비스 롤 불필요). 메모리에서 비교.
//
// 사용:
//   node scripts/admin/semantic-dedup.mjs                 # 승인 질문 전체 intra-bank 의미중복 스캔
//   node scripts/admin/semantic-dedup.mjs --title "..."   # 후보 1건을 기존 질문과 비교(제출 플로우)
//   node scripts/admin/semantic-dedup.mjs --threshold 0.9 # 임계 조정(기본 0.88)
//
// 출력: JSON(작음 — id/제목/점수만). 벡터는 출력하지 않는다.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const CACHE_PATH = join(ROOT, '_tmp', 'embeddings-cache.json');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_KEY = process.env.openai || process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const candidateTitle = getArg('title', null);
const threshold = Number(getArg('threshold', '0.88'));

const fail = (m) => { process.stderr.write(m + '\n'); process.exit(1); };
if (!SUPABASE_URL || !ANON) fail('Missing EXPO_PUBLIC_SUPABASE_URL / ANON_KEY in .env');
if (!OPENAI_KEY) fail('Missing OpenAI key (.env: openai)');

const norm = (t) => (t || '').toLowerCase().replace(/[\s\p{P}]/gu, '');
const keyOf = (t) => createHash('sha1').update(MODEL + '|' + norm(t)).digest('hex');

async function loadCache() {
  try { return JSON.parse(await readFile(CACHE_PATH, 'utf8')); } catch { return {}; }
}
async function saveCache(cache) {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache), 'utf8');
}

// 승인 질문 전부 가져오기(공개 read, anon REST). 페이지네이션.
async function fetchApproved() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const url = `${SUPABASE_URL}/rest/v1/questions?select=id,title,category_id&status=eq.approved&order=created_at.asc`;
    const res = await fetch(url, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Range: `${from}-${from + pageSize - 1}` }
    });
    if (!res.ok) fail(`Supabase fetch failed: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

// 캐시에 없는 텍스트만 OpenAI로 임베딩(1배치). 비용 최소화.
async function embedMany(texts, cache) {
  const missing = [...new Set(texts.filter((t) => !cache[keyOf(t)]))];
  if (missing.length) {
    process.stderr.write(`Embedding ${missing.length} new titles via ${MODEL}...\n`);
    // OpenAI 배치 제한 대비 청크(2048).
    for (let i = 0; i < missing.length; i += 2048) {
      const chunk = missing.slice(i, i + 2048);
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, input: chunk })
      });
      if (!res.ok) fail(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
      const json = await res.json();
      json.data.forEach((d, idx) => { cache[keyOf(chunk[idx])] = d.embedding; });
    }
    await saveCache(cache);
  } else {
    process.stderr.write('All titles cached — no API cost.\n');
  }
  return texts.map((t) => cache[keyOf(t)]);
}

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const norm2 = (a) => Math.sqrt(dot(a, a));
const cosine = (a, b) => dot(a, b) / (norm2(a) * norm2(b) || 1);

async function main() {
  const cache = await loadCache();
  const approved = await fetchApproved();
  const vecs = await embedMany(approved.map((r) => r.title), cache);
  const items = approved.map((r, i) => ({ ...r, vec: vecs[i] }));

  if (candidateTitle) {
    // 제출 플로우: 후보 1건 vs 기존 전체.
    const [cv] = await embedMany([candidateTitle], cache);
    const scored = items
      .map((it) => ({ id: it.id, title: it.title, similarity: Number(cosine(cv, it.vec).toFixed(4)) }))
      .filter((x) => x.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
    process.stdout.write(JSON.stringify({ candidate: candidateTitle, threshold, matches: scored }, null, 2) + '\n');
    return;
  }

  if (args.includes('--pending')) {
    // 관리자 큐 플래그: status='pending' 사용자 제출을 기존 승인 질문과 비교.
    const url = `${SUPABASE_URL}/rest/v1/questions?select=id,title&status=eq.pending&order=created_at.desc`;
    const res = await fetch(url, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
    if (!res.ok) fail(`pending fetch failed: ${res.status}`);
    const pending = await res.json();
    const pvecs = await embedMany(pending.map((p) => p.title), cache);
    const flags = pending.map((p, i) => {
      const best = items
        .map((it) => ({ id: it.id, title: it.title, similarity: Number(cosine(pvecs[i], it.vec).toFixed(4)) }))
        .sort((a, b) => b.similarity - a.similarity)[0];
      return { pending_id: p.id, pending_title: p.title, bestMatch: best, isSemanticDuplicate: best && best.similarity >= threshold };
    });
    process.stdout.write(JSON.stringify({ pendingCount: pending.length, threshold, flags }, null, 2) + '\n');
    return;
  }

  // intra-bank 스캔: 의미상 거의 같은 쌍 찾기.
  const pairs = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = cosine(items[i].vec, items[j].vec);
      if (sim >= threshold) {
        pairs.push({
          a: { id: items[i].id, title: items[i].title },
          b: { id: items[j].id, title: items[j].title },
          similarity: Number(sim.toFixed(4))
        });
      }
    }
  }
  pairs.sort((x, y) => y.similarity - x.similarity);
  process.stdout.write(JSON.stringify({ scanned: items.length, threshold, duplicatePairs: pairs.length, pairs: pairs.slice(0, 60) }, null, 2) + '\n');
  process.stderr.write(`Done. ${pairs.length} pairs >= ${threshold}.\n`);
}

main().catch((e) => fail(String(e?.stack || e)));
