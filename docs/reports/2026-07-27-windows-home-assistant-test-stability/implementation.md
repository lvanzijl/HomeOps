# Windows Home Assistant test stability

**Remediation phase:** Phase 0 — Safety baseline and regression harness  
**Slice:** 0.1A — Cross-platform Home Assistant test isolation  
**Status:** Completed  
**Date:** 2026-07-27

## Outcome

Removed the 21 Windows-only `HomeAssistantClimateProviderTests` failures without changing production provider behavior.

The test fixture now:

- treats `HOMEASSISTANT__ACCESSTOKEN` and `HomeAssistant__AccessToken` as the same key on Windows;
- clears and restores both keys independently on case-sensitive operating systems;
- preserves any credential value that existed before a test;
- covers the provider's compatibility-key fallback;
- uses the same reversible fixture for the missing-credential case.

## Validation

- focused `HomeAssistantClimateProviderTests`: 28/28 passed;
- guarded PostgreSQL migration tests: 2/2 passed;
- full backend suite: 575/575 passed;
- existing `NU1903` warning remains for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11.

No production code or product behavior changed.
