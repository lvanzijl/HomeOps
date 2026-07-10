# Summary

Implemented Avatar Contacts V1 Slice 5 as a reusable decorative avatar infrastructure slice. No Shopping, Tasks, Agenda, Motivation, Home, member page, People management, picker, suggestion, API, persistence, or production feature integration was added.

# Implemented

- Added a frontend `DecorativeAvatarReference` model with explicit `familyMember` and `knownPerson` source types.
- Added a resolver that projects optional decorative references into renderable identities and returns `null` for missing, blank, unknown, or deleted/unavailable sources.
- Added reusable `DecorativeAvatar` and `DecorativeAvatarBadge` components for future consumers.
- Added focused tests for FamilyMember rendering, KnownPerson rendering, null behavior, badge labeling, source-type preservation, and deletion-safe missing KnownPerson resolution.

# Decorative Avatar Infrastructure

Decorative avatars remain optional presentation metadata. The new reference type stores only a source type and source id and does not imply ownership, assignment, participation, responsibility, permissions, recipients, or any semantic relationship.

The infrastructure keeps `FamilyMember` and `KnownPerson` separate by representing resolved identities as a discriminated union instead of adding a base class, `AvatarProfile`, inheritance, avatar snapshots, or a duplicate renderer.

# Rendering

Rendering reuses the existing `FamilyAvatar` component. `DecorativeAvatar` passes through FamilyMember sources directly and adapts KnownPerson display fields only at the rendering boundary. It does not duplicate AvatarSelection-to-SVG rendering logic.

`DecorativeAvatarBadge` is a small wrapper for future badge placement. It renders nothing when no identity is resolved and uses presentation-only labeling.

# Validation

- .NET local tool environment was prepared with repository-local `DOTNET_CLI_HOME`, `DOTNET_HOME`, `NUGET_PACKAGES`, and npm cache directories before .NET validation.
- `dotnet --version` returned `10.0.301`.
- `dotnet restore HomeOps.sln` passed with the existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory warning in `tests/HomeOps.Api.Tests`.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing NU1903 warning.
- `dotnet test HomeOps.sln --no-build` passed: 411/411 backend tests.
- `npm run build` passed. Vite reported the existing large chunk warning.
- Focused avatar tests passed: `npm test -- DecorativeAvatar.test.tsx FamilyAvatar.test.tsx` passed 12/12.
- Full frontend suite passed: `npm test` passed 265/265 across 40 files.

# Tests

Added `DecorativeAvatar.test.tsx` coverage for:

- FamilyMember decorative rendering;
- KnownPerson decorative rendering;
- null/undefined rendering;
- presentation badge labeling;
- source-type preserving resolution;
- deletion-safe KnownPerson missing-source behavior;
- blank and unknown reference behavior.

Existing `FamilyAvatar` regression coverage continued to pass in the focused avatar test run and full frontend suite.

# Verified

- No decorative avatar fields were added to Shopping, Tasks, Agenda, Motivation, Home, member pages, or People management.
- No backend API, OpenAPI, generated client, database schema, migration, or domain integration changes were introduced.
- No screenshots or binary files were added.
- Repository-local cache/build outputs remained ignored and were not staged.

# Risks and Follow-up Work

- Future slices still need to decide each product area's decorative persistence model before adding references to Shopping, Tasks, or Agenda.
- Future KnownPerson deletion integrations should clear persisted decorative references at the owning product boundary once those references exist.
- Future picker work should consume this source-type split without adding automatic suggestions, fuzzy matching, or semantic assignment behavior in this infrastructure layer.

# Modified Files

- `src/HomeOps.Client/src/avatarContacts/decorativeAvatar.ts`
- `src/HomeOps.Client/src/avatarContacts/DecorativeAvatar.tsx`
- `src/HomeOps.Client/src/avatarContacts/DecorativeAvatar.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-10-avatar-contacts-v1-decorative-avatar-foundation/avatar-contacts-v1-decorative-avatar-foundation.md`
