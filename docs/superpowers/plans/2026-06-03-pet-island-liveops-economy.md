# Pet + Island Collectible LiveOps Strategy Plan

> **For agentic workers:** This is a product/economy strategy plan, not an implementation checklist. If implementation starts, create a separate implementation plan using `superpowers:writing-plans`.

**Goal:** Maximize collection desire, personalization, and repeat return loops in Balance Island without turning early MVP into an untrusted or legally risky gacha economy.

**Recommendation:** Do not choose only pet or island. Make **limited pets the primary desire object** and make **island/theme customization the status stage** where users show, equip, and emotionally justify the collection.

**Current Codebase Fit:** Balance Island already has `pet_species`, `user_pet_state`, `theme_skins`, `theme_draw_pools`, `theme_draw_pool_items`, `user_theme_inventory`, `theme_draw_history`, `user_theme_pity`, and probability disclosure RPCs. That means the fastest path is to evolve the current theme draw system into a seasonal LiveOps layer while adding collectible pet variants in a controlled second wave.

**Identity Update:** The app should not primarily feel like “a gacha island game.” It should feel like **a playful balance-question app where your choices slowly reveal your unknown preferences, values, dislikes, and personality patterns, then turn them into an explorable island-map of yourself.**

---

## 1. External Research Takeaways

### LiveOps Is The Operating Model

Mobile F2P games are not “ship once” products. LiveOps is the recurring operating layer: weekly events, monthly drops, seasonal moments, and anniversary beats. MWM summarizes typical cadence as weekly events, monthly content drops, quarterly seasonal moments, and annual milestones, and frames LiveOps as the engine of mature F2P retention and monetization.

**Balance Island implication:** Build the economy around a 4-week season calendar, not around one permanent shop.

Source:
- https://mwm.ai/glossary/live-ops

### Pets Create Stronger Scarcity Desire Than Places

Adopt Me-style pet economies show that limited pets become valuable because they are emotionally nameable, cute, scarce, and easy to compare socially. Community discussion also shows the dark side: bots, scams, off-platform value speculation, and “hard to find” status can distort the economy.

**Balance Island implication:** Pets should be the aspirational headline object, but trading should not be opened in MVP. Scarcity should be visible, but resale markets should not be encouraged.

Sources:
- https://games.gg/adopt-me/guides/adopt-me-beginners-guide/
- https://www.reddit.com/r/AdoptMeRBX/comments/1s4kwid/adopt_me_economy/

### Islands/Themes Are Better As Personal Showrooms

Animal Crossing: Pocket Camp shows that cozy customization can monetize through furniture, themes, and premium currency while staying close to the fantasy of self-expression. The strongest lesson is not “sell furniture”; it is that players need a place where collected items become identity.

**Balance Island implication:** A rare pet without a beautiful island stage is underused. A rare island without a living companion is less emotionally sticky.

Source:
- https://www.pocketgamer.biz/how-does-animal-crossing-pocket-camp-monetise/

### Pity, Carryover, And Rate-Up Are Expected Vocabulary

Gacha users understand hard pity, rate-up guarantee, and banner-specific counters. Open-source gacha simulators and public guides commonly model guaranteed high-rarity drops after a pull threshold and carryover counters between related limited banners.

**Balance Island implication:** Use transparent pity from day one. Do not rely on “mystery luck.” Desire survives transparency better than trust damage.

Sources:
- https://github.com/resyfer/genshin-wish-simulator
- https://gist.github.com/RandomThi/15a492fde82233c4b247d9f3a5089abf

### Probability Disclosure Is Not Optional

Apple requires apps with paid randomized virtual items to disclose odds before purchase. Roblox creator docs go further: odds should be displayed as percentages, sum to 100%, and dynamic odds must update when one-off outcomes or probability modifiers change. Korea also legally requires probability information disclosure for probability-based items.

**Balance Island implication:** Every paid or premium-currency random draw needs an in-app probability screen, versioned probability snapshots, and copy that users can understand before they spend.

