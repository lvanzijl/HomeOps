# Summary

Implemented Avatar Contacts V1 Slice 7 smart decorative avatar suggestions for the Shopping decorative avatar picker. Suggestions are deterministic, local, score-based hints only; users must still explicitly select an avatar from the existing picker before any Shopping item reference is saved.

# Implemented

- Added reusable decorative avatar suggestion ranking infrastructure for FamilyMember and KnownPerson identities.
- Added centralized KnownPerson relationship aliases, including English and Dutch relationship labels.
- Integrated ranked suggestions into the Shopping decorative avatar picker above the existing Family Members, Shared People, and Private People groups.
- Added focused ranking and Shopping picker tests.

# Ranking Algorithm

The ranking engine tokenizes and normalizes the query and candidates, then assigns deterministic scores for exact display-name matches, first-name matches, nicknames, relationship aliases, custom relationship labels, lightweight fuzzy matches, FamilyMember identity matches, current-member PrivateToMember context, and Shared fallback scope.

Suggestions are filtered through an explicit minimum score threshold. Low-confidence matches are suppressed instead of always showing suggestions. Scores and reasons are exposed by the ranking result so later Tasks and Agenda slices can reuse the same implementation.

Fuzzy matching is intentionally lightweight: it supports bounded prefixes and one-edit typo/transposition cases for longer tokens, while rejecting broad substring matches such as `Frank` versus `Frankfurter` unless the candidate itself is a real matched token.

# Relationship Aliases

Relationship aliases are centralized in the reusable suggestion module. The alias set includes English aliases such as grandma, grandpa, uncle, aunt, teacher, babysitter, and friend, plus Dutch aliases such as oma, opa, oom, tante, juf, meester, vriend, vriendin, buur, buurvrouw, and buurman.

# Shopping Integration

When opening the Shopping decorative avatar picker, the select now shows a Suggested group only when the current item text produces qualifying ranked suggestions. The original manual groups remain available in this order: Family Members, Shared People, Private People.

Suggestions use the same option values as the manual picker entries. Selecting a suggested entry is still an explicit user action. The picker does not attach anything automatically while opening, rendering, typing, or calculating suggestions.

# Validation

Executed repository-supported .NET and frontend validation commands after configuring `DOTNET_CLI_HOME=/tmp/dotnet` and `NUGET_PACKAGES=/tmp/nuget-packages` for local tool/cache isolation.

# Tests

- `dotnet restore HomeOps.sln` passed with the existing NU1903 vulnerability warning for `SQLitePCLRaw.lib.e_sqlite3`.
- `dotnet build HomeOps.sln --no-restore` passed with the existing NU1903 warning.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build` passed 421/421 backend tests.
- `npm --prefix src/HomeOps.Client run build` passed with the existing Vite chunk-size warning.
- `npm --prefix src/HomeOps.Client test -- decorativeAvatarSuggestions.test.ts ShoppingListWidget.test.tsx knownPeopleApi.test.ts PeopleManagement.test.tsx DecorativeAvatar.test.tsx AvatarSelectionEditor.test.tsx` passed 34/34 focused frontend tests.
- `npm --prefix src/HomeOps.Client test` passed 270/270 frontend tests.

# Verified

- Exact name, first-name, nickname, relationship alias, localized alias, FamilyMember, KnownPerson, current-member PrivateToMember, Shared fallback, minor typo, prefix, negative, Frank vs Frankfurter, multiple-match, and low-confidence suppression behavior.
- Shopping picker Suggested section appears only for qualifying suggestions.
- Manual selection remains required; rendering suggestions does not call the decorative avatar update API.
- Existing Shopping picker manual selection and clearing behavior remains unchanged.

# Risks and Follow-up Work

- Shopping currently does not pass an active FamilyMember context into the picker, so current-member PrivateToMember boosting is available in the reusable ranking API and covered by tests but not yet used by Shopping runtime.
- Later Tasks and Agenda slices should reuse the same ranking module instead of adding domain-specific ranking logic.

# Modified Files

- `src/HomeOps.Client/src/avatarContacts/decorativeAvatarSuggestions.ts`
- `src/HomeOps.Client/src/avatarContacts/decorativeAvatarSuggestions.test.ts`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.test.tsx`
- `docs/reports/2026-07-10-avatar-contacts-v1-smart-suggestions/avatar-contacts-v1-smart-suggestions.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
