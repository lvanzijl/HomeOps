# Avatar Contacts Research

## 1. Executive Summary

**Repository-confirmed findings**

- The current avatar-backed person model is `FamilyMember`. It is household-scoped, soft-deleted, and stores both legacy `AvatarV2Config` columns and a catalog-backed `AvatarSelection` JSON value.
- Avatar catalog validation is already mostly entity-independent: `AvatarCatalogService.ValidateForWrite` accepts an `AvatarSelection` and does not require a `FamilyMember` instance.
- Frontend avatar editing is currently member-shaped. `FamilyAvatarEditor` receives a `FamilyMember`, updates member fields, and labels itself as the editor for a family member.
- Tasks already distinguish true assignment/ownership through `TaskOwnershipKind` and `FamilyMemberId`. Decorative contact avatars must not reuse that semantic assignment path.
- Shopping list items and calendar event series currently have plain title/text persistence and no person reference.
- There is no authentication/authorization system in the repository beyond product-level child/adult presentation patterns and `FamilyMemberKind`.
- Calendar export/restore is calendar-specific, not a whole-household backup. Contacts would not affect the current portability document unless decorative calendar badges are added later.

**Design recommendation**

Introduce a separate `Contact` entity with its own `AvatarSelection` and no `AvatarV2Config` legacy columns unless a compatibility bridge is required for old render consumers. Store contacts in the same household boundary as `FamilyMember`, with `ContactScope` distinguishing shared family contacts from member-specific contacts. Keep `FamilyMember` structurally separate and expose a lightweight picker candidate DTO that can combine family members and contacts only at read-model/API boundaries.

Use **DecorativeAvatarId** as the domain/API term for a future optional visual badge. It is clearer than `DisplayAvatarId` and less person-like than `VisualPersonId`. The identifier should reference a neutral `AvatarProfile` read identity rather than overloading `FamilyMemberId` or `ContactId` directly in task/list/event contracts.

**Phased recommendation**

- **Phase 1:** Add contact domain/persistence, contact management, and reusable avatar editor inputs. No decorative item references yet.
- **Phase 2:** Add one manual decorative avatar badge in the lowest-risk product area: shopping list items. No suggestions and no automatic matching.
- **Phase 3:** Add deterministic suggestion ranking and extend manual decorative badges to tasks and calendar events.

## 2. Current Repository Findings

### FamilyMember persistence and aggregate boundaries

`FamilyMember` is the current avatar-bearing person record. It has string `Id`, `HouseholdId`, display name/color/initials, `FamilyMemberKind`, optional birth date, soft-delete fields, timestamps, legacy avatar config, and catalog avatar selection.

The EF model maps `FamilyMember` to `FamilyMembers`, uses `Id` as the primary key, stores `AvatarSelection` as `jsonb`, restricts deletion of the household relationship, and indexes household/name and household/deletion/name. Duplicate names are allowed because the indexes are not unique.

Family members are referenced by tasks, recurring task series, task templates, motivation goals, and helpful moments with restrictive delete behavior. The existing member deletion endpoint soft-deletes a member rather than removing the row, which protects existing semantic references.

### AvatarSelection ownership and storage

`AvatarSelection` is a simple value object with `SchemaVersion` and a `Dictionary<string,string>` of slot selections. It is stored directly on `FamilyMember` as JSON, not in a separate avatar table. The frontend mirrors this with `AvatarCatalogSelection` and a normalized catalog object.

The current storage model means the avatar belongs to the member record, and rendering can be reconstructed from the member payload without joining to another table.

### Avatar catalog repository and validation

The shared catalog lives in `src/shared/avatar-catalog.json` and is loaded by both backend and frontend. Backend validation is entity-independent: `AvatarCatalogService` validates schema version, slot names, catalog item existence, category matching, required categories, and retired item rejection. It also normalizes missing values to catalog defaults.

Retired catalog items cannot be selected for writes, but existing persisted selections can still be normalized/rendered as long as their item IDs remain in the catalog. Hidden/deprecated items are not rejected unless marked retired.

### Avatar editor assumptions

`FamilyAvatarEditor` is reusable in spirit but not in type shape. It accepts a `FamilyMember`, computes a persisted selection from `member.avatarSelection` or legacy config, updates the member object on save, and uses labels such as `Avatar van {member.name} bewerken`. `AvatarCatalogControls` is generic and already receives `selection`, `onSelectionChange`, labels, and preview rendering callbacks.

The smallest safe frontend refactor is to extract a generic `AvatarSelectionEditor` component around `AvatarCatalogControls`, then keep `FamilyAvatarEditor` as a thin adapter.

### Family member creation and editing flows

Family member endpoints provide list/get/create/update/delete under `/api/family-members`. Creation and update validate name, child birth date, and avatar input. The frontend `familyMembersApi.ts` maps NSwag-generated DTOs into local `FamilyMember` models and sends both legacy `avatarV2Config` and catalog `avatarSelection` today.

Family member UI is centered on individual member pages rather than a Settings member-management page. Removal copy explicitly says task/motivation references remain preserved.

### Child-mode and adult permission rules

The repository has `FamilyMemberKind.Child` and `FamilyMemberKind.Adult`, plus child/adult presentation differences in the member page. There is no confirmed logged-in adult/child principal, role policy, or backend permission enforcement. Existing behavior should therefore be treated as product-mode UX rather than security authorization.