Sources:
- https://developer.apple.com/app-store/review/guidelines/
- https://github.com/Roblox/creator-docs/blob/main/content/en-us/production/monetization/virtual-items.md
- https://pmc.ncbi.nlm.nih.gov/articles/PMC12583229/

### Obsidian Graph Gives The Island Its Mental Model

Obsidian Graph view represents notes as nodes and links as lines. Its useful product ideas are not the visual complexity itself, but filters, node size, link thickness, group colors, and Local Graph depth. Local Graph is especially important because it shows only what is connected to the active note, with depth controls.

**Balance Island implication:** The island should not show a giant unreadable graph by default. It should show a simple “나의 선택 지도” and let users tap one node, such as `연애`, `안정`, `혼자`, or `매운맛`, to see the surrounding local graph.

Sources:
- https://obsidian.md/help/Plugins/Graph%2Bview
- https://www.reddit.com/r/ObsidianMD/comments/1ij8hqd

### Obsidian Canvas Gives The Island Its Card Language

Obsidian Canvas uses cards, connections, colors, and groups to arrange ideas spatially. This is useful for Balance Island because individual votes are easier to understand as small evidence cards than as raw data rows.

**Balance Island implication:** A question result can become a card: “데이트는 즉흥 쪽 선택”, linked to `표현`, `흐름`, `연애`, and one AI insight sentence. The user should feel they are walking through evidence about themselves, not reading a diagnostic report.

Sources:
- https://obsidian.md/help/plugins/canvas
- https://obsidian.md/canvas

### Personal Informatics Explains Why This Is More Than MBTI

Personal informatics research describes systems that help people collect personal data, integrate it, reflect on it, and sometimes act on it. Reviews of the literature connect self-relevant data inspection to self-insight and behavior change, but also imply that raw data alone is not enough; users need interpretation and reflection.

**Balance Island implication:** The app should avoid “당신은 이런 사람입니다” as a final diagnosis. It should say “최근 선택에서 이런 흐름이 보여요” and show the evidence path from questions to traits to insight.

Sources:
- https://www.cs.cmu.edu/~jhm/Readings/2010-ianli-chi-stage-based-model.pdf
- https://www.tandfonline.com/doi/abs/10.1080/07370024.2016.1276456

### Mind Map Keeps The Experience Understandable

Mind maps are radial, hierarchical diagrams built around a central concept. They are easier for users to parse than a dense global graph because the center and branches give immediate orientation.

**Balance Island implication:** The default island map should be a radial mind map, not a full Obsidian vault graph. The captured reference image is useful as an aspirational “data constellation,” but the product should reveal that density gradually.

Sources:
- https://github.com/xyflow/react-flow-mindmap-app
- https://en.wikipedia.org/wiki/Mind_map

### Finch Shows Why A Pet Should React To The User

Finch's core pattern is not just “cute pet.” It connects the user's self-care actions to a virtual pet that gains energy, grows, and goes on adventures. Public app-store/review descriptions consistently frame Finch as habit/self-care plus virtual-pet companionship.

**Balance Island implication:** The pet should not be a static reward. It should visibly react to votes, streaks, comeback moments, and insight discoveries. Keep the reaction gentle: the pet misses the user, but never guilt-trips them.

Sources:
- https://apps.apple.com/us/app/finch-self-care-pet/id1528595748
- https://webisoft.com/articles/finch-self-care-app/

### Spotify Wrapped Shows Why Data Needs Story

Spotify Wrapped works because it turns activity logs into a personal, visual, shareable story. Research and media coverage also point out a caution: users enjoy personalized reflection, but data stories can feel inaccurate, exposing, or over-assertive if the platform overclaims identity.

**Balance Island implication:** Weekly/monthly recaps should be opt-in, story-card based, and phrased as “최근 선택에서 보이는 흐름,” not as a permanent identity label.

Sources:
- https://journals.sagepub.com/doi/10.1177/14614448251391301
- https://www.clarigital.com/codex/case-studies/spotify-data-marketing/
- https://www.axios.com/2024/12/05/spotify-wrapped-2024-ai

