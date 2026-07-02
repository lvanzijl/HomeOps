# HomeOps Copilot Instructions

- Default model: GPT-5.4; GPT-5.3 is acceptable for small isolated changes; GPT-5.5 requires explicit justification.
- Work one implementation slice at a time and keep reports concise.
- Do not make unsupported validation claims.
- After implementation work, update `docs/state/current-state.md`; update the current phase roadmap for normal feature work.
- Phase 1 is historical. Future work targeting Phase 2, Phase 3, or later phases must not modify `docs/roadmap/phase-1.md` unless correcting factual mistakes, fixing incorrect history, or repairing broken references.
- Maintain the modular monolith architecture using ASP.NET Core, C#, React, TypeScript, Vite, PostgreSQL, OpenAPI, and NSwag.
- Do not implement authentication, external integrations, widgets, data sources, Kubernetes, microservices, CQRS, event sourcing, or distributed architecture unless a future slice explicitly asks for it.

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
