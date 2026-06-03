import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CategorySlug = 'food' | 'life' | 'romance' | 'career' | 'culture';
type OptionSide = 'A' | 'B';

interface RefinedTrait {
  option_side: OptionSide;
  trait_key: string;
  weight: number;
}

interface RefinedQuestionPayload {
  title: string;
  description: string;
  tags: string[];
  option_a_title: string;
  option_a_description: string;
  option_a_image_url: string;
  option_b_title: string;
  option_b_description: string;
  option_b_image_url: string;
  category_slug: CategorySlug;
  trait_mapping: RefinedTrait[];
  traits: RefinedTrait[];
}

interface QuestionDraftInput {
  title: string;
  optionAText: string;
  optionBText: string;
  categorySlug: CategorySlug;
}

interface RefineRequestBody {
  draft: QuestionDraftInput;
}

const CATEGORY_SLUGS = ['food', 'life', 'romance', 'career', 'culture'] as const;
const MAX_BODY_BYTES = 16_384;
const MAX_TITLE_LENGTH = 160;
const MAX_OPTION_LENGTH = 240;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const allowedOrigins = new Set([
  'https://balance-vert.vercel.app',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
]);

const getCorsHeaders = (request: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(request),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

const jsonSchema = {
  name: 'balance_island_ai_refine_result',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
      option_a_title: { type: 'string' },
      option_a_description: { type: 'string' },
      option_a_image_url: { type: 'string' },
      option_b_title: { type: 'string' },
      option_b_description: { type: 'string' },
      option_b_image_url: { type: 'string' },
      category_slug: { type: 'string', enum: ['food', 'life', 'romance', 'career', 'culture'] },
      trait_mapping: {
        type: 'array',
        minItems: 2,
        maxItems: 6,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            option_side: { type: 'string', enum: ['A', 'B'] },
            trait_key: { type: 'string' },
            weight: { type: 'number', minimum: 0.5, maximum: 2.0 },
          },
          required: ['option_side', 'trait_key', 'weight'],
        },
      },
      traits: {
        type: 'array',
        minItems: 2,
        maxItems: 6,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            option_side: { type: 'string', enum: ['A', 'B'] },
            trait_key: { type: 'string' },
            weight: { type: 'number', minimum: 0.5, maximum: 2.0 },
          },
          required: ['option_side', 'trait_key', 'weight'],
        },
      },
    },
    required: [
      'title',
      'description',
      'tags',
      'option_a_title',
      'option_a_description',
      'option_a_image_url',
      'option_b_title',
      'option_b_description',
      'option_b_image_url',
      'category_slug',
      'trait_mapping',
      'traits',
    ],
  },
};

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

const defaultSystemPrompt = `
You are the lead copywriter for Balance Island, a tropical mobile balance-game app.
Rewrite rough Korean user input into polished Korean copy with playful island-game energy.
Keep it concise, vivid, and easy to vote on.
Return only JSON matching the schema.
`;

const buildUserPrompt = (draft: QuestionDraftInput) => {
  const fallback = fallbackImageByCategory[draft.categorySlug];

  return `
Category: ${draft.categorySlug}
Rough title: ${draft.title}
Rough option A: ${draft.optionAText}
Rough option B: ${draft.optionBText}

Rules:
- Keep the core meaning, but make it more tempting and game-like.
- Korean copy only for visible fields.
- title: one clear balance-game question.
- description: one sentence that makes the choice feel playful.
- option titles: short and punchy.
- option descriptions: explain the emotional tradeoff.
- tags: 2-5 Korean tags without '#'.
- category_slug must stay "${draft.categorySlug}" unless the draft clearly belongs elsewhere.
- option_a_image_url should be "${fallback.a}" unless a better public URL is obvious.
- option_b_image_url should be "${fallback.b}" unless a better public URL is obvious.
- trait_mapping and traits must contain the same objects.
- Include at least one trait for option A and at least one trait for option B.
- Trait keys must be English snake_case.
- Weight range is 0.5 to 2.0.
`;
};

serve(async (request) => {
  const responseHeaders = getCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, responseHeaders);
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Request body is too large.' }, 413, responseHeaders);
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized: Missing or invalid token' }, 401, responseHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration is missing for refine-question.');
      return jsonResponse({ error: 'Server configuration error.' }, 500, responseHeaders);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized: Invalid token' }, 401, responseHeaders);
    }

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return jsonResponse(
        { error: 'Rate limit exceeded.' },
        429,
        responseHeaders,
        { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) },
      );
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const model = Deno.env.get('OPENAI_REFINE_MODEL') ?? 'gpt-4.1-mini';

    if (!openAiKey) {
      console.error('OPENAI_API_KEY is not configured for refine-question.');
      return jsonResponse({ error: 'Server configuration error.' }, 500, responseHeaders);
    }

    const body = await parseJsonBody<RefineRequestBody>(request);
    if (!body) {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400, responseHeaders);
    }

    const draft = sanitizeDraft(body.draft);
    if ('error' in draft) {
      return jsonResponse({ error: draft.error }, 400, responseHeaders);
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: defaultSystemPrompt,
          },
          {
            role: 'user',
            content: buildUserPrompt(draft),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            ...jsonSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI refine request failed.', response.status, errorText.slice(0, 500));
      return jsonResponse(
        { error: 'AI service request failed.' },
        response.status === 429 ? 429 : 502,
        responseHeaders,
      );
    }

    const payload = await response.json();
    const outputText = payload.output_text ?? payload.output?.[0]?.content?.[0]?.text;

    if (!outputText) {
      throw new Error('OpenAI response did not contain output_text.');
    }

    const parsed = parseJsonString(outputText);
    const normalized = parsed ? normalizeRefinedPayload(parsed) : null;
    if (!normalized) {
      console.error('OpenAI refine response did not match expected schema.');
      return jsonResponse({ error: 'AI service returned an invalid response.' }, 502, responseHeaders);
    }

    return jsonResponse(normalized, 200, responseHeaders);
  } catch (error) {
    console.error('refine-question failed.', error);
    return jsonResponse({ error: 'Internal server error.' }, 500, responseHeaders);
  }
});

