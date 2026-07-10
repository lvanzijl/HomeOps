# Avatar Contacts V1 Design Specification

## 1. Executive Summary

### Repository-confirmed findings

- The current canonical avatar-bearing domain entity is `FamilyMember`. It is household-scoped, soft-deleted, and owns both legacy `AvatarV2Config` columns and the newer catalog-backed `AvatarSelection` JSON value.
- The avatar catalog, validation, defaults, and renderer bindings are already reusable. Backend validation accepts an `AvatarSelection` without depending on a `FamilyMember` instance, and frontend `AvatarCatalogControls` already works with generic selection state.
- The current frontend editor is still family-member-shaped. `FamilyAvatarEditor` receives a `FamilyMember`, saves by returning an updated member, and uses member-specific labels.
- Existing task ownership, recurring task ownership, motivation goals, and helpful moments use `FamilyMemberId` for semantic product meaning. Avatar Contacts must not be allowed into those relationships.
- Shopping list items and calendar event series currently have no person/avatar reference, which keeps V1 free from decorative-reference migrations.
- The existing repository has presentation-level child/adult concepts through `FamilyMemberKind`, but no authentication or authorization model that could enforce child permissions securely.

### Product decisions

- Introduce a new lightweight entity named **KnownPerson** for non-family-member people.
- Do not introduce a generic `Person` base class.
- Do not introduce `AvatarProfile`, avatar snapshots, or future decorative-reference persistence in V1.
- Keep `FamilyMember` as its own semantic entity and keep all semantic ownership references pointing only at `FamilyMember`.
- Use scope terminology for where a known person belongs: `Shared` and `PrivateToMember`.
- Model relationships with a normalized enum plus an optional custom display label.
- Treat **People** as a product capability, not necessarily a dedicated page; private known people primarily belong with their owning family member.
- Decorative avatars for shopping, tasks, and agenda events remain out of scope for V1 implementation.

### Architectural recommendation

Avatar Contacts V1 should add a household-scoped `KnownPerson` aggregate that directly owns an `AvatarSelection`, mirrors the useful display fields from `FamilyMember`, and participates only in known-person management and future avatar picker read models. The system should treat known people as lightweight visual identities, not principals, assignees, attendees, recipients, or account holders.

## 2. Product Vision

FamilyBoard avatars should become reusable identity visuals without turning every recognizable person into a household user. Families often need lightweight visual references for grandparents, teachers, babysitters, neighbours, friends, classmates, cousins, coaches, and other familiar people. Those people help make household information recognizable, but they should not participate in the application's core semantic models.

Avatar Contacts V1 establishes a **People** catalog for non-family-member identities. A known person has a name, optional nickname, relationship type, optional custom relationship label, color, initials, and avatar selection. A known person exists so the household can recognize a person visually. It does not imply login access, household membership, task responsibility, permissions, calendar attendance, shopping assignment, or motivation ownership.

The V1 product outcome is a clear implementation contract for future backend and frontend slices:

- known people can be created, edited, soft-deleted, and listed;
- known people can be shared with the household or private to one family member;
- known people reuse the same avatar catalog and editor infrastructure as family members;
- known people are available later to picker surfaces as optional decorative candidates;
- no decorative persistence is introduced in V1.

## 3. Current Architecture

### Repository-confirmed: FamilyMember as the current avatar identity

`FamilyMember` currently contains identity and avatar display fields: `Id`, `HouseholdId`, `Name`, `DisplayColor`, `Initials`, `MemberKind`, optional `DateOfBirth`, soft-delete timestamps, legacy `AvatarV2Config`, and catalog `AvatarSelection`.

The EF mapping stores `FamilyMember.AvatarSelection` as `jsonb`, preserves legacy Avatar V2 owned columns, restricts household deletion, and indexes by household/name and household/deletion/name. The current design therefore treats avatar data as owned by the member row, not by a separate avatar profile table.

### Repository-confirmed: avatar catalog reuse points

The backend avatar catalog service provides:

- `DefaultSelection()`;
- legacy Avatar V2 mapping;
- write validation for schema version, slots, item existence, category compatibility, required categories, and retired items;
- normalization with defaults.

These functions are entity-neutral enough to be reused by known people. A known person backend slice should call the same validation service rather than create known person-specific avatar rules.

The frontend avatar system already has a useful split:

- `AvatarCatalogControls` is selection-oriented and reusable;
- `FamilyAvatarEditor` is member-specific and should become a thin wrapper around a generic avatar selection editor;
- renderer functions can render catalog selections through the existing Avatar V2 renderer bridge.

### Repository-confirmed: semantic FamilyMember references

`FamilyMemberId` currently appears in semantic domains such as tasks, recurring task series, task templates, motivation individual goals, and helpful moments. These are not visual references. They encode responsibility, progress, or recognition for household members. Known people must not be accepted by these fields.

### Repository-confirmed: no current decorative target fields

Shopping list items are plain list entries with text, completion state, deletion state, optional preferred store, and timestamps. Calendar event series have title, description, location, recurrence/provider fields, and timestamps. Neither currently stores a person reference. That means Avatar Contacts V1 can avoid migrations in those domains.

## 4. Final Domain Model

### Product decision: entity name

Use **KnownPerson**.

#### Why `KnownPerson` wins

- It describes the backend/domain entity precisely without implying phone, email, or address-book data.
- It clearly means “a known external person” rather than a family member.
- It supports grandparents, teachers, neighbours, friends, classmates, and babysitters without implying application access.
- User-facing copy can still say People, Shared People, and Thomas's People, while backend/API code uses the more precise `KnownPerson` name.
- It is less ambiguous than `HouseholdPerson`, which could sound like a family member or household user.

#### Terminology caveat

The UI should avoid “KnownPeople” and “Known Persons” as user-facing destination labels because they sound technical. The product terminology remains **People**, **Shared People**, and member-scoped labels such as **Thomas's People**, while the implementation entity is `KnownPerson`.

### Recommended entity shape

```text
KnownPerson
- Id: Guid
- HouseholdId: Guid
- Scope: KnownPersonScope
- PrivateToFamilyMemberId: string?
- DisplayName: string
- Nickname: string?
- RelationshipType: KnownPersonRelationshipType
- CustomRelationshipLabel: string?
- Initials: string
- DisplayColor: string
- AvatarSelection: AvatarSelection
- IsDeleted: bool
- DeletedUtc: DateTimeOffset?
- CreatedByFamilyMemberId: string?
- CreatedUtc: DateTimeOffset
- UpdatedUtc: DateTimeOffset
```

### Enums

```text
KnownPersonScope
- Shared
- PrivateToMember
```

```text
KnownPersonRelationshipType
- Friend
- FamilyFriend
- Grandparent
- Uncle
- Aunt
- Cousin
- Teacher
- Coach
- Babysitter
- Classmate
- Neighbour
- Other
```

### Identity boundaries

- `FamilyMember` remains the only entity that can be a semantic family member.
- `KnownPerson` represents a non-family-member person only.
- A `KnownPerson` is never a user, principal, assignee, permissions subject, event attendee, shopping recipient, or motivation subject.
- Known people and family members may be combined only in read models for visual selection and management views.

## 5. Entity Responsibilities

### FamilyMember responsibilities

`FamilyMember` continues to represent a person who belongs to the household model. It owns product semantics such as task assignment, motivation goals, helpful moments, family member pages, onboarding, and adult/child presentation.

`FamilyMember` continues to own its own `AvatarSelection`. Existing legacy `AvatarV2Config` compatibility remains a family-member concern until the broader avatar migration is complete.

### KnownPerson responsibilities

`KnownPerson` represents a lightweight non-member identity. It is responsible for:

- display name;
- optional nickname;
- relationship classification;
- optional custom relationship label;
- initials and display color fallback;
- avatar selection;
- scope within the household;
- soft-delete lifecycle.

`KnownPerson` is not responsible for:

- authentication;
- permissions;
- task ownership;
- recurring task ownership;
- task templates;
- calendar participation;
- shopping ownership or recipients;
- motivation goals;
- household membership;
- external address-book sync;
- email, phone, or address storage.

### Read-model responsibilities

Future picker APIs may project family members and known people into a shared read DTO. That DTO should not become a shared domain base class. It should be a query shape only.

Recommended future read model:

```text
AvatarIdentityCandidate
- SourceType: FamilyMember | KnownPerson
- SourceId: string
- DisplayName: string
- Nickname: string?
- RelationshipType: KnownPersonRelationshipType?
- RelationshipLabel: string?
- Scope: FamilyMember | SharedKnownPerson | PrivateKnownPerson
- PrivateToFamilyMemberId: string?
- Initials: string
- DisplayColor: string
- AvatarSelection: AvatarSelectionDto
```

