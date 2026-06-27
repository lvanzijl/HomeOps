# Agenda UX Review

## Executive Summary

- Overall Agenda quality: **7.5 / 10**
- Overall FamilyBoard quality: **8 / 10**
- Ready for beta: **No**
- Primary conclusion: Agenda now forms a coherent three-workspace FamilyBoard planning experience, but it should receive one focused polish iteration before beta. Month, Week, and List have distinct jobs and share enough event-card, indicator, colour, and typography language to feel like one product. The biggest beta risk is not architecture; it is density, desktop scrolling, and the need for clearer workspace affordances and empty/quiet states across real household data.

## Workspace Scorecard

### Month

- UX score: **8 / 10**
- FamilyBoard score: **8.5 / 10**

Strengths:
- Month is clearly the primary planning surface.
- Master-detail architecture gives families a stable sense of place: the month grid remains visible while the selected-day panel becomes the working surface.
- `Gebeurtenis toevoegen` in the selected-day panel makes event creation feel contextual rather than global.
- Event-type indicators and overflow pills make month cells more informative without turning them into dense schedules.
- The selected-day cards feel warmer and more family-oriented than a conventional business calendar list.

Weaknesses:
- Month navigation depth was not fully captured in the completed review findings; the implementation is anchored on the selected date, but dedicated previous/next month controls were not documented as validated.
- Desktop page-level scrolling was previously observed at 1366×768 in the Month slice, which weakens the “at-a-glance” planning promise on common laptop displays.
- Event indicators are compact and friendly, but icon-only month cells may still require learning for some families.
- The detail panel can become tall for busy days and relies on internal/page scrolling.
- Month remains visually strong, but the source selector still feels more like a configuration control than part of a warm planning workflow.

### Week

- UX score: **7 / 10**
- FamilyBoard score: **8 / 10**

Strengths:
- Week is not an hourly calendar clone; it uses seven FamilyBoard planning cards instead of a timeline grid.
- Busy and quiet days are communicated through information density, indicators, summaries, and compact cards rather than explicit stress scoring.
- Previous/current/next week navigation supports Sunday-evening planning without adding scheduling complexity.
- Reusing Month/List event visuals creates recognition across workspaces.
- Quiet-day copy supports a calm family-first tone.

Weaknesses:
- The seven-column layout becomes dense when several days contain multiple events.
- Browser validation previously measured page-level scrolling at both 1366×768 and 1920×1080 for the populated Week workspace.
- Compact event cards preserve functionality, but edit/delete actions inside small cards can compete with scanability.
- Week currently answers “what is happening?” better than “what should we prepare?” because no planning prompts or family-prep affordances exist yet.
- Mobile was intentionally left as a simple fallback and was not reviewed as a full Week experience.

### List

- UX score: **7.5 / 10**
- FamilyBoard score: **8 / 10**

Strengths:
- List has a clear purpose: chronological reference for “Wat komt eraan?”
- Grouping into `Vandaag`, `Morgen`, `Deze week`, `Volgende week`, and `Later` supports quick scanning.
- Past events are omitted, making the workspace feel forward-looking rather than archival.
- Existing event cards and indicators keep List visually consistent with Month and Week.
- The empty state is warm and avoids technical wording.

Weaknesses:
- The populated List workspace was previously measured as taller than both desktop viewports, requiring page-level scrolling.
- Dense event cards make the timeline friendly but tall; long lists may become hard to scan without search or filters.
- The completed validation did not capture a real-data household with many recurring/all-day items, so worst-case scanability remains unknown.
- Group headers are useful but could do more to show date ranges or prep context.
- List currently has no add-event affordance, so event creation remains primarily tied to the Month selected-day workflow.

## Workflow Assessment

### Monthly planning

Month successfully supports monthly planning. The persistent grid and selected-day panel create a stable planning workspace, and event indicators make days scannable at a glance. The selected-day panel turns the old day view into an integrated detail surface. The main concern is whether the page remains sufficiently visible without scrolling on common laptop displays.

### Weekly planning

