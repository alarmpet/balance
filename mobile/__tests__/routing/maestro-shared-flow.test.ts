import { readFileSync } from 'node:fs';
import path from 'node:path';

test('shared Maestro flow uses the deterministic seeded UUID and expected journey', () => {
  const flow = readFileSync(path.resolve(__dirname, '../../maestro/shared-question.yaml'), 'utf8');
  const seed = readFileSync(path.resolve(__dirname, '../../supabase/seed.sql'), 'utf8');
  const questionId = '60000000-0000-0000-0000-000000000001';

  expect(seed).toContain(questionId);
  expect(flow).toContain(`mobile:///share/${questionId}`);
  expect(flow).toContain('다른 밸런스도 보기');
  expect(flow).not.toMatch(/daily-ramen-chicken|\/share\/q1/);
});

test('primary Maestro flow is UTF-8 and both local and Supabase seeds provide ten cards', () => {
  const flow = readFileSync(path.resolve(__dirname, '../../maestro/vote-create-brain.yaml'), 'utf8');
  const questions = JSON.parse(readFileSync(
    path.resolve(__dirname, '../../src/seed/questions.ko.json'), 'utf8',
  )) as unknown[];
  const seed = readFileSync(path.resolve(__dirname, '../../supabase/seed.sql'), 'utf8');
  const seededQuestionIds = new Set(seed.match(/60000000-0000-0000-0000-0000000000\d{2}/g) ?? []);

  expect(flow).toContain('A 선택:.*');
  expect(flow).toContain('물어보기');
  expect(flow).toContain('질문 등록');
  expect(flow).toContain('나의 뇌');
  expect(flow).not.toContain('�');
  expect(questions.length).toBeGreaterThanOrEqual(10);
  expect(seededQuestionIds.size).toBeGreaterThanOrEqual(10);
});