## 6. Scope Model

### Product decision

Use **scope**, not visibility or ownership, in domain and API terminology. Scope represents where the `KnownPerson` belongs in the product model; it is not a future permission or access-control rule.

The model is:

- **Shared**: belongs to the household as a whole.
- **PrivateToMember**: belongs with one family member and is managed primarily from that member's page.

### Invariants

- Every known person belongs to exactly one household.
- `Scope = Shared` means `PrivateToFamilyMemberId` must be null.
- `Scope = PrivateToMember` means `PrivateToFamilyMemberId` must reference an active, non-deleted `FamilyMember` in the same household.
- A known person cannot move to another household.
- A private known person cannot reference a family member from another household.
- Soft-deleted family members cannot become new private-known person owners.
- If a family member is soft-deleted, existing private known people should remain rows but should be hidden from default people lists unless an administrative recovery view is later added.
- A known person's scope controls management placement and future picker context only; it does not create permissions.
- Shared known people may be listed in all household-level decorative picker contexts.
- Private known people belong with the owning `FamilyMember` and should be listed primarily in that member's context.

### API validation expectations

- Create/update must reject `Shared` known people with a private member id.
- Create/update must reject `PrivateToMember` known people without a valid private member id.
- Create/update must reject unknown enum values.
- Endpoints must filter out `IsDeleted` known people by default.

## 7. Relationship Model

### Product decision

Use a normalized relationship enum plus optional custom label. Do not use only free text.

Recommended enum:

```text
Friend
FamilyFriend
Grandparent
Uncle
Aunt
Cousin
Teacher
Coach
Babysitter
Classmate
Neighbour
Other
```

### Custom label rules

`CustomRelationshipLabel` is optional and user-facing. It should refine the relationship, not replace the normalized type.

Examples:

```text
RelationshipType = Grandparent
CustomRelationshipLabel = Oma Joke
```

```text
RelationshipType = Teacher
CustomRelationshipLabel = Juf Sophie
```

```text
RelationshipType = Other
CustomRelationshipLabel = Logopedist
```

### Display rules

- Primary display should use `DisplayName` when present.
- Relationship display should use `CustomRelationshipLabel` when present; otherwise use localized `RelationshipType` text.
- Picker cards should show enough disambiguation for duplicates: avatar, display name, relationship label, and scope context.

### Why normalized relationships matter

Normalized relationships support deterministic avatar picker suggestions, localization, simple shared-people grouping, and stable UI organization. `FamilyFriend` covers household-level friends who are closer than a generic friend but not family members. Free text alone would make “teacher,” “juf,” “meester,” and “coach” hard to reason about consistently.

## 8. Avatar Ownership

### Product decision

Both `FamilyMember` and `KnownPerson` directly own their own `AvatarSelection`.

### Rules

- Do not create a shared avatar profile table or any avatar snapshot persistence in V1.
- Do not duplicate the avatar catalog.
- Do not create a known person-specific renderer.
- Do not add legacy `AvatarV2Config` columns to known people unless an implementation slice proves they are necessary for temporary renderer compatibility.
- New known people should default to `AvatarCatalogService.DefaultSelection()` when no selection is provided.
- KnownPerson create/update must validate with `AvatarCatalogService.ValidateForWrite()`.
- Retired catalog items must not be newly selectable for known people, matching family member behavior.
- Existing known person selections should normalize missing optional slots to defaults in the same way family member selections do.

### Frontend direction

Refactor toward a generic avatar selection editor:

```text
AvatarSelectionEditor
- title
- previewLabel
- controlsLabel
- persistedSelection
- onSave(selection)
- onClose()
```

Then keep wrappers:

- `FamilyAvatarEditor` adapts `FamilyMember` to `AvatarSelectionEditor`.
- `KnownPersonAvatarEditor` adapts `KnownPerson` to `AvatarSelectionEditor`.

This preserves existing behavior while making known people use the same controls, renderer, validation expectations, and visual quality tier.

## 9. People Management UX

### Product decision

Use a **People** management capability with sections for family members and known people. The eventual frontend UX may be a page, dialog, drawer, or extension of an existing surface; this V1 design does not require People to become a new primary page.

Recommended top-level IA:

```text
People
- Family Members
- Shared People
- Thomas's People
- Robin's People
```

### Why People is the right surface

