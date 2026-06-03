# Pet + Island Collectible LiveOps Strategy Plan

> **For agentic workers:** This is a product/economy strategy plan, not an implementation checklist. If implementation starts, create a separate implementation plan using `superpowers:writing-plans`.

**Goal:** Maximize collection desire, personalization, and repeat return loops in Balance Island without turning early MVP into an untrusted or legally risky gacha economy.

**Recommendation:** Do not choose only pet or island. Make **limited pets the primary desire object** and make **island/theme customization the status stage** where users show, equip, and emotionally justify the collection.

**Current Codebase Fit:** Balance Island already has `pet_species`, `user_pet_state`, `theme_skins`, `theme_draw_pools`, `theme_draw_pool_items`, `user_theme_inventory`, `theme_draw_history`, `user_theme_pity`, and probability disclosure RPCs. That means the fastest path is to evolve the current theme draw system into a seasonal LiveOps layer while adding collectible pet variants in a controlled second wave.

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

---

## 2. Product Decision

### The Core Answer

If forced to choose one collectible axis, choose **pets**.

Reason:
- Pets are character-like, nameable, cute, and emotionally bonded.
- Limited pets are easier to market: “이번 시즌 한정 카멜레온” is clearer than “이번 시즌 한정 섬 배경.”
- Pets can evolve, react, sit on the profile, appear on the island, and become the user’s avatar proxy.

But the better product is **pets as desire, islands as proof**.

The island should answer: “What does owning this pet let me show?”

### Recommended Hierarchy

1. **Pet Variant:** primary chase item.
   - Example: `카멜레온: 달빛 변이`, `비숑: 체리블라썸`, `아메숏: 오로라`.
   - Limited variants change appearance, idle effect, profile badge, and island behavior.

2. **Island Theme:** secondary chase and display stage.
   - Example: `별빛 왕국`, `네온 카페`, `핑크 라군`.
   - Themes modify background, ambience, effects, and visitor first impression.

3. **Decor/Props:** long-tail collection filler.
   - Example: chairs, lamps, shells, signs, plants.
   - Use for common/rare rewards so duplicates do not feel worthless.

4. **Titles/Badges:** social proof.
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
3. Traits influence recommended pet/island style.
4. User receives or chases a pet/theme that feels “me-coded.”
5. User equips it on island/profile.
6. Other users can see it.
7. New season introduces a more desirable expression of self.

This makes the gacha feel like self-expression rather than pure gambling.

### “나만의 꾸미기” Must Be Visible

Do not bury inventory in a list. The island screen should eventually become:
- Pet center stage.
- Theme background.
- 3-6 decor slots.
- Visitor/profile preview.
- “오늘의 섬 기분” based on recent choices.

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
- Showroom.
- Collection sink.
- Social proof.
- Personalization canvas.

Use for:
- Themes.
- Decor slots.
- Seasonal atmosphere.
- Visitor preview.

### Decision

Do not make users choose “pet or island.” Make users want a limited pet, then make them want the perfect island to display it.

---

## 9. Metrics

Track:
- D1/D7/D30 retention.
- Daily draw claim rate.
- First pet assignment completion.
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

---

## 10. Implementation Phases

### Phase 1: Make Existing Theme Draw Feel Valuable

- Add probability modal before draw.
- Show pity counter and draw history.
- Improve result animation and duplicate conversion copy.
- Add equipped island preview.
- Add “why this theme fits you” text from trait data.

### Phase 2: Add Pet Variants Without Trading

- Add `pet_variants` table.
- Add `user_pet_variants` table.
- Let current personality pet species remain stable.
- Variants are skins/forms for the assigned pet family.
- Add seasonal pet variant banner with pity.

### Phase 3: Add Island Showroom

- Add island decor slots.
- Add visitor/profile preview.
- Let users save one active layout.
- Add seasonal theme collections.

### Phase 4: Add LiveOps Admin Config

- Add server-side banner schedule.
- Add probability versioning per banner.
- Add content calendar.
- Add metrics dashboard export.

### Phase 5: Consider Monetization

Only after retention data:
- Add non-random starter pack first.
- Add battle-pass-like seasonal reward track second.
- Add paid random banners only after legal/probability disclosure, age/regional controls, refund support, and support docs are ready.

---

## 11. Final Recommendation

Balance Island should become:

> “내 선택이 만든 성향 펫을 중심으로, 한정판 펫 변이와 섬 테마를 모아 나만의 섬을 꾸미는 취향 수집 게임.”

The desire engine is not “a gacha button.” The desire engine is:
- This pet feels like me.
- This limited version may not come back soon.
- My island makes it look special.
- Other people can see I got it.
- I can still trust the game because odds and pity are clear.

That is the strongest path between obsession and trust.
