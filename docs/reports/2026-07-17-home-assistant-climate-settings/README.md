# Home Assistant Climate Settings — 2026-07-17

## Summary
Implemented Settings > Woning Home Assistant climate setup, status, refresh, and safe diagnostics using generated TypeScript client contracts directly.

## Implemented
- Added a `Klimaatbronnen` / `Home Assistant` workspace inside Woning settings.
- Added provider summary with display name, base URL, enabled state, connection status, refresh status, room count, mapping count, and health text.
- Added provider create/update form for display name, base URL, and enabled state where generated provider contracts support it.
- Added provider, room, and mapping refresh actions using generated Home Assistant climate refresh methods.
- Added grouped room mapping overview with Dutch role and health labels.

## UX decisions
- The setup lives in Settings > Woning only, not on runtime Woning or Klimaat in huis pages.
- Desktop uses a bounded summary + mapping workspace with internal scrolling. Tablet and phone stack the workspace while preserving status visibility.
- Existing room configuration navigation is reused by focusing the relevant room card instead of duplicating editors.

## Provider setup
The provider form stores only safe provider metadata: display name, base URL via `externalInstanceReference`, and enabled state via the generated provider update contract.

## Credential guidance
The UI explains that the access token is configured outside FamilyBoard and is never shown. It mentions only configuration names: `HomeAssistant__AccessToken` and `HOMEASSISTANT__ACCESSTOKEN`.

## Connection verification
`Verbinding controleren` calls the generated Home Assistant provider refresh method and presents typed outcomes as household-facing Dutch text.

## Refresh workflow
The UI supports provider-wide refresh, room refresh, and mapping refresh. Duplicate clicks are prevented while an action is active. Refresh summaries show attempted/succeeded/failed room counts, mapping health counts, observation counts, times, and cancellation state.

## Mapping overview
Mappings are grouped by FamilyBoard Room and show role, provider-derived safe source reference, enabled/archived state, health, last checked/success timestamps, and diagnostic summary.

## Health/diagnostics
Health is shown as text and does not rely on color. Diagnostics are limited to safe generated fields and include explicit copy that technical details are limited to protect tokens and Home Assistant data.

## Resume strategy
The generated frontend contracts do not expose a typed public update contract for allow-listed resume-strategy metadata. Strategy configuration is therefore presented as read-only/unavailable rather than editing generic diagnostic metadata.

## Room configuration navigation
Each room group exposes `Klimaatinstellingen` and `Koppelingen beheren`, reusing the current Woning room context rather than creating a separate Home Assistant editor or entity browser.

## Accessibility
Status and failure regions use `role="status"` and `role="alert"`; forms have explicit labels; mapping groups use headings; actions are regular keyboard-accessible buttons; status is textual.

## Responsive behavior
The desktop workspace is bounded with internal summary/mapping scroll regions. Narrow viewports stack the workspace and mapping cards in list-first presentation.

## Security boundaries
- Generated contracts are used directly.
- No token input or token storage was added.
- No arbitrary Home Assistant service execution was added.
- No raw JSON, Authorization header, raw HTTP response, or stack trace display was added.
- No handwritten API workaround was added.
- No unrelated product scope was added.

## Tests
- Added focused Home Assistant Settings tests for empty setup, token guidance, URL credential rejection, provider summary, safe diagnostics, refresh, and save flow.
- Updated Woning Settings tests to mock the new settings-side climate source loading.

## Deferred scope
OAuth, discovery, generic entity browser, service execution, lighting, presence, weather, energy, automation, dashboards, screenshots, binary assets, and schedule editors remain out of scope.

## Risks/limitations
- Resume-strategy editing is blocked until a typed safe public contract is exposed.
- Existing mapping editor/navigation remains minimal in the current frontend architecture; this slice links back to room context rather than duplicating management flows.

## Modified files
- `src/HomeOps.Client/src/settings/HomeAssistantClimateSettings.tsx`
- `src/HomeOps.Client/src/settings/HomeAssistantClimateSettings.test.tsx`
- `src/HomeOps.Client/src/settings/WoningManagement.tsx`
- `src/HomeOps.Client/src/settings/WoningManagement.test.tsx`
- `src/HomeOps.Client/src/settings/woningApi.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-07-17-home-assistant-climate-settings/README.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
