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

- Introduce a new lightweight entity named **Contact** for non-family-member people.
- Do not introduce a generic `Person` base class.
- Do not introduce `AvatarProfile` in V1.
- Keep `FamilyMember` as its own semantic entity and keep all semantic ownership references pointing only at `FamilyMember`.
- Use visibility terminology instead of ownership terminology: `Shared` and `PrivateToMember`.
- Model relationships with a normalized enum plus an optional custom display label.
- Manage shared contacts centrally in **People**; expose private contacts both in People and on the owning family member page.
- Decorative avatars for shopping, tasks, and agenda events remain out of scope for V1 implementation.

### Architectural recommendation

Avatar Contacts V1 should add a household-scoped `Contact` aggregate that directly owns an `AvatarSelection`, mirrors the useful display fields from `FamilyMember`, and participates only in contact management and future avatar picker read models. The system should treat contacts as lightweight visual identities, not principals, assignees, attendees, recipients, or account holders.

## 2. Product Vision

FamilyBoard avatars should become reusable identity visuals without turning every recognizable person into a household user. Families often need lightweight visual references for grandparents, teachers, babysitters, neighbours, friends, classmates, cousins, coaches, and other familiar people. Those people help make household information recognizable, but they should not participate in the application's core semantic models.

Avatar Contacts V1 establishes a **People** catalog for non-family-member identities. A contact has a name, optional nickname, relationship type, optional custom relationship label, color, initials, and avatar selection. A contact exists so the household can recognize a person visually. It does not imply login access, household membership, task responsibility, permissions, calendar attendance, shopping assignment, or motivation ownership.

The V1 product outcome is a clear implementation contract for future backend and frontend slices:

- contacts can be created, edited, soft-deleted, and listed;
- contacts can be shared with the household or private to one family member;
- contacts reuse the same avatar catalog and editor infrastructure as family members;
- contacts are available later to picker surfaces as optional decorative candidates;
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

These functions are entity-neutral enough to be reused by contacts. A contact backend slice should call the same validation service rather than create contact-specific avatar rules.

The frontend avatar system already has a useful split:

- `AvatarCatalogControls` is selection-oriented and reusable;
- `FamilyAvatarEditor` is member-specific and should become a thin wrapper around a generic avatar selection editor;
- renderer functions can render catalog selections through the existing Avatar V2 renderer bridge.

### Repository-confirmed: semantic FamilyMember references

`FamilyMemberId` currently appears in semantic domains such as tasks, recurring task series, task templates, motivation individual goals, and helpful moments. These are not visual references. They encode responsibility, progress, or recognition for household members. Contacts must not be accepted by these fields.

### Repository-confirmed: no current decorative target fields

Shopping list items are plain list entries with text, completion state, deletion state, optional preferred store, and timestamps. Calendar event series have title, description, location, recurrence/provider fields, and timestamps. Neither currently stores a person reference. That means Avatar Contacts V1 can avoid migrations in those domains.

## 4. Final Domain Model

### Product decision: entity name

Use **Contact**.

#### Why `Contact` wins

- It is short, familiar, and natural in UI and API names.
- It clearly means “a known external person” rather than a family member.
- It supports grandparents, teachers, neighbours, friends, classmates, and babysitters without implying application access.
- It is less awkward than `KnownPerson` in user-facing copy and code.
- It is less ambiguous than `HouseholdPerson`, which could sound like a family member or household user.

#### Terminology caveat

The UI should avoid “Contacts” as the main user-facing destination because that can imply address books, email addresses, and phone numbers. The product surface should be **People**, while the implementation entity can be `Contact`.

### Recommended entity shape

```text
Contact
- Id: Guid
- HouseholdId: Guid
- Visibility: ContactVisibility
- PrivateToFamilyMemberId: string?
- DisplayName: string
- Nickname: string?
- RelationshipType: ContactRelationshipType
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
ContactVisibility
- Shared
- PrivateToMember
```

