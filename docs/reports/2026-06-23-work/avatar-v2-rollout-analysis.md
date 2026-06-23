# Avatar V2 Rollout Analysis

## Summary

Avatar V2 is ready for a controlled visual rollout, but not for legacy avatar removal. The current safest path is a hybrid rollout: introduce a shared Avatar V2 display component and roll it through core identity surfaces first, while preserving the legacy avatar API, DTO, and database fields until every rendering surface, editor detail panel, tests, generated API contract, and fallback path no longer depends on legacy avatar data.

Recommended first target: Family Member page hero and child hero area, because it is already the persistence/editing owner and gives the largest preview size.

Recommended last target: small, dense and secondary ownership surfaces such as Motivation cards and future mobile list/task/shopping/weekly reset/media surfaces, because readability at compact sizes and mixed icon/avatar semantics need validation.

## Legacy Avatar Inventory

### Legacy avatar fields

The legacy avatar model still exists on both frontend and backend.

Frontend legacy avatar fields are represented by `FamilyMemberAvatarConfig`:

- `ageGroup`
- `presentation`
- `skinTone`
- `hairColor`
- `hairStyle`
- `glasses`
- `shirtColor`

`FamilyMember` still carries both `avatar` and `avatarV2Config`, so Avatar V2 has been added alongside, not as a replacement.

Backend legacy avatar fields remain first-class columns/properties on `FamilyMember`:

- `AgeGroup`
- `Presentation`
- `SkinTone`
- `HairColor`
- `HairStyle`
- `Glasses`
- `ShirtColor`

Avatar V2 is an owned config on the same entity.

### Current legacy avatar rendering paths

The active production avatar renderer is `FamilyAvatar`. It ignores `avatarV2Config` and renders from `member.avatar`. If `member.avatar` is absent, it falls back to initials.

`FamilyAvatar` renders CSS/span-based legacy parts:

- portrait/fallback wrapper
- head
- hair
- face
- eyes
- optional glasses
- smile
- shirt

The renderer is consumed by:

- Home family strip.
- Family Member page hero.
- Child hero area inside Family Member page.
- Motivation individual goal cards.

### Current legacy avatar components

- `FamilyAvatar`: active legacy display component.
- Legacy CSS selectors under `.family-avatar-*`, `.avatar-head`, `.avatar-hair`, `.avatar-face`, `.avatar-eye`, `.avatar-glasses`, `.avatar-shirt`, and presentation/hair/age modifier classes.
- Family Member detail card still displays the legacy avatar configuration values rather than Avatar V2 values.

Avatar V2 components already exist, but are editor/preview paths rather than rollout display paths:

- `AvatarEditorPage`: isolated Avatar V2 admin/editor preview.
- `FamilyAvatarEditor`: family-member-owned Avatar V2 editor and preview.
- `avatarV2` engine and `avatarConfig` normalization/render mapping.

### Current legacy avatar DTO usage

The backend contract still exposes `FamilyMemberAvatarDto` in:

- `FamilyMemberDto.Avatar`
- `CreateFamilyMemberRequest.Avatar`
- `UpdateFamilyMemberRequest.Avatar`

`UpdateFamilyMemberRequest.Avatar` is non-nullable, so updating a Family Member still requires legacy avatar payloads.

The generated frontend API client still includes both `FamilyMemberAvatarDto` and `AvatarV2ConfigDto`. The handwritten API mapper still converts legacy avatar data in both directions and falls back to seeded legacy avatar values when saving.

### Current legacy avatar persistence

Legacy avatar persistence is still active:

- Legacy fields are modeled directly on `FamilyMember`.
- EF maps legacy fields to required FamilyMembers table columns.
- Create normalizes/defaults legacy avatar input and writes legacy values.
- Update writes legacy avatar values from `request.Avatar`.
- Read maps legacy fields into `FamilyMemberAvatarDto`.

Avatar V2 persistence also exists through the owned `AvatarV2Config`, but it does not supersede legacy persistence yet.

## Avatar Surface Inventory

