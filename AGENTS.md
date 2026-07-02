# HomeOps Agent Instructions

## Model Guidance
- Default model: GPT-5.4.
- Use GPT-5.3 for small, isolated changes.
- Use GPT-5.5 only with explicit justification.

## Delivery Rules
- Work one implementation slice per run.
- Keep reports concise.
- Do not claim validation that was not performed.
- Stop when requirements are ambiguous.
- Avoid speculative refactoring and future-slice implementation.
- Update `docs/state/current-state.md` after implementation work. Update the current phase roadmap for normal feature work.

## Documentation Governance
- Phase 1 is historical. Future work targeting Phase 2, Phase 3, or later phases must not modify `docs/roadmap/phase-1.md` unless correcting factual mistakes, fixing incorrect history, or repairing broken references. Normal feature work must update the current phase roadmap instead.

## Architecture Guardrails
- Backend: ASP.NET Core with C#.
- Frontend: React + TypeScript + Vite.
- Database: PostgreSQL; development database runs through Docker Compose.
- API contracts: OpenAPI with NSwag.
- Architecture: modular monolith.
- No Kubernetes, microservices, event sourcing, CQRS, or distributed architecture.
- Widgets are presentation units; data models must not be widget-specific.
- Layout is widget-driven.
- Workspaces contain widget instances.
- Widget instances reference widget definitions.
- Future widgets may consume shared data models.

## Current Scope Boundaries
- Bootstrap only unless a later prompt explicitly advances a roadmap slice.
- Do not implement authentication, Google Calendar, Home Assistant, shopping lists, agenda, sensors, media, or gamification during bootstrap.

## Viewport-First Workflow

Before implementing any viewport/layout changes for a primary FamilyBoard page, an analysis is mandatory.

Implementation may not begin until the analysis has been completed.

The analysis must include:

- The current page composition.
- Why the page exceeds its reserved viewport region.
- Which sections are primary versus secondary.
- Which content should always remain visible.
- Which content can be compacted, summarized, limited, paginated, or internally scrolled.
- A proposed dashboard/grid composition with reserved layout regions.
- Justification that the proposed composition will fit within common desktop/laptop viewports without page scrolling.
- Risks, trade-offs, and alternative layouts considered.

Only after this analysis has been completed may implementation begin.

Implementation must follow the approved analysis rather than iteratively changing CSS until the page happens to fit.

The objective is to intentionally design each page to fit the viewport instead of treating viewport overflow as a styling problem.

## Analysis Authority Rule

For any task that follows the Viewport-First Workflow, the approved analysis becomes the implementation contract.

Once implementation begins:

- Follow the approved analysis.
- Do not redesign the page while implementing.
- Do not introduce alternative layouts because they appear easier to implement.
- Do not gradually drift away from the approved composition.
- Treat the approved report as the source of truth for the implementation.

If implementation reveals a significant technical limitation or an unforeseen UX issue:

- Stop implementation.
- Document the issue.
- Update or replace the analysis.
- Explain why the original proposal is no longer appropriate.
- Only continue implementation after the analysis has been revised.

Small implementation adjustments are acceptable when they do not change the approved information architecture, layout strategy, viewport strategy, or UX goals.

The implementation phase exists to realise the approved design, not to redesign it.

## Scope Sanity Check

Before reporting a task as complete, compare the resulting changeset against the expected scope of the work.

If the changeset is significantly larger than expected, stop immediately and investigate before continuing.

Examples include, but are not limited to:

- hundreds or thousands of changed files;
- unexpectedly large line-count changes;
- generated caches;
- build artifacts;
- temporary files;
- package caches;
- test output;
- browser artifacts;
- screenshots;
- videos;
- binary assets;
- generated documentation outside the requested scope.

Do not assume these files are acceptable simply because they were produced during the task.

Determine:

- which directory introduced the unexpected files;
- why they were created;
- whether they are required by the repository;
- whether they are intended to be version controlled.

Unless the repository explicitly requires them, remove all generated artifacts from the changeset before continuing.

After cleanup:

- regenerate the git diff;
- verify that the remaining changes match the intended feature scope.

Every implementation should have a proportionate changeset.

For example:

- a UI layout improvement should primarily modify frontend source files, styles, tests (if needed), and the implementation report.
- it should not unexpectedly introduce thousands of generated files or unrelated repository changes.

If the cause cannot be determined with confidence, stop and report the issue instead of completing the task.


## Repository-Local Cache Rule

Repository-local cache directories exist only to isolate the execution environment.

They are temporary execution artifacts and are never part of the implementation.

Examples include, but are not limited to:

- .dotnet-home/
- .nuget/
- .nuget/packages/
- .npm-cache/
- Playwright browser caches
- temporary build caches
- temporary package caches
- temporary tool caches

These directories must never appear in the final changeset unless the repository explicitly versions them.

Before completing any task:

- inspect the changeset for repository-local cache directories;
- verify they are not staged for commit;
- remove any generated cache content from the changeset;
- regenerate the git diff;
- verify that only implementation-related files remain.

If a repository-local cache directory appears in the changeset unexpectedly:

- stop completion;
- determine why it was created;
- determine why it became tracked;
- clean the changeset;
- continue only after the cache artifacts have been removed.

### Git ignore verification

Whenever a new repository-local cache directory is introduced by the repository workflow, verify that it is appropriately ignored.

If it is not already ignored:

- update the repository's .gitignore;
- explain why the ignore rule is required;
- ensure future executions cannot accidentally commit the cache.

## FamilyBoard Viewport & Layout Rule

FamilyBoard is a dashboard application, not a document-style web application.

Hard requirement:
Primary product pages must never use vertical page scrolling.

This applies globally to:
- Home
- Agenda
- Tasks
- Shopping
- Motivation
- My Page
- Settings
- any future primary product page

Implementation rules:
- The page viewport is the fixed boundary.
- The browser window must not become vertically scrollable during normal product use.
- Every primary page must fit inside the available viewport.
- Main layout regions must have reserved space.
- Components must not grow until they push other components off-screen.
- A full list, agenda, task section, motivation section, or other content block must never make the page taller.
- Overflow must be handled inside the component, not by the page.
- Prefer summarising, compacting, limiting visible rows, "+N more" indicators, pagination, or internal component scrolling.
- The global page composition must stay stable regardless of data volume.
- Responsive behavior must reduce spacing, padding, visible rows, or density before allowing any page overflow.
- Introducing vertical page scrolling on a primary page is a UX regression.

Review rule:
When changing any primary page layout, check for:
- document.body vertical overflow;
- visible browser/page scrollbar;
- cards pushing other cards off-screen;
- variable-height content changing the global page composition;
- desktop viewport fit;
- common laptop viewport fit.