```text
ContactRelationshipType
- Friend
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
- `Contact` represents a non-family-member person only.
- A `Contact` is never a user, principal, assignee, permissions subject, event attendee, shopping recipient, or motivation subject.
- Contacts and family members may be combined only in read models for visual selection and management views.

## 5. Entity Responsibilities

### FamilyMember responsibilities

`FamilyMember` continues to represent a person who belongs to the household model. It owns product semantics such as task assignment, motivation goals, helpful moments, family member pages, onboarding, and adult/child presentation.

`FamilyMember` continues to own its own `AvatarSelection`. Existing legacy `AvatarV2Config` compatibility remains a family-member concern until the broader avatar migration is complete.

### Contact responsibilities

`Contact` represents a lightweight non-member identity. It is responsible for:

- display name;
- optional nickname;
- relationship classification;
- optional custom relationship label;
- initials and display color fallback;
- avatar selection;
- visibility within the household;
- soft-delete lifecycle.

`Contact` is not responsible for:

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

Future picker APIs may project family members and contacts into a shared read DTO. That DTO should not become a shared domain base class. It should be a query shape only.

Recommended future read model:

```text
AvatarIdentityCandidate
- SourceType: FamilyMember | Contact
- SourceId: string
- DisplayName: string
- Nickname: string?
- RelationshipType: ContactRelationshipType?
- RelationshipLabel: string?
- Visibility: FamilyMember | SharedContact | PrivateContact
- PrivateToFamilyMemberId: string?
- Initials: string
- DisplayColor: string
- AvatarSelection: AvatarSelectionDto
```

## 6. Visibility Model

### Product decision

Use **visibility**, not ownership, in product and API terminology.

The model is:

- **Shared**: visible to the household as a whole.
- **PrivateToMember**: visible in the context of one family member.

### Invariants

- Every contact belongs to exactly one household.
- `Visibility = Shared` means `PrivateToFamilyMemberId` must be null.
- `Visibility = PrivateToMember` means `PrivateToFamilyMemberId` must reference an active, non-deleted `FamilyMember` in the same household.
- A contact cannot move to another household.
- A private contact cannot reference a family member from another household.
- Soft-deleted family members cannot become new private-contact owners.
- If a family member is soft-deleted, existing private contacts should remain rows but should be hidden from default people lists unless an administrative recovery view is later added.
- A contact's visibility controls management and picker availability only; it does not create permissions.
- Shared contacts may be listed in all household-level decorative picker contexts.
- Private contacts may be listed only when the active family-member context matches `PrivateToFamilyMemberId`, or when an adult is centrally managing people.

### API validation expectations

- Create/update must reject `Shared` contacts with a private member id.
- Create/update must reject `PrivateToMember` contacts without a valid private member id.
- Create/update must reject unknown enum values.
- Endpoints must filter out `IsDeleted` contacts by default.

## 7. Relationship Model

### Product decision

Use a normalized relationship enum plus optional custom label. Do not use only free text.

Recommended enum:

```text
Friend
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
- Picker cards should show enough disambiguation for duplicates: avatar, display name, relationship label, and visibility context.

### Why normalized relationships matter

Normalized relationships support deterministic avatar picker suggestions, localization, analytics-free grouping, and stable UI filters. Free text alone would make “teacher,” “juf,” “meester,” and “coach” hard to reason about consistently.

## 8. Avatar Ownership

### Product decision

Both `FamilyMember` and `Contact` directly own their own `AvatarSelection`.

### Rules

- Do not create a shared avatar profile table in V1.
- Do not duplicate the avatar catalog.
- Do not create a contact-specific renderer.
- Do not add legacy `AvatarV2Config` columns to contacts unless an implementation slice proves they are necessary for temporary renderer compatibility.
- New contacts should default to `AvatarCatalogService.DefaultSelection()` when no selection is provided.
- Contact create/update must validate with `AvatarCatalogService.ValidateForWrite()`.
- Retired catalog items must not be newly selectable for contacts, matching family member behavior.
- Existing contact selections should normalize missing optional slots to defaults in the same way family member selections do.

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
- `ContactAvatarEditor` adapts `Contact` to `AvatarSelectionEditor`.

