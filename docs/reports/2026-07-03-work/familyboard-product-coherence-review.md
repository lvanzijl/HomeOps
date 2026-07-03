# FamilyBoard Product Coherence Review

Date: 2026-07-03  
Branch: `work`  
Scope: Analysis-only product coherence review for the primary FamilyBoard pages: Home, Agenda, Tasks, Shopping, Motivation, My Page, and Settings.

## Executive Summary

FamilyBoard now reads as a coherent household dashboard rather than a collection of unrelated web pages. The strongest product-level achievement is that the primary pages share a consistent intent: make household coordination visible, bounded, and emotionally safe. The redesigned pages generally use one dominant answer per page, move deeper workflows into dialogs or contextual panels, and reserve primary viewport space for household-facing summaries rather than administration.

Overall coherence assessment: **Strong, beta-adjacent, with a few consistency risks.**

The product identity is clearest on Home, Tasks, Motivation, My Page, and Settings. Agenda and Shopping are functionally aligned but still feel more tool-like than emotionally integrated in a few places because their headers and action rails emphasize operational controls more than the household question. This is not a blocker for controlled beta, but it is the main polish opportunity.

Recommended beta posture: **Ready for a controlled beta after targeted product-polish review, not broad redesign.** The product should avoid further page-specific redesign and instead standardize cross-product patterns: page question expression, contextual panel naming, dialog behavior, action rail placement, and household-language tone.

## Product Identity

FamilyBoard has a clear emerging identity: a calm household operating system for families. The interface language repeatedly frames work as family coordination rather than personal productivity: examples include `Dagelijkse gezinsplek`, `Familie-acties voor vandaag`, `Gedeeld familiekompas`, and `Gezinsonderhoud`.

### Family-first feeling

The family-first feeling is strong. Navigation is organized around household spaces, not modules or data models. Home uses family members and shared today context as the primary entry point. Tasks are framed as help for the family. Motivation centers a shared family goal. My Page makes a person visible without turning the page into account management.

### Emotional consistency

The product consistently uses calm, encouraging language. The emotional arc is: orient the family, reduce pressure, make help visible, celebrate progress, and keep administration quiet. Motivation is the emotional anchor, but Home and My Page also carry emotional product identity through family avatars, daily status, encouragement, and celebration language.

### Visual consistency

Visual consistency is broadly strong. Shared tokens for surfaces, warm tints, elevation, radii, dialog motion, and domain color classes create a unified system. Cards, panels, command bands, and overlays mostly feel related. The main inconsistency is that each major page still has its own specialized header vocabulary and structure, which can make the product feel like seven related dashboards rather than one repeated product grammar.

### Interaction consistency

Interaction consistency is good but not complete. Most deeper workflows are moved into bounded dialogs, contextual panels, or detail surfaces, and Escape-to-close behavior appears in several areas. However, dialogs use different class systems and naming conventions across Home, Agenda, Tasks, Motivation, My Page, Shopping, and Settings. Some actions appear in command bands, some in footer rails, some in card-level buttons, and some in side/action rails.

### Language consistency

Language is usually Dutch and household-focused. One notable exception is the Media workspace description, which is English while neighboring workspace descriptions are Dutch. That weakens perceived product polish even though the page is internal/future-facing.

### Dashboard philosophy

The dashboard philosophy is now strong. Pages prioritize stable summaries, limited visible rows, reserved regions, and contextual detail surfaces. The product generally avoids document-like behavior and treats overflow as a component responsibility rather than page growth.

### Household focus

The household focus is the product's strongest identity asset. FamilyBoard does not feel like a generic calendar plus task app. It feels like a home coordination surface because pages consistently answer household questions and translate administrative objects into family language.

## Product Coherence

FamilyBoard is coherent at the concept level and mostly coherent at the interaction level.

### What is coherent

- Primary navigation uses household spaces instead of technical modules.
- Primary pages generally present one dashboard question.
- Deeper administration is increasingly contained in panels or dialogs.
- Cards use similar rounded, warm, low-pressure visual language.
- Data-heavy pages expose summaries first and detail second.
- Emotional language appears across functional and motivational surfaces.