| Surface | Current state | Evidence / notes | Rollout implication |
|---|---:|---|---|
| Family Member page hero | Uses legacy avatar | `FamilyAvatar size="large"` in the member hero. | Best first rollout candidate. Large size makes visual defects easier to catch and this page owns editing. |
| Child hero area | Uses legacy avatar | `FamilyAvatar size="large"` in child identity area. | Good early candidate after Family Member hero, but child-readability review is required. |
| Home family strip | Uses legacy avatar | Family chips render `FamilyAvatar`. | Core identity surface; roll out early after large-size validation. |
| Motivation individual goal cards | Uses legacy avatar | Individual goal heading renders `FamilyAvatar`. | Medium risk because compact avatars compete with progress/icon content. |
| Helpful Moments | Uses no person avatar | Moment card uses `HomeOpsIcon` inside `.moment-avatar`, keyed to recognition tag rather than member avatar. | Do not replace immediately; decide whether this is an icon slot or a person identity slot. |
| Avatar V2 standalone editor page | Uses Avatar V2 | Renders SVG preview from `renderAvatarV2Svg`. | Already V2; not a rollout target. |
| Family Avatar editor modal | Uses Avatar V2 for editing/preview | Persists `member.avatarV2Config` on save. | Already V2; should become validation source for display component consistency. |
| Tasks page / lists of owned tasks | Uses no avatar in current code search | Uses family members for assignment, but no `FamilyAvatar` usage was found. | Future candidate only after ownership UI decides whether avatar is needed. |
| Home dashboard outside family strip | Uses no avatar | Family strip is the only `FamilyAvatar` usage in Home. | No rollout required beyond family strip. |
| Lists / Shopping | Uses no avatar in current code search | No `FamilyAvatar` usage found. | Future-surface planning only. |
| Weekly Reset | Uses no avatar in current code search | No current implementation/avatar usage found in searched client source. | Future-surface planning only. |
| Media | Uses no avatar in current code search | No current implementation/avatar usage found in searched client source. | Future-surface planning only. |
| Celebrations | Uses no current person avatar in searched client source | Existing reports describe anticipation/celebration concepts, but production code search did not find a FamilyAvatar surface. | Treat as future/high review because child emotion and celebration visuals are sensitive. |
| Future mobile surfaces | Not implemented / not directly searchable | Needs small-size and responsive validation. | Last wave or per-surface validation after desktop/tablet success. |

## Rollout Priority

### Safe Early Rollout

1. **Family Member page hero**
   - Largest existing avatar placement.
   - The page already owns avatar editing and persistence, reducing conceptual mismatch.
   - Users can compare the saved Avatar V2 config with the main identity preview in one place.

2. **Child hero area**
   - Also large and identity-centric.
   - Important to validate child friendliness early.
   - Should follow the main Family Member hero so one page can be visually reviewed as a coherent unit.

3. **Home family strip**
   - Core household identity surface.
   - Compact size introduces risk, but the surface is central enough that it should not lag far behind the Family Member page.

### Medium Risk Rollout

1. **Motivation individual goal cards**
   - Compact avatar beside goal title and a progress/ownership icon.
   - Risk of visual clutter or unclear hierarchy.
   - Needs validation across active, completed, empty, and creation states.

2. **Helpful Moments, if changed from icon identity to person identity**
   - Current `.moment-avatar` is an icon/tag visual, not the family member portrait.
   - Replacing it with Avatar V2 would be a product semantics change, not a simple renderer swap.

3. **Tasks / ownership lists if avatars are added**
   - No current avatar display path was found, but ownership UIs may later use member identity.
   - Risk depends on row density and mobile layout.

### High Risk Rollout

1. **Future mobile surfaces**
   - Avatar V2 is SVG-rich and visually detailed; 32px and dense mobile rows need explicit legibility validation.

2. **Celebrations / child emotional moments**
   - Avatars can amplify delight, but visual mismatch, clipping, or perceived unfairness is more noticeable in child-facing reward moments.

3. **Shopping, weekly reset, and media if they become household ownership surfaces**
   - These are not current avatar surfaces and should not receive avatars solely because Avatar V2 exists.
   - Rollout should wait for product need and layout design.

## Visual Validation Requirements

### Family Member page hero

Required screenshots:

- Desktop Family Member page, adult member.
- Desktop Family Member page, child member.
- Tablet landscape Family Member page.
- Narrow/mobile viewport if supported by the current app shell.
- Editor open and closed states after saving an Avatar V2 config.

Manual validation:

- Avatar is readable at large size.
- Hair/accessories are not clipped.
- Member name, age context, and action buttons remain visually dominant where appropriate.
- Fallback behavior is graceful if `avatarV2Config` is missing or invalid.

UX review:

- Does the large avatar feel like the same identity created in the editor?
- Does it remain household-oriented rather than profile/login-oriented?

### Child hero area

Required screenshots:

- Child page with child hero area for each age band represented by seeded/test members.
- Desktop and tablet/narrow layouts.

Manual validation:

- Child can recognize “this is me” quickly.
- Avatar does not overpower tasks/goals.
- Clothing and accessories remain friendly, not reward-shop-coded.

