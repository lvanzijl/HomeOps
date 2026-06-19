# Home Dashboard Visual Review

## Summary
The current Home screen does not yet feel like the intended household glassboard. The strongest thing on screen is still the workspace shell and product-framework chrome, not the household information. Agenda is present but not dominant enough, Lists is currently not useful because the card renders empty in the running app, and the Family Member strip reads more decorative than contextual.

## Screenshots Captured
- `/home/runner/work/HomeOps/HomeOps/docs/reports/home-dashboard-review-slice-1-desktop.png`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/home-dashboard-review-slice-2-tablet-landscape.png`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/home-dashboard-review-slice-3-tablet-portrait.png`

## Agenda Review
- Agenda is not visually dominant enough because the page header, workspace navigation, workspace count, and Home panel framing all compete with it before the summary card even starts.
- The Agenda card is only slightly wider than Lists, so the hierarchy reads as two equal cards instead of one primary household anchor plus one secondary support area.
- The content is readable once reached, but it is not the first thing the eye lands on; date/time and family chips win attention first.
- The repeated `Today`/`Next` labels add some structure, but the card still feels like an app summary widget rather than the core family planning surface.

## Lists Review
- Lists is visually secondary, which is directionally correct, but it is currently too weak to feel useful.
- In the running app, the Lists summary renders with `No active list items.` despite seeded list data existing, so the Home screen loses one of its two core glassboard pillars.
- Even aside from the empty-state bug, the card reads as a flat secondary panel rather than a high-value shopping/packing reminder area.

## Family Member Review
- The Family Member strip is noticeable enough, but it feels more decorative than functional.
- Its size is acceptable in isolation, but relative to the weak Agenda card it pulls too much attention toward identity chips instead of today’s plan.
- It does not yet communicate household context strongly because there is no visible involvement, ownership, or “today” relevance attached to the members.

## Dashboard Hierarchy Review
- Home still feels like a workspace inside a framework shell, not the primary dashboard.
- The outer `Household Information Hub` heading, workspace nav tabs, `Workspace 1 of 6`, and `Primary household overview workspace.` copy make the glassboard feel nested and secondary.
- The Home surface currently reads as a panel inside the app rather than the app’s main household command surface.

## Glassboard Review
- It does not yet feel like a replacement for a family glassboard.
- What stands out immediately: current date/time, pastel family chips, and generic app navigation.
- What is missing immediately: strong shopping/packing reminders, obvious household urgency, clearer tomorrow/next preparation cues, and meaningful family-to-information context.
- With Lists effectively empty, the screen currently answers “what time is it?” better than “what does the household need to do?”

## Touch UX Review
- The quick-capture buttons are large enough and read as touch-friendly.
- The nav pills are also large enough for touch use.
- The `View Agenda` and `View Lists` affordances are visually small and feel more like link text than clear tap targets.
- Whole-card clickability is not obvious enough from the visuals alone.
- Tablet portrait is likely a problem: the responsive breakpoint is below 768px, so the two-card layout is likely still forced side-by-side in a common portrait tablet width instead of stacking for easier reading.

## Visual Direction Review
- The implementation is pastel and warm enough to avoid the rejected clinical direction.
- The Family Member treatment aligns with the accepted Variant B direction more than the rest of the page does.
- The overall page still feels too framework-demo and too neutral-white around the edges to fully hit a family-friendly wall-tablet-first dashboard mood.
- Variant C dashboard hierarchy is only partially achieved because the outer shell still dominates the composition.

## Risks
- Users may treat Home as a navigation gateway instead of a shared family planning surface.
- The empty Lists panel materially weakens the glassboard concept.
- Tablet portrait readability is at risk if summary cards remain side-by-side at 768px.
- The current hierarchy may normalize too much chrome above the fold, reducing glanceability from a distance.

## Unexpected Findings
- Startup blocker: the Vite dev proxy pointed to `http://localhost:5000` while the API launch profile runs on `http://localhost:5152`. This was fixed.
- Startup blocker: local startup depended on a separate manual migration step before seeded data was available. Pending EF Core migrations are now applied on non-testing startup.
- Functional blocker affecting review: the Home Lists summary rendered empty in the running app even after startup was fixed, so Lists could not be meaningfully reviewed as implemented.

## Recommended Changes
- Reduce or remove the workspace-framework chrome on Home so the glassboard becomes the first-class surface.
- Make Agenda materially more dominant than Lists in both scale and placement.
- Fix the Lists summary data path so active shopping/packing items actually appear on Home.
- Keep the Family Member strip, but tie it more directly to household context instead of letting it act as decorative emphasis.
- Stack or otherwise simplify the summary layout for portrait tablet widths.
- Add stronger glanceable preparation cues so Home answers today/next/remember more clearly.

## Next Prompt Context
Proceed with a Home Dashboard visual hardening slice only.

Constraints:
- Do not add new domains or future-slice functionality.
- Preserve Home as summary-first.
- Reduce workspace-shell dominance on Home.
- Strengthen Agenda hierarchy over Lists.
- Fix the Home Lists summary so active items render from current data.
- Tune tablet portrait behavior for touch-first readability.
- Keep the family-friendly pastel direction and the Family Member strip, but make it feel more contextual and less decorative.

## Validation
- Application started successfully: yes
- Screenshots created: yes
- Navigation verified: yes (existing frontend tests plus live startup verification)
