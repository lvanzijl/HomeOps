# Avatar V2 Slice 3 API/Client Contract Cleanup

## Summary
Removed legacy avatar DTO/request/response exposure from the public Family Member API contract and regenerated the OpenAPI/TypeScript client. Frontend family member create/update mapping now sends Avatar V2 configuration without legacy avatar payloads. Backend persistence still retains legacy avatar entity columns for the next dedicated cleanup slice.

## Implemented
- Removed `FamilyMemberAvatarDto` plus `Avatar` fields from `FamilyMemberDto`, `CreateFamilyMemberRequest`, and `UpdateFamilyMemberRequest`.
- Updated Family Member create/update endpoints so clients do not send legacy avatar data.
- Kept temporary server-side defaults for legacy entity fields on create and adjusted kind-derived age-group updates to satisfy the existing persistence model.
- Preserved Avatar V2 config create/update and response support.
- Regenerated OpenAPI and the generated TypeScript API client with the cleaned contract.
- Updated frontend Family Member API mapping, onboarding, and add-member flows so no legacy avatar payload is sent.
- Updated backend and frontend tests for create/update without legacy avatar payloads and responses without legacy avatar fields.

## Verified
- Legacy avatar DTO/request/response fields were removed from the public API contract.
- Frontend no longer sends legacy avatar payloads.
- Create/update work without legacy avatar request payloads.
- Avatar V2 config remains supported.
- Initials fallback remains intact through existing FamilyAvatar coverage.
- No migrations were added.
- EF/database legacy fields remain for later persistence cleanup.

## Risks
- Legacy entity fields still exist and are populated with server defaults until Slice 4 removes or migrates persistence safely.
- Frontend fallback/mock member type still allows optional legacy avatar data for remaining renderer regression coverage and static fixture compatibility, but API mapping ignores it.

## Modified Files
- `src/HomeOps.Api/FamilyMembers/FamilyMemberDtos.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/home/familyMembersApi.ts`
- `src/HomeOps.Client/src/home/familyMembersApi.test.ts`
- `src/HomeOps.Client/src/FirstRunWizard.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `tests/HomeOps.Api.Tests/Lists/FamilyMemberApiTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Deferred To Slice 4
- Remove legacy avatar EF entity properties.
- Remove legacy avatar database columns.
- Add any required schema migration.
- Remove seed data or model defaults that only exist for legacy persistence columns.
- Remove remaining frontend fixture-only legacy avatar model fields if no longer needed after persistence cleanup.

## Next Prompt Context
Avatar V2 legacy removal Slice 3 is complete. Public Family Member API contracts no longer expose or require legacy avatar DTO/request/response fields, the regenerated TypeScript client reflects that contract, and frontend create/update flows do not send legacy avatar payloads. Backend create/update still populate retained legacy entity fields internally with defaults only to satisfy current persistence. Avatar V2 config remains supported, initials fallback remains permanent, no migrations were added, and EF/database legacy fields remain unchanged for Slice 4 persistence cleanup.