### Forced Choice Is Useful, But Not Magic

Balance-game questions resemble forced-choice preference elicitation. Forced-choice formats can reduce some rating-scale problems, but psychometric literature is mixed: forced-choice can create ipsative scores and does not automatically solve social desirability or measurement validity.

**Balance Island implication:** Use forced choices as playful preference signals, not as clinical measurement. The app can say “이런 선택 흐름이 보여요,” but should not imply a validated personality diagnosis.

Sources:
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10621689/
- https://journals.sagepub.com/doi/abs/10.1177/00131644231178721

---

## 2. Product Decision

### The Core Answer

If forced to choose one collectible axis, choose **pets**.

Reason:
- Pets are character-like, nameable, cute, and emotionally bonded.
- Limited pets are easier to market: “이번 시즌 한정 카멜레온” is clearer than “이번 시즌 한정 섬 배경.”
- Pets can evolve, react, sit on the profile, appear on the island, and become the user’s avatar proxy.

But the better product is **pets as self-avatar, islands as self-knowledge space**.

The island should answer: “What do my choices reveal about the world I want to live in?”

### Recommended Hierarchy

1. **Pet / Avatar:** the living symbol of “me.”
   - The pet is not just a collectible. It is the user's personality avatar.
   - It should react to choice patterns, mood, streaks, and repeated values.
   - Limited variants are still powerful, but they should feel like expressions of the user's discovered self.

2. **Insight Island:** the user's explorable self-map.
   - The island is not just a showroom. It is where choices become visible geography.
   - Trait clusters become zones.
   - Repeated values become landmarks.
   - Favorite/disliked patterns become paths, weather, or borders.

3. **Pet Variant:** primary chase item inside the collection economy.
   - Example: `카멜레온: 달빛 변이`, `비숑: 체리블라썸`, `아메숏: 오로라`.
   - Limited variants change appearance, idle effect, profile badge, and island behavior.

4. **Island Theme:** secondary chase and atmosphere layer.
   - Example: `별빛 왕국`, `네온 카페`, `핑크 라군`.
   - Themes modify background, ambience, effects, and the emotional reading of the user's self-map.

5. **Decor/Props:** long-tail collection filler.
   - Example: chairs, lamps, shells, signs, plants.
   - Use for common/rare rewards so duplicates do not feel worthless.

6. **Titles/Badges:** social proof.
   - Example: `시즌 1 개척자`, `달빛 카멜레온 오너`, `100문답 탐험가`.
   - Cheap to produce, high status value.

---

## 3. MVP Economy Shape

### Currency

Keep one soft currency early:
- `shells`: earned through voting, daily check-in, pet care, streaks.

Delay real-money IAP until the retention loop proves itself. The first monetization-like layer can be “premium currency ready” in schema, but not sold.

Reason:
- Current app still needs retention proof.
- Paid random items immediately trigger disclosure, platform, and Korea compliance work.
- Free/earned gacha lets the team tune desire without trust damage.

### Draw Types

#### Daily Free Theme Draw

Purpose:
- Habit loop.
- Low-stakes dopamine.
- Inventory growth.

Rules:
- 1 free draw per day.
- Mostly common decor/theme fragments.
- Small chance at rare/legendary theme.
- No paid currency.

#### Seasonal Pet Variant Banner

Purpose:
- Desire peak.
- Marketing hook.
- “I need this before it disappears.”

Rules:
- Uses earned shells at first.
- 4-week season.
- One featured limited pet variant.
- Hard pity: guaranteed featured variant by N pulls.
- Pity carries to the next pet variant banner of the same family.
- Duplicates become “aura shards” or evolution material, never dead trash.

#### Island Theme Banner

Purpose:
- Personalization and showroom expansion.

Rules:
- Lower emotional stakes than pet banner.
- Themes return more often than pets.
- Legendary island themes are rarer but less FOMO-heavy.
- Ten-draw guarantee: at least rare-or-better in the final slot.

---

## 4. Scarcity Policy

### Scarcity Tiers

