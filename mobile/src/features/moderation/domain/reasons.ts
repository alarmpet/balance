export const REASONS = [
  { code: 'realistic', label: '현실적으로 이쪽' },
  { code: 'emotional', label: '감정적으로 이쪽' },
  { code: 'money', label: '돈이 더 중요' },
  { code: 'time', label: '시간이 더 중요' },
  { code: 'neither', label: '둘 다 애매해' },
  { code: 'undecided', label: '아직 모르겠어' },
] as const;

export type ReasonCode = (typeof REASONS)[number]['code'];
