import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

interface EmbedRequestBody {
  text: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const model = Deno.env.get('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small';

    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not configured.');
    }

    const body = (await request.json()) as EmbedRequestBody;

    if (!body.text?.trim()) {
      return jsonResponse({ error: 'Missing text.' }, 400);
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: body.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return jsonResponse({ error: errorText }, response.status);
    }

    const payload = await response.json();
    const embedding = payload.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error('OpenAI embedding response was empty.');
    }

    return jsonResponse({ embedding }, 200);
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
