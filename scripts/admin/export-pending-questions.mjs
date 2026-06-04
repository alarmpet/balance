#!/usr/bin/env node
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { classifyQuestion } from './classify-pending-question.mjs';

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

function readArgs() {
  const args = process.argv.slice(2);
  const outIndex = args.findIndex((arg) => arg === '--out');
  const limitIndex = args.findIndex((arg) => arg === '--limit');
  const telegram = args.includes('--telegram');
  return {
    outPath: outIndex >= 0 ? args[outIndex + 1] : null,
    limit: limitIndex >= 0 ? Number(args[limitIndex + 1]) : 50,
    telegram
  };
}

function requireEnv() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(', ')}. Use local-only .env values; never commit service role keys.`);
  }
}

function normalizeRow(row) {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    optionA: row.option_a_title,
    optionB: row.option_b_title,
    categorySlug: category?.slug ?? null,
    categoryName: category?.name ?? null,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at
  };
}

function formatTelegramDigest(items) {
  if (!items.length) return 'pending 질문이 없습니다.';
  const lines = [`질문 검토 필요: ${items.length}개`];
  for (const item of items.slice(0, 10)) {
    lines.push('');
    lines.push(`질문: ${item.title}`);
    lines.push(`A/B: ${item.optionA} vs ${item.optionB}`);
    lines.push(`판정: ${item.review.suggested_action}`);
    lines.push(`성향 가치: ${item.review.personality_value}/3, 위험성: ${item.review.safety}, 균형: ${item.review.balance}`);
    lines.push(`추천 trait: A=${item.review.suggested_traits.A.join(', ') || '-'} / B=${item.review.suggested_traits.B.join(', ') || '-'}`);
  }
  if (items.length > 10) lines.push(`\n나머지 ${items.length - 10}개는 JSONL에서 확인.`);
  return lines.join('\n');
}

async function fetchPendingQuestions(limit) {
  requireEnv();
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase
    .from('questions')
    .select('id,title,description,option_a_title,option_b_title,is_anonymous,created_at,categories(slug,name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(normalizeRow).map((question) => ({
    ...question,
    review: classifyQuestion(question)
  }));
}

async function main() {
  const { outPath, limit, telegram } = readArgs();
  const items = await fetchPendingQuestions(Number.isFinite(limit) && limit > 0 ? limit : 50);

  if (telegram) {
    process.stdout.write(`${formatTelegramDigest(items)}\n`);
    return;
  }

  const jsonl = items.map((item) => JSON.stringify(item)).join('\n');
  if (outPath) {
    fs.writeFileSync(outPath, jsonl ? `${jsonl}\n` : '', 'utf8');
    process.stdout.write(`Exported ${items.length} pending questions to ${outPath}\n`);
    return;
  }

  process.stdout.write(jsonl ? `${jsonl}\n` : '');
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
