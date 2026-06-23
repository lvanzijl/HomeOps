# HomeOps FamilyMember vs Profile Analysis

## Summary
- Recommendation: make `Household` / Family the product root and `FamilyMember` the primary person-level domain entity for MVP.
- `Profile` should not survive as a domain entity in the MVP. The current product and codebase already treat family members as household context, not login identities or profiles.
- Avatar V2 configuration should belong to `FamilyMember`, under the family/household aggregate: `Family -> Members -> AvatarConfig`.
- The Netflix-style profile picker should not survive in MVP startup. Startup should open the shared family Home after household setup.
- Future identity/permissions should be introduced later as an optional technical/account layer that can link to one or more `FamilyMember` records when needed.

## Current Model Assessment
- The persisted backend root is `Household`, which owns household-level setup state such as name, timezone, onboarding completion, and timestamps.
- `FamilyMember` is already a household-scoped person record with name, display color, initials, adult/child kind, date of birth, deletion state, and current MVP avatar fields.
- Current API endpoints create, update, list, and soft-delete `FamilyMember` records under the seeded household, and create/update requests already carry avatar configuration.
- Existing Tasks, Motivation individual goals, and Helpful Moments attach to `FamilyMemberId`, not Profile or User.
- No source-level Profile model, Profile API, Profile DTO, User model, identity model, or auth model appears to exist in the current app source.

## Family vs Profile Analysis
### Real primary entity
- Product primary entity: Family / Household.
- Person primary entity: FamilyMember.
- Technical identity entity: not needed for MVP.

### Ownership recommendations
| Concern | Recommended owner | Rationale |
| --- | --- | --- |
| Avatar V2 | FamilyMember | Avatar identifies a household member in shared family surfaces. |
| Child settings | FamilyMember | Child mode, age band, date of birth, and parent-managed settings describe the child household member, not a login profile. |
| Rewards | Family/Household for shared goals; FamilyMember for individual progress | Rewards are family-oriented; individual progress is already member-linked. |
| Family participation | FamilyMember | Tasks, goals, and helpful moments already refer to family member participation. |
| Future personalization | FamilyMember first; optional Identity later | Preferences can remain member-scoped until true authenticated users exist. |

### Is Profile still needed?
- As a domain entity: no.
- As a product concept: no for MVP.
- As a technical implementation detail: possibly later, but it should be renamed/understood as `Identity`, `Account`, or `DeviceSession`, not `Profile`, if its job is login/session/permissions.
- `Profile` duplicates `FamilyMember` if it stores display name, avatar, child/adult role, family presence, or member-specific preferences.
- Keeping Profile now would encourage user-first thinking and create two person-like models before there is any actual authentication or permission requirement.

## Avatar Ownership Analysis
### Option A: Family -> Members -> AvatarConfig
Recommended.

Why:
- Avatars are used to recognize people in Home, Child Mode, Motivation, Tasks, and family-member pages.
- Current MVP avatar configuration is already embedded in FamilyMember DTOs and persistence.
- Avatar V2 stores user intent for a member's look; that intent belongs to the member record, not to a login/session/profile abstraction.

### Option B: Profile -> AvatarConfig
Not recommended.

Why:
- It assumes an individual-user model that the product no longer needs for MVP.
- It would split a child's visual identity between FamilyMember and Profile, making Child Mode and member administration harder to reason about.
- It creates immediate questions about profile selection, profile ownership, permissions, and login state without current product value.

### Option C: Alternative model
A future `Identity -> FamilyMemberLink` model can be introduced if mobile/login/permissions require it:

```text
Household
  Members
    AvatarConfig
Identity / Account (optional later)
  LinksTo FamilyMember(s)
  Role within Household
  Auth/session metadata
```

This keeps the domain model family-first while allowing future authenticated actors.

