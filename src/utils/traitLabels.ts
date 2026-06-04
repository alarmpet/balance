// 성향 키 → 한국어 라벨. 여러 컴포넌트가 공유한다(중복 방지).
export const TRAIT_LABELS: Record<string, string> = {
  safe: '안정',
  adventure: '모험',
  plan: '계획',
  flow: '흐름',
  solo: '혼자',
  social: '함께',
  calm: '차분',
  express: '표현',
  curious: '호기심',
  comfort: '익숙함',
  aesthetic: '미감'
};

export function traitLabel(key: string): string {
  return TRAIT_LABELS[key] ?? key;
}