For contact design, this means server-side invariants should protect household/owner consistency, but child/adult management rules need a future authentication/active-member design before becoming enforceable security.

### Household/family aggregate structure

`Household` is a small aggregate root with `Id`, `Name`, `TimeZoneId`, onboarding state, and timestamps. Most domain records carry `HouseholdId` and restrict household deletion. The current app is effectively single-household through `SeedHousehold.Id` in many endpoints.

Contacts should follow the same household-scoped pattern and avoid existing outside a household.

### Existing navigation and settings/member-management surfaces

Settings currently manages maintenance, calendar sources, backups/restores, and additional widget settings. It is not currently a people directory. Family members are managed through member pages and onboarding/member surfaces. A contact management feature should avoid turning Settings into a large document page because primary pages must avoid document-level vertical scrolling.

### Task, shopping-item, and agenda-event persistence and contracts

- Tasks persist `Title`, optional `DueDate`, `TaskOwnershipKind`, optional `FamilyMemberId`, recurrence/lifecycle fields, and timestamps. This is a semantic ownership model and must stay distinct from decorative badges.
- Shopping list items persist `Text`, completion/deletion state, optional preferred store, and timestamps. They have no person reference.
- Event series persist title, description, location, time/date, recurrence, provider metadata, and timestamps. Event exceptions can override title/description/location/time fields. Imported/provider events include provider IDs/revisions/fingerprints.

### Search, normalization, localization, and fuzzy utilities

No general person-search, fuzzy matching, relationship alias, or text normalization utility was found for people. Existing normalization is domain-specific, such as shopping purchase history normalized text and avatar selection normalization. The frontend has localized shopping list-name recognition for `shopping`/`boodschappen`, but not a broader localization subsystem for relationship terms.

### Backup, restore, migrations, and API compatibility implications

Calendar portability exports/restores only calendar data and event sources. Adding contacts alone does not affect current backups/restores. Adding decorative calendar badges later requires deciding whether those fields are included in calendar export, ignored for imported events, or treated as local-only metadata.

API compatibility is currently generated through NSwag/OpenAPI. New endpoints and DTOs will update the generated client. Existing family member avatar data does not need migration if contacts are separate.

### Existing test patterns

Backend tests use xUnit and WebApplicationFactory-style API tests. Frontend tests use Vitest/Testing Library and include focused tests for avatar catalog, family members, settings, tasks, shopping, and agenda widgets. Future contact work should mirror these patterns: backend endpoint/persistence tests and frontend component/API mapping tests.

## 3. Product Interpretation

The product intent is a lightweight visual people catalog, not a permissions or relationship graph system.

**Confirmed requirement interpretation**

- Contacts are not household users.
- Contacts are not login accounts.
- Contacts are not task owners, event participants, agenda attendees, shopping recipients, or permission principals.
- Contacts can have avatars and labels that help families visually recognize people.
- Decorative avatar attachment is optional and user-controlled.
- Suggestions may rank likely people but must never automatically attach or replace an avatar.

**Terminology recommendation**

Use these terms consistently:

- **Contact**: a non-household person record.
- **Family contact**: contact shared by the household.
- **Member contact**: contact owned by one `FamilyMember`.
- **Avatar badge**: user-facing label for a decorative avatar attached to an item.
- **DecorativeAvatarId**: API/domain property name for the optional badge reference.

Avoid `VisualPersonId` because it implies a generic person abstraction and may blur the member/contact separation. Avoid `DisplayAvatarId` because “display avatar” sounds like the avatar of the item itself rather than a decorative badge. `AvatarBadgeId` is friendly but less explicit in persistence/API contracts. `DecorativeAvatarId` best encodes the non-semantic rule.

## 4. Domain Model Options

### Option A: Separate Contact entity with its own AvatarSelection

**Shape**

- `Contact` table with `Id`, `HouseholdId`, `Scope`, nullable `OwnerFamilyMemberId`, `DisplayName`, `RelationshipLabel`, `Nickname`, `Initials`, `DisplayColor`, `AvatarSelection`, soft-delete fields, timestamps, and optional `CreatedByFamilyMemberId`.

**Assessment**

- Aggregate ownership: household-scoped; member-specific contacts have a constrained owner.
- Lifecycle: independent from `FamilyMember`; soft-delete contacts like members.
- Deletion behavior: deleting a contact clears decorative references or leaves snapshot depending future badge design.
- Identifiers: use `Guid` or string slug. `Guid` is safer for duplicate names.
- Display names and duplicates: duplicate names allowed with non-unique indexes.
- Avatar selections: reused directly through catalog validation.
- Scope/visibility: explicit and enforceable.
- Migration complexity: low; no existing member migration.
- Future extensibility: can add relationship aliases/nicknames without affecting members.

**Pros**

- Preserves the requirement that contacts are structurally separate from `FamilyMember`.
- Avoids migration risk to existing references.
- Keeps semantic member references intact.
- Allows distinct privacy and lifecycle behavior.

**Cons**

- Picker read models must merge `FamilyMember` and `Contact` candidates.
- Some avatar editor refactoring is needed for reuse.

