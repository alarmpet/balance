import type {
  AIRefineResult,
  CategorySlug,
  OptionSide,
  Question,
  TablesInsert,
} from '../types/database.types';
import { supabase } from './questionService';

type SupabaseClient = NonNullable<typeof supabase>;

export interface QuestionDraftInput {
  title: string;
  optionAText: string;
  optionBText: string;
  categorySlug: CategorySlug;
}

export interface SimilarQuestionMatch {
  id: string;
  title: string;
  option_a_title: string;
  option_b_title: string;
  category_id: string | null;
  similarity: number;
}

export type DuplicateDecision =
  | {
      status: 'clear';
      highestSimilarity: number;
      matches: SimilarQuestionMatch[];
    }
  | {
      status: 'warning';
      highestSimilarity: number;
      matches: SimilarQuestionMatch[];
      message: string;
    }
  | {
      status: 'blocked';
      highestSimilarity: number;
      matches: SimilarQuestionMatch[];
      message: string;
    };

export interface RefineQuestionPipelineResult {
  refined: AIRefineResult;
  embedding: number[];
  duplicateDecision: DuplicateDecision;
}

export interface SubmitRefinedQuestionParams {
  userId?: string | null;
  refined: AIRefineResult;
  embedding: number[];
}

export const AI_REFINE_SYSTEM_PROMPT = `
You are the lead copywriter for Balance Island, a tropical mobile balance-game app.
Transform rough user ideas into vivid, concise Korean copy with a playful island-game tone.
Return only JSON matching the requested schema. Do not include markdown.
Each option must map to one or more personality traits so votes can accumulate weighted scores.
Use trait keys in English snake_case, and keep weights between 0.5 and 2.0.
`;

const BLOCK_DUPLICATE_THRESHOLD = 0.88;
const WARN_DUPLICATE_THRESHOLD = 0.78;

const fallbackImageByCategory: Record<CategorySlug, { a: string; b: string }> = {
  food: {
    a: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    b: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
  },
  life: {
    a: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94',
    b: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
  },
  romance: {
    a: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7',
    b: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2',
  },
  career: {
    a: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
    b: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
  },
  culture: {
    a: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66',
    b: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',
  },
};

const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Missing Supabase environment variables.');
  }

  return supabase;
};

const normalizeDraftText = (draft: QuestionDraftInput) =>
  [
    `category: ${draft.categorySlug}`,
    `title: ${draft.title.trim()}`,
    `option_a: ${draft.optionAText.trim()}`,
    `option_b: ${draft.optionBText.trim()}`,
  ].join('\n');

const normalizeRefinedForEmbedding = (refined: AIRefineResult) =>
  [
    refined.category_slug,
    refined.title,
    refined.description,
    refined.option_a_title,
    refined.option_a_description,
    refined.option_b_title,
    refined.option_b_description,
    refined.tags.join(', '),
  ].join('\n');

const toVectorLiteral = (embedding: number[]) => `[${embedding.join(',')}]`;

const ensureRefineResultShape = (value: AIRefineResult): AIRefineResult => {
  const traitMapping =
    value.trait_mapping && value.trait_mapping.length > 0 ? value.trait_mapping : value.traits;

  return {
    ...value,
    tags: value.tags.slice(0, 5),
    option_a_image_url:
      value.option_a_image_url || fallbackImageByCategory[value.category_slug].a,
    option_b_image_url:
      value.option_b_image_url || fallbackImageByCategory[value.category_slug].b,
    trait_mapping: traitMapping,
    traits: traitMapping,
  };
};

