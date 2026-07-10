# Summary

Implemented the Avatar Contacts V1 Slice 5 follow-up architectural correction by removing the premature decorative reference model while preserving reusable decorative avatar rendering components.

# Architectural Correction

The canonical Avatar Contacts V1 design intentionally leaves decorative persistence undecided until the first real consumer slice. The previous Slice 5 implementation introduced `DecorativeAvatarReference` and a resolver, which effectively started defining a future persistence contract before Shopping, Tasks, or Agenda had a concrete implementation need.

This follow-up restores the boundary: the rendering layer can display already-resolved FamilyMember or KnownPerson identity data, but it does not define how future product domains store, resolve, clear, or migrate decorative references.

# Rendering Infrastructure

`DecorativeAvatar` and `DecorativeAvatarBadge` remain as reusable presentation components. They accept already-resolved identity data from callers and render through the existing `FamilyAvatar` component so AvatarSelection-to-SVG rendering remains centralized.

The components do not fetch data, resolve identifiers, define source-id storage, persist metadata, or decide deletion behavior for future consumers.

# Removed

- Removed `DecorativeAvatarReference`.
- Removed the dedicated `resolveDecorativeAvatarReference` resolver.
- Removed tests that validated the premature reference/resolver behavior.
- Removed the standalone `decorativeAvatar.ts` abstraction that could be mistaken for a future decorative persistence contract.

# Validation

- .NET local tool environment was prepared with repository-local `DOTNET_CLI_HOME`, `DOTNET_HOME`, `NUGET_PACKAGES`, and npm cache directories before .NET validation.
- `dotnet restore HomeOps.sln` passed with the existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory warning in `tests/HomeOps.Api.Tests`.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing NU1903 warning.
- `dotnet test HomeOps.sln --no-build` passed: 411/411 backend tests.
- `npm run build` passed. Vite reported the existing large chunk warning.
- Focused avatar tests passed: `npm test -- DecorativeAvatar.test.tsx FamilyAvatar.test.tsx` passed 9/9.
- Full frontend suite passed: `npm test` passed 262/262 across 40 files.

# Tests

Updated `DecorativeAvatar.test.tsx` to retain coverage for:

- FamilyMember rendering from already-resolved identity data;
- KnownPerson rendering from already-resolved identity data;
- null/undefined rendering;
- badge rendering;
- regression coverage for existing avatar rendering through the focused `FamilyAvatar.test.tsx` run.

Removed tests for `DecorativeAvatarReference` and resolver behavior because the reference contract is intentionally deferred.

# Verified

- No Shopping, Tasks, Agenda, Motivation, People, member page, API, persistence, backend, picker, or suggestion functionality was added or modified.
- The decorative persistence model remains intentionally undecided.
- Shopping remains the expected first consumer slice to define the decorative reference contract, with later consumers reusing that future contract.
- No screenshots or binary files were added.
- Repository-local cache/build outputs remained ignored and were not staged.

# Risks and Follow-up Work

- The first Shopping decorative avatar integration slice must define the actual decorative reference contract, including persistence shape, identifier semantics, deletion clearing, and API/client behavior.
- Tasks and Agenda should not define separate competing contracts; they should reuse the contract established by the first Shopping consumer slice unless that slice documents a reason not to.
- Future resolver/deletion-clearing infrastructure should be introduced only when there is a persisted consumer to validate it against.

# Modified Files

- `src/HomeOps.Client/src/avatarContacts/DecorativeAvatar.tsx`
- `src/HomeOps.Client/src/avatarContacts/DecorativeAvatar.test.tsx`
- `src/HomeOps.Client/src/avatarContacts/decorativeAvatar.ts` (removed)
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-10-avatar-contacts-v1-decorative-avatar-follow-up/avatar-contacts-v1-decorative-avatar-follow-up.md`