### Option B: Shared Person entity used by FamilyMember and Contact

**Shape**

- Introduce `Person` as the core avatar/display record. `FamilyMember` and `Contact` reference or derive from `Person`.

**Assessment**

- Aggregate ownership: more complex; semantic member and lightweight contacts share a base identity.
- Lifecycle: deleting/promoting/converting becomes ambiguous.
- Migration complexity: high because existing `FamilyMember` primary keys and references would need adaptation or duplication.
- Future extensibility: broad but invites family-tree, participant, and permission abstractions.

**Pros**

- Unified avatar profile model.
- Could simplify picker candidates in the long term.

**Cons**

- Violates the “keep contacts structurally separate unless repository evidence strongly supports another model” direction.
- High migration risk with little current benefit.
- Risks making contacts look like principals or task/event participants.

### Option C: Contact entity referencing reusable AvatarProfile entity

**Shape**

- `AvatarProfile` stores display identity and avatar selection. `FamilyMember` and `Contact` reference an `AvatarProfile`.

**Assessment**

- Aggregate ownership: avatar becomes its own aggregate or owned dependent shared by two aggregates.
- Lifecycle: profile deletion/snapshot rules become central.
- Migration complexity: moderate to high if existing members move to profiles.
- Future extensibility: supports neutral decorative references cleanly.

**Pros**

- Good long-term shape for `DecorativeAvatarId`.
- Avoids polymorphic item fields.

**Cons**

- Too much upfront refactor for Phase 1.
- Requires migrating family member avatars or maintaining two systems.
- Sharing a mutable avatar profile may surprise users if item badges change everywhere.

### Option D: Repository-native alternative — read-model AvatarIdentity only

**Shape**

- Keep `FamilyMember.AvatarSelection` and `Contact.AvatarSelection` separately. Add a lightweight `AvatarIdentity`/`AvatarPickerCandidate` read DTO that unifies them for picker display. Later, decorative item references use `DecorativeAvatarRef` with source kind/id plus snapshot.

**Assessment**

- Aggregate ownership: no new shared aggregate in Phase 1.
- Lifecycle: source entities remain authoritative.
- Migration complexity: low.
- Future extensibility: enough for picker and badges without person abstraction.

**Pros**

- Matches the current repository style: simple entities, DTO projection, minimal abstractions.
- Avoids polymorphic database constraints in initial contact work.

**Cons**

- Later badge references still need a persistence decision.

## 5. Recommended Contact Model

**Recommendation:** implement Option A in Phase 1, with Option D read models for picker surfaces.

### Proposed `Contact` entity

```text
Contact
- Id: Guid
- HouseholdId: Guid
- Scope: ContactScope // Family or Member
- OwnerFamilyMemberId: string? // required when Scope == Member; null when Scope == Family
- DisplayName: string // required, max 120 or 160
- RelationshipLabel: string? // optional user-facing label, max 80
- Nickname: string? // optional, max 80
- Initials: string // required/fallback, max 8
- DisplayColor: string // required/fallback, max 32
- AvatarSelection: AvatarSelection // jsonb, required via default normalization
- IsDeleted: bool
- DeletedUtc: DateTimeOffset?
- CreatedByFamilyMemberId: string? // optional audit/product context, not permissions
- CreatedUtc: DateTimeOffset
- UpdatedUtc: DateTimeOffset
```

### ContactScope

```text
ContactScope
- Family
- Member
```

### Identifier recommendation

Use `Guid` contact IDs rather than name slugs. Duplicate names are an explicit requirement, and contact names may be short, localized, or relationship-only (`Oma`, `Teacher`). GUIDs avoid confusing URL/id conflicts and do not require slug uniqueness logic.

### Display names, relationships, and nicknames

- `DisplayName` is required and should be the primary label: `Uncle Frank`, `Oma`, `Juf Sara`, `Tim`.
- `RelationshipLabel` is optional and controlled/free-form initially: `uncle`, `grandma`, `teacher`, `friend`.
- `Nickname` is optional and used for suggestions/display hints: `Oma Joke`, `Mr. T`, `Juf Sara`.
- Duplicate `DisplayName`, duplicate `RelationshipLabel`, and duplicate nicknames must be allowed.

### Avatar selection

Contacts should use the same catalog-backed `AvatarSelection` and required catalog selections as family members. This keeps editor/rendering behavior consistent and avoids a second avatar quality tier. If a contact is created without avatar choices, use `AvatarCatalogService.DefaultSelection()` and allow initials/color fallback in UI while the SVG avatar loads.

## 6. Ownership, Scope, and Permissions

### Recommended fields and invariants

Use `HouseholdId`, `ContactScope`, nullable `OwnerFamilyMemberId`, and optional `CreatedByFamilyMemberId`.

Invariants:

- A family contact belongs to exactly one household.
- A family contact has `Scope == Family` and `OwnerFamilyMemberId == null`.
- A member contact belongs to exactly one household and exactly one owner family member.
- A member contact has `Scope == Member` and non-null `OwnerFamilyMemberId`.
- The owner family member must belong to the same household and should not be deleted at creation time.
- Contacts cannot exist outside a household.
- Contacts cannot authenticate, receive permissions, own tasks, participate in events, or become task owners.
- Duplicate names are allowed.
- Deleting a contact soft-deletes it and removes it from future picker candidate lists.
- Deleting a contact must safely clear or retire future decorative avatar references according to the chosen badge design.
- Deleting a family member should soft-delete or hide that member's private contacts, not promote them automatically.