1. **Permanent**
   - Always obtainable.
   - Good for onboarding and baseline fairness.

2. **Seasonal Returning**
   - Returns in rerun windows.
   - Best for island themes and decor.

3. **Limited Variant**
   - Only available during a season, but can rerun after 6-12 months.
   - Best for pet skins/variants.

4. **Founder / Achievement Limited**
   - Earned by behavior, not random purchase.
   - Example: early adopter badge, first 10,000 islanders, beta tester pet aura.

### Avoid “Never Again” Too Early

Permanent FOMO can create short-term obsession but damages trust and makes late users feel locked out. Use “season-limited, rerun possible” for most items. Reserve true one-time exclusivity for non-random prestige badges.

---

## 5. Personalization Loop

The strongest loop is:

1. User answers questions.
2. Traits update.
3. The app turns votes into visible evidence nodes.
4. Traits, categories, likes, dislikes, and repeated values become island-map clusters.
5. The pet reflects the user's current self-pattern.
6. The user receives or chases a pet/theme that feels “me-coded.”
7. The user equips it on island/profile.
8. Other users can see a simplified version of the island identity.
9. New questions and seasons add new branches to the self-map.

This makes the gacha feel like self-expression rather than pure gambling.

### Identity Loop

The app promise should be:

> “재미삼아 밸런스 게임을 하다 보면, 내가 좋아하는 것과 싫어하는 것, 반복해서 고르는 가치관, 나도 몰랐던 성향이 섬의 지도로 자라난다.”

This is closer to “playful self-discovery” than to MBTI. MBTI gives a type label. Balance Island should give a living evidence map.

### Choice Echo

Each vote should create a tiny reflection moment before the next question:

- Show the selected option.
- Show 1-2 trait/category effects in plain Korean.
- Show one pet reaction.
- Offer “섬 지도에서 보기” only when a meaningful new connection exists.

Example:

> “즉흥 여행을 골랐어요. 흐름과 모험 쪽 별이 조금 밝아졌고, 비숑이 신나서 해변 쪽으로 뛰어갔어요.”

Rules:

- Keep it under two seconds unless the user taps for detail.
- Do not interrupt fast voting every time; after the first few sessions, show Choice Echo only for strong, new, or surprising signals.
- Do not use clinical language.
- Never claim one choice proves a trait.

### Daily Dilemma Theme

Bundle daily questions around a lightweight theme:

- `혼자 vs 같이`
- `안정 vs 모험`
- `계획 vs 즉흥`
- `맛 vs 분위기`
- `표현 vs 차분`

Why:

- It makes the feed feel intentional.
- It gives the island map enough related data to show visible growth.
- It creates a natural weekly recap: “이번 주에는 흐름 쪽 선택이 자주 보였어요.”

### Pet As Interpreter

The pet should become the emotional narrator of self-discovery:

- Vote reaction: “오늘은 새로운 쪽에 마음이 갔네.”
- Comeback reaction: “돌아와서 기뻐. 오늘은 가볍게 하나만 골라볼까?”
- Insight reaction: “연애에서는 표현, 일에서는 차분. 이 조합 꽤 멋진데?”
- Diary reaction: one short optional daily note after enough choices.

Do not make the pet punish the user. Avoid “네가 안 와서 아팠어.” Use “기다리고 있었어” or “돌아와서 기뻐.”

### Existing Pet Asset Pipeline

The project already has a strong local pet asset base:

- Common assets: `C:\Users\petbl\Desktop\alarmpetgo_\svg`
- Rare assets: `C:\Users\petbl\Desktop\alarmpetgo_\rare`
- Legendary/mythic assets: `C:\Users\petbl\Desktop\alarmpetgo_\legend`

Current verified inventory:

- `svg`: 35 PNG pet images plus one empty text file.
- `rare`: 35 matching rare PNG pet images prefixed with `rare-`.
- `legend`: 18 PNG images, mostly mythic/cosmic creatures such as dragon, phoenix, unicorn, pegasus, kraken, mermaid, and cosmic warrior variants.

