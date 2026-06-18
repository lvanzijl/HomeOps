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
- Update `docs/roadmap/phase-1.md` and `docs/state/current-state.md` after implementation work.

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