- A People capability matches how families think about recognizable people without requiring the UX to become a dedicated page.
- It avoids overloading Settings with a high-frequency household editing task.
- It keeps shared known people central while still preserving member-specific contexts.
- It creates a natural future home for picker candidate review without implying phone/email details.

### Alternatives evaluated

#### Dedicated People page

Possible, but not required by this design. A future frontend design may choose a dedicated page if it can reserve fixed viewport regions, show grouped lists, and support shared/private distinctions without crowding the member page.

#### Family Members page only

Not sufficient. Shared people such as grandparents, neighbours, babysitters, and teachers do not belong under one family member. A member-only design would hide shared household context.

#### Settings

Not recommended as the only surface. Settings is already maintenance/configuration oriented, and “people we recognize” is product content, not application configuration. Settings may link to or open the People capability but should not define the whole UX.

#### Member profile only

Useful for private known people, but incomplete for shared people. Member pages should expose quick editing for that member's private people, not become the whole known person directory.

#### Hybrid People + member shortcuts

Recommended as the product principle. Shared known people can be managed centrally. Private known people primarily belong with the owning member and may also be reachable from a central People capability.

### Management and permissions model

There is currently no authentication or active-user model. Therefore all management capabilities are currently available.

The UX should still make private known people feel naturally owned by their member context, especially for children managing their own friends, classmates, and teachers from their own member page. Future authentication can introduce restrictions without changing the `KnownPerson` model.

## 10. Member Page Integration

Private known people primarily belong with their owning `FamilyMember`. Each `FamilyMember` page should include a bounded **People** section for that member's private known people.

Recommended member page section:

```text
Thomas
- Friends
  - Vic
  - Tim
  - Emma

Thomas's People
- visible row/card list of private known people
- Add person
- Edit name, relationship, color, avatar
- link: Manage all People
```

### Requirements

- The section must be internally bounded and must not introduce page-level vertical scrolling on primary pages.
- The section should summarize when there are many private known people, for example showing a limited list and “+N more”.
- Editing should use the same known person editor model as any central People management capability.
- Shared people may be visible as suggestions or references later, but member pages should primarily focus on that member's private people.

### Product rationale

Private known people are often meaningful to a child: classmates, friends, teachers, coaches, or babysitters. Placing them on the member page makes quick editing natural without forcing the household to maintain every private social connection centrally.

## 11. Shared People Management

Shared known people belong in the central People capability. They should be grouped by relationship rather than presented as one flat list. No filtering is required for V1; simple visual grouping is enough.

Recommended shared section:

```text
Shared People
- Family
  - grandparents
  - uncles/aunts/cousins
- School
  - teachers
  - coaches when relevant to the household as a whole
- Helpers
  - babysitters
  - neighbours who help the household
- Friends
  - family friends
  - close neighbours
```

### Shared known person behavior

- Shared known people are visible in household-level management.
- Shared known people are eligible for future decorative picker contexts that are not member-specific.
- Shared known people have no owner member.
- Shared known people are part of the household-level People management capability.
- Shared known people should not appear as task assignees or calendar participants.

### UI terminology

Use:

- People
- Shared People
- Thomas's People
- Robin's People
- Add person
- Edit person
- Relationship
- Avatar

Avoid:

- Address book
- Contacts app
- Phone/address-book entries
- Recipients
- Participants
- Owners
- Assignees

## 12. Smart Avatar Picker

### Product decision

Avatar selection should eventually provide deterministic suggestions, but suggestions must never automatically attach an avatar.

### Intended behavior

When a user edits an item in a future decorative-avatar-capable surface, the picker may show suggested people based on the item text and current context. The user must explicitly choose a suggested person. The application must never silently attach, replace, or infer a decorative avatar.

### Ranking inputs

Future ranking should consider:

- exact display name matches;
- first-name matches;
- nickname matches;
- normalized relationship terms;
- fuzzy matching for minor typos;
- localization aliases such as Dutch family/school terms;
- current family member context;
- scope, with matching private known people ranked higher in that member's context;
- shared known people as household-level fallbacks.

### Non-goals for V1

- No picker algorithm implementation.
- No automatic text scanning that creates known people.
- No automatic decorative attachment.
- No AI-based inference.
- No external known person import.

### UX expectation

Suggested people should be presented as “suggestions,” not as confirmed matches. The picker should make it clear when no avatar is attached.

## 13. Future Decorative Avatar Support

Decorative avatar persistence is intentionally out of scope for V1. The chosen `KnownPerson` architecture naturally supports future decorative avatar references because it provides stable household-scoped identity records without allowing known people into semantic family-member fields.

