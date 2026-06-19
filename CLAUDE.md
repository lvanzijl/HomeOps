# HomeOps Repository Guidance

- Default model: GPT-5.4; use GPT-5.3 for small isolated changes; use GPT-5.5 only with explicit justification.
- Complete one implementation slice per run and keep reports concise.
- Do not claim validation that was not performed.
- Update `docs/state/current-state.md` after implementation work; update the current phase roadmap for normal feature work.
- Phase 1 is historical. Future work targeting Phase 2, Phase 3, or later phases must not modify `docs/roadmap/phase-1.md` unless correcting factual mistakes, fixing incorrect history, or repairing broken references.
- Preserve the modular monolith: ASP.NET Core backend, React + TypeScript + Vite frontend, PostgreSQL database, OpenAPI + NSwag contracts.
- Bootstrap must not implement feature integrations or future slices.