Week is directionally successful as a Sunday-evening planning workspace. It avoids an hourly scheduling clone and uses seven simultaneous planning cards. Busy/quiet recognition works through density, but richer prep-oriented prompts are still missing. Week is useful for awareness, but not yet a complete weekly family planning ritual.

### Upcoming events

List successfully fills the “what is coming next?” gap. Chronological grouping, reused cards, and warm headers prevent it from feeling like a table or inbox. Its main limitation is vertical length: the more it succeeds as a reference, the more it needs filtering, search, and compacting controls.

### Event management

Event management remains consistent because creation, editing, and deletion reuse existing flows. Editing and deleting were validated in Week/List implementation slices through reused event cards. Creation remains strongest in Month because `Gebeurtenis toevoegen` is tied to the selected day. The completed review did not capture whether users expect add-event actions in Week or List.

## Cross-Workspace Consistency

### Navigation

The `Maand`, `Week`, and `Lijst` workspace toggle establishes clear top-level modes. Month remains default, and Week/List are non-default supporting workspaces. The labels are concise and Dutch. The remaining risk is discoverability: the toggle communicates modes, but not the distinct jobs of each workspace beyond the workspace content itself.

### Cards

Event cards are one of the strongest consistency points. Month detail, Week day cards, and List groups reuse the same FamilyBoard event-card language, preserving icons, type labels, pastel backgrounds, and edit/delete actions.

### Buttons

Buttons generally share rounded, warm FamilyBoard styling. Primary actions such as `Gebeurtenis toevoegen` are clear. Secondary edit/delete actions remain functional but can feel visually busy inside compact Week cards.

### Typography

Typography is consistent and readable. Eyebrows, headers, helper copy, and card labels follow the broader product style. Some text hierarchy in dense Week/List states could be tightened so primary family information stands out faster.

### Colours

Pastel event-type colours are cohesive and calm. They reinforce event type without creating enterprise-style severity/status colours. Colour contrast should still be checked more deeply against accessibility targets in a later polish pass.

### Icons

Emoji-style icons make the Agenda more approachable and family-friendly. They also make event types recognisable across workspaces. The risk is semantic ambiguity for some categories and inconsistent rendering across platforms.

### Event indicators

Indicators successfully replace raw counts and help users recognise the nature of days/events quickly. Overflow pills prevent overcrowding. Icon-only meaning may need tooltips/labels or a legend-like learning aid later.

### Event presentation

Presentation is recognisably shared across Month, Week, and List. This is the strongest evidence that the three workspaces feel like one product rather than separate pages.

### Spacing

Spacing feels warm and touch-friendly in low-to-medium density states. In high-density Week/List states, vertical height grows quickly and causes page-level scrolling on desktop.

## Remaining UX Issues

1. **High** — Page-level scrolling remains in populated Month/Week/List desktop validation, which weakens at-a-glance planning.
2. **High** — Week is useful for awareness but lacks planning prompts for Sunday-evening preparation.
3. **High** — List can become very tall because it reuses full event cards without compacting/search/filtering.
4. **High** — Month navigation controls were not documented as fully validated in the completed review findings.
5. **High** — Source selector still feels like a technical/configuration element inside the family planning surface.
6. **Medium** — Icon-only event indicators may not be immediately understandable for all families.
7. **Medium** — Week cards can become crowded when multiple editable events appear on the same day.
8. **Medium** — Edit/delete actions compete with scanability in compact Week cards.
9. **Medium** — List group headers do not show date ranges, which could help chronological clarity.
10. **Medium** — Event colours are soft and coherent, but accessibility contrast was not captured in the completed review findings.
11. **Medium** — Add-event workflow is strongest in Month; expectations for adding from Week/List were not captured.
12. **Medium** — Mobile behaviour was intentionally not reviewed as a full redesign and remains a risk.
13. **Medium** — Empty/quiet states are warm, but could become repetitive across workspaces.
14. **Low** — Emoji rendering may vary across devices and operating systems.
15. **Low** — The workspace toggle labels are concise but do not explain the job of each workspace on first use.
16. **Low** — List currently omits past events entirely; future archive/reference expectations are unresolved.
17. **Low** — Dense all-day or multi-day event behaviour was not captured in the completed review findings.
18. **Low** — The reports documented validation measurements, but no qualitative family-user testing was captured.