This document intentionally does not decide the future decorative persistence model. The persistence model for decorative references will be designed in a later Avatar Decorations slice. In particular, this design does not introduce `AvatarProfile`, avatar snapshots, snapshot display names, snapshot initials, snapshot colors, or snapshot avatar selections.

### Why the model supports future shopping/task/agenda decorations

- `FamilyMember` and `KnownPerson` remain separate source entities, preserving semantic member-only fields.
- A future decorative reference can use optional presentation metadata without requiring inheritance or changing task, shopping, or agenda semantics.
- The source distinction keeps a decorative known person reference different from task ownership.
- Shopping items, tasks, and agenda events can each add optional decorative fields later without changing known person fundamentals.

### Decorative reference deletion behavior

Future decorative avatar references must always be optional presentation metadata. Removing a `KnownPerson` must never invalidate tasks, shopping items, or agenda events.

Expected future behavior:

- decorative references become null during `KnownPerson` deletion;
- parent records remain unchanged;
- removing a `KnownPerson` never deletes or modifies the semantic content of another entity;
- recreating a `KnownPerson` does not reconnect previous decorative references automatically.

This section defines product behavior only. It does not design the persistence model for those references.

### V1 boundary

Do not add `DecorativeAvatarRef`, `DecorativeAvatarId`, or related columns to shopping items, tasks, or calendar events in V1. This specification only confirms that known people are suitable future sources.

## 14. API Direction

### Product decision

Add known person endpoints in a future implementation slice; do not modify APIs in this design task.

Recommended route family:

```text
GET    /api/known-people
GET    /api/known-people/{knownPersonId:guid}
POST   /api/known-people
PUT    /api/known-people/{knownPersonId:guid}
DELETE /api/known-people/{knownPersonId:guid}
```

Optional query filters:

```text
/api/known-people?scope=Shared
/api/known-people?scope=PrivateToMember&familyMemberId=thomas
```

### DTO direction

```text
KnownPersonDto
- id: Guid
- displayName: string
- nickname: string?
- relationshipType: KnownPersonRelationshipType
- customRelationshipLabel: string?
- scope: KnownPersonScope
- privateToFamilyMemberId: string?
- initials: string
- displayColor: string
- avatarSelection: AvatarSelectionDto
- createdUtc: DateTimeOffset
- updatedUtc: DateTimeOffset
```

```text
CreateKnownPersonRequest / UpdateKnownPersonRequest
- displayName: string
- nickname: string?
- relationshipType: KnownPersonRelationshipType
- customRelationshipLabel: string?
- scope: KnownPersonScope
- privateToFamilyMemberId: string?
- initials: string?
- displayColor: string?
- avatarSelection: AvatarSelectionDto?
```

### API invariants

- Validate display name is required and trimmed.
- Generate initials if omitted.
- Generate default color if omitted.
- Validate relationship enum.
- Validate scope invariants.
- Validate avatar selection through the existing avatar catalog service.
- Return validation problems instead of silently coercing invalid scope/member combinations.
- Soft-delete on DELETE.

### Future picker API direction

A future picker endpoint may be added after known person CRUD exists:

```text
GET /api/avatar-identities?contextFamilyMemberId=thomas
```

That endpoint should return `AvatarIdentityCandidate` read models and should not imply a shared persisted `Person` table.

## 15. Persistence Direction

### Recommended table

```text
KnownPeople
- Id uuid primary key
- HouseholdId uuid not null foreign key Households(Id) on delete restrict
- Scope varchar(32) not null
- PrivateToFamilyMemberId varchar(120) null foreign key FamilyMembers(Id) on delete restrict
- DisplayName varchar(160) not null
- Nickname varchar(80) null
- RelationshipType varchar(32) not null
- CustomRelationshipLabel varchar(80) null
- Initials varchar(8) not null
- DisplayColor varchar(32) not null
- AvatarSelection jsonb not null
- IsDeleted boolean not null
- DeletedUtc timestamptz null
- CreatedByFamilyMemberId varchar(120) null foreign key FamilyMembers(Id) on delete restrict
- CreatedUtc timestamptz not null
- UpdatedUtc timestamptz not null
```

### Indexes

```text
IX_KnownPeople_HouseholdId_IsDeleted_DisplayName
IX_KnownPeople_HouseholdId_Scope_IsDeleted_DisplayName
IX_KnownPeople_HouseholdId_PrivateToFamilyMemberId_IsDeleted_DisplayName
IX_KnownPeople_HouseholdId_RelationshipType_IsDeleted
```