export const refineQuestionWithAI = async (draft: QuestionDraftInput): Promise<AIRefineResult> => {
  const client = getSupabaseClient();
  const { data, error } = await client.functions.invoke<AIRefineResult>('refine-question', {
    body: {
      systemPrompt: AI_REFINE_SYSTEM_PROMPT,
      draft,
    },
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('AI refine returned an empty response.');
  }

  return ensureRefineResultShape(data);
};

export const createQuestionEmbedding = async (
  text: string,
): Promise<number[]> => {
  const client = getSupabaseClient();
  const { data, error } = await client.functions.invoke<{ embedding: number[] }>('embed-question', {
    body: { text },
  });

  if (error) {
    throw error;
  }

  if (!data?.embedding?.length) {
    throw new Error('Embedding function returned an empty vector.');
  }

  return data.embedding;
};

export const checkDuplicateQuestion = async (
  embedding: number[],
): Promise<DuplicateDecision> => {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('match_questions_by_embedding', {
    query_embedding: toVectorLiteral(embedding),
    match_threshold: WARN_DUPLICATE_THRESHOLD,
    match_count: 5,
  });

  if (error) {
    throw error;
  }

  const matches = (data ?? []) as SimilarQuestionMatch[];
  const highestSimilarity = matches.reduce(
    (highest, match) => Math.max(highest, Number(match.similarity)),
    0,
  );

  if (highestSimilarity >= BLOCK_DUPLICATE_THRESHOLD) {
    return {
      status: 'blocked',
      highestSimilarity,
      matches,
      message: '이미 존재하는 유사 질문입니다.',
    };
  }

  if (highestSimilarity >= WARN_DUPLICATE_THRESHOLD) {
    return {
      status: 'warning',
      highestSimilarity,
      matches,
      message: '비슷한 질문이 있어요. 그래도 등록할까요?',
    };
  }

  return {
    status: 'clear',
    highestSimilarity,
    matches,
  };
};

export const runAIQuestionPipeline = async (
  draft: QuestionDraftInput,
): Promise<RefineQuestionPipelineResult> => {
  const refined = await refineQuestionWithAI(draft);
  const embedding = await createQuestionEmbedding(normalizeRefinedForEmbedding(refined));
  const duplicateDecision = await checkDuplicateQuestion(embedding);

  return {
    refined,
    embedding,
    duplicateDecision,
  };
};

export const submitRefinedQuestion = async ({
  userId,
  refined,
  embedding,
}: SubmitRefinedQuestionParams): Promise<Question> => {
  const client = getSupabaseClient();
  const category = await fetchCategoryBySlug(client, refined.category_slug);

  const questionPayload: TablesInsert<'questions'> = {
    creator_id: userId ?? null,
    title: refined.title,
    description: refined.description,
    category_id: category.id,
    tags: refined.tags,
    option_a_title: refined.option_a_title,
    option_a_description: refined.option_a_description,
    option_a_image_url:
      refined.option_a_image_url ?? fallbackImageByCategory[refined.category_slug].a,
    option_b_title: refined.option_b_title,
    option_b_description: refined.option_b_description,
    option_b_image_url:
      refined.option_b_image_url ?? fallbackImageByCategory[refined.category_slug].b,
    status: 'pending',
    visibility: 'public',
    is_official: false,
    is_anonymous: !userId,
    embedding: toVectorLiteral(embedding),
  };

  const { data: question, error: questionError } = await client
    .from('questions')
    .insert(questionPayload)
    .select('*')
    .single();

  if (questionError) {
    throw questionError;
  }

  const traitRows: TablesInsert<'question_traits'>[] = refined.trait_mapping.map((trait) => ({
    question_id: question.id,
    option_side: trait.option_side as OptionSide,
    trait_key: trait.trait_key,
    weight: trait.weight,
  }));

  const { error: traitError } = await client.from('question_traits').insert(traitRows);

  if (traitError) {
    await client.from('questions').delete().eq('id', question.id);
    throw traitError;
  }

  return question;
};

const fetchCategoryBySlug = async (client: SupabaseClient, slug: CategorySlug) => {
  const { data, error } = await client
    .from('categories')
    .select('id, slug')
    .eq('slug', slug)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const makeDraftEmbeddingText = normalizeDraftText;
