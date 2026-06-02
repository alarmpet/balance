import type { SupabaseClient } from '@supabase/supabase-js';
import { guestInsightCards, guestInsightGraph } from '../data/guestInsightGraph';
import { supabase } from '../lib/supabaseClient';
import type {
  InsightGraphEdge,
  InsightGraphEdgeKind,
  InsightGraphNode,
  InsightGraphNodeKind,
  InsightGraphSnapshot,
  Json,
  UserInsightCardRow
} from '../types/database.types';

const rpcClient = supabase as SupabaseClient | null;

export async function fetchInsightGraph(focusNodeId: string | null = null, depth = 1): Promise<InsightGraphSnapshot> {
  if (!supabase) {
    return guestInsightGraph;
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return guestInsightGraph;
  }

  const { data, error } = await rpcClient!.rpc('get_personality_insight_graph', {
    p_focus_node_id: focusNodeId,
    p_depth: depth
  });

  if (error) throw error;
  return normalizeInsightGraph(data);
}

export async function fetchInsightCards(): Promise<UserInsightCardRow[]> {
  if (!supabase) {
    return guestInsightCards;
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return guestInsightCards;
  }

  const { data, error } = await rpcClient!.rpc('refresh_user_insight_cards', {});
  if (error) throw error;
  return Array.isArray(data) ? (data as UserInsightCardRow[]) : [];
}

export async function markInsightRead(insightId: string): Promise<UserInsightCardRow> {
  if (!supabase || insightId.startsWith('guest-')) {
    const card = guestInsightCards.find((item) => item.id === insightId) ?? guestInsightCards[0];
    return { ...card, is_read: true };
  }

  const { data, error } = await rpcClient!.rpc('mark_insight_card_read', {
    p_insight_id: insightId
  });

  if (error) throw error;
  return data as UserInsightCardRow;
}

function normalizeInsightGraph(value: Json): InsightGraphSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return guestInsightGraph;
  }

  const record = value as Record<string, Json | undefined>;
  const nodes = Array.isArray(record.nodes) ? record.nodes.map(normalizeNode).filter(Boolean) : [];
  const edges = Array.isArray(record.edges) ? record.edges.map(normalizeEdge).filter(Boolean) : [];
  const summary = normalizeSummary(record.summary);
  const meta = normalizeMeta(record.meta);

  return {
    nodes: nodes as InsightGraphNode[],
    edges: edges as InsightGraphEdge[],
    summary,
    meta
  };
}

function normalizeNode(value: Json): InsightGraphNode | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, Json | undefined>;
  if (!record.id || !record.kind || !record.label) return null;

  return {
    id: String(record.id),
    kind: normalizeNodeKind(String(record.kind)),
    label: String(record.label),
    size: toNumber(record.size, 20),
    color: record.color ? String(record.color) : '#0ea5e9',
    score: toNumber(record.score, 0),
    meta: normalizeMetaRecord(record.meta)
  };
}

function normalizeEdge(value: Json): InsightGraphEdge | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, Json | undefined>;
  if (!record.id || !record.source || !record.target || !record.kind) return null;

  return {
    id: String(record.id),
    source: String(record.source),
    target: String(record.target),
    kind: normalizeEdgeKind(String(record.kind)),
    weight: toNumber(record.weight, 0.5),
    label: record.label ? String(record.label) : null
  };
}

function normalizeSummary(value: Json | undefined): InsightGraphSnapshot['summary'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return guestInsightGraph.summary;
  }

  const record = value as Record<string, Json | undefined>;
  return {
    title: record.title ? String(record.title) : guestInsightGraph.summary.title,
    body: record.body ? String(record.body) : guestInsightGraph.summary.body,
    completion: toNumber(record.completion, 0)
  };
}

function normalizeMeta(value: Json | undefined): InsightGraphSnapshot['meta'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return guestInsightGraph.meta;
  }

  const record = value as Record<string, Json | undefined>;
  return {
    focus_node_id: record.focus_node_id ? String(record.focus_node_id) : null,
    depth: toNumber(record.depth, 1),
    node_limit: toNumber(record.node_limit, 40),
    window_days: toNumber(record.window_days, 30)
  };
}

function normalizeMetaRecord(value: Json | undefined): Record<string, Json | undefined> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, Json | undefined>;
}

function normalizeNodeKind(value: string): InsightGraphNodeKind {
  return ['pet', 'trait', 'category', 'question', 'choice', 'theme', 'insight'].includes(value)
    ? (value as InsightGraphNodeKind)
    : 'insight';
}

function normalizeEdgeKind(value: string): InsightGraphEdgeKind {
  return [
    'trait_score',
    'category_affinity',
    'question_evidence',
    'choice_to_trait',
    'pet_affinity',
    'theme_match',
    'balance',
    'recent_change'
  ].includes(value)
    ? (value as InsightGraphEdgeKind)
    : 'trait_score';
}

function toNumber(value: Json | undefined, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}