### Constraints

Prefer explicit check constraints if supported by the migration target:

```text
(Scope = 'Shared' AND PrivateToFamilyMemberId IS NULL)
OR
(Scope = 'PrivateToMember' AND PrivateToFamilyMemberId IS NOT NULL)
```

### Deletion behavior

- `KnownPerson` rows should be soft-deleted, not hard-deleted by default.
- Household deletion remains restricted by existing patterns.
- Private member foreign keys should restrict hard deletion; member deletion is already soft-delete-oriented.
- Future decorative references must be optional presentation metadata. If later implemented, deleting a `KnownPerson` should clear those decorative references without changing the semantic content of parent records.

## 16. Migration Impact

### V1 known person migration

A future implementation migration would add only the `KnownPeople` table, indexes, constraints, and EF mapping. It should not migrate existing family members. It should not alter task, shopping, calendar, or motivation tables.

### Existing data impact

- Existing family member data remains unchanged.
- Existing avatar selections remain unchanged.
- Existing tasks and motivation references remain unchanged.
- Existing shopping and calendar records remain unchanged.

### API/client generation impact

Adding known person endpoints and DTOs will update OpenAPI/NSwag outputs in the implementation slice. That is expected, but it should be limited to known person CRUD and any generic avatar-editor frontend changes needed to reuse existing avatar infrastructure.

## 17. Alternatives Considered

### Dedicated `Person` base class

A generic `Person` would unify family members and known people, but it would blur the product boundary between household members and lightweight external people. It would also create migration risk because many existing semantic fields point to `FamilyMemberId`.

### `HouseholdPerson`

`HouseholdPerson` sounds too close to family membership and could confuse future implementers into allowing these people into semantic household-member flows.

### Settings-only management

Settings-only management misclassifies people as configuration. It also risks turning Settings into a large directory page, which conflicts with viewport-first dashboard behavior.

### Member-page-only management

Member-page-only management handles private friends/classmates well but fails for shared grandparents, neighbours, babysitters, and family friends.

## 18. Rejected Designs

### Rejected: known people as family members with a flag

Do not add a `FamilyMemberKind.KnownPerson` or `IsKnownPerson` flag. That would invite known people into task ownership, motivation, family pages, and other semantic member-only flows.

### Rejected: polymorphic task ownership

Do not allow task ownership to point to either `FamilyMember` or `KnownPerson`. Known people cannot own tasks, and decorative avatar badges must remain visually separate from responsibility.

### Rejected: free-text-only relationship

Free text cannot reliably support localized suggestions, grouping, filtering, or deterministic matching. Use the enum plus custom label model.

### Rejected: automatic avatar attachment

Suggestions must never mutate data automatically. The user must explicitly attach a future decorative avatar.

### Rejected: known person details/address book

Do not add email, phone, address, external provider IDs, or sync in V1. The feature is a lightweight visual people catalog, not address-book software.

### Future pets

This design intentionally models only people. If pets are introduced in the future, they should receive their own dedicated entity instead of extending `KnownPerson`.

## 19. Final Recommendation

Implement Avatar Contacts V1 in future slices as follows:

1. Add a household-scoped `KnownPerson` entity with `KnownPersonScope`, `KnownPersonRelationshipType`, direct `AvatarSelection` ownership, and soft-delete lifecycle.
2. Preserve `FamilyMember` as the only semantic household member entity.
3. Reuse the existing avatar catalog, renderer, defaults, and validation service.
4. Refactor the frontend avatar editor around a generic selection editor, keeping family-member and known person wrappers.
5. Add a viewport-first **People** management capability with sections for Family Members, grouped Shared People, and each member's private people. The frontend design may realize this as a page, dialog, drawer, or extension of an existing surface.
6. Add member-page shortcuts for the owning member's private people.
7. Do not add permission assumptions in V1; all management capabilities are currently available until future authentication introduces restrictions.
8. Keep decorative avatar references out of V1 persistence, while designing future picker read models around `FamilyMember | KnownPerson` source types, without deciding decorative persistence in this slice.

The canonical V1 decision is therefore: **KnownPerson is the lightweight non-member identity; scope is Shared or PrivateToMember; relationships are normalized; avatars are owned directly and reused through the catalog; People is a management capability; decorative references are future work.**
