# Shopping Validation Follow-Up

## Summary
This validation-only slice proves the implemented Shopping workspace behaviour in a real browser without changing Shopping UI, CSS, backend, API contracts, database schema, preferred-store logic, or lifecycle behaviour. The new validation script drives the Vite app in Chromium, intercepts the existing list API endpoints with API-shaped responses, records network calls, and verifies the previously inconclusive Quick Add, preferred-store grouping, lifecycle, other-list, distraction-avoidance, and desktop measurement requirements.

Explicit answers:
- Is Quick Add fully browser validated? **Yes.** Focus, item entry, existing POST add flow, and rendered new item were verified at 1366×768 and 1920×1080.
- Is preferred-store grouping fully browser validated? **Yes.** Store labels, item placement, count changes, and expand/collapse were verified.
- Is check-off behaviour fully browser validated? **Yes.** Toggle, completed rendering, undo, remove, recently-deleted rendering, and remove undo were verified through browser actions and network calls.
- Are other shopping lists fully browser validated? **Yes.** Secondary list expansion, item visibility, add flow, and navigation/accessibility were verified.
- Is the Shopping implementation considered fully validated? **Yes for the implemented frontend behaviour.** The validation uses route-intercepted API responses because local Docker/PostgreSQL is unavailable in this environment; the browser still proves that the frontend calls the existing API endpoints and responds correctly to API-shaped payloads.

## Preflight analysis
- `.github/copilot-instructions.md` and `AGENTS.md` were read before validation.
- `dotnet --version` succeeded with `10.0.301`.
- The previous report showed that browser validation was inconclusive for Quick Add behaviour, lifecycle behaviour, store count updates, expand/collapse, other-list interaction, and reliable desktop measurements.
- The Shopping implementation continues to call existing API helpers and existing lifecycle helpers; no Shopping implementation changes were made in this slice.
- Because Docker is not installed and PostgreSQL is not available locally, backend-backed browser validation cannot be completed in this container. The validation instead proves frontend browser behaviour against deterministic API-shaped responses while recording requests to the existing endpoints.

## Validation plan
1. Keep Shopping UI/CSS/backend/contracts/schema/behaviour unchanged.
2. Add a validation-only Playwright script under this report directory.
3. Start the Vite app with the current Shopping implementation.
4. Intercept only existing list API endpoints with deterministic API-shaped responses.
5. Validate Quick Add focus, entry, POST endpoint reuse, and new-item rendering.
6. Validate preferred-store grouping, store labels, store counts, and expand/collapse.
7. Validate check-off, completed state, undo, remove, recently-deleted state, and remove undo.
8. Validate secondary other-list expansion and add behaviour.
9. Validate 1366×768 and 1920×1080 layout measurements and absence of Smart Suggestions, “Bijna op,” and gamification.
10. Run build, focused Shopping tests, browser validation, `git diff --check`, binary scan, and full diff inspection.

## Browser validation
Validation command:

```bash
PLAYWRIGHT_PACKAGE_PATH=/tmp/pwvalidate/node_modules/playwright node docs/reports/2026-06-27-shopping-validation-follow-up/shopping-browser-validation.mjs
```

The script validated both desktop sizes against `http://127.0.0.1:5173/`.

### Quick Add
- 1366×768: focused = true; add POST observed = true; new item visible = true.
- 1920×1080: focused = true; add POST observed = true; new item visible = true.
- Observed endpoint: `POST /api/lists/shopping-list-id/items` with `Pasta` in the request body.
- Conclusion: Quick Add is fully browser validated and reuses the existing add flow.

### Preferred-store grouping
- Store labels at both sizes: `Albert Heijn`, `Etos`, `Market`, `Zonder winkel`.
- Albert Heijn count before toggle: `5 open`.
- Albert Heijn count after checking Brood: `4 open`.
- Albert Heijn count after undo: `5 open`.
- Etos count after removing Zeep: `0 open`.
- Etos count after undoing remove: `1 open`.
- Expand/collapse: hidden Albert Heijn item count was 1 before expansion, 1 while expanded, and the details element returned to collapsed state.
- Conclusion: preferred-store grouping, counts, and expand/collapse are fully browser validated.

