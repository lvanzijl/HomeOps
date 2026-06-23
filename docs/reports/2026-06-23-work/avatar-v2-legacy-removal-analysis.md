# Avatar V2 Legacy Removal Analysis

## Summary
Avatar V2 is the accepted long-term FamilyAvatar path, but legacy avatar removal is not ready as a single immediate deletion. The legacy renderer is now mostly a runtime migration bridge, yet legacy avatar data remains contractually and persistently active across frontend models, generated API client types, request/response DTOs, EF-required columns, seeds, tests, and the Family Member parent detail surface. Initials fallback must remain permanently after removal.

## Remaining Legacy Inventory
- Frontend model: `FamilyMemberAvatarConfig`, `FamilyMember.avatar`, legacy enum unions, and static fallback members still define age group, presentation, skin tone, hair color, hair style, glasses, and shirt color.
- Frontend API mapper: `fromApi`, `avatarToApi`, `toApi`, and create/update request builders still read and write `FamilyMemberAvatarDto`.
- Generated TypeScript client/OpenAPI: `FamilyMemberAvatarDto` remains in `FamilyMemberDto.avatar`, `CreateFamilyMemberRequest.avatar`, and required `UpdateFamilyMemberRequest.avatar`.
- Frontend rendering/CSS: `FamilyAvatar` still contains the legacy CSS/span renderer, and `styles.css` still contains `.avatar-head`, `.avatar-hair`, `.avatar-face`, `.avatar-eye`, `.avatar-glasses`, `.avatar-shirt`, `hair-*`, `age-*`, and `presentation-*` styling.
- User-visible surface: the Family Member parent detail card still shows “Current avatar configuration” using legacy avatar fields.
- Creation flows: First Run Wizard and Add Family Member dialog still seed legacy avatar payloads for new members.
- Backend entity/contracts: `FamilyMember` still has required legacy properties, `FamilyMemberAvatarDto` still exists, and create/update/read DTOs still include avatar data.
- Backend endpoints: create defaults legacy avatar values, update requires `request.Avatar`, and read maps entity columns back into `FamilyMemberAvatarDto`.
- EF/database: legacy columns are required mappings and remain in migrations/model snapshot. Seed data still supplies legacy values for every seeded family member.
- Tests: frontend and backend tests explicitly cover legacy fallback rendering, legacy avatar detail display, and legacy avatar persistence through update.

## Runtime Dependencies
- Active runtime use remains in `FamilyAvatar` only when `member.avatarV2Config` is absent or invalid enough to normalize away before rendering. In that state, configured legacy avatars render instead of initials.
- Motivation, Home family strip, Family Member hero, and Child hero area can still hit legacy rendering indirectly because they all consume `FamilyAvatar`.
- The Family Member parent detail surface actively displays legacy values whenever `member.avatar` exists.
- Client save/update actively sends legacy avatar payloads because the generated `UpdateFamilyMemberRequest` requires them.
- Backend create/update/read actively persists and returns legacy fields because EF columns and DTO contracts require them.
- Static/mock/fallback family members actively provide legacy avatar data for offline/fallback UI and as fallback update payloads.

## Removal Blockers
- Removing only legacy rendering now would make members without `avatarV2Config` jump directly to initials. That is functionally safe only if the product accepts initials for all unmigrated/invalid Avatar V2 records; current reviews call for migration/fallback consistency first.
- Removing legacy frontend model fields now would break API mapper code, create flows, tests, and generated-client compatibility because backend contracts still expose/require avatar.
- Removing `FamilyMemberAvatarDto` or avatar request/response properties now would break generated clients, frontend mapper construction, API tests, and any caller that still posts/puts legacy avatar payloads.
- Removing database columns now would break EF mapping, model snapshot alignment, existing migrations, seed data, backend endpoint mapping, and any existing database containing required non-null legacy fields unless a coordinated migration updates the model and contracts first.
- Removing user-visible legacy detail text now should be paired with an Avatar V2 detail/fallback copy decision so Parent Mode does not show stale or missing avatar configuration information.

