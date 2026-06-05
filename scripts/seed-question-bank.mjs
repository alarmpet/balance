#!/usr/bin/env node
// Convert recreated balance questions in data/question-bank/*.json into an
// idempotent SQL seed file.
//
// Usage:
//   node scripts/seed-question-bank.mjs > /tmp/seed.sql
//   NEW_ONLY=1 node scripts/seed-question-bank.mjs > /tmp/seed-new.sql
//
// Rules:
// - id = md5(seed_key)::uuid, so reruns are deterministic.
// - questions are inserted as status='approved', is_official=true.
// - question_traits are upserted by (question_id, option_side, trait_key).
// - invalid questions are printed to stderr and excluded.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BANK_DIR = join(__dirname, '..', 'data', 'question-bank');

const TRAITS = new Set(['safe', 'adventure', 'plan', 'flow', 'solo', 'social', 'calm', 'express', 'comfort', 'curious']);

// Verified Unsplash image ids by category. Replace with owned assets later.
const IMG = {
  food: ['photo-1551183053-bf91a1d81141', 'photo-1562967914-608f82629710', 'photo-1495474472287-4d71bcdd2085', 'photo-1517248135467-4c7edcad34c4', 'photo-1533134242443-d4fd215305ad'],
  life: ['photo-1476480862126-209bfaa8edc8', 'photo-1554224155-6726b3ff858f', 'photo-1506126613408-eca07ce68773', 'photo-1524758631624-e2822e304c36', 'photo-1489599849927-2ee91cede3ba'],
  romance: ['photo-1512428559087-560fa5ceab42', 'photo-1516585427167-9f4af9627e6c', 'photo-1500530855697-b586d89ba3ee', 'photo-1513201099705-a9746e1e201f', 'photo-1522673607200-164d1b6ce486'],
  career: ['photo-1497366811353-6870744d04b2', 'photo-1553877522-43269d4ea984', 'photo-1516321318423-f06f85e504b3', 'photo-1556761175-b413da4baf72', 'photo-1559136555-9303baea8ebd'],
  culture: ['photo-1489599849927-2ee91cede3ba', 'photo-1506157786151-b8491531f063', 'photo-1531058020387-3be344556be6', 'photo-1440404653325-ab127d49abc1', 'photo-1511512578047-dfb367046420'],
  money: ['photo-1554224155-6726b3ff858f', 'photo-1518458028785-8fbcd101ebb9', 'photo-1579621970795-87facc2f976d', 'photo-1565514020179-026b92b84bb6', 'photo-1607863680198-23d4b2565df0'],
  relationship: ['photo-1529156069898-49953e39b3ac', 'photo-1543269865-cbf427effbad', 'photo-1511632765486-a01980e01a18', 'photo-1488751045188-3c55bbf9a3fa', 'photo-1496024840928-4c417adf211d'],
  values: ['photo-1507692049790-de58290a4334', 'photo-1518655048521-f130df041f66', 'photo-1454165804606-c3d57bc86b40', 'photo-1499209974431-9dddcece7f88', 'photo-1500964757637-c85e8a162699'],
  health: ['photo-1517836357463-d25dfeac3438', 'photo-1571019613454-1cb2f99b2d8b', 'photo-1538805060514-97d9cc17730c', 'photo-1490645935967-10de6ba17061', 'photo-1476480862126-209bfaa8edc8'],
  travel: ['photo-1488646953014-85cb44e25828', 'photo-1530789253388-582c481c54b0', 'photo-1476514525535-07fb3b4ae5f1', 'photo-1507525428034-b723cf961d3e', 'photo-1500530855697-b586d89ba3ee'],
  trend: ['photo-1611162617474-5b21e879e113', 'photo-1556761175-b413da4baf72', 'photo-1563986768609-322da13575f3', 'photo-1611605698335-8b1569810432', 'photo-1517292987719-0369a794ec0f'],
  hobby: ['photo-1452857297128-d9c29adba80b', 'photo-1425082661705-1834bfd09dca', 'photo-1516981879613-9f5da904015f', 'photo-1493663284031-b7e3aefcae8e', 'photo-1517457373958-b7bdd4587205'],
  dilemma: ['photo-1499209974431-9dddcece7f88', 'photo-1518655048521-f130df041f66', 'photo-1507692049790-de58290a4334', 'photo-1454165804606-c3d57bc86b40', 'photo-1500964757637-c85e8a162699']
};

