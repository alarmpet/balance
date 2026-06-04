#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const CANONICAL_TRAITS = ['safe', 'adventure', 'plan', 'flow', 'solo', 'social', 'calm', 'express', 'comfort', 'curious'];

const TRAIT_RULES = [
  { trait: 'safe', patterns: ['안정', '검증', '저축', '고정비', '미루기', '정직', '전문가', '베스트셀러', '준비', '예약', '회사원', '건강', '절교', '비밀', '장점', '무난', '인기'] },
  { trait: 'adventure', patterns: ['모험', '도전', '위험', '리더', '앞장', '즉흥', '바로', '직설', '밖', '짬뽕', '산책', '초기 리더', '낯선', '프리랜서'] },
  { trait: 'plan', patterns: ['계획', '루틴', '매일', '정리', '준비', '동선', '실행', '저축', '회사원', '고칠', '30분', '공부', '예약'] },
  { trait: 'flow', patterns: ['즉흥', '자유', '흐름', '그날', '주말', '몰아서', '랜덤', '예술', '여행', '산책', '몰입', '표지'] },
  { trait: 'solo', patterns: ['혼자', '소수', '조용', '카페', '집', '침대'] },
  { trait: 'social', patterns: ['친구', '함께', '많은 관계', '모두', '팀', '만나', '사람', '사랑받기', '계속 만나기'] },
  { trait: 'calm', patterns: ['차분', '하루', '생각', '정리하고', '조용', '미루기', '비밀', '장점', '소수', '카페', '침대', '천천히'] },
  { trait: 'express', patterns: ['표현', '바로 말', '솔직', '직설', '사랑', '리액션', '결제', '공유', '친구 만나', '많은 관계', '리더', '앞장'] },
  { trait: 'comfort', patterns: ['편안', '익숙', '늘 먹던', '늘 같은', '반복', '여기', '카페', '직장', '친한', '가봤던', '회식', '단골', '기존', '내 관심사', '갖고 싶던', '짜장'] },
  { trait: 'curious', patterns: ['궁금', '호기심', '낯선', '처음', '신상', '새 메뉴', '새 음악', '새 분야', '새 길', '새 앱', '탐색', '탐험', '실험', '새 조합', '안 가본', '처음인', '색다른', '모르는', '파보기', '잘 안 하는'] }
];

const SENSITIVE_PATTERNS = ['몰래', '비밀번호', '개인정보', '엿보기', '정치', '종교', '절교', '범죄', '폭력', '자해', '성적', '미성년'];
const REJECT_PATTERNS = ['매일 아프', '가난하게', '미움받기', '죽기', '괴롭히기'];
const LOW_VALUE_PATTERNS = ['비빔밥', '콜라', '짜장', '짬뽕', '산 vs 바다', '민초', '부먹', '찍먹'];
const VALUE_PATTERNS = ['안정', '자유', '앞장', '계획', '즉흥', '혼자', '친구', '관계', '갈등', '피드백', '저축', '소비', '반복', '성장', '리더', '공부', '정직', '미루기', '카페', '산책', '베스트셀러', '낯선 책', '표지', '익숙', '궁금', '호기심', '신상', '탐색', '탐험', '실험', '처음', '모르는', '무난', '인기 취미', '관심사'];
const BROKEN_BALANCE_PATTERNS = ['건강하게 살기 vs 매일 아프기', '부자 되기 vs 가난하게 살기', '사랑받기 vs 모두에게 미움받기', '사랑받기 vs 미움받기'];
const NEEDS_EDIT_PATTERNS = ['하루 종일 카페', '하루 종일 산책'];

const SAMPLE_QUESTIONS = [
  { title: '안정적인 회사원 vs 자유로운 프리랜서', optionA: '안정적인 회사원', optionB: '자유로운 프리랜서', categorySlug: 'career' },
  { title: '비빔밥 vs 콜라', optionA: '비빔밥', optionB: '콜라', categorySlug: 'culture' },
  { title: '연인의 비밀번호 몰래 보기 vs 그냥 믿기', optionA: '몰래 보기', optionB: '그냥 믿기', categorySlug: 'romance' },
  { title: '늘 먹던 디저트 vs 이번 시즌 신상', optionA: '늘 먹던 디저트', optionB: '이번 시즌 신상', categorySlug: 'food' }
];

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern.toLowerCase()));
}

function scorePersonalityValue(text) {
  const hits = VALUE_PATTERNS.filter((pattern) => text.includes(pattern.toLowerCase())).length;
  if (hits >= 3) return 3;
  if (hits >= 1) return 2;
  if (includesAny(text, LOW_VALUE_PATTERNS)) return 1;
  return 0;
}

