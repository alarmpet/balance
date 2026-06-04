// 화면 surface별 그라데이션 토큰. 시안 3종(보케 피드 / 석양 섬 / 성운 인사이트)과 정렬.
// expo-linear-gradient 또는 배경 스폿 구성에 사용한다.
export const GRADIENTS = {
  // ① 피드: 파스텔 보케 (좌상→우하)
  feedBokeh: ['#FFF0F5', '#E6F3FF', '#F0E6FF', '#FFFFE0'],
  // ② 섬: 석양 하늘 → 바다
  islandSunset: ['#fed7aa', '#fdba74', '#38bdf8', '#0ea5e9'],
  // ③ 인사이트: 딥 스페이스 성운
  insightNebula: ['#070b19', '#0b132b', '#1c2541']
} as const;

export type GradientKey = keyof typeof GRADIENTS;
