export type CategorySlug =
  | 'food'
  | 'life'
  | 'romance'
  | 'career'
  | 'culture'
  | 'money'
  | 'relationship'
  | 'values'
  | 'health'
  | 'travel'
  | 'trend'
  | 'hobby'
  | 'dilemma';

export type CategoryInfo = {
  slug: CategorySlug | 'uncategorized';
  name: string;
  color: string;
};

export const CATEGORIES: Record<CategorySlug, CategoryInfo> = {
  food: {
    slug: 'food',
    name: '푸드',
    color: '#f59e0b'
  },
  life: {
    slug: 'life',
    name: '라이프',
    color: '#0f766e'
  },
  romance: {
    slug: 'romance',
    name: '연애',
    color: '#ec4899'
  },
  career: {
    slug: 'career',
    name: '커리어',
    color: '#3b82f6'
  },
  culture: {
    slug: 'culture',
    name: '문화',
    color: '#8b5cf6'
  },
  money: {
    slug: 'money',
    name: '머니',
    color: '#16a34a'
  },
  relationship: {
    slug: 'relationship',
    name: '관계',
    color: '#f97316'
  },
  values: {
    slug: 'values',
    name: '가치관',
    color: '#6366f1'
  },
  health: {
    slug: 'health',
    name: '건강',
    color: '#ef4444'
  },
  travel: {
    slug: 'travel',
    name: '여행',
    color: '#0ea5e9'
  },
  trend: {
    slug: 'trend',
    name: '트렌드',
    color: '#d946ef'
  },
  hobby: {
    slug: 'hobby',
    name: '취미',
    color: '#14b8a6'
  },
  dilemma: {
    slug: 'dilemma',
    name: '딜레마',
    color: '#eab308'
  }
};

export const CATEGORY_OPTIONS = Object.values(CATEGORIES);

export function getCategoryBySlug(slug: string | null | undefined): CategoryInfo {
  if (!slug) return { slug: 'uncategorized', name: '밸런스', color: '#6b7280' };
  const normalized = slug.trim().toLowerCase() as CategorySlug;
  return CATEGORIES[normalized] ?? { slug: 'uncategorized', name: '밸런스', color: '#6b7280' };
}
export function getCategoryByName(name: string | null | undefined): CategoryInfo {
  if (!name) return { slug: 'uncategorized', name: '밸런스', color: '#6b7280' };
  const trimmed = name.trim();
  const found = Object.values(CATEGORIES).find((cat) => cat.name === trimmed);
  return found ?? { slug: 'uncategorized', name: trimmed, color: '#6b7280' };
}
