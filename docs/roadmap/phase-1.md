# Phase 1 Roadmap

| Slice | Name | Status |
| --- | --- | --- |
| 1.1 | Repository Bootstrap | Completed |
| 1.2 | Workspace Framework | Completed |
| 1.3 | Widget Framework | Completed |
| 1.4 | Event Source Framework | Completed |
| 1.5 | Agenda Widget MVP | Completed |
| 1.6 | Layer Settings Persistence | Completed |
| 1.7 | Google Calendar Adapter | Completed |
| 1.8 | Birthdays Source | Completed |
| 1.9 | Shopping List MVP | Completed |

Validation pass: Completed on 2026-06-18.

Phase 2 follow-up note: Calendar JSON export, full restore foundations, and V1 contract hardening now preserve the Phase 1 Agenda, Birthday, source filtering, and widget framework boundaries by keeping EventOccurrence projection-only and exporting EventSeries as canonical calendar data.


## Calendar Portability UX and Pre-Restore Export Update
Automatic local pre-restore export snapshots now run before calendar full restore replacement. The Settings workspace now exposes simple local export/restore controls with version, timestamp, validation feedback, friendly errors, and a replacement warning. JSON remains the canonical export format; restore remains local-only and full restore only.

Phase 2 validation hardening note: Calendar portability validation, snapshot storage, and restore safety UX are tracked in Phase 2 documentation; Phase 1 slice statuses remain historical and unchanged.


## Calendar Recurrence Runtime Follow-up
Phase 2 now includes the V1 HomeOps Calendar recurrence runtime foundation. EventSeries owns supported recurrence metadata, EventException owns skipped/modified occurrence overrides, EventOccurrence remains projection-only, and household timezone local wall-clock semantics are documented for future UI work.

## Home Dashboard Follow-up
Phase 2 now includes a Home Dashboard MVP that consumes the existing Agenda and Lists foundations as bounded summaries. The Phase 1 Agenda Widget MVP and Shopping List MVP remain preserved as full domain-page functionality behind Home navigation.
Local development uses the ASP.NET Core launch profile on `http://localhost:5152`, and the Vite client proxy should target that API origin so Home summary data loads during local startup.
The API also applies pending EF Core migrations on non-testing startup so the seeded household, agenda, and lists data are available during local visual review without a separate manual migration step.

## Home Dashboard Visual Hardening Follow-up
Phase 2 now includes a limited Home Dashboard visual hardening pass. Home chrome is less framework-oriented, Agenda remains the primary summary, Lists loads active item details for useful Home visibility, and Family Members use lightweight visual identity without becoming users, profiles, task owners, or authentication identities. Phase 1 Agenda and Shopping/List page functionality remains preserved behind Home navigation.
