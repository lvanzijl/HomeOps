# HomeOps Copilot Instructions

- Default model: GPT-5.4; GPT-5.3 is acceptable for small isolated changes; GPT-5.5 requires explicit justification.
- Work one implementation slice at a time and keep reports concise.
- Do not make unsupported validation claims.
- After implementation work, update `docs/roadmap/phase-1.md` and `docs/state/current-state.md`.
- Maintain the modular monolith architecture using ASP.NET Core, C#, React, TypeScript, Vite, PostgreSQL, OpenAPI, and NSwag.
- Do not implement authentication, external integrations, widgets, data sources, Kubernetes, microservices, CQRS, event sourcing, or distributed architecture unless a future slice explicitly asks for it.