### What still reduces coherence

- Page headers do not yet share a single product grammar. Some pages use hidden shell headers and custom internal command bands; Settings has an explicit question header; Agenda uses a widget header; Shopping uses a command row; Tasks uses a command band.
- Contextual workflows are conceptually similar but named and structured differently: surface dialogs, task panels, shopping panels, motivation dialogs, avatar editor dialogs, and family member detail dialogs.
- Some page-level primary questions are explicit while others are inferred. Settings states `Is alles in orde?`, but Tasks, Agenda, Shopping, Home, Motivation, and My Page do not all express their primary question equally directly.
- Some administration remains visible on primary experiences through dense action clusters, especially when a page has many secondary controls.

## One-Primary-Question Evaluation

| Page | Expected household question | Five-second clarity | Assessment |
| --- | --- | --- | --- |
| Home | What is happening today? | Strong | Home is clearly a today-oriented household command center. Agenda, task, shopping, family, and motivation summaries support the daily question. |
| Agenda | When is everything happening? | Moderate to strong | The Agenda page clearly exposes time views, but the command toggle and event controls can compete with the core question. The household question is answered, but more as a calendar tool than a family dashboard. |
| Tasks | What should we do now? | Strong | The command band and primary today task group make the immediate action question clear. Planning, completed work, routines, and weekly review are secondary. |
| Shopping | What do we need to buy? | Strong | The quick-add strip and active list region make the buying question clear. Completed/deleted/other-list workflows are pushed to footer panels. |
| Motivation | Why are we doing this together? | Strong | The shared family goal and progress proof communicate purpose quickly. Secondary memories and personal goals reinforce the why rather than competing with it. |
| My Page | How am I doing today? | Strong | Identity strip, daily status, today tasks, and personal journey answer the personal daily question. Admin actions are present but mostly secondary. |
| Settings | Is everything in order? | Very strong | Settings explicitly states the question and answers it with a readiness state, health summary, backup state, restore readiness, and maintenance rail. |

### Pages that communicate within five seconds

Home, Tasks, Shopping, Motivation, My Page, and Settings communicate their primary question within five seconds.

### Pages needing product-level polish

Agenda is the main candidate for cross-product polish. It functions correctly and fits the dashboard philosophy, but it still feels more like a calendar workspace than a household answer surface. The issue is not viewport fit or page layout; it is product-language emphasis and hierarchy consistency.

## Information Hierarchy

The information hierarchy is substantially improved across the product.

### Dominant focal point

- Home: daily household status and immediate summary cards.
- Agenda: calendar/time view, though view controls are prominent.
- Tasks: today's task group.
- Shopping: active shopping list and quick add.
- Motivation: shared family goal.
- My Page: member identity plus daily status.
- Settings: maintenance readiness state.

### Secondary information support

Secondary information mostly supports the primary answer. Planning, completed tasks, shopping recovery, settings details, family memories, personal goals, and maintenance details have been moved into supporting rails or panels. This is a major product coherence win.

### Context no longer competing for permanent space

The product has largely moved contextual detail out of permanent viewport space. Shopping completed/deleted lists, Settings restore details, Motivation memories/stats, and My Page goals/history/settings are available without becoming primary page content.

### Administration removal

Administration is quieter than before, especially in Settings and My Page. The largest remaining risk is that some pages still expose multiple maintenance or configuration affordances in visible rails. This is acceptable for beta but should be monitored in user testing.

## Dashboard Philosophy

FamilyBoard consistently behaves like a dashboard in the current design direction.

### Glanceability

Glanceability is strong. Most pages can be scanned by reading the primary card/header, then the largest content region, then the rail/footer. The best examples are Settings, Tasks, Motivation, and Shopping.

### Dashboard behavior

The product uses stable layout regions, summary counts, status chips, visible limits, and contextual overflow. This supports shared household use because the screen does not recompose dramatically when data volume changes.

### Stability of layouts

