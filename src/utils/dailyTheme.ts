// 오늘의 딜레마 테마: 요일마다 하나의 성향 축을 전면에 내세워 복귀 이유를 만든다.
// MVP는 클라이언트 로컬 매핑이며, 이후 DB 기반 큐레이션/이벤트로 심화한다.
// 축 이름은 BIPI 4축(solo-social, safe-adventure, plan-flow, calm-express)과 정렬한다.

export type DailyTheme = {
  label: string; // 상단 라벨 (예: "오늘의 딜레마")
  name: string; // 테마 이름 (예: "혼자 vs 같이")
  emoji: string;
  blurb: string; // 한 줄 안내 (비진단 톤)
  axis: string | null; // 연결된 BIPI 축 (없으면 자유 테마)
};

const THEMES_BY_WEEKDAY: DailyTheme[] = [
  // 0 일요일 — 한 주를 돌아보는 자유 테마
  { label: '이번 주 돌아보기', name: '자유 선택의 날', emoji: '🌈', blurb: '오늘은 마음 가는 대로 골라봐요.', axis: null },
  // 1 월요일
  { label: '오늘의 딜레마', name: '혼자 vs 같이', emoji: '🧑‍🤝‍🧑', blurb: '나는 어느 쪽에서 더 편안할까요?', axis: 'solo-social' },
  // 2 화요일
  { label: '오늘의 딜레마', name: '안정 vs 모험', emoji: '🧭', blurb: '익숙함과 설렘 사이, 오늘의 나는?', axis: 'safe-adventure' },
  // 3 수요일
  { label: '오늘의 딜레마', name: '계획 vs 즉흥', emoji: '🗓️', blurb: '흐름에 맡길까, 그려둘까?', axis: 'plan-flow' },
  // 4 목요일
  { label: '오늘의 딜레마', name: '차분 vs 표현', emoji: '🎭', blurb: '마음을 어떻게 드러내는 편인가요?', axis: 'calm-express' },
  // 5 금요일
  { label: '오늘의 딜레마', name: '맛 vs 분위기', emoji: '🍽️', blurb: '무엇이 먼저 마음을 끌까요?', axis: null },
  // 6 토요일
  { label: '주말 특집', name: '취향 대탐험', emoji: '🎡', blurb: '오늘은 다양한 취향을 골고루!', axis: null }
];

export function getDailyTheme(date: Date = new Date()): DailyTheme {
  return THEMES_BY_WEEKDAY[date.getDay()];
}