## Top 10 Improvements

1. Priority: **High**
   Expected impact: Reduce desktop scrolling and improve at-a-glance confidence.
   Estimated implementation complexity: **Medium**
   Design System or Agenda specific: **Agenda specific**

2. Priority: **High**
   Expected impact: Make Week feel more like Sunday planning by adding prep prompts or “things to get ready” areas.
   Estimated implementation complexity: **Medium**
   Design System or Agenda specific: **Agenda specific**

3. Priority: **High**
   Expected impact: Improve List scanability for dense calendars with compact timeline density options or collapsed groups.
   Estimated implementation complexity: **Medium**
   Design System or Agenda specific: **Agenda specific**

4. Priority: **High**
   Expected impact: Add clearer Month navigation affordances if not already present/validated.
   Estimated implementation complexity: **Low to Medium**
   Design System or Agenda specific: **Agenda specific**

5. Priority: **High**
   Expected impact: Rework source selection into a warmer “Wat tonen we?” control instead of a technical settings fieldset.
   Estimated implementation complexity: **Medium**
   Design System or Agenda specific: **Design System**

6. Priority: **Medium**
   Expected impact: Add an event-type indicator legend or accessible labels to reduce icon ambiguity.
   Estimated implementation complexity: **Low**
   Design System or Agenda specific: **Agenda specific**

7. Priority: **Medium**
   Expected impact: Improve Week day card density by separating scan summary from edit/delete actions.
   Estimated implementation complexity: **Medium**
   Design System or Agenda specific: **Agenda specific**

8. Priority: **Medium**
   Expected impact: Add date ranges/subtitles to List group headers for stronger chronological clarity.
   Estimated implementation complexity: **Low**
   Design System or Agenda specific: **Agenda specific**

9. Priority: **Medium**
   Expected impact: Run/accessibility-check event colour contrast and adjust soft palettes where needed.
   Estimated implementation complexity: **Low to Medium**
   Design System or Agenda specific: **Design System**

10. Priority: **Medium**
    Expected impact: Validate/add a minimal mobile-specific Agenda polish pass for Month, Week, and List.
    Estimated implementation complexity: **Medium to High**
    Design System or Agenda specific: **Agenda specific**

## Recommendation

**Ready with Minor Polish**

Agenda does not need a significant redesign. The three workspaces now have distinct purposes and form a coherent FamilyBoard planning experience: Month answers how the month looks, Week supports weekly awareness, and List answers what is coming next. The experience is warm, family-first, and visually unified through shared cards, indicators, colours, and copy. However, beta readiness should include a focused polish pass for density, scrolling, source-selection warmth, workspace affordance clarity, and Week/List scanability.

## Validation

- Preflight result: `.github/copilot-instructions.md` was read, and `dotnet --version` returned `10.0.301` with `DOTNET_CLI_HOME=/tmp/dotnet` and `$HOME/.dotnet/tools` on `PATH`.
- Browser validation: reused from the completed Agenda Month, Week, and List implementation validations; browser validation was **not repeated** for this documentation-only follow-up.
- Viewports reused from completed validation: `1366×768` and `1920×1080`.
- Month validation data reused: month grid/detail panel validation and desktop scrolling observations from the Month report.
- Week validation data reused: seven-card Week validation and measurements from the Week report.
- List validation data reused: timeline grouping/order, edit/delete, empty state, and measurements from the List report.
- `git diff --check`: run for this documentation-only change.
- Binary artifact confirmation: no screenshots or binary artifacts were added by this report task.

## Modified Files

- `docs/reports/2026-06-27-agenda-ux-review/agenda-ux-review.md`

## Binary Artifact Check

- No binary files committed.
- No screenshots committed.
- No temporary screenshots remain.
- No PNG, JPG, JPEG, GIF, WEBP, or PDF files were added.