The codebase shows explicit strategies for limiting visible content, including visible agenda/task/list limits and detail panels. These patterns make the product feel intentionally designed rather than incidentally responsive.

### Contextual workflows

Contextual workflows are conceptually strong. They keep primary surfaces stable and let parents handle detail work without taking over the whole page. The opportunity is to standardize the interaction grammar so the same mental model applies everywhere.

## Family Experience

### Parents

Parents are well served. The product gives them a quick operating picture of the day, planning, shopping, tasks, household maintenance, and family motivation. Detail workflows exist but are not permanently dominant. Settings is especially parent-friendly because it answers readiness without exposing raw administration first.

### Children

Children are increasingly well served through My Page, Motivation, family avatars, and encouraging language. Tasks and Motivation make contribution visible without presenting the app as punishment or productivity pressure. The biggest child-facing risk is density: some pages remain adult-oriented dashboards rather than child-readable surfaces.

### Shared household usage

Shared household usage is strong. The product is appropriate for a shared screen because it emphasizes household status, today, collective progress, and stable regions. Dialogs and panels keep private or administrative detail from overtaking the board.

## Cross-Product Consistency

### Page headers

Headers are directionally consistent but structurally inconsistent. The shell sometimes renders a generic page header, Home and Settings suppress or replace it, Agenda relies on widget header structure, Tasks uses a command band, Shopping uses a command row, and Motivation uses a primary card as header-like content.

Recommendation: establish one cross-product page-question pattern rather than redesigning pages individually.

### Card hierarchy

Card hierarchy is mostly consistent: primary cards are larger, secondary cards are quieter, and status/proof tiles support the main answer. The largest inconsistency is naming and class structure rather than user-visible behavior.

### Spacing and typography

Spacing and typography appear coherent through shared CSS tokens, radii, and surface styles. Minor variations exist but are not product-level blockers.

### Action placement

Action placement is the most visible consistency opportunity. Primary actions appear in page headers, command bands, card footers, footer rails, and side rails depending on the page. This is understandable given page-specific needs, but a beta polish pass should define a common rule: one primary action near the page answer, secondary actions in a rail or contextual panel.

### Contextual panels

Contextual panels are a strong pattern but need naming and behavior standardization. Shopping, Settings, Tasks, Motivation, Home, and My Page all have versions of detail surfaces. Product coherence would improve if these shared common close behavior, heading structure, copy style, and action placement.

### Dialogs

Dialogs are visually related but implemented through several patterns: `avatar-editor`, `home-capture-dialog`, `task-dialog`, `motivation-dialog`, `settings-surface-dialog`, `shopping-surface-dialog`, and family member detail dialogs. This is acceptable internally but could produce subtle user-facing inconsistencies.

### Navigation behavior

Navigation behavior is coherent. Primary pages are separated from administration, and My Page uses a family-member detail mode with a back slot. The Settings navigation being isolated as administration supports product identity.

### Visual rhythm

Visual rhythm is good. The product has a warm, rounded, calm rhythm. The most pronounced rhythm difference is Agenda, which can feel more control-heavy because of view toggles and calendar interactions.

### Information density

Information density is mostly appropriate for a household dashboard. Tasks and Settings have higher density but justify it through summary chips and structured panels. Child-facing readability should be validated during beta.

## Remaining Product Weaknesses

1. **Header/question grammar is not fully standardized.** Some pages explicitly answer a question; others rely on inferred page purpose.
2. **Agenda remains the most tool-like primary page.** It answers time, but its first impression is still a calendar control surface.
3. **Action placement varies across pages.** Users may need to relearn where the primary action lives on each page.
4. **Contextual surfaces are conceptually consistent but mechanically varied.** Dialogs, panels, and rails should feel like one FamilyBoard pattern.
5. **Some future/internal workspace copy is inconsistent.** The Media description uses English among Dutch workspace descriptions.
6. **Administration is quieter but not always invisible.** Some maintenance affordances remain visible on primary pages, especially where rails carry multiple actions.
7. **Child readability is promising but not proven.** My Page and Motivation support children, but Agenda/Shopping/Tasks still assume adult reading and operation.
8. **Product vocabulary has near-duplicates.** Terms such as dashboard, workspace, surface, panel, rail, settings, maintenance, and details could be consolidated for user-facing coherence.