function judgeSafety(text) {
  if (includesAny(text, REJECT_PATTERNS)) return 'reject';
  if (includesAny(text, SENSITIVE_PATTERNS)) return 'needs_review';
  return 'safe';
}

function judgeBalance(text, optionA, optionB) {
  if (includesAny(`${optionA} vs ${optionB}`, BROKEN_BALANCE_PATTERNS) || includesAny(text, BROKEN_BALANCE_PATTERNS)) return 'broken';
  if (optionA.length < 2 || optionB.length < 2) return 'tilted';
  if (Math.max(optionA.length, optionB.length) / Math.max(1, Math.min(optionA.length, optionB.length)) >= 3) return 'tilted';
  if (includesAny(text, LOW_VALUE_PATTERNS)) return 'tilted';
  return 'balanced';
}

function inferTraits(text) {
  const traits = [];
  for (const rule of TRAIT_RULES) {
    if (includesAny(text, rule.patterns)) traits.push(rule.trait);
  }
  return [...new Set(traits)].filter((trait) => CANONICAL_TRAITS.includes(trait)).slice(0, 4);
}

function splitOptionText(question) {
  return {
    a: normalizeText(question.optionA ?? question.option_a_title ?? ''),
    b: normalizeText(question.optionB ?? question.option_b_title ?? '')
  };
}

export function classifyQuestion(question) {
  const title = normalizeText(question.title);
  const { a, b } = splitOptionText(question);
  const fullText = normalizeText([question.title, question.description, question.optionA, question.optionB, question.option_a_title, question.option_b_title].join(' '));
  const personalityValue = scorePersonalityValue(fullText);
  const safety = judgeSafety(fullText);
  const balance = judgeBalance(title, a, b);
  const traitsA = inferTraits(a || title);
  const traitsB = inferTraits(b || title);
  const traitFit = traitsA.length > 0 && traitsB.length > 0
    ? 'strong'
    : traitsA.length > 0 || traitsB.length > 0
      ? 'weak'
      : 'none';
  const duplication = 'none';

  let suggestedAction = 'approve_candidate';
  if (safety === 'needs_review') {
    suggestedAction = 'needs_human_review';
  } else if (personalityValue === 0 || safety === 'reject' || balance === 'broken' || traitFit === 'none') {
    suggestedAction = 'reject_candidate';
  } else if (personalityValue < 2 || balance === 'tilted' || traitFit === 'weak' || duplication === 'similar' || includesAny(fullText, NEEDS_EDIT_PATTERNS)) {
    suggestedAction = 'needs_edit';
  }

  return {
    title: String(question.title ?? ''),
    personality_value: personalityValue,
    balance,
    safety,
    duplication,
    trait_fit: traitFit,
    suggested_traits: {
      A: traitsA,
      B: traitsB
    },
    suggested_action: suggestedAction
  };
}

function readQuestionsFromFile(path) {
  const raw = fs.readFileSync(path, 'utf8').trim();
  if (!raw) return [];
  if (raw.startsWith('[')) return JSON.parse(raw);
  return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function includesAll(actual, expected) {
  return expected.every((trait) => actual.includes(trait));
}

function checkExamples(path) {
  const examples = readQuestionsFromFile(path);
  const results = examples.map((question) => {
    const actual = classifyQuestion(question);
    const expectedTraits = question.expectedTraits ?? {};
    const shouldCheckTraits = ['approve_candidate', 'needs_edit'].includes(question.expectedAction);
    const traitsOk = !shouldCheckTraits
      || ((!expectedTraits.A || includesAll(actual.suggested_traits.A, expectedTraits.A))
        && (!expectedTraits.B || includesAll(actual.suggested_traits.B, expectedTraits.B)));
    return {
      title: question.title,
      expected: question.expectedAction,
      actual: actual.suggested_action,
      expectedTraits,
      actualTraits: actual.suggested_traits,
      ok: (!question.expectedAction || question.expectedAction === actual.suggested_action) && traitsOk
    };
  });
  const failed = results.filter((result) => !result.ok);
  printJson({ ok: failed.length === 0, total: results.length, failed, results });
  if (failed.length > 0) process.exitCode = 1;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--sample')) {
    printJson(SAMPLE_QUESTIONS.map(classifyQuestion));
    return;
  }

  if (args.includes('--check-examples')) {
    checkExamples('data/question-review/rubric.examples.jsonl');
    return;
  }

  const fileIndex = args.findIndex((arg) => arg === '--file');
  if (fileIndex >= 0 && args[fileIndex + 1]) {
    printJson(readQuestionsFromFile(args[fileIndex + 1]).map(classifyQuestion));
    return;
  }

  process.stderr.write('Usage: node scripts/admin/classify-pending-question.mjs --sample | --file <questions.jsonl>\n');
  process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