const imgUrl = (cat, i) => {
  const pool = IMG[cat];
  if (!pool) throw new Error(`No image pool for category "${cat}" — add it to IMG in seed-question-bank.mjs`);
  return `https://images.unsplash.com/${pool[i % pool.length]}`;
};
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const arr = (a) => 'ARRAY[' + a.map(q).join(',') + ']::text[]';

function validate(cat, item, idx) {
  const errs = [];
  if (!item.t || item.t.length < 4) errs.push('title too short');
  if (!item.a || !item.b) errs.push('missing option');
  if (item.a === item.b) errs.push('options identical');
  if (!TRAITS.has(item.at)) errs.push(`bad at trait: ${item.at}`);
  if (!TRAITS.has(item.bt)) errs.push(`bad bt trait: ${item.bt}`);
  if (item.at === item.bt) errs.push('same trait both sides');
  for (const w of [item.aw, item.bw]) {
    if (typeof w !== 'number' || w < 1.0 || w > 1.5) errs.push(`weight out of range: ${w}`);
  }
  if (!IMG[cat]) errs.push(`unknown category: ${cat}`);
  if (errs.length) process.stderr.write(`REJECT [${cat}#${idx}] "${item.t}" :: ${errs.join('; ')}\n`);
  return errs;
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const only = process.env.CATEGORY || null;

  // --keys k1,k2,... : 지정한 key만 출력(안정적 증분 시드). seed_key는 위치가 아니라 JSON의 명시적 `key`.
  const keysArgIdx = process.argv.indexOf('--keys');
  const onlyKeys = keysArgIdx >= 0 && process.argv[keysArgIdx + 1]
    ? new Set(process.argv[keysArgIdx + 1].split(',').map((s) => s.trim()).filter(Boolean))
    : null;

  // NEW_ONLY(위치/카운트 기반)는 항목 삭제 후 인덱스가 밀려 신뢰 불가 → 폐기. --keys 또는 전량 멱등 시드 사용.
  if (process.env.NEW_ONLY === '1') {
    process.stderr.write('NEW_ONLY is deprecated (positions shift after edits). Use --keys k1,k2 or run the full idempotent seed.\n');
    process.exit(2);
  }

  const files = (await readdir(BANK_DIR)).filter((f) => f.endsWith('.json') && !f.startsWith('.')).sort();
  const rows = [];
  let rejected = 0;

  for (const file of files) {
    const data = JSON.parse(await readFile(join(BANK_DIR, file), 'utf8'));
    const cat = data.category;
    if (only && cat !== only) continue;

    data.questions.forEach((item, i) => {
      const errs = validate(cat, item, i);
      if (errs.length) {
        rejected++;
        return;
      }
      // seed_key는 명시적 key 우선(위치 비의존 → 항목 삭제·재정렬에도 id 안정).
      const seedKey = item.key || `bank-${cat}-${String(i + 1).padStart(3, '0')}`;
      if (!item.key) process.stderr.write(`WARN ${cat}#${i}: missing key, using positional ${seedKey}\n`);
      if (onlyKeys && !onlyKeys.has(seedKey)) return;
      // 이미지 인덱스도 key의 일련번호 기준(위치 비의존).
      const seq = Number(seedKey.split('-').pop()) || (i + 1);
      rows.push({
        seed_key: seedKey,
        cat,
        title: item.t,
        desc: item.ad && item.bd ? `${item.a} vs ${item.b}` : null,
        tags: item.tags || [],
        a_t: item.a,
        a_d: item.ad || null,
        a_img: imgUrl(cat, seq * 2),
        b_t: item.b,
        b_d: item.bd || null,
        b_img: imgUrl(cat, seq * 2 + 1),
        reward: 1.0,
        at: item.at,
        aw: item.aw,
        bt: item.bt,
        bw: item.bw
      });
    });
  }

  const structuralErrors = collectStructuralErrors(rows);
  if (checkOnly) {
    const categoryCounts = countBy(rows, (row) => row.cat);
    const traitCounts = countBy(rows.flatMap((row) => [row.at, row.bt]), (trait) => trait);
    process.stdout.write(`${JSON.stringify({
      ok: rejected === 0 && structuralErrors.length === 0,
      generated: rows.length,
      rejected,
      structuralErrors,
      categoryCounts,
      traitCounts
    }, null, 2)}\n`);
    if (rejected > 0 || structuralErrors.length > 0) process.exitCode = 1;
    return;
  }

  const valTuples = rows.map((r) => `(${q(r.seed_key)}, ${q(r.cat)}, ${q(r.title)}, ${r.desc ? q(r.desc) : 'NULL'}, ${arr(r.tags)}, ${q(r.a_t)}, ${r.a_d ? q(r.a_d) : 'NULL'}, ${q(r.a_img)}, ${q(r.b_t)}, ${r.b_d ? q(r.b_d) : 'NULL'}, ${q(r.b_img)}, ${r.reward}, ${q(r.at)}, ${r.aw}, ${q(r.bt)}, ${r.bw})`);

  let sql = '';
  sql += '-- AUTO-GENERATED by scripts/seed-question-bank.mjs - do not edit by hand.\n';
  sql += 'BEGIN;\n';
  sql += 'CREATE TEMP TABLE _qb (seed_key text, cat text, title text, descr text, tags text[], a_t text, a_d text, a_img text, b_t text, b_d text, b_img text, reward numeric, at text, aw numeric, bt text, bw numeric) ON COMMIT DROP;\n';
  sql += 'INSERT INTO _qb VALUES\n' + valTuples.join(',\n') + ';\n';
  sql += `INSERT INTO public.questions (id, title, description, category_id, tags, option_a_title, option_a_description, option_a_image_url, option_b_title, option_b_description, option_b_image_url, status, is_official, reward_score)
SELECT md5(q.seed_key)::uuid, q.title, q.descr, c.id, q.tags, q.a_t, q.a_d, q.a_img, q.b_t, q.b_d, q.b_img, 'approved', TRUE, q.reward
FROM _qb q JOIN public.categories c ON c.slug = q.cat
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, category_id=EXCLUDED.category_id, tags=EXCLUDED.tags, option_a_title=EXCLUDED.option_a_title, option_a_description=EXCLUDED.option_a_description, option_a_image_url=EXCLUDED.option_a_image_url, option_b_title=EXCLUDED.option_b_title, option_b_description=EXCLUDED.option_b_description, option_b_image_url=EXCLUDED.option_b_image_url, status='approved', is_official=TRUE, reward_score=EXCLUDED.reward_score;
`;
  sql += `INSERT INTO public.question_traits (question_id, option_side, trait_key, weight)
SELECT md5(seed_key)::uuid, 'A', at, aw FROM _qb
UNION ALL SELECT md5(seed_key)::uuid, 'B', bt, bw FROM _qb
ON CONFLICT (question_id, option_side, trait_key) DO UPDATE SET weight=EXCLUDED.weight;
`;
  sql += 'COMMIT;\n';

  process.stdout.write(sql);
  process.stderr.write(`\nGENERATED ${rows.length} questions, REJECTED ${rejected}.\n`);
}

function countBy(values, keyFn) {
  return values.reduce((acc, value) => {
    const key = keyFn(value);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectStructuralErrors(rows) {
  const errors = [];
  const seenSeedKeys = new Set();
  const seenQuestionKeys = new Set();

  for (const row of rows) {
    if (seenSeedKeys.has(row.seed_key)) {
      errors.push(`duplicate seed_key: ${row.seed_key}`);
    }
    seenSeedKeys.add(row.seed_key);

    const optionPair = [normalizeKey(row.a_t), normalizeKey(row.b_t)].sort().join(' | ');
    const questionKey = `${row.cat}::${normalizeKey(row.title)}::${optionPair}`;
    if (seenQuestionKeys.has(questionKey)) {
      errors.push(`duplicate question: ${row.cat} / ${row.title}`);
    }
    seenQuestionKeys.add(questionKey);
  }

  return errors;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
