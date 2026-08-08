# Phase 5 Slice 5.6 — Provider credential and lifecycle management

**Status:** Completed on 2026-08-08.

## Outcome

- Home Assistant credentials remain administrator-managed. FamilyBoard returns only the canonical configuration key and configured/missing state, and exposes no secret input or secret-bearing provider field.
- One backend resolver supplies the provider adapter and connection test. The test is household-scoped, limited to ten seconds, and returns only normalized outcomes and safe Dutch explanations.
- Provider create/update rejects embedded URL credentials and no longer accepts free-form diagnostic metadata. Portability filters provider diagnostics to enumerated safe refresh markers.
- Provider archive requires explicit confirmation and reports affected rooms and active/archived mappings. Archive preserves mappings but removes their runtime effect; restore returns retained mappings to `Unverified` and asks for a new test/refresh.
- The bounded Settings → Woning management dialog keeps credential guidance, safe fields, connection testing, dependency impact, lifecycle actions, and recoverable errors together. Archived providers remain reachable as compact restore rows.
- Migration `20260808124113_SanitizeClimateProviderDiagnostics` clears legacy provider diagnostic values that do not match a known safe refresh marker.

## Viewport implementation

The implementation follows `viewport-analysis.md`. PostgreSQL-backed Chromium found that the archived restore row could be painted under the following floor-plan card even though the page had no scrollbar. The approved analysis was revised twice while preserving its information architecture: the secondary Woning overflow owner is now a sequential flex column of non-shrinking cards, and direct Home Assistant lifecycle blocks cannot collapse below their content.

The final dialog uses a fixed header/footer and an internally bounded body. Automated and independent browser checks at 1440×900 and 1366×768 show zero body/document overflow, a fully contained dialog, an operable restore action, and no browser warnings or errors.

## Validation

| Gate | Result |
| --- | --- |
| Focused provider/portability backend tests | 58/58 passed |
| Focused Settings → Woning frontend tests | 13/13 passed |
| Full backend tests | 646/646 passed |
| Full frontend tests | 377/377 passed |
| Solution build | Passed; existing SQLitePCL `NU1903` warning remains |
| Frontend production build | Passed; existing large-chunk warning remains |
| PostgreSQL migration baseline | 4/4 passed through Rancher Desktop |
| EF migration list/model drift/idempotent script | Passed; generated temporary script removed |
| Pinned NSwag 14.7.1, two runs | Hash-identical OpenAPI and TypeScript client output |
| PostgreSQL-backed Playwright | 15/15 passed at both required viewports |
| Independent in-app browser | Credential boundary, normalized test, archive/restore, dialog containment, zero page overflow, and zero error logs verified |

Pinned generation hashes:

- OpenAPI: `2AEE7C632624EF7EC95658509CB9221539895DA89CBECAB39D5A88E524AD15DC`
- TypeScript client: `6153A3B9DDFE82AD48C3908124A61E3889968209B813F3E1B99FDE66E654A45A`

## Boundary

This slice does not add token entry, browser or database secret persistence, encrypted secret storage, entity discovery, arbitrary Home Assistant service execution, additional heating authority, or household weather configuration. Weather location remains Slice 5.7.