The current DB seed already points to these folders with `asset://alarmpetgo/svg/...` and `asset://alarmpetgo/rare/...` paths for:

- `american-shorthair`
- `bichon`
- `chameleon`

That confirms the intended direction, but the current app only renders `http://`, `https://`, and `file://` image URIs. `asset://...` is useful as a content identifier, but it is not yet a renderable app URL.

Recommended asset strategy:

1. **Do not regenerate everything.**
   - Keep the existing 35 common and 35 rare pet images as the visual foundation.
   - They already provide enough breadth for personality matching, collection, and rarity progression.

2. **Process assets into app-ready derivatives.**
   - Create transparent PNG/WebP versions for runtime use.
   - Normalize canvas size, padding, and visual scale.
   - Generate thumbnails for inventory/grid views.
   - Generate hero versions for pet detail and island center stage.
   - Keep original files untouched as source assets.

3. **Use Supabase Storage or bundled Expo assets, not raw `asset://` strings.**
   - For MVP, bundled assets are simplest if app size remains acceptable.
   - For LiveOps, Supabase Storage/CDN URLs are better because new pets can ship without app-store releases.
   - The DB should store a stable `asset_key` plus renderable `public_url` or resolved app asset reference.

4. **Treat `legend` as seasonal/mythic variants, not simple level-20 replacements.**
   - The legend folder does not map 1:1 to all 35 common animals.
   - Use it for special limited pets, mythic transformations, founder rewards, or season bosses.
   - Avoid forcing `dragon.png` to be the level-20 form of `bichon`; that breaks identity continuity.

5. **Upgrade selectively.**
   - Use image editing/upscaling only where assets are inconsistent, cropped, low contrast, too heavy, or missing transparent backgrounds.
   - Do not change the whole art direction until a visual style guide exists.

First asset batch:

- Common/Rare MVP: `american shorthair`, `bichon`, `chameleon`.
- Expansion batch: add 8-12 more common/rare pairs that map cleanly to BIPI traits.
- Mythic batch: choose 3-5 legend assets for seasonal limited banners.

### Contradiction Discovery

One of the strongest self-discovery moments is a positive contradiction:

> “연애 질문에서는 표현을 자주 고르지만, 커리어 질문에서는 차분을 자주 골라요. 일관성이 없는 게 아니라, 관계와 일에서 다른 모드를 쓰는 사람일 수 있어요.”

This should become a later insight-card type because it uses existing category/trait inputs and fits the app identity better than simple trait totals.

### Island Information Architecture

To avoid complexity, the island should have only three map modes at first:

1. **오늘의 발견**
   - One new insight card.
   - Example: “최근 연애 질문에서는 표현을 숨기기보다 바로 말하는 선택이 많았어요.”
   - User sees one clear takeaway, not a graph wall.

2. **성향 가지**
   - Mind-map view.
   - Center: pet/avatar.
   - First branches: core trait axes.
   - Second branches: categories and repeated choices.
   - Best default mode for mobile.

3. **연결 지도**
   - Obsidian Local Graph style.
   - User taps one node and sees nearby evidence only.
   - Depth starts at 1, with optional depth 2.
   - Full global graph remains hidden until advanced mode.

The captured reference image should guide the long-term feeling: a constellation of self-data. MVP should show a small island constellation, not the whole universe.

### “나만의 꾸미기” Must Be Visible

Do not bury inventory or insights in lists. The island screen should eventually combine:
- Pet center stage as “나의 현재 아바타.”
- Theme background as “내가 살고 싶은 무드.”
- 3-6 decor slots as lightweight self-expression.
- Insight map as “내 선택의 연결.”
- Visitor/profile preview as “남에게 보여줄 요약본.”
- “오늘의 섬 기분” based on recent choices.

### Complexity Guardrails

The concept is deep, but the first UI must stay simple:

