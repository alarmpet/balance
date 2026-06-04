export type AnalyticsEventName =
  | 'feed_impression'
  | 'vote_submit'
  | 'choice_echo_open'
  | 'choice_echo_map_open'
  | 'comments_open_soon'
  | 'first_insight_unlock'
  | 'today_discovery_view'
  | 'today_discovery_map_open'
  | 'theme_draw_probability_open'
  | 'theme_draw_submit'
  | 'island_mode_change'
  | 'share_card_generate'
  | 'share_card_complete'
  | 'day_n_return';

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

class AnalyticsService {
  private sanitizePayload(payload?: AnalyticsPayload): AnalyticsPayload {
    if (!payload) return {};
    const sanitized: AnalyticsPayload = {};

    for (const [key, value] of Object.entries(payload)) {
      // Exclude potential PII keys
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('email') ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('nickname') ||
        lowerKey.includes('name') ||
        lowerKey.includes('phone')
      ) {
        continue;
      }
      sanitized[key] = value;
    }
    return sanitized;
  }

  public track(eventName: AnalyticsEventName, payload?: AnalyticsPayload): void {
    const sanitized = this.sanitizePayload(payload);
    console.log(`[Analytics] Tracked event: "${eventName}"`, sanitized);
  }
}

export const analyticsService = new AnalyticsService();
