import type { FeedQuestion, OptionSide } from '../services/questionService';
import { getCategoryBySlug } from '../constants/categories';

export type RarityTier = 'pioneer' | 'unicorn' | 'minority' | 'even' | 'majority';

export type ChoiceEchoResult = {
  text: string;
  categoryName: string;
  categoryColor: string;
  optionTitle: string;
  // 희귀도(바이럴 훅): 같은 선택을 한 사람의 비율. 표본이 적으면 percent는 null.
  rarityPercent: number | null;
  rarityTier: RarityTier;
  rarityHeadline: string;
  rarityFlavor: string;
  // 펫 말풍선 반응(가벼운 교감). 진단형/처벌형 표현은 사용하지 않는다.
  petLine: string;
};

// 표본이 이보다 적으면 비율이 왜곡되므로 '개척자' 프레이밍으로 전환한다.
const MIN_SAMPLE_FOR_RARITY = 10;

function resolveRarity(
  question: FeedQuestion,
  side: OptionSide
): Pick<ChoiceEchoResult, 'rarityPercent' | 'rarityTier' | 'rarityHeadline' | 'rarityFlavor'> {
  // 사용자가 방금 던진 표를 포함해서 계산한다(낙관적 반영).
  const chosen = (side === 'A' ? question.vote_count_a : question.vote_count_b) + 1;
  const total = question.vote_count_a + question.vote_count_b + 1;

  if (total < MIN_SAMPLE_FOR_RARITY) {
    const others = total - 1;
    return {
      rarityPercent: null,
      rarityTier: 'pioneer',
      rarityHeadline: others <= 0 ? '첫 번째 선택' : `아직 ${others}명만 답한 질문`,
      rarityFlavor: '당신은 이 질문의 개척자예요 🧭'
    };
  }

  const percent = Math.round((chosen / total) * 100);

  let tier: RarityTier;
  let flavor: string;
  if (percent <= 15) {
    tier = 'unicorn';
    flavor = '아주 희귀한 선택이에요 🦄';
  } else if (percent <= 35) {
    tier = 'minority';
    flavor = '소수파의 취향이네요 ✨';
  } else if (percent <= 65) {
    tier = 'even';
    flavor = '의견이 팽팽하게 갈렸어요 ⚖️';
  } else {
    tier = 'majority';
    flavor = '많은 사람과 통하는 선택이에요 🤝';
  }

  return {
    rarityPercent: percent,
    rarityTier: tier,
    rarityHeadline: `같은 선택을 한 사람 ${percent}%`,
    rarityFlavor: flavor
  };
}

function resolvePetLine(categorySlug: string, tier: RarityTier, optionTitle: string): string {
  if (tier === 'pioneer') {
    return '오~ 아무도 안 간 길을 먼저 가네! 두근거려 🐾';
  }
  if (tier === 'unicorn') {
    return `'${optionTitle}'? 너 진짜 특별한 취향이다! 나 신났어 🐾`;
  }
  if (tier === 'minority') {
    return '소신 있는 선택, 나는 그런 네가 좋더라 🐾';
  }

  const byCategory: Record<string, string> = {
    food: '오늘 입맛 취향이 한 스푼 더 쌓였어! 🐾',
    life: '우리 섬 리듬이 조금 더 또렷해지는 기분이야 🐾',
    romance: '마음의 결이 살짝 보였어. 흥미로운걸? 🐾',
    career: '일에서의 너다운 방식이 그려지고 있어 🐾',
    culture: '취향의 색깔이 한 칸 더 칠해졌어 🐾'
  };
  return byCategory[categorySlug] ?? '방금 선택, 네 지도에 잘 담아뒀어 🐾';
}

export function generateChoiceEcho(question: FeedQuestion, side: OptionSide): ChoiceEchoResult {
  const categoryInfo = getCategoryBySlug(question.category?.slug);
  const optionTitle = side === 'A' ? question.option_a_title : question.option_b_title;

  const commentsByCategory: Record<string, string[]> = {
    food: [
      `방금 고르신 '${optionTitle}'은(는) 오늘의 입맛과 취향을 조금 더 반영하고 있어요.`,
      `푸드 질문에서 '${optionTitle}'을(를) 선택하셨네요. 나만의 미식 가지가 조금 더 자랐어요.`,
      `이 선택은 맛있는 위로를 얻는 방향에 가까워요.`
    ],
    life: [
      `방금 고르신 '${optionTitle}'은(는) 일상의 속도와 편안함에 대한 성향을 보여줍니다.`,
      `익숙한 편안함과 새로운 조화 사이에서 '${optionTitle}' 쪽으로 마음이 기우셨군요.`,
      `이 선택은 일상 속에서 나만의 리듬을 지키는 방향이에요.`
    ],
    romance: [
      `관계와 감정의 밸런스에서 '${optionTitle}'을(를) 고르셨네요. 섬의 감정 기류가 쌓이고 있어요.`,
      `서로 다른 가치가 부딪힐 때 '${optionTitle}' 쪽을 지지하시는군요.`,
      `마음이 기우는 방향에 따라 나를 더 깊이 이해하게 될 거예요.`
    ],
    career: [
      `성장과 배움의 일터에서 '${optionTitle}' 쪽을 설계하고 계시네요.`,
      `현실적인 선택과 모험 사이에서 '${optionTitle}'의 가치를 더 크게 평가하셨어요.`,
      `이 선택은 나만의 일하는 방식과 가치를 조금 더 채워 나갑니다.`
    ],
    culture: [
      `취향과 감성을 채우는 문화 밸런스에서 '${optionTitle}'을(를) 선택하셨군요.`,
      `섬의 예술적 감각이 '${optionTitle}' 방향으로 은은하게 퍼져갑니다.`,
      `나도 몰랐던 감각적인 기호들이 지도에 기록되고 있어요.`
    ]
  };

  const categorySlug = categoryInfo.slug;
  const list = commentsByCategory[categorySlug] || [
    `방금 선택하신 '${optionTitle}'은(는) 나만의 성향 패턴을 채워주는 소중한 조각입니다.`,
    `익숙함보다 내면이 이끄는 '${optionTitle}' 쪽의 흐름에 한 표를 더해주셨네요.`
  ];

  // Pick pseudo-randomly based on question id length and option side
  const index = (question.id.length + (side === 'A' ? 1 : 2)) % list.length;
  const mainComment = list[index];
  const footnote = '몇 번 더 고르면 섬에서 더 선명한 흐름으로 보여줄게요.';
  const text = `${mainComment}\n\n${footnote}`;

  const rarity = resolveRarity(question, side);
  const petLine = resolvePetLine(categorySlug, rarity.rarityTier, optionTitle);

  return {
    text,
    categoryName: categoryInfo.name,
    categoryColor: categoryInfo.color,
    optionTitle,
    ...rarity,
    petLine
  };
}
