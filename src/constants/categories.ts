export type CategorySlug = 'food' | 'life' | 'romance' | 'career' | 'culture';

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