This preserves existing behavior while making contacts use the same controls, renderer, validation expectations, and visual quality tier.

## 9. People Management UX

### Product decision

Use a **People** management surface with sections for family members and contacts.

Recommended top-level IA:

```text
People
- Family Members
- Shared People
- Thomas's People
- Robin's People
```

### Why People is the right surface

- A dedicated People surface matches how families think about recognizable people.
- It avoids overloading Settings with a high-frequency household editing task.
- It keeps shared contacts central while still preserving member-specific contexts.
- It creates a natural future home for picker candidate review without implying phone/email contact details.

### Alternatives evaluated

#### Dedicated People page

Recommended as the long-term primary management surface. It can reserve fixed viewport regions, show grouped lists, and support shared/private distinctions without crowding the member page.

#### Family Members page only

Not sufficient. Shared people such as grandparents, neighbours, babysitters, and teachers do not belong under one family member. A member-only design would hide shared household context.

#### Settings

Not recommended as the primary surface. Settings is already maintenance/configuration oriented, and “people we recognize” is product content, not application configuration. Settings may link to People but should not host the main management UI.

#### Member profile only

Useful for private contacts, but incomplete for shared people. Member pages should expose quick editing for that member's private people, not become the whole contact directory.

#### Hybrid People + member shortcuts

Recommended. Shared contacts are managed centrally. Private contacts are centrally visible in People and also available directly from the owning member page.

### Child/adult editing model

Avoid a complex permissions model in V1 because the repository does not yet have enforceable authenticated users or roles.

Recommended product rule:

- Adults manage shared people.
- Children may create, rename, and edit avatars for their own private people when the UI is in that child's member context.
- Children should not manage shared people.
- Adults may manage any shared person and any member's private people.

Implementation should initially treat this as presentation/workflow policy, not security. Backend invariants should protect household and visibility correctness, but true permission enforcement requires a later authentication/active-principal design.

## 10. Member Page Integration

Each `FamilyMember` page should include a bounded **People** section for that member's private contacts.

Recommended member page section:

```text
Thomas's People
- visible row/card list of private contacts
- Add person
- Edit name, relationship, color, avatar
- link: Manage all People
```

### Requirements

- The section must be internally bounded and must not introduce page-level vertical scrolling on primary pages.
- The section should summarize when there are many private contacts, for example showing a limited list and “+N more”.
- Editing should use the same contact editor model as the central People surface.
- Shared people may be visible as suggestions or references later, but member pages should primarily focus on that member's private people.

### Product rationale

Private contacts are often meaningful to a child: classmates, friends, teachers, coaches, or babysitters. Placing them on the member page makes quick editing natural without forcing the household to maintain every private social connection centrally.

## 11. Shared People Management

Shared contacts belong in the central People surface.

Recommended shared section:

```text
Shared People
- grandparents
- uncles/aunts/cousins
- neighbours
- babysitters
- family friends
- coaches when relevant to the household as a whole
```

### Shared contact behavior

- Shared contacts are visible in household-level management.
- Shared contacts are eligible for future decorative picker contexts that are not member-specific.
- Shared contacts have no owner member.
- Shared contacts should be manageable by adults in the product workflow.
- Shared contacts should not appear as task assignees or calendar participants.

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
- Phone contacts
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
- visibility, with matching private contacts ranked higher in that member's context;
- shared contacts as household-level fallbacks.

### Non-goals for V1

- No picker algorithm implementation.
- No automatic text scanning that creates contacts.
- No automatic decorative attachment.
- No AI-based inference.
- No external contact import.

### UX expectation

