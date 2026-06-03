import type { FeedQuestion, OptionSide } from '../services/questionService';
import { getCategoryBySlug } from '../constants/categories';

export type ChoiceEchoResult = {
  text: string;
  categoryName: string;
  categoryColor: string;
  optionTitle: string;
};

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

  return {
    text,
    categoryName: categoryInfo.name,
    categoryColor: categoryInfo.color,
    optionTitle
  };
}