const parseJsonBody = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

const sanitizeDraft = (
  draft: QuestionDraftInput | undefined,
): QuestionDraftInput | { error: string } => {
  if (!draft) {
    return { error: 'Missing draft fields.' };
  }

  const title = typeof draft.title === 'string' ? draft.title.trim() : '';
  const optionAText = typeof draft.optionAText === 'string' ? draft.optionAText.trim() : '';
  const optionBText = typeof draft.optionBText === 'string' ? draft.optionBText.trim() : '';
  const categorySlug = draft.categorySlug;

  if (!title || !optionAText || !optionBText) {
    return { error: 'Missing draft fields.' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: 'Title is too long.' };
  }
  if (optionAText.length > MAX_OPTION_LENGTH || optionBText.length > MAX_OPTION_LENGTH) {
    return { error: 'Option text is too long.' };
  }
  if (!CATEGORY_SLUGS.includes(categorySlug)) {
    return { error: 'Invalid category.' };
  }

  return { title, optionAText, optionBText, categorySlug };
};

const parseJsonString = (value: string): unknown | null => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const normalizeRefinedPayload = (payload: unknown): RefinedQuestionPayload | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const traits = isTraitArray(payload.traits) && payload.traits.length
    ? payload.traits
    : isTraitArray(payload.trait_mapping)
      ? payload.trait_mapping
      : null;
  const traitMapping = isTraitArray(payload.trait_mapping) && payload.trait_mapping.length
    ? payload.trait_mapping
    : traits;

  if (!traits || !traitMapping || traits.length < 2 || traitMapping.length < 2) {
    return null;
  }
  if (!isStringArray(payload.tags) || payload.tags.length < 2 || payload.tags.length > 5) {
    return null;
  }
  if (!isCategorySlug(payload.category_slug)) {
    return null;
  }

  const title = getRequiredString(payload.title);
  const description = getRequiredString(payload.description);
  const optionATitle = getRequiredString(payload.option_a_title);
  const optionADescription = getRequiredString(payload.option_a_description);
  const optionAImageUrl = getRequiredString(payload.option_a_image_url);
  const optionBTitle = getRequiredString(payload.option_b_title);
  const optionBDescription = getRequiredString(payload.option_b_description);
  const optionBImageUrl = getRequiredString(payload.option_b_image_url);

  if (
    !title ||
    !description ||
    !optionATitle ||
    !optionADescription ||
    !optionAImageUrl ||
    !optionBTitle ||
    !optionBDescription ||
    !optionBImageUrl
  ) {
    return null;
  }

  return {
    title,
    description,
    tags: payload.tags,
    option_a_title: optionATitle,
    option_a_description: optionADescription,
    option_a_image_url: optionAImageUrl,
    option_b_title: optionBTitle,
    option_b_description: optionBDescription,
    option_b_image_url: optionBImageUrl,
    category_slug: payload.category_slug,
    trait_mapping: traitMapping,
    traits,
  };
};

const getRequiredString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0);

const isCategorySlug = (value: unknown): value is CategorySlug =>
  typeof value === 'string' && CATEGORY_SLUGS.includes(value as CategorySlug);

const isTraitArray = (value: unknown): value is RefinedTrait[] =>
  Array.isArray(value) &&
  value.length >= 2 &&
  value.length <= 6 &&
  value.every(
    (item) =>
      isRecord(item) &&
      (item.option_side === 'A' || item.option_side === 'B') &&
      typeof item.trait_key === 'string' &&
      item.trait_key.trim().length > 0 &&
      typeof item.weight === 'number' &&
      item.weight >= 0.5 &&
      item.weight <= 2,
  );

const checkRateLimit = (userId: string) => {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(userId);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    pruneRateLimitBuckets(now);
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
};

const pruneRateLimitBuckets = (now: number) => {
  if (rateLimitBuckets.size < 1_000) {
    return;
  }

  for (const [userId, bucket] of rateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(userId);
    }
  }
};

const getAllowedOrigin = (request: Request) => {
  const origin = request.headers.get('Origin');
  if (origin && allowedOrigins.has(origin)) {
    return origin;
  }

  return 'https://balance-vert.vercel.app';
};

const jsonResponse = (
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...headers,
      'Content-Type': 'application/json',
    },
  });