Suggested people should be presented as “suggestions,” not as confirmed matches. The picker should make it clear when no avatar is attached.

## 13. Future Decorative Avatar Support

Decorative avatar persistence is intentionally out of scope for V1. However, the chosen identity model supports future expansion without redesign.

### Why the model supports future shopping/task/agenda decorations

- `FamilyMember` and `Contact` remain separate source entities, preserving semantic member-only fields.
- A future decorative reference can use a neutral source discriminant without requiring inheritance:

```text
DecorativeAvatarRef
- SourceType: FamilyMember | Contact
- SourceId: string
- SnapshotDisplayName: string
- SnapshotInitials: string
- SnapshotDisplayColor: string
- SnapshotAvatarSelection: AvatarSelectionDto?
```

- The source discriminant keeps a decorative contact reference different from task ownership.
- Snapshot fields can preserve historical display if a contact is later renamed or deleted.
- Shopping items, tasks, and agenda events can each add optional decorative fields later without changing contact fundamentals.

### V1 boundary

Do not add `DecorativeAvatarRef`, `DecorativeAvatarId`, or related columns to shopping items, tasks, or calendar events in V1. This specification only confirms that contacts are suitable future sources.

## 14. API Direction

### Product decision

Add contact endpoints in a future implementation slice; do not modify APIs in this design task.

Recommended route family:

```text
GET    /api/contacts
GET    /api/contacts/{contactId:guid}
POST   /api/contacts
PUT    /api/contacts/{contactId:guid}
DELETE /api/contacts/{contactId:guid}
```

Optional query filters:

```text
/api/contacts?visibility=Shared
/api/contacts?visibility=PrivateToMember&familyMemberId=thomas
```

### DTO direction

```text
ContactDto
- id: Guid
- displayName: string
- nickname: string?
- relationshipType: ContactRelationshipType
- customRelationshipLabel: string?
- visibility: ContactVisibility
- privateToFamilyMemberId: string?
- initials: string
- displayColor: string
- avatarSelection: AvatarSelectionDto
- createdUtc: DateTimeOffset
- updatedUtc: DateTimeOffset
```

