# HomeOps Copilot Instructions

- Default model: GPT-5.4; GPT-5.3 is acceptable for small isolated changes; GPT-5.5 requires explicit justification.
- Work one implementation slice at a time and keep reports concise.
- Do not make unsupported validation claims.
- After implementation work, update `docs/state/current-state.md`; update the current phase roadmap for normal feature work.
- Phase 1 is historical. Future work targeting Phase 2, Phase 3, or later phases must not modify `docs/roadmap/phase-1.md` unless correcting factual mistakes, fixing incorrect history, or repairing broken references.
- Maintain the modular monolith architecture using ASP.NET Core, C#, React, TypeScript, Vite, PostgreSQL, OpenAPI, and NSwag.
- Do not implement authentication, external integrations, widgets, data sources, Kubernetes, microservices, CQRS, event sourcing, or distributed architecture unless a future slice explicitly asks for it.

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