### Visibility and management recommendation

Because the repository does not have enforceable user auth/roles, the safest initial product rule is:

- **Family contacts:** visible to everyone using household-wide UI.
- **Member contacts:** associated with one member and visible in that member's people context and picker context.
- **Adults:** can manage all contacts in the current household UI.
- **Children:** should not get unrestricted contact management in Phase 1. If child mode exposes contacts, start with view/select only for contacts already created for that child.

This mirrors existing product-mode behavior without pretending there is backend security. When real authentication arrives, member contacts can become visible only to owner + adults, but that is not enforceable today.

### FamilyMember deletion behavior

If a `FamilyMember` with private contacts is soft-deleted:

1. Keep contacts in the database for audit/restore safety.
2. Mark owner-member contacts as not visible by default because the owner is deleted.
3. Do not automatically convert them to family contacts.
4. Consider a later adult-only cleanup/promote flow.

## 7. Contact Management UX Placement

### Options evaluated

#### Dedicated Contacts section under Settings

- Pros: obvious administrative area; low navigation changes.
- Cons: Settings is already maintenance-heavy and viewport-sensitive; contacts are everyday family content, not technical settings.

#### People section combining Family Members and Contacts

- Pros: user-friendly; matches mental model; shared avatar editor fits both.
- Cons: requires adding a new primary/secondary surface and careful distinction between household members and contacts.

#### Contact management inside each FamilyMember profile

- Pros: natural for member-specific contacts; parents can manage Thomas's friends from Thomas's page.
- Cons: poor place for shared family contacts; duplicate management across members.

#### Household-level Family & Contacts page

- Pros: clear shared directory; can show family members, shared contacts, and member contacts.
- Cons: may be too large if it replaces current member surfaces.

#### Inline “Create contact” from avatar picker

- Pros: efficient when user is adding a birthday/shopping/task item.
- Cons: easy to create duplicates; scope/owner decisions can be confusing in-context.

#### Hybrid central management plus inline creation

- Pros: best long-term UX; central source of truth and low-friction creation.
- Cons: more UI and permission complexity.

### Recommendation

Use a **hybrid model**, staged:

- Phase 1: central **People** area with tabs/sections for `Family members`, `Family contacts`, and `Member contacts`. If a new primary navigation item is too much, place a `People` card/action inside Settings that opens a bounded people-management surface.
- Member-specific contacts can also be managed from a `Contacts` section on each FamilyMember page, but only as a shortcut to the same contact editor model.
- Phase 2: avatar picker supports selecting existing contacts only.
- Phase 3: inline contact creation from picker can be added behind a deliberate “Create new contact” action after duplicate handling and scope copy are validated.

### Specific UX recommendations

- Shared family contacts are created in the People/Contacts management surface.
- Member-specific contacts are created from the owner member's profile or from People with an owner selector.
- Adults manage a child's contacts through the child member's contact section or People owner filter.
- Children should not create contacts in Phase 1 unless a parent/adult mode is later confirmed.
- The picker should show scope badges: `Gezin` / `Van Thomas`, or English equivalents if localized.
- Promote personal-to-shared should not be Phase 1. Later, support a clear adult-only “Share with family” action that changes scope and clears owner.
- Duplicate people should be allowed. The UI should disambiguate by relationship/scope/avatar, not force deduplication.

## 8. Avatar-System Reuse

### Assumptions that currently bind avatars to FamilyMember

- Backend `FamilyMember` owns `AvatarV2Config` and `AvatarSelection`.
- Family member DTOs include avatar fields directly.
- `FamilyMemberEndpoints` contains private helpers for avatar resolution and DTO conversion.
- Frontend `FamilyAvatarEditor` requires a `FamilyMember` object.
- Frontend `FamilyAvatar` renders a member, not a generic avatar-bearing profile.
- API client mapping for avatars is located in `familyMembersApi.ts`.

### What can be reused directly

- `AvatarSelection` value object.
- `AvatarCatalogService.ValidateForWrite` and default normalization.
- `AvatarCatalogControls`.
- Frontend catalog adapter and renderer (`avatarSelectionToAvatarV2RenderConfig`, `renderAvatarV2Svg`).
- Existing backend and frontend avatar catalog tests as patterns.

### Smallest safe refactor

1. Backend: extract shared helper methods for avatar DTO conversion and `ResolveAvatarSelection` from `FamilyMemberEndpoints` into an avatar endpoint/domain helper, or duplicate minimally in a first contact endpoint if the project prefers low abstraction.
2. Frontend: extract a generic `AvatarSelectionEditor` that accepts:
   - `displayName`
   - `selection`
   - `onSave(selection)`
   - `onClose()`
3. Keep `FamilyAvatarEditor` as a wrapper and add `ContactAvatarEditor` as another wrapper.
4. Add a generic `AvatarBadge`/`AvatarPreview` component that renders from `AvatarSelection` and initials/color, without requiring `FamilyMember`.

### Retired catalog items

