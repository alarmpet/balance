import type { InsightGraphSnapshot, UserInsightCardRow } from '../types/database.types';

export const guestInsightGraph: InsightGraphSnapshot = {
  nodes: [
    {
      id: 'pet:self',
      kind: 'pet',
      label: '미리보기 펫',
      size: 44,
      color: '#38bdf8',
      score: 1,
      meta: { preview: true }
    },
    {
      id: 'trait:safe',
      kind: 'trait',
      label: '안정',
      size: 38,
      color: '#0ea5e9',
      score: 22,
      meta: { rank: 1 }
    },
    {
      id: 'trait:plan',
      kind: 'trait',
      label: '계획',
      size: 34,
      color: '#0ea5e9',
      score: 18,
      meta: { rank: 2 }
    },
    {
      id: 'trait:comfort',
      kind: 'trait',
      label: '취향',
      size: 30,
      color: '#14b8a6',
      score: 14,
      meta: { rank: 3 }
    },
    {
      id: 'category:food',
      kind: 'category',
      label: '푸드',
      size: 32,
      color: '#f59e0b',
      score: 9,
      meta: { slug: 'food' }
    },
    {
      id: 'category:life',
      kind: 'category',
      label: '라이프',
      size: 28,
      color: '#f59e0b',
      score: 6,
      meta: { slug: 'life' }
    },
    {
      id: 'question:guest-food',
      kind: 'question',
      label: '오늘 딱 하나만 먹는다면?',
      size: 18,
      color: '#a78bfa',
      score: 1,
      meta: { category_slug: 'food' }
    }
  ],
  edges: [
    {
      id: 'edge:pet:self->trait:safe',
      source: 'pet:self',
      target: 'trait:safe',
      kind: 'trait_score',
      weight: 1,
      label: '자주 선택'
    },
    {
      id: 'edge:pet:self->trait:plan',
      source: 'pet:self',
      target: 'trait:plan',
      kind: 'trait_score',
      weight: 0.82,
      label: '선택 흐름'
    },
    {
      id: 'edge:pet:self->trait:comfort',
      source: 'pet:self',
      target: 'trait:comfort',
      kind: 'trait_score',
      weight: 0.64,
      label: '취향 조각'
    },
    {
      id: 'edge:pet:self->category:food',
      source: 'pet:self',
      target: 'category:food',
      kind: 'category_affinity',
      weight: 0.9,
      label: '최근 선택'
    },
    {
      id: 'edge:pet:self->category:life',
      source: 'pet:self',
      target: 'category:life',
      kind: 'category_affinity',
      weight: 0.58,
      label: '생활 취향'
    },
    {
      id: 'edge:category:food->question:guest-food',
      source: 'category:food',
      target: 'question:guest-food',
      kind: 'question_evidence',
      weight: 0.65,
      label: '근거 질문'
    }
  ],
  summary: {
    title: '안정적인 취향 가지가 먼저 자라고 있어요',
    body: '가상의 30개 선택을 바탕으로 만든 미리보기 지도예요. 로그인하면 실제 선택으로 바뀝니다.',
    completion: 0.64
  },
  meta: {
    focus_node_id: null,
    depth: 1,
    node_limit: 40,
    window_days: 30
  }
};

export const guestInsightCards: UserInsightCardRow[] = [
  {
    id: 'guest-insight-1',
    user_id: 'guest',
    insight_key: 'guest_preview_summary',
    title: '편안함을 고르지만 기준은 또렷해요',
    body: '푸드와 라이프 선택에서 익숙한 선택을 선호하지만, 고를 때의 기준은 꽤 분명한 편이에요.',
    primary_trait_key: 'safe',
    secondary_trait_key: 'plan',
    category_slug: 'food',
    confidence: 0.72,
    evidence: {
      recent_question_ids: ['guest-food']
    },
    is_read: false,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString()
  }
];
