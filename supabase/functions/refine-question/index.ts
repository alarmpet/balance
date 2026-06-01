import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type CategorySlug = 'food' | 'life' | 'romance' | 'career' | 'culture';
type OptionSide = 'A' | 'B';

interface QuestionDraftInput {
  title: string;
  optionAText: string;
  optionBText: string;
  categorySlug: CategorySlug;
}

interface RefineRequestBody {
  systemPrompt?: string;
  draft: QuestionDraftInput;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const model = Deno.env.get('OPENAI_REFINE_MODEL') ?? 'gpt-4.1-mini';

    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not configured.');
    }

    const body = (await request.json()) as RefineRequestBody;

    if (!body.draft?.title || !body.draft?.optionAText || !body.draft?.optionBText) {
      return jsonResponse({ error: 'Missing draft fields.' }, 400);
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
            content: body.systemPrompt ?? defaultSystemPrompt,
          },
          {
            role: 'user',
            content: buildUserPrompt(body.draft),
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
      return jsonResponse({ error: errorText }, response.status);
    }

    const payload = await response.json();
    const outputText = payload.output_text ?? payload.output?.[0]?.content?.[0]?.text;

    if (!outputText) {
      throw new Error('OpenAI response did not contain output_text.');
    }

    const parsed = JSON.parse(outputText);
    const normalized = {
      ...parsed,
      traits: parsed.traits?.length ? parsed.traits : parsed.trait_mapping,
      trait_mapping: parsed.trait_mapping?.length ? parsed.trait_mapping : parsed.traits,
    };

    return jsonResponse(normalized, 200);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