## Recommended Removal Sequence
1. Define the post-legacy fallback policy: Avatar V2 first, initials permanently for missing/invalid Avatar V2, with no legacy visual bridge.
2. Ensure every normal seed/mock/test family member has explicit Avatar V2 config so routine screens no longer rely on legacy data for visual consistency.
3. Update frontend create flows to create Avatar V2 config by default and stop constructing legacy avatar data in user-facing flows, while contracts still tolerate legacy payloads.
4. Remove or convert the Family Member parent detail legacy avatar configuration card to Avatar V2-oriented copy/details, preserving initials fallback messaging.
5. Remove `FamilyAvatar` legacy CSS/span rendering and legacy-only CSS selectors after tests prove Avatar V2 and initials fallback cover all display states.
6. Make API contracts backward-compatible for one slice if needed: stop requiring legacy avatar on update before deleting generated/client use.
7. Regenerate OpenAPI/client after DTO request/response changes, then remove frontend mapper legacy conversion and model fields.
8. Remove backend legacy entity properties, EF mappings, seed values, migrations/model snapshot references through a dedicated migration after the application no longer reads/writes them.
9. Run full frontend/backend tests plus OpenAPI generation/build checks.

## Recommended Slice Boundaries
Split removal into multiple implementation slices rather than one large slice.

- Slice 1: frontend/product cleanup only. Add Avatar V2 defaults to creation/mock/seed-facing frontend paths, remove user-visible legacy detail copy, and keep contracts unchanged.
- Slice 2: renderer cleanup. Remove FamilyAvatar legacy rendering and CSS selectors after coverage confirms Avatar V2 and initials fallback.
- Slice 3: API contract/client cleanup. Make/update DTOs and generated client remove legacy avatar fields, then update mappers and tests.
- Slice 4: persistence cleanup. Remove entity columns/mappings/seeds and add the database migration once no runtime code or contracts depend on the columns.

This split limits blast radius across UI rendering, API compatibility, generated code, and database migration risk.

## Required Tests
- FamilyAvatar renders Avatar V2 when config exists and initials when Avatar V2 config is absent/invalid; no test should require legacy renderer after the renderer-removal slice.
- Home dashboard, Family Member page, Child hero area, and Motivation tests should cover Avatar V2 configured members and missing-config initials fallback.
- Family Member parent detail tests should verify Avatar V2-oriented detail/fallback copy instead of legacy field labels.
- First Run Wizard and Add Family Member dialog tests should verify new members receive Avatar V2 defaults or are accepted without legacy avatar data, depending on the selected contract slice.
- API tests should cover create/update without legacy avatar once contracts allow it, and verify Avatar V2 config is normalized/persisted.
- OpenAPI/generated-client checks should verify `FamilyMemberAvatarDto` is absent only in the contract-removal slice.
- EF migration/model snapshot checks should verify legacy columns are removed only in the persistence slice.
- Regression tests must keep initials fallback permanent and assert member names remain present near compact avatars.

## Risks
- Existing households with null/missing Avatar V2 config could lose illustrated avatars and fall back to initials unless a data migration/backfill or accepted fallback policy exists.
- Contract removal can break generated clients and external callers if update still requires avatar or if consumers expect `FamilyMemberDto.avatar`.
- Database column removal is irreversible without backup/migration care and must not precede code/contract cleanup.
- Removing mixed legacy fallback will improve visual consistency for configured households but may make unconfigured records look less complete.
- Dense future surfaces should not receive avatars by default; removal should not be used as a reason to expand Avatar V2 into unrelated screens.

## Open Questions
- Should missing Avatar V2 config be stored as a default Avatar V2 config during migration, or should the app intentionally render initials until a user edits the avatar?
- Should create/update contracts make `AvatarV2Config` required, optional with server defaults, or optional with initials fallback semantics?
- Should the Parent Mode detail card show Avatar V2 selections, a simple “Avatar configured” status, or only the edit action?
- Is a one-release compatibility window needed for legacy avatar DTOs before contract deletion?
- Should historical migrations remain untouched except for the new removal migration, or should any generated SQL/report artifacts be updated separately if they are used as deploy assets?

## Next Prompt Context
Legacy avatar removal should be split. Avatar V2 remains the long-term FamilyAvatar rendering path and Motivation keeps Avatar V2 only as a secondary ownership cue. Initials fallback must remain permanently. Do not add avatars to unrelated dense surfaces by default, and do not frame Avatar V2 as profiles/accounts/reward-shop mechanics. Next implementation should start with frontend/product cleanup and fallback-policy tests, not database or DTO deletion.