## Cross-Product Opportunities

1. Define a reusable **page question pattern** for every primary page.
2. Standardize **primary action placement** across dashboards.
3. Standardize **contextual detail surfaces** across Shopping, Settings, Tasks, Motivation, Home, and My Page.
4. Establish a product-wide **empty/loading/error state language** for household contexts.
5. Create consistent **action rail rules**: what belongs in a visible rail versus a contextual panel.
6. Normalize **Dutch product copy** across all workspace descriptions and future placeholders.
7. Create a shared **family proof/status tile** pattern for summaries and readiness indicators.
8. Add a child-readability beta checklist for shared-screen pages.
9. Standardize **Escape/backdrop/close behavior** for every overlay.
10. Define a shared **beta polish rubric** for glanceability, emotional tone, and family-first language.

## Beta Readiness

### Biggest strengths

- Clear household-first identity.
- Strong dashboard philosophy.
- Stable primary page compositions.
- Warm, emotionally safe language.
- Reduced administration on primary surfaces.
- Good separation between primary answers and contextual workflows.

### Biggest remaining risks

- Inconsistent page header/question grammar could make the product feel less intentionally unified.
- Agenda may feel like a generic calendar rather than a FamilyBoard-native household dashboard.
- Dialog and panel variations may become noticeable during repeated beta use.
- Child usability needs real-world validation, not just design inspection.

### Polish items

The next polish pass should be cross-product, not page-specific. It should align headers, action placement, overlay behavior, user-facing vocabulary, and child-readable language without changing the underlying page layouts.

### Consistency score

**8.1 / 10**

FamilyBoard is coherent enough for controlled beta. The remaining gap is not architecture or layout; it is product-system consistency.

### Family usability

**Strong for parents, promising for children, strong for shared household display.**

### Product maturity

**Late alpha / controlled beta candidate.** The product feels substantially formed and coherent, but should enter beta with explicit observation goals around comprehension, action discovery, child readability, and whether Agenda feels native to the product.

## Top 10 Recommended Polish Items

1. Add or standardize a visible primary household question on every primary page.
2. Make Agenda's first impression more household-answer oriented without redesigning its layout.
3. Define one product rule for primary action placement.
4. Consolidate contextual panels/dialogs into one user-facing interaction pattern.
5. Normalize Dutch copy for future/internal workspace descriptions.
6. Standardize loading, empty, success, and error states around household language.
7. Review all visible rails for whether secondary actions can be grouped more consistently.
8. Create a child-readability pass for My Page, Tasks, Motivation, and shared Home summaries.
9. Standardize overlay close behavior, headings, descriptions, and footer actions.
10. Create a controlled-beta observation checklist focused on five-second comprehension per page.

## Overall Recommendation

Proceed toward a controlled beta after a small cross-product polish slice. Do not start another round of independent page redesigns. The product now has enough coherence that page-specific redesign would risk fragmentation. The best next step is to reinforce the shared product grammar that already exists.

## Validation Performed

- Read repository governance instructions in `AGENTS.md` and `.github/copilot-instructions.md`.
- Configured repository-local .NET, NuGet, and npm cache environment locations before validation commands.
- Inspected primary navigation, workspace definitions, Home, Agenda, Tasks, Shopping, Motivation, My Page, Settings, and shared CSS patterns.
- Ran a frontend test command incorrectly with a Jest-only option; it failed before tests executed.
- Ran the frontend Vitest command; it started but produced no completion output within the observation window and was stopped to avoid an unbounded validation run.
- Performed scope sanity review through `git status` and ignored-file inspection.

## Files Inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/MotivationPage.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/package.json`

## Confirmation That No Implementation Changes Were Made

No source-code implementation changes were made. This review only adds this markdown report.

## Confirmation That No Binary Files Were Added

No binary files were added by this task.