## Permissions Analysis
- Identity should not exist now as a required domain concept.
- Identity should exist later only when there is a concrete permission, mobile, audit, or account requirement.
- Identity should be optional and separate from `FamilyMember` because a FamilyMember can be a child with no login, a parent could manage multiple child members, and a shared wall tablet may have no active individual user.
- Future permissions should answer “who is currently acting?” separately from “which family member does this data describe?”
- Suggested future concepts:
  - `HouseholdRole`: parent/admin, adult, child, viewer.
  - `Identity`: login/account/device session actor.
  - `IdentityFamilyMemberLink`: optional mapping between an actor and a household member.
  - `ActingContext`: request/session information for audit and permissions.

## Startup Flow Analysis
- The current MVP should not use a Netflix-style profile picker.
- HomeOps is a shared family application and the Home dashboard is a family glassboard, not a per-person landing app.
- A profile picker would imply account choice, permissions, and personal state before those concepts exist.
- Current first-run flow already matches the family-first direction: it gathers adults and children, reviews the household, completes onboarding, and opens Home.
- Profile picking can return later only if individual identity has clear product value, such as child-safe mobile sessions, parent-only administration, or audit trails.

## Recommended MVP Model
```text
Household / Family
  Settings
  WorkspaceLayouts
  Agenda / Lists / Tasks / Motivation / HelpfulMoments
  FamilyMembers
    Name
    MemberKind: Adult | Child
    DateOfBirth
    DisplayColor
    AvatarConfig / AvatarV2Config
    ChildSettings (when needed)
    Participation links: Tasks, Goals, HelpfulMoments, Rewards
```

### MVP startup flow
1. If household setup is incomplete, show First Run Wizard.
2. Add adults and children as FamilyMembers.
3. Review household.
4. Finish and open shared Home dashboard.
5. Manage individual member details from Family Member pages / parent administration surfaces.

### MVP avatar ownership
- Store Avatar V2 configuration on `FamilyMember`.
- Do not store Avatar V2 configuration on Profile.
- Do not require an identity/profile picker before editing avatars in MVP.

## Future Evolution Path
1. Keep `FamilyMember` as the durable person record.
2. Move current MVP avatar fields toward a single `AvatarV2Config` value object on FamilyMember when Avatar V2 replaces MVP avatars.
3. Add `ChildSettings` as a FamilyMember-owned value object only when real settings exist.
4. Add parent-only administration as a UI boundary first if authentication is still absent.
5. Add optional `Identity` only when mobile/login/permission/audit requirements become real.
6. Link Identity to FamilyMember rather than merging them.
7. Introduce actor tracking (`CreatedByIdentityId`, `UpdatedByIdentityId`, or audit events) only after Identity exists.

## Risks
- Removing Profile as a concept too aggressively could make later mobile identity feel surprising unless the future Identity path is documented.
- FamilyMember can become too large if every future preference is added directly; use value objects such as `AvatarV2Config` and `ChildSettings` to keep it organized.
- Parent-only controls currently rely on UX separation, not security; this is acceptable for MVP but must not be mistaken for real permissions.
- Profile-picker removal means child-specific entry may need another access pattern later, such as “Open Riley's Child Mode” from Home.

## Open Questions
- Should the persisted root remain named `Household` in code while product copy says Family?
- Should Avatar V2 config be stored as typed columns or a JSON/value object when promoted from editor MVP to production FamilyMember data?
- What is the first real permission requirement that should trigger optional Identity work?
- Should child mode become directly reachable from Home without implying a selected login identity?

## Next Prompt Context
- Do not implement database, startup, authentication, or Avatar V2 changes from this analysis yet.
- Recommended next implementation prompt: remove or avoid any remaining Profile Picker/product-copy assumptions and explicitly document `FamilyMember` as the primary MVP person entity.
- Recommended future implementation prompt for Avatar V2 production integration: add `AvatarV2Config` to FamilyMember, map editor intent into that member-owned config, and keep profile/user/identity out of scope.