UX review:

- Child friendliness.
- Emotional tone.
- Consistency between avatar and member color.

### Home family strip

Required screenshots:

- Desktop Home dashboard with all seeded family members.
- Tablet landscape Home dashboard.
- Narrow/mobile Home dashboard if supported.
- Cases with long family member names.

Manual validation:

- Compact avatar remains readable.
- Avatars do not make family chips too tall or noisy.
- Tapping/clicking still clearly opens the Family Member page.
- Initials fallback is still legible.

UX review:

- Household board consistency.
- Recognition at a glance from typical kitchen/tablet viewing distance.

### Motivation individual goal cards

Required screenshots:

- Motivation page with multiple individual goals.
- Goal creation/edit state if member ownership picker is visible.
- Completed/progress-heavy cards.
- Mobile/narrow layout.

Manual validation:

- Avatar, ownership icon, member name, and goal title do not compete.
- Progress remains more important than decoration.
- Small-size Avatar V2 remains readable.

UX review:

- Motivation tone remains encouraging.
- Avatars do not imply gamified unlocks or rewards unless explicitly implemented later.

### Helpful Moments

Required screenshots if changed:

- Helpful Moments list with current icon approach.
- Prototype with Avatar V2 if product chooses person identity.
- Mobile/narrow layout.

Manual validation:

- Recognition tag icon meaning is not lost.
- Family member identity is clear without duplicating text.

UX review:

- Decide whether `.moment-avatar` is a semantic icon slot or a person-avatar slot before implementation.

### Future surfaces

Required screenshots:

- Per-surface desktop/tablet/mobile screenshots before rollout.
- 32px, 48px, 64px, 96px, and 160px avatar checks where the surface uses those sizes.

Manual validation:

- Clipping.
- Contrast.
- Tap target separation.
- Text hierarchy.
- Empty/error/missing-config fallbacks.

UX review:

- Consistency with Family Member and Home identity.
- Child friendliness.
- No accidental authentication/profile semantics.

## Legacy Removal Analysis

### What blocks removal

Legacy avatar removal is blocked by four active dependency categories:

1. **Rendering**
   - `FamilyAvatar` renders only `member.avatar`.
   - Home, Family Member, Child Hero, and Motivation all depend on `FamilyAvatar`.

2. **Frontend model and API mapper**
   - `FamilyMember` still includes `avatar`.
   - `fromApi`, `toApi`, and `createFamilyMember` still map/send `FamilyMemberAvatarDto`.
   - `toApi` depends on legacy fallback avatar values to satisfy update contract requirements.

3. **Backend contract**
   - `FamilyMemberDto.Avatar` remains present.
   - `CreateFamilyMemberRequest.Avatar` remains present.
   - `UpdateFamilyMemberRequest.Avatar` is required.

4. **Persistence**
   - Legacy fields are required in EF mapping and exist as FamilyMembers columns.
   - Create/update endpoints still populate and update those fields.

### Screens still depending on legacy avatars

- Home family strip.
- Family Member page hero.
- Child hero area.
- Motivation individual goal cards.
- Family Member detail card displays legacy avatar configuration values.

### DTOs still depending on legacy avatars

- `FamilyMemberAvatarDto`.
- `FamilyMemberDto.Avatar`.
- `CreateFamilyMemberRequest.Avatar`.
- `UpdateFamilyMemberRequest.Avatar`.
- Generated TypeScript equivalents in `homeOpsApiClient.ts`.

### Persistence fields still depending on legacy avatars

- `AgeGroup`
- `Presentation`
- `SkinTone`
- `HairColor`
- `HairStyle`
- `Glasses`
- `ShirtColor`

### When legacy removal becomes safe

Legacy removal becomes safe only after:

1. A shared Avatar V2 display component replaces `FamilyAvatar` or `FamilyAvatar` becomes V2-backed.
2. Every current avatar-rendering surface has been visually validated with Avatar V2.
3. Family Member detail UI no longer presents legacy avatar fields as the current configuration.
4. Frontend create/update flows can save Family Members without constructing legacy avatar payloads.
5. Backend update contract no longer requires `FamilyMemberAvatarDto`.
6. API clients/OpenAPI are regenerated and consumers updated.
7. A migration/backfill/removal plan exists for legacy columns.
8. Tests no longer assert legacy avatar behavior except temporary backward-compatibility tests during the migration window.

## Rollout Strategy Comparison

### Big Bang

Replace all avatars at once.

Pros:

- Fastest visible consistency.
- Avoids a prolonged mixed-avatar period.

Cons:

- Highest regression risk across rendering, API mapping, tests, and visual hierarchy.
- Compact surfaces and child-facing surfaces would be validated too late.
- Legacy removal pressure may cause accidental contract/database changes before display readiness.

Verdict: not recommended.

### Incremental

Replace surface by surface.

Pros:

- Lowest per-surface visual risk.
- Allows targeted screenshots and UX review.
- Easier to pause if compact rendering fails.

Cons:

- Mixed legacy/V2 visuals persist longer.
- May duplicate display-component adaptation work if not planned around a shared renderer.

Verdict: safe but potentially too slow for core identity consistency.

### Hybrid

Replace core identity surfaces together after building one shared display path, then defer secondary/future surfaces.

Core group:

1. Family Member page hero.
2. Child hero area.
3. Home family strip.

Later group:

1. Motivation.
2. Helpful Moments only after semantic decision.
3. Future task/list/shopping/weekly reset/media/mobile surfaces only when product need exists.

Pros:

- Balances consistency and risk.
- Keeps the first rollout focused on identity surfaces.
- Avoids forcing avatars into non-avatar surfaces.
- Preserves legacy fields until all dependencies are retired.

Cons:

- Requires careful visual validation at both large and compact sizes before shipping the core group.
- Still needs temporary compatibility with legacy API/persistence.

Verdict: recommended.

## Recommended Rollout Plan

1. **Prepare a display-only Avatar V2 component**
   - It should accept a Family Member and render normalized `avatarV2Config`.
   - It should preserve initials fallback behavior.
   - It should not change API contracts or persistence in the same slice.

2. **Roll out to Family Member page hero first**
   - Validate large rendering and editor consistency.
   - Confirm missing/invalid Avatar V2 configs normalize safely.

3. **Roll out to child hero area in the same core page slice or immediately next**
   - Validate child friendliness and large-size identity.

4. **Roll out to Home family strip**
   - Validate compact sizing and household-board readability.

5. **Pause for visual review**
   - Capture desktop/tablet/mobile screenshots for Family Member and Home.
   - Do not proceed to secondary surfaces until small-size readability is accepted.

6. **Roll out to Motivation individual goal cards**
   - Treat as a separate slice with screenshots and hierarchy review.

7. **Decide Helpful Moments semantics**
   - Keep current icon-based `.moment-avatar` unless product decides each card should show person identity.

8. **Only after all display surfaces are V2-backed, plan contract/persistence removal**
   - Make legacy avatar DTO optional/deprecated first if backward compatibility is needed.
   - Remove frontend mapper dependency.
   - Regenerate clients/OpenAPI.
   - Create migration to remove legacy columns only after deployed code no longer reads/writes them.

## Risks

- **Compact readability risk:** Avatar V2 is more detailed than the legacy CSS avatar and may not read well in family chips or goal cards.
- **Mixed identity risk:** During rollout, users may see V2 in the editor and legacy avatars elsewhere.
- **Semantic drift risk:** Avatars could accidentally imply profiles, logins, rewards, or unlockables if copy and placement are not controlled.
- **API coupling risk:** `UpdateFamilyMemberRequest.Avatar` being required forces legacy payload construction until the contract changes.
- **Removal risk:** Dropping legacy columns before all generated clients and mappers are updated would break create/update flows.
- **Child-facing risk:** Child surfaces require extra review for friendliness, recognition, and emotional tone.

## Open Questions

1. Should `FamilyAvatar` be converted in place to render Avatar V2, or should a new `FamilyAvatarV2` component be introduced and swapped surface-by-surface?
2. What is the minimum supported avatar size for production V2: 32px, 40px, 48px, or larger?
3. Should the Family Member detail card show Avatar V2 config metadata, hide technical avatar config entirely, or present a more user-friendly summary?
4. Should Helpful Moments remain icon/tag based, or should it become person-avatar based?
5. Are future mobile surfaces required before legacy removal, or can legacy removal be scoped to currently implemented surfaces only?
6. Is backward compatibility required for older clients after the API stops requiring `FamilyMemberAvatarDto`?

## Next Prompt Context

Avatar V2 should roll out through a hybrid strategy. First implement a shared display-only Avatar V2 renderer without API, migration, or legacy-field removal. Apply it first to the Family Member page hero and child hero area, then Home family strip, with screenshots for desktop/tablet/narrow layouts. Keep legacy avatar DTOs and persistence untouched until every current rendering surface and frontend mapper no longer depends on `member.avatar` or `FamilyMemberAvatarDto`. Motivation should follow after core identity surfaces pass visual review. Helpful Moments needs a semantic product decision before avatar replacement.
