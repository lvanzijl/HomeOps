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
