# Summary

Implemented Avatar Contacts V1 Slice 4 by integrating member-scoped People into the existing FamilyMember page. The page now shows a bounded People section for the current member's `PrivateToMember` `KnownPerson` records, supports lightweight search, create/edit/delete, avatar display, and avatar editing through the existing Slice 2 and Slice 3 infrastructure.

# Implemented

- Added a FamilyMember-page People card for the current member only.
- Loaded `KnownPerson` records through `knownPeopleApi` with `scope = PrivateToMember` and `familyMemberId = current FamilyMember`.
- Added client-side search over the member's displayed People.
- Added loading, empty, no-results, save/delete error, and load error states.
- Kept the section bounded with internal scrolling for relationship groups.
- Added shared presentation-group ordering so Friends appear first without hardcoding FamilyMember-page groups.
- Added tests for display, grouping, CRUD, avatars, avatar editing, search, states, and bounded layout class coverage.

# Member Page Integration

Viewport-first analysis before implementation:

- Current page composition: identity strip at the top, a reserved dashboard region for Today and Journey cards, an action rail, and bounded dialogs for goals/history/settings/avatar editing.
- Why overflow could happen: adding People as an unbounded list below the dashboard would increase document height and violate the primary-page no-scroll rule; large relationship lists could push the action rail off-screen.
- Primary sections: identity strip, Today, Journey/progress, and member-scoped People. Secondary sections remain contextual dialogs and action rail entries.
- Always visible content: member identity/status, today's bounded summary, progress summary, and the People section shell with search/add affordance.
- Compactable/internal-scroll content: relationship groups and person rows are internally scrollable inside the People card; search narrows the card contents without changing page height.
- Proposed composition: keep the existing dashboard as the reserved layout region and add People as the third dashboard card on desktop/laptop; collapse to a single column at narrower widths.
- Fit justification: the People card uses `min-height: 0`, fixed grid participation, and internal `overflow: auto`, so additional people do not increase the page height. The desktop grid reserves a bounded third column rather than appending document content.
- Risks/trade-offs: a third column reduces horizontal width for the existing Today/Journey cards on medium desktops, so the responsive breakpoint was raised to collapse earlier. Alternative rejected: placing People below the existing dashboard because it would create page-height pressure.

# KnownPerson Management

- Create always sends `scope: PrivateToMember` and the current `FamilyMember.id`.
- Edit normalizes the draft back to `PrivateToMember` and the current `FamilyMember.id` before saving.
- Delete calls the existing soft-delete API wrapper and removes the record from local member state.
- The FamilyMember page does not expose scope selection; Shared People remain managed through the Settings People capability.

# Avatar Reuse

- Display uses `KnownPersonAvatar`.
- Editing uses `KnownPersonAvatarEditor`, which continues to wrap the shared `AvatarSelectionEditor`.
- No decorative avatars, avatar picker integration, or duplicate avatar editor was added.

# Validation

- Configured .NET validation with `DOTNET_CLI_HOME=/tmp/dotnet` and `$HOME/.dotnet/tools` on `PATH` before running .NET commands.
- `dotnet restore HomeOps.sln` passed with the existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory warning.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing NU1903 warning.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter FullyQualifiedName~KnownPersonApiTests` passed 22/22.
- `npm run build` passed; Vite reported the existing chunk-size warning.
- `npm test -- FamilyMemberPage.test.tsx PeopleManagement.test.tsx KnownPersonAvatarEditor.test.tsx AvatarSelectionEditor.test.tsx` passed 23/23.
- `npm test` passed 258/258.

# Tests

Added and updated frontend coverage for:

- member page displays only current member-scoped `KnownPerson` rows;
- Friends-first presentation and derived relationship grouping;
- member-scoped create/edit/delete;
- avatar rendering and `KnownPersonAvatarEditor` launch;
- lightweight search;
- loading, empty, and error states;
- bounded layout class coverage;
- People management regression via the shared grouping helper.

# Verified

- Shared People management was not expanded beyond reusing the same presentation grouping helper.
- No decorative avatars, picker, smart suggestions, shopping, tasks, agenda, authentication, or permissions were implemented.
- Relationship grouping remains presentation-only and derived from `KnownPersonRelationshipType`.
- `knownPeopleApi` is used; generated NSwag client classes are not called directly from the FamilyMember page.

# Risks and Follow-up Work

- The FamilyMember People form intentionally duplicates the current People-management form shape instead of introducing a broader shared form component, to keep this slice limited to page integration.
- Future slices may refine copy and layout density after real household data is available.
- Future avatar picker/decorative references remain deferred.

# Modified Files

- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/knownPeople/PeopleManagement.tsx`
- `src/HomeOps.Client/src/knownPeople/peoplePresentation.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-07-10-avatar-contacts-v1-member-pages/avatar-contacts-v1-member-pages.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