- No freeform canvas editing in MVP.
- No giant full graph on first open.
- No more than 7 visible nodes in the default island map.
- Every insight must show one evidence path: question -> choice -> trait/category -> insight.
- The pet and island must not both have separate complex leveling systems.
- Pet owns growth. Island owns map/space.
- Use the current `react-native-svg` + `d3-hierarchy` direction for MVP visual maps; defer `react-native-skia`, gesture-heavy editing, and complex animation stacks until the basic map proves useful.
- Treat pet diary, weekly recap, and contradiction discovery as staged features, not day-one requirements.

### Ethics Guardrails

- No diagnosis language: avoid “당신은 이런 사람입니다.”
- No guilt mechanics: the pet can welcome, miss, or encourage, but must not shame the user.
- No hidden public sharing: insight details and vote history are private by default.
- Share cards must be opt-in and summarize, not expose raw votes.
- Forced-choice results are preference signals, not validated psychological scores.

---

## 6. LiveOps Calendar

### Weekly

- Daily free draw reset.
- 3-question mini quest.
- Shell bonus for streak recovery.
- Small decor reward.

### Monthly

- New pet variant banner.
- New island theme banner.
- One personality event, e.g. “혼자 vs 같이 여행 주간.”
- One free event reward track.

### Quarterly

- Big seasonal collection.
- Rerun shop.
- Founder/collector badge.
- One new mechanic only if metrics justify it.

### Anniversary

- “내 선택의 1년” recap.
- Rerun vote: users pick which limited pet returns.
- High-status non-random reward for long-term users.

---

## 7. Gacha Design Rules

### Must Have

- Public odds before draw.
- Versioned probability snapshots.
- Hard pity.
- Pity carryover within banner family.
- Duplicate conversion.
- Draw history.
- “Expected maximum cost” copy for paid banners later.

### Avoid

- Paid random draws before retention is proven.
- Trading before anti-scam systems exist.
- Hidden dynamic odds.
- “Complete set bonus” that requires multiple random rare pulls.
- Power advantage from rare pets.

### First Suggested Rates For Testing

For earned-currency MVP only:

- Common: 80%
- Rare: 17%
- Legendary: 3%
- Featured limited legendary pet variant: 1% inside the seasonal pet banner
- Hard pity: 60 pulls for featured pet variant
- Rare guarantee: every 10 pulls

These are starting points, not final economy promises. Tune only through versioned probability records.

---

## 8. Pet vs Island Operating Model

### Pets

Role:
- Emotional anchor.
- Scarcity object.
- Banner headline.
- Profile identity.

Use for:
- Limited variants.
- Evolution.
- Mood/energy animations.
- Trait-linked “this pet chose you” moments.

### Islands

Role:
- Self-knowledge space.
- Preference map.
- Showroom.
- Collection sink.
- Social proof.
- Personalization canvas.

Use for:
- Insight map.
- Trait zones.
- Like/dislike landmarks.
- Local graph exploration.
- Themes.
- Decor slots.
- Seasonal atmosphere.
- Visitor preview.

### Decision

Do not make users choose “pet or island.” Make the pet the user-avatar, and make the island the readable map of the user's values, preferences, and desired world.

The simplified product sentence:

> “펫은 나, 섬은 내가 살아가고 싶은 세계와 내 선택의 지도.”

---

## 9. Metrics

Track:
- D1/D7/D30 retention.
- Daily draw claim rate.
- First pet assignment completion.
- Choice Echo view/skip/tap rate.
- Daily dilemma completion rate.
- Pet reaction positive engagement: care tap, next-question tap, diary open.
- Insight card open and “섬 지도에서 보기” tap rate.
- Weekly recap open/share/save rate.
- Seasonal banner open rate.
- Draw conversion from probability screen.
- Inventory equip rate.
- Duplicate frustration: duplicate rate vs churn.
- Shell earning/spending balance.
- Percent of users reaching pity.
- Support complaints about odds, duplicates, or scarcity.

Early success signal:
- Users equip what they draw.
- Users return for free daily draw.
- Users talk about which pet/theme they want.

Danger signal:
- Users draw but do not equip.
- Users churn after duplicates.
- Users complain that odds are unclear.
- New users feel old users are impossibly ahead.
- Users skip Choice Echo repeatedly.
- Users perceive insights as inaccurate or too deterministic.
- Users feel pet comeback messages are guilt-inducing.