```text
CreateContactRequest / UpdateContactRequest
- displayName: string
- nickname: string?
- relationshipType: ContactRelationshipType
- customRelationshipLabel: string?
- visibility: ContactVisibility
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
- Validate visibility invariants.
- Validate avatar selection through the existing avatar catalog service.
- Return validation problems instead of silently coercing invalid visibility/member combinations.
- Soft-delete on DELETE.

### Future picker API direction

A future picker endpoint may be added after contact CRUD exists:

```text
GET /api/avatar-identities?contextFamilyMemberId=thomas
```

That endpoint should return `AvatarIdentityCandidate` read models and should not imply a shared persisted `Person` table.

## 15. Persistence Direction

### Recommended table

```text
Contacts
- Id uuid primary key
- HouseholdId uuid not null foreign key Households(Id) on delete restrict
- Visibility varchar(32) not null
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
IX_Contacts_HouseholdId_IsDeleted_DisplayName
IX_Contacts_HouseholdId_Visibility_IsDeleted_DisplayName
IX_Contacts_HouseholdId_PrivateToFamilyMemberId_IsDeleted_DisplayName
IX_Contacts_HouseholdId_RelationshipType_IsDeleted
```

### Constraints

Prefer explicit check constraints if supported by the migration target:

```text
(Visibility = 'Shared' AND PrivateToFamilyMemberId IS NULL)
OR
(Visibility = 'PrivateToMember' AND PrivateToFamilyMemberId IS NOT NULL)
```

### Deletion behavior

- Contacts should be soft-deleted, not hard-deleted by default.
- Household deletion remains restricted by existing patterns.
- Private member foreign keys should restrict hard deletion; member deletion is already soft-delete-oriented.
- Future decorative references should decide independently whether to snapshot, clear, or preserve deleted contact references.

## 16. Migration Impact

### V1 contact migration

A future implementation migration would add only the `Contacts` table, indexes, constraints, and EF mapping. It should not migrate existing family members. It should not alter task, shopping, calendar, or motivation tables.

### Existing data impact

- Existing family member data remains unchanged.
- Existing avatar selections remain unchanged.
- Existing tasks and motivation references remain unchanged.
- Existing shopping and calendar records remain unchanged.

### API/client generation impact

Adding contact endpoints and DTOs will update OpenAPI/NSwag outputs in the implementation slice. That is expected, but it should be limited to contact CRUD and any generic avatar-editor frontend changes needed to reuse existing avatar infrastructure.

## 17. Alternatives Considered

### Dedicated `Person` base class

A generic `Person` would unify family members and contacts, but it would blur the product boundary between household members and lightweight external people. It would also create migration risk because many existing semantic fields point to `FamilyMemberId`.

### `AvatarProfile` aggregate

An `AvatarProfile` table could become a reusable avatar identity source, but V1 does not need it. It would add lifecycle questions, sharing semantics, and migration work before the product has decorative references. Direct `AvatarSelection` ownership is simpler and matches current persistence.

### `KnownPerson`

`KnownPerson` is descriptive but awkward in user-facing and API language. It also sounds like a broader identity registry than V1 requires.

### `HouseholdPerson`

`HouseholdPerson` sounds too close to family membership and could confuse future implementers into allowing these people into semantic household-member flows.

### Settings-only management

Settings-only management misclassifies people as configuration. It also risks turning Settings into a large directory page, which conflicts with viewport-first dashboard behavior.

### Member-page-only management

Member-page-only management handles private friends/classmates well but fails for shared grandparents, neighbours, babysitters, and family friends.

## 18. Rejected Designs

### Rejected: contacts as family members with a flag

Do not add a `FamilyMemberKind.Contact` or `IsContact` flag. That would invite contacts into task ownership, motivation, family pages, and other semantic member-only flows.

### Rejected: polymorphic task ownership

Do not allow task ownership to point to either `FamilyMember` or `Contact`. Contacts cannot own tasks, and decorative avatar badges must remain visually separate from responsibility.

### Rejected: free-text-only relationship

Free text cannot reliably support localized suggestions, grouping, filtering, or deterministic matching. Use the enum plus custom label model.

### Rejected: automatic avatar attachment

Suggestions must never mutate data automatically. The user must explicitly attach a future decorative avatar.

### Rejected: contact details/address book

Do not add email, phone, address, external provider IDs, or sync in V1. The feature is a lightweight visual people catalog, not contact management software.

### Rejected: pets in V1

The model can eventually support pet-like visual identities through relationship/category evolution, but pets should not be implemented in Avatar Contacts V1. V1 is scoped to non-family-member people.

## 19. Final Recommendation

Implement Avatar Contacts V1 in future slices as follows:

1. Add a household-scoped `Contact` entity with `ContactVisibility`, `ContactRelationshipType`, direct `AvatarSelection` ownership, and soft-delete lifecycle.
2. Preserve `FamilyMember` as the only semantic household member entity.
3. Reuse the existing avatar catalog, renderer, defaults, and validation service.
4. Refactor the frontend avatar editor around a generic selection editor, keeping family-member and contact wrappers.
5. Add a viewport-first **People** management surface with sections for Family Members, Shared People, and each member's private people.
6. Add member-page shortcuts for the owning member's private people.
7. Treat child editing as product workflow only until real authorization exists: children may manage their own private people; adults manage shared people.
8. Keep decorative avatar references out of V1 persistence, while designing future picker read models around `FamilyMember | Contact` source types.

The canonical V1 decision is therefore: **Contact is the lightweight non-member identity; visibility is Shared or PrivateToMember; relationships are normalized; avatars are owned directly and reused through the catalog; People is the management surface; decorative references are future work.**