Contacts should follow the same rule as family members: retired items cannot be newly selected. Existing contact selections should remain renderable where possible and normalize missing optional selections to defaults. If a retired item is removed entirely from the catalog, the existing avatar will need replacement/default migration, same as family members.

## 9. Decorative Avatar Reference Design

### Options evaluated

#### Polymorphic person reference (`FamilyMember` or `Contact`)

- Pros: direct and simple DTO shape.
- Cons: relational integrity is weak; tasks/list/events would need source type + source ID; deletion handling is custom; it looks semantic.

#### Shared AvatarIdentity entity

- Pros: clean FK target for `DecorativeAvatarId`; supports both members and contacts.
- Cons: requires introducing and keeping a derived identity table in sync.

#### Separate `FamilyMemberAvatarId` and `ContactAvatarId` fields

- Pros: database FKs are straightforward.
- Cons: awkward API shape; two nullable fields; encourages semantic member/contact branching everywhere.

#### Neutral `AvatarProfileId`

- Pros: best API vocabulary and FK shape.
- Cons: only low-risk if introduced as a read identity or owned derived row, not by migrating all member/contact data immediately.

#### Snapshot of avatar configuration on each item

- Pros: preserves badge even after contact deletion/rename; no joins.
- Cons: duplicates JSON everywhere; item records become heavier; hard to update intentionally.

### Recommendation

Use a neutral **DecorativeAvatarId** in item contracts, backed by a new **AvatarProfile** read identity only when decorative badges are implemented.

Recommended future shape:

```text
AvatarProfile
- Id: Guid
- HouseholdId: Guid
- SourceKind: FamilyMember | Contact
- FamilyMemberId: string?
- ContactId: Guid?
- DisplayNameSnapshot: string
- InitialsSnapshot: string
- DisplayColorSnapshot: string
- AvatarSelectionSnapshot: jsonb
- IsDeletedSource: bool
- CreatedUtc
- UpdatedUtc
```

Item fields:

```text
HouseholdTask.DecorativeAvatarId: Guid?
ListItem.DecorativeAvatarId: Guid?
EventSeries.DecorativeAvatarId: Guid?
EventException.DecorativeAvatarId: Guid? // only if occurrence override can differ
```

Why this design:

- `DecorativeAvatarId` is neutral and clearly non-semantic.
- Items have one FK, not polymorphic source fields.
- Rendering can use snapshots, so contact rename/deletion does not break historical badges unexpectedly.
- Deleting a source person can mark the profile source deleted while preserving or clearing item badges by product policy.
- API can describe the field as “visual badge only; does not imply ownership/participation.”

Deletion recommendation:

- Phase 2 should clear `DecorativeAvatarId` when a contact/avatar profile is deleted if keeping snapshots feels privacy-sensitive.
- Longer term, consider preserving a snapshot for family members and shared contacts, but clearing private member contacts when the owner/contact is deleted.

Calendar-specific considerations:

- Imported/read-only external events should not send decorative badge changes back to providers.
- Store local badge metadata only in HomeOps tables.
- For recurring series, put the badge on `EventSeries` by default. Only add `EventException.DecorativeAvatarId` if users need occurrence-specific overrides.
- Calendar export must decide whether to include local badges; the safest first calendar phase is local-only and not exported until contacts/avatar profiles are included in an export format.

## 10. Smart Suggestion Ranking

### Architecture recommendation

Use deterministic, testable ranking with a hybrid boundary:

- Backend returns a bounded candidate list of family members + visible contacts for the current household/context.
- Frontend performs instant ranking for typed item titles using local deterministic logic.
- Backend can later expose the same ranker for server-side tests or large households, but current household sizes are likely small.

No LLM or external AI is justified. The matching problem is small, private, deterministic, and needs predictable false-positive controls.

### Candidate fields

```text
AvatarPickerCandidate
- avatarProfileId or source reference
- sourceKind: FamilyMember | Contact
- displayName
- relationshipLabel?
- nickname?
- scope: FamilyMember | FamilyContact | MemberContact
- ownerFamilyMemberId?
- avatarSelection
- initials
- displayColor
- recentlySelectedRank? // optional later
```

### Normalization rules

- Lowercase with invariant culture plus locale-aware display labels.
- Trim whitespace.
- Remove diacritics for matching (`cadeau voor oma` should match `Oma`).
- Replace punctuation with spaces.
- Split into tokens on whitespace.
- Keep original display string for exact full-name comparison.
- Remove very short stop tokens from fuzzy matching, but keep meaningful short names (`Bo`, `Jo`) if candidate name length is short.
- Do not stem arbitrary words; use explicit alias dictionaries for relationships.

### Relationship aliases

Start with a small local dictionary and make it test data, not AI:

```text
grandma: grandma, grandmother, gran, granny, oma, grootmoeder
 grandpa: grandpa, grandfather, opa, grootvader
 uncle: uncle, oom
 aunt: aunt, tante
 teacher: teacher, juf, meester, leraar, lerares
 babysitter: babysitter, oppas
 friend: friend, vriend, vriendin
 neighbor: neighbor, neighbour, buur, buurman, buurvrouw
classmate: classmate, klasgenoot, klasgenootje
```

### Scoring table

