import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface EmbedRequestBody {
  text: string;
}

interface RpcClient {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string } | null }>;
}

const MAX_BODY_BYTES = 16_384;
const MAX_EMBED_TEXT_LENGTH = 4_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_WINDOW_SECONDS = RATE_LIMIT_WINDOW_MS / 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
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
      console.error('Supabase configuration is missing for embed-question.');
      return jsonResponse({ error: 'Server configuration error.' }, 500, responseHeaders);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized: Invalid token' }, 401, responseHeaders);
    }

    const durableRateLimit = await checkDurableRateLimit(
      supabase,
      'embed-question',
      RATE_LIMIT_WINDOW_SECONDS,
      RATE_LIMIT_MAX_REQUESTS,
    );
    if (durableRateLimit.error) {
      console.error('Durable rate limit check failed for embed-question.', durableRateLimit.error);
      return jsonResponse({ error: 'Rate limit temporarily unavailable.' }, 503, responseHeaders);
    }
    if (!durableRateLimit.allowed) {
      return jsonResponse(
        { error: 'Rate limit exceeded.' },
        429,
        responseHeaders,
        { 'Retry-After': String(durableRateLimit.retryAfterSeconds) },
      );
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
    const model = Deno.env.get('OPENAI_EMBEDDING_MODEL') ?? 'text-embedding-3-small';

    if (!openAiKey) {
      console.error('OPENAI_API_KEY is not configured for embed-question.');
      return jsonResponse({ error: 'Server configuration error.' }, 500, responseHeaders);
    }

    const body = await parseJsonBody<EmbedRequestBody>(request);
    if (!body) {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400, responseHeaders);
    }

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return jsonResponse({ error: 'Missing text.' }, 400, responseHeaders);
    }
    if (text.length > MAX_EMBED_TEXT_LENGTH) {
      return jsonResponse({ error: 'Text is too long.' }, 400, responseHeaders);
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI embedding request failed.', response.status, errorText.slice(0, 500));
      return jsonResponse(
        { error: 'AI service request failed.' },
        response.status === 429 ? 429 : 502,
        responseHeaders,
      );
    }

    const payload = await response.json();
    const embedding = payload.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error('OpenAI embedding response was empty.');
    }

    return jsonResponse({ embedding }, 200, responseHeaders);
  } catch (error) {
    console.error('embed-question failed.', error);
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

const checkDurableRateLimit = async (
  supabase: RpcClient,
  functionName: 'embed-question',
  windowSeconds: number,
  maxRequests: number,
) => {
  const { data, error } = await supabase.rpc('check_ai_rate_limit', {
    p_function_name: functionName,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });

  if (error) {
    return { allowed: false, retryAfterSeconds: 0, error: error.message ?? 'Unknown RPC error' };
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!isRecord(result)) {
    return { allowed: false, retryAfterSeconds: 0, error: 'Unexpected RPC response shape' };
  }

  return {
    allowed: result.allowed === true,
    retryAfterSeconds: Math.max(1, Number(result.retry_after_seconds ?? 1)),
    error: null,
  };
};

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
