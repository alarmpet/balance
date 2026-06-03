export const FORBIDDEN_WORDS = [
  'MBTI',
  'mbti',
  '진단',
  '심리검사',
  '정확한 성격',
  'MBTI 대체',
  '당신은 X형입니다'
];

export function hasForbiddenWords(text: string): boolean {
  return FORBIDDEN_WORDS.some((word) => text.includes(word));
}

export const PRODUCT_COPY = {
  feed: {
    kicker: '밸런스 아일랜드',
    heading: '오늘의 밸런스',
    loading: '밸런스 카드를 준비하고 있어요.',
    empty: '표시할 질문이 없습니다.',
    voteCount: (count: number) => `${count.toLocaleString('ko-KR')}명 참여`
  },
  island: {
    kicker: '밸런스 아일랜드',
    heading: '나의 성향 섬',
    level: (level: number) => `섬 Lv.${level}`,
    participationSummary: (count: number) => `지금까지 ${count}개의 선택이 이 섬의 성격을 만들었어요.`,
    todayProgress: (count: number) => `${count}/10 완료`,
    petLabel: '성향 펫',
    petEmpty: '질문을 더 풀면 내 선택 패턴과 닮은 펫이 자동으로 배정됩니다.',
    claimDailyTheme: '오늘의 무료 테마',
    drawTheme: '테마 뽑기',
    viewProbability: '확률 보기',
    todayDiscoveryTitle: '오늘의 발견',
    todayDiscoveryEmpty: '몇 개의 선택이 쌓이면 오늘의 발견이 열려요.'
  },
  insightMap: {
    title: '성향 인사이트 맵',
    kicker: '나의 선택 지도',
    summaryEmpty: '질문을 풀면 오늘의 발견 카드가 생겨요.',
    graphLoading: '성향 가지를 배치하는 중입니다.',
    description: (participation: number, traitCount: number) =>
      `${participation}개의 선택이 ${traitCount}개의 성향 가지로 연결되고 있어요.`
  },
  tone: {
    nonDiagnosticNotice: '이건 성격 진단이 아니라 선택 패턴을 가볍게 해석한 결과예요.',
    choiceEchoFallback: '몇 번 더 고르면 섬에서 더 선명한 흐름으로 보여줄게요.',
    petReaction: (petName: string, traitName: string) =>
      `${petName}이(가) 주인님의 ${traitName} 선택에 반응했어요!`,
    islandBranchUnlocked: '내 섬에 새로운 취향 가지가 생겼어요.',
    petMemory: '펫이 방금 선택을 기억했어요.'
  }
};
