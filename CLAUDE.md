# HomeOps Repository Guidance

- Default model: GPT-5.4; use GPT-5.3 for small isolated changes; use GPT-5.5 only with explicit justification.
- Complete one implementation slice per run and keep reports concise.
- Do not claim validation that was not performed.
- Update `docs/roadmap/phase-1.md` and `docs/state/current-state.md` after implementation work.
- Preserve the modular monolith: ASP.NET Core backend, React + TypeScript + Vite frontend, PostgreSQL database, OpenAPI + NSwag contracts.
- Bootstrap must not implement feature integrations or future slices.