| Signal | Suggested points | Notes |
|---|---:|---|
| Exact normalized full display name appears as phrase | 100 | `Uncle Frank` in title. |
| Exact nickname phrase appears | 95 | Strong because nicknames are user-entered. |
| Exact first-name/display token match | 80 | `Frank` matches `Uncle Frank`. |
| Exact relationship alias token match | 50 | `uncle` matches relationship `Uncle`. |
| Relationship + name both match | +60 bonus | Prevents `Uncle Frank` ambiguity. |
| Prefix name match | 35 | `Fran` -> Frank after minimum length. |
| Substring name match | 20 | Only for candidate token length >= 4 and query token length >= 4. |
| Small spelling distance | 25 | Only Levenshtein distance 1 for tokens length 4-7 or distance 2 for length >= 8. |
| Candidate is member-specific to current member context | +15 | Only when current member context is known. |
| Candidate is shared family contact | +5 | Mild default availability boost. |
| Recent manual selection | +5 to +15 | Later only, local/household-safe. |
| Candidate is deleted/hidden | exclude | Never rank. |

### False-positive controls

- Do not show suggestions when top score is below 50.
- Do not use substring matching against long food/common words unless a candidate token also matches. Example: `Frankfurter sausages` must not strongly suggest Frank because `frank` is only a substring inside `frankfurter`; require word boundary or exact token for person names.
- Relationship-only matches should show at most 3 suggestions and label them as broad suggestions.
- If multiple candidates tie within 10 points, show them as ambiguous suggestions, not a single highlighted choice.
- Never auto-select.

### Example evaluation

| Text | Expected ranking behavior |
|---|---|
| `Present for Uncle Frank` | Candidate named Frank + relationship Uncle wins. Uncle contacts without Frank rank lower. Other Franks rank near top. |
| `Cadeau voor oma` | Contacts with relationship grandma/oma rank. Candidate named Oma also ranks. |
| `Playdate with Tim` | Family/member contacts or members named Tim rank by exact token. Friends/classmates with Tim rank above unrelated Tim only if scope/context matches. |
| `Flowers for teacher` | Contacts with relationship teacher/juf/meester rank. Do not require a name. |
| `Call grandpa Theo` | Theo with grandpa relationship wins; other Theos and grandpa contacts follow. |
| `Frankfurter sausages` | No suggestion, because `Frank` is not a standalone token. |
| `Ask Uncle Frank about Grandma` | Frank/Uncle likely top; Grandma also shown. If both are strong, show multiple suggestions and require user choice. |

### Pseudocode

```text
rankCandidates(title, candidates, context):
  normalizedTitle = normalize(title)
  titleTokens = tokenize(normalizedTitle)
  aliases = expandRelationshipAliases(titleTokens, locale)

  results = []
  for candidate in candidates where candidate.visible:
    names = normalizePhrases([candidate.displayName, candidate.nickname])
    nameTokens = tokenize(names)
    relationshipKeys = normalizeRelationship(candidate.relationshipLabel)

    score = 0
    if phraseContains(normalizedTitle, candidate.displayName): score += 100
    if candidate.nickname && phraseContains(normalizedTitle, candidate.nickname): score += 95
    if anyExactToken(titleTokens, firstNameOrNameTokens(candidate)): score += 80
    if relationshipMatches(titleTokens, aliases, relationshipKeys): score += 50
    if nameMatched && relationshipMatched: score += 60
    if safePrefixMatch(titleTokens, nameTokens): score += 35
    if safeSubstringMatch(titleTokens, nameTokens): score += 20
    if safeEditDistanceMatch(titleTokens, nameTokens): score += 25
    if context.currentFamilyMemberId == candidate.ownerFamilyMemberId: score += 15
    else if candidate.scope == FamilyContact: score += 5
    score += recentSelectionBoost(candidate, context)

    if score >= 50: results.add(candidate, score, matchedReasons)

  sort by score desc, exact-name before relationship-only, scope relevance, displayName
  return top 5 suggestions plus Show all people action
```

### Picker grouping

The picker should display:

1. Suggested people.
2. Family members.
3. Family contacts.
4. Member contacts, grouped by owner or filtered to the current member context.
5. `Show all people` opens the full grouped list with search.

## 11. API and Persistence Impact

### Proposed endpoints

```text
GET    /api/contacts?scope=all|family|member&ownerFamilyMemberId={id}&includeDeleted=false
POST   /api/contacts/family
POST   /api/family-members/{memberId}/contacts
GET    /api/contacts/{contactId}
PUT    /api/contacts/{contactId}
DELETE /api/contacts/{contactId}
PUT    /api/contacts/{contactId}/avatar-selection
GET    /api/avatar-picker/candidates?contextFamilyMemberId={id?}
POST   /api/avatar-picker/suggestions
```

Alternative: omit `POST /api/avatar-picker/suggestions` in Phase 1/2 and rank on the frontend after `GET /api/avatar-picker/candidates`.

### DTO sketch

