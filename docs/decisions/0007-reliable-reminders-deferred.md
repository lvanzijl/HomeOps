# 0007: Reliable reminders are deferred

## Status

Accepted

## Decision

HomeOps stores and displays appointments but does not send reminders or notifications. Reliable reminder delivery is outside Phase 3. The product must state this limitation in the Agenda event form and must not expose reminder controls or wording that suggests delivery exists.

Phase 3 will not add reminder fields, notification permissions, in-page timers, service workers, background schedulers, delivery tables, or device subscriptions. A browser timer is not an acceptable substitute for reliable delivery.

## Context

Calendar CRUD, recurrence, imports, household-local time behavior, and per-device source visibility are complete. Reminder delivery is a separate reliability system: an appointment can be stored correctly while a notification still fails because no background worker ran, a device revoked permission, a subscription expired, or delivery was never acknowledged. Partial browser-only behavior would create false confidence for time-sensitive family plans.

## Prerequisites for a future reminder phase

A future approved design must define and implement all of the following together:

- persisted per-event and default reminder rules;
- background scheduling that continues without an open HomeOps page;
- delivery attempts and acknowledgements;
- per-device notification permission and subscription lifecycle;
- household time-zone and DST behavior for scheduling and later zone changes;
- visible pending, delivered, failed, expired, and revoked-permission states;
- retry, deduplication, cancellation, and occurrence/series-change behavior.

The future work also requires an explicit threat/privacy review and user-facing recovery behavior. Until those prerequisites are approved and delivered, appointments remain planning records only.

## Consequences

- Agenda truthfully explains that it does not notify users.
- No reminder or notification contract, persistence, or runtime infrastructure is introduced in Phase 3.
- Existing calendar-field and recurrence semantics remain unchanged.
- CAL-01 is closed by explicit deferral and expectation-setting, not by partial notification support.
