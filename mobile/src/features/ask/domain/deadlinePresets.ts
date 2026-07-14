export const DEADLINE_PRESETS = [
  { id: 'none', label: '마감 없음', durationMs: null },
  { id: '24h', label: '24시간', durationMs: 24 * 60 * 60 * 1000 },
  { id: '3d', label: '3일', durationMs: 3 * 24 * 60 * 60 * 1000 },
  { id: '7d', label: '7일', durationMs: 7 * 24 * 60 * 60 * 1000 },
] as const;

export type DeadlinePresetId = (typeof DEADLINE_PRESETS)[number]['id'];

export function deadlineToIso(presetId: DeadlinePresetId, now = Date.now()): string | null {
  const preset = DEADLINE_PRESETS.find(({ id }) => id === presetId);
  if (!preset || preset.durationMs === null) return null;
  return new Date(now + preset.durationMs).toISOString();
}