```text
ContactDto
- id
- householdId
- scope
- ownerFamilyMemberId
- displayName
- relationshipLabel
- nickname
- initials
- displayColor
- avatarSelection
- createdUtc
- updatedUtc

CreateFamilyContactRequest
- displayName
- relationshipLabel?
- nickname?
- initials?
- displayColor?
- avatarSelection?

CreateMemberContactRequest
- displayName
- relationshipLabel?
- nickname?
- initials?
- displayColor?
- avatarSelection?

AvatarPickerCandidateDto
- id // avatarProfileId eventually, source reference earlier
- sourceKind
- sourceId
- displayName
- relationshipLabel?
- nickname?
- scope
- ownerFamilyMemberId?
- initials
- displayColor
- avatarSelection
```

### EF Core changes

- Add `Contacts` DbSet.
- Add `ContactScope` enum conversion string, max length 16.
- Add `AvatarSelection` jsonb conversion matching `FamilyMember`.
- Add FK `Contact.HouseholdId -> Households.Id` restrict.
- Add FK `Contact.OwnerFamilyMemberId -> FamilyMembers.Id` restrict.
- Add optional FK `CreatedByFamilyMemberId -> FamilyMembers.Id` restrict/no action.
- Add check constraint equivalent in migration:
  - family scope requires null owner;
  - member scope requires non-null owner.
- Indexes:
  - `(HouseholdId, IsDeleted, DisplayName)`
  - `(HouseholdId, Scope, IsDeleted, DisplayName)`
  - `(HouseholdId, OwnerFamilyMemberId, IsDeleted, DisplayName)`
  - optional `(HouseholdId, RelationshipLabel)` for suggestions, not unique.

### Serialization/API compatibility

Adding contacts is additive. Existing family member DTOs and item DTOs can remain unchanged in Phase 1. Generated NSwag client changes only after endpoints are added.

## 12. Frontend Impact

### Likely frontend work

- Add contacts API module or generated client wrappers.
- Add `Contact` model and mapping utilities.
- Extract generic avatar editor component from `FamilyAvatarEditor`.
- Add generic `AvatarBadge` renderer that accepts selection/name/color instead of `FamilyMember`.
- Add People/Contacts management page or Settings sub-surface with fixed-height regions and internal scrolling.
- Add contact editor with:
  - display name;
  - relationship label;
  - nickname;
  - scope;
  - owner family member selector for member contacts;
  - avatar editor.
- Add avatar picker with:
  - suggested state;
  - grouped all-people state;
  - search/filter;
  - clear badge action;
  - no automatic attach.
- Add accessibility labels that distinguish decorative badges from assignment.
- Ensure touch targets match existing compact action patterns.
- Respect no-page-scroll primary page constraints by using reserved panels and internal lists.

### Minimum viable flow

1. Adult opens People/Contacts management.
2. Creates a family contact or selects a member owner and creates a member contact.
3. Chooses an avatar using the shared avatar editor.
4. Contact appears in People and future picker candidate list.
5. No task/shopping/agenda item changes in Phase 1.

### Child-mode restrictions

Child-mode UI may show member-specific contacts only as visual choices in a picker later, not as a management surface. Because there is no backend auth, do not present child creation/edit/delete as a protected capability yet.

## 13. Privacy and Data-Minimization

### Recommended initial contact data

Keep contacts limited to:

- display name;
- relationship label;
- nickname;
- avatar selection;
- initials/color fallback;
- scope/owner metadata.

Explicitly exclude from initial scope:

- phone numbers;
- addresses;
- email;
- birthdays;
- notes;
- school/classroom details beyond optional relationship label;
- messaging identifiers;
- imported address book identifiers.

### Visibility recommendation

- Shared contacts are visible to household-wide UI.
- Member contacts are visible in contexts for the owning member and adult management UI.
- Adults can manage all contacts in the product model, but backend security should not claim this until authentication exists.
- Children should not manage contacts in Phase 1.

### Privacy posture

Contacts can represent children, teachers, babysitters, classmates, and neighbors. The smallest privacy surface is intentional: no real-world contact details, no hidden notes, no automatic extraction from task/event text, no external sync.

## 14. Migration and Compatibility

### Existing family member avatar data

No migration is required if contacts are separate. Existing `FamilyMember.AvatarSelection` stays in place.

### Shared Person abstraction risk

A shared `Person` abstraction would require migrating existing `FamilyMember` identity/avatar data or adding synchronization. This is unnecessary risk because current member references are semantic and must remain distinct from contacts.

### Backups/restores

- Phase 1 contacts do not affect calendar portability.
- If a future whole-household export exists, contacts should be included after family members and before decorative badge references.
- If calendar decorative badges are added, the calendar export format must either include avatar profile/contact references or explicitly omit local badges.

### API versioning

Additive contact endpoints are low risk. Adding `DecorativeAvatarId` to task/list/event DTOs is additive if nullable and optional, but generated frontend client tests should be updated.

### Renderer consumers

Existing consumers that render `FamilyMember` avatars continue unchanged if generic avatar components are introduced alongside wrappers. Do not break `FamilyAvatar` in Phase 1.

### Tests

Expected tests for future implementation:

- Backend contact validation and persistence tests.
- Contact endpoint tests for family/member scope invariants.
- Avatar catalog validation reuse tests for contact writes.
- Frontend contact API mapping tests.
- Generic avatar editor tests.
- Picker ranking unit tests with example phrases.
- Later item contract tests for nullable `DecorativeAvatarId` clearing behavior.

### Feature flags/staged rollout