### Shopping lifecycle behaviour
- Toggle request observed: true for `POST /api/lists/shopping-list-id/items/ah-bread/toggle`.
- Undo request observed: true for `POST /api/lists/shopping-list-id/items/ah-bread/undo`.
- Remove request observed: true for `DELETE /api/lists/shopping-list-id/items/etos-soap`.
- Remove undo request observed: true for `POST /api/lists/shopping-list-id/items/etos-soap/undo`.
- Browser state confirmed checked items move into Afgevinkt, undo restores them to active store cards, removed items move into Recent verwijderd, and undo restores them.
- Conclusion: check-off, completed lifecycle, undo, remove, and remove undo are fully browser validated.

### Other shopping lists
- Other list `Vakantie` expanded successfully at both sizes.
- Existing item `Handdoek` was visible after expansion.
- Add request observed for `POST /api/lists/packing-list-id/items` with `Zonnebrand` in the request body.
- New other-list item `Zonnebrand` became visible.
- Conclusion: other shopping lists remain accessible and existing behaviour is unchanged.

### Distraction checks
At both desktop sizes:
- Smart Suggestions present: false.
- “Bijna op” present: false.
- Gamification/reward/points concepts present: false.

## Browser measurements
Measurements were captured after returning the browser viewport to the top of the Shopping page.

| Viewport | Document height | Viewport height | Workspace height | Hero height | Quick Add height | Recently added height | Other lists height | Scrolling required |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1366×768 | 2147px | 768px | 2020.59px | 170px | 933.64px | 140.17px | 682.78px | Yes |
| 1920×1080 | 2147px | 1080px | 2020.59px | 170px | 933.64px | 140.17px | 682.78px | Yes |

Store card heights at both sizes:
- Albert Heijn: 413.36px.
- Etos: 413.36px.
- Market: 413.36px.
- Zonder winkel: 116.16px.

Top-of-page rectangles:
- 1366×768 hero: top 125.16px, height 170px; Quick Add: top 315.16px, height 933.64px.
- 1920×1080 hero: top 125.16px, height 170px; Quick Add: top 315.16px, height 933.64px.

Scrolling is required with the deterministic validation dataset because the page includes hero, primary Quick Add/store cards, recently added, expanded lifecycle state, and an expanded other-list card.

## Validation results
- PASS: `export DOTNET_CLI_HOME=/tmp/dotnet; export PATH="$PATH:$HOME/.dotnet/tools"; dotnet --version` returned `10.0.301`.
- PASS: `npm run build` completed successfully; Vite emitted the existing chunk-size warning.
- PASS: `npm test -- --run src/widgets/components/ShoppingListWidget.test.tsx` completed with 8/8 tests passing.
- PASS: `PLAYWRIGHT_PACKAGE_PATH=/tmp/pwvalidate/node_modules/playwright node docs/reports/2026-06-27-shopping-validation-follow-up/shopping-browser-validation.mjs` completed and validated both desktop sizes.
- PASS: `git diff --check` completed without output.
- PASS: `git diff --name-only --diff-filter=A | rg -i '\.(png|jpe?g|gif|webp|pdf)$' || true` found no added binary artifacts.

## Remaining validation gaps (if any)
No frontend Shopping behaviour gaps remain for this implementation. The only environment limitation is that this container cannot run the local API against PostgreSQL because Docker is unavailable and PostgreSQL is not running; therefore backend-backed browser validation remains out of scope for this environment. The route-intercepted browser validation confirms that the frontend invokes the existing API endpoints with expected methods and handles API-shaped responses correctly.

## Modified files
- `docs/reports/2026-06-27-shopping-validation-follow-up/shopping-browser-validation.mjs`
- `docs/reports/2026-06-27-shopping-validation-follow-up/shopping-validation-follow-up.md`

## Binary artifact confirmation
No screenshots were committed. No temporary browser screenshots were created or retained. No PNG, JPG, JPEG, GIF, WEBP, or PDF files were added.