---

## 10. Implementation Phases

### Phase 1: Make The Island Explain The User

- Add “오늘의 발견” card to the island screen.
- Show one evidence path from recent votes to one insight.
- Keep graph hidden behind a simple card.
- Use existing `user_traits`, `votes`, `questions`, `categories`, and `user_insight_cards`.
- Add a minimal Choice Echo after meaningful votes.
- Add 5-10 pet dialogue templates driven by existing trait/category signals, without adding a large dialogue CMS yet.
- Add daily dilemma theme labels to the feed calendar or seed plan.

### Phase 2: Make Existing Theme Draw Feel Valuable

- Add probability modal before draw.
- Show pity counter and draw history.
- Improve result animation and duplicate conversion copy.
- Add equipped island preview.
- Add “why this theme fits you” text from trait data.

### Phase 3: Add Pet Variants Without Trading

- Add `pet_variants` table.
- Add `user_pet_variants` table.
- Let current personality pet species remain stable.
- Variants are skins/forms for the assigned pet family.
- Add seasonal pet variant banner with pity.
- Add an asset processing step for `C:\Users\petbl\Desktop\alarmpetgo_\svg`, `rare`, and `legend`.
- Preserve original local files and create app-ready resized/optimized derivatives.
- Replace non-renderable `asset://alarmpetgo/...` runtime URLs with bundled asset references or Supabase Storage public URLs.
- Map `svg` and `rare` folders as common/rare variants for the same species.
- Map `legend` folder as mythic/seasonal variants only after manually approving each creature-to-theme fit.

### Phase 4: Add Island Mind Map

- Add radial `성향 가지` map.
- Center node is current pet.
- First branches are core trait axes.
- Second branches are categories and repeated choices.
- Keep max visible nodes low.
- Add geography metaphors only where they clarify meaning: e.g. `모험의 언덕`, `안정의 마을`, `흐름의 해변`.
- Add “나의 선택 별자리” as a visual style for local graph/detail mode, not as the default full map.

### Phase 5: Add Island Showroom

- Add island decor slots.
- Add visitor/profile preview.
- Let users save one active layout.
- Add seasonal theme collections.

### Phase 6: Add Local Graph Exploration

- Add `연결 지도` detail mode.
- Tapping a node shows only nearby connected nodes.
- Depth 1 is default.
- Depth 2 is opt-in.
- Add filters by category and time window.
- Add contradiction-discovery cards for category-specific differences, such as “연애에서는 표현, 커리어에서는 차분.”

### Phase 6.5: Add Recaps After Retention Signals

- Add weekly recap only after users have enough vote volume for the story to feel grounded.
- Use story-card format inspired by Wrapped, but keep sharing opt-in.
- Add “펫의 짧은 일기” as the emotional wrapper around the recap.
- Include privacy copy before first share.

### Phase 7: Add LiveOps Admin Config

- Add server-side banner schedule.
- Add probability versioning per banner.
- Add content calendar.
- Add metrics dashboard export.

### Phase 8: Consider Monetization

Only after retention data:
- Add non-random starter pack first.
- Add battle-pass-like seasonal reward track second.
- Add paid random banners only after legal/probability disclosure, age/regional controls, refund support, and support docs are ready.

---

## 11. Final Recommendation

Balance Island should become:

> “재미삼아 밸런스 게임을 하다 보면, 내 선택이 성향 펫과 섬의 지도로 자라나서 내가 좋아하는 것, 싫어하는 것, 반복하는 가치관을 발견하게 해주는 취향 자기이해 앱.”

The desire engine is not “a gacha button.” The desire engine is:
- This pet feels like me.
- This island shows the world I want to live in.
- This map helps me understand why I keep choosing certain things.
- This limited version may not come back soon.
- My island makes it look special.
- Other people can see I got it.
- I can still trust the game because odds and pity are clear.

That is the strongest path between self-discovery, collection desire, and trust.
