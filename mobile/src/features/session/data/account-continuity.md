# Account continuity

P0 upgrades the currently authenticated anonymous user in place. Email and phone
identities use `updateUser`; OAuth identities use `linkIdentity`. Both operations
must return the same `auth.uid()`. The client rejects a changed user ID and never
rewrites application foreign keys. Production must enable manual identity linking
and retain Supabase Auth's per-IP anonymous-user rate limit.

Production CAPTCHA is explicitly deferred: this repository has no site key, widget,
or token-provider adapter, so it must not be described as enabled. When
`EXPO_PUBLIC_AUTH_CAPTCHA_REQUIRED=true`, a new anonymous signup fails closed unless
the app injects a valid token provider. Cached anonymous and permanent sessions are
checked and reused before CAPTCHA because no signup occurs. Enabling production
CAPTCHA requires provisioning the provider/site key, implementing and testing the
widget adapter, and configuring the matching Supabase Auth CAPTCHA secret.

Pending-action ownership migration is intentionally conservative. New actions store
their exact `ownerId` and offline actions also retain `localGuestId`. Legacy records
without an owner are readable for diagnosis but are never auto-bound, sent, or
deleted. They remain quarantined with an explicit conflict message until a future
user-confirmed migration flow can prove ownership. Records owned by another UID are
handled the same way; only an exact-owner partition is eligible for replay.

Signing into an already-existing permanent account is a P1 merge, not an upgrade.
It requires an explicit confirmation and a server-side transaction with these
conflict rules:

- `profiles`: retain the permanent account row; fill only missing display fields.
- `votes`: keep at most one vote per question, preferring the permanent account's
  vote; never change a `client_action_id` or count both sides.
- `user_value_scores`: recompute from the retained votes; never add aggregate rows.
- `questions`: transfer anonymous authorship unless the target account is blocked
  by a participant; keep question IDs and lifecycle stages unchanged.
- `question_skips`, `question_exposures`, `reason_reactions`, and `reports`: union by
  each table's natural uniqueness key; prefer the permanent row on conflict.
- `blocks`: union both directions without removing an existing block.
- `push_tokens`: keep only tokens proven to belong to the current device; preserve
  the permanent account's notification preferences.
- `analytics_events` and `report_attempts`: retain immutable history under the
  original actor ID; do not rewrite it as merged behavior.

The merge must write an audit record and either commit every table or roll back all
of them. P0 never calls ordinary sign-in while an anonymous user owns local data.