A feature flag is optional for contacts but useful for decorative badges because badges affect primary product pages. Phase the rollout by enabling contact management first, then one product area's badge UI, then suggestions.

## 15. Phased Implementation Plan

### Phase 1: Contact domain and avatar reuse

Build:

- `Contact` domain and persistence.
- `ContactScope` with family/member invariants.
- Contact CRUD endpoints.
- Visible contact list endpoint.
- Shared versus member-specific scope.
- Central People/Contacts management surface.
- Member profile shortcut for that member's contacts if it fits the existing page.
- Generic avatar editor extraction.
- Contact avatar editing using existing avatar catalog and validation.
- Backend/frontend tests for contact scope, avatar validation, and editor reuse.

Do not build:

- decorative task/shopping/agenda references;
- suggestion ranking;
- inline contact creation from item pickers;
- promotion/share workflow unless explicitly requested.

### Phase 2: Manual decorative avatar badge in one product area

Recommended lowest-risk area: **shopping list items**.

Rationale:

- Shopping list items have simple text-based records and no existing owner/participant semantics.
- A shopping item like `Birthday present for Grandma` naturally benefits from a visual badge without modeling a recipient.
- The API surface is smaller than recurring calendar events and less semantically loaded than task assignment.

Build:

- Neutral nullable `DecorativeAvatarId` on `ListItem` or a sidecar local badge table.
- Avatar picker that lists candidates manually.
- Clear badge action.
- Rendering that labels the avatar as decorative.
- Deletion behavior that clears badges or uses an avatar profile snapshot according to the final privacy decision.

Do not build:

- auto-matching;
- suggestions;
- badges on tasks/events;
- multiple badges per item.

### Phase 3: Deterministic suggestions and broader decorative support

Build:

- Deterministic ranking utility and tests.
- Relationship alias dictionary with Dutch and English initial aliases.
- Picker suggested state with `Show all people`.
- Optional backend suggestion endpoint only if frontend-only ranking becomes inadequate.
- Extend decorative badge support to tasks and agenda events after preserving non-semantic wording.

Do not build:

- LLM/external AI matching;
- automatic attachment or replacement;
- semantic participants/recipients;
- contact-based permissions;
- detailed address book fields.

## 16. Risks and Open Questions

### Risks

- Without authentication, child/adult visibility cannot be enforced as security.
- A People page can become too large and violate no-page-scroll rules if not designed with reserved regions and internal scrolling.
- Contacts and family members with duplicate names require careful UI disambiguation.
- Decorative badges can be misunderstood as assignment/participation unless labels and API names stay neutral.
- Calendar recurrence and imported event behavior is more complex than shopping/task badges.
- Avatar profile snapshots trade privacy deletion expectations against visual continuity.

### Open product decisions

- Should member contacts be visible to all adults in the current no-auth product model, or hidden except in owner member context?
- Should deleting a contact clear all decorative badges or preserve a snapshot?
- Should children ever create/manage their own contacts before authentication exists?
- Should relationship labels be free-form, selected from suggestions, or both?
- Should personal contacts be promotable to family contacts in Phase 1 or later?
- Should recent selections be stored locally per device or in the household database?

## 17. Recommended Next Slice

Create a viewport-first design report for the People/Contacts management surface, then implement Phase 1 contact persistence and minimal management UI.

The next implementation slice should be limited to:

1. Contact entity, migration, endpoints, and backend tests.
2. Generic avatar editor extraction and contact editor UI.
3. A bounded People/Contacts management surface.
4. State/roadmap documentation updates required by repository governance.

It should not modify tasks, shopping, agenda, or decorative badge contracts yet.

## 18. Files Reviewed

### Backend

- `src/HomeOps.Api/FamilyMembers/FamilyMember.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberDtos.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberKind.cs`
- `src/HomeOps.Api/AvatarCatalog/AvatarSelection.cs`
- `src/HomeOps.Api/AvatarCatalog/AvatarCatalogService.cs`
- `src/HomeOps.Api/AvatarCatalog/AvatarCatalogValidator.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Tasks/HouseholdTask.cs`
- `src/HomeOps.Api/Tasks/TaskDtos.cs`
- `src/HomeOps.Api/Lists/ListItem.cs`
- `src/HomeOps.Api/Lists/ListDtos.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/Households/Household.cs`

### Frontend

- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatar.tsx`
- `src/HomeOps.Client/src/home/familyMembersApi.ts`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.ts`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalogAdapter.ts`
- `src/HomeOps.Client/src/avatarCatalog/AvatarCatalogControls.tsx`
- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/tasks/tasksApi.ts`
- `src/HomeOps.Client/src/shopping/listsApi.ts`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`

### Tests and documentation patterns

- `tests/HomeOps.Api.Tests/Lists/FamilyMemberApiTests.cs`
- `tests/HomeOps.Api.Tests/Lists/AvatarCatalogTests.cs`
- `tests/HomeOps.Api.Tests/Lists/ListApiTests.cs`
- `tests/HomeOps.Api.Tests/Lists/TaskApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.test.tsx`
- `src/HomeOps.Client/src/home/familyMembersApi.test.ts`
- `src/HomeOps.Client/src/settings/SettingsDashboard.test.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `src/HomeOps.Client/src/shopping/listsApi.test.ts`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.test.ts`
