# Room Heating Control Foundation Analysis

## Summary

Slice 11 should add the smallest backend foundation for room heating commands by extending the existing FloorPlans climate runtime boundary rather than introducing a new automation subsystem. The recommended implementation is:

- model provider-independent commands as `TemporaryWarmer`, `ResumeSchedule`, and optional `TemporaryCooler` only when a provider capability snapshot explicitly allows lowering setpoints;
- keep operational command state in new runtime tables that are deliberately excluded from backup/restore;
- derive the active temporary override from command records instead of maintaining a second authoritative override table;
- expose typed API contracts for room control capability, command submission, command status, and active override status;
- dispatch commands through a provider-neutral interface that accepts FamilyBoard-selected mappings and returns accepted/rejected/unavailable responses without Home Assistant payloads;
- reuse the existing hosted-service pattern only as a scheduling hook, with testable reconciliation logic in a scoped service.

No production code, migration, generated client, or tests were changed in this analysis step.

## Existing architecture found

### Canonical design constraints

The canonical design says runtime heating controls are limited to `Tijdelijk warmer` and `Schema hervatten`, with `Tijdelijk koeler` only when provider capability is validated. Controls require fresh current state, validated semantic control, bounded temperature range and duration, pending state, success confirmation, safe failure behavior, and shared-zone warnings. Controls must not appear directly on the floor plan, and pending commands must not pretend the room has already changed.

Backup/restore is incremental, but runtime controls only export portable control configuration and provider capability diagnostics where appropriate. Operational command history, active command references, and provider execution references should not be portable household configuration.

### Current climate configuration and roles

`RoomClimateConfiguration` is keyed by `RoomId` and stores climate enablement, bedtime relevance, preferred temperature and humidity ranges, `HeatingPolicyIntent`, and timestamps. `HeatingPolicyIntent.BoundedControl` already exists and is the correct configuration gate for command endpoints. `ClimateSourceRole` already separates semantic sources: comfort temperature, humidity, heating control temperature, heating status, heating target temperature, and heating control.

`FloorPlanEndpoints.DeriveRequiredSourceRoles` already requires `HeatingStatus`, `HeatingControlTemperature`, and `HeatingTargetTemperature` for read-only or bounded heating status, and additionally requires `HeatingControl` for bounded control. This is the correct seam for determining whether a room is even eligible for control.

### Provider mappings and capability summaries

`ClimateProvider` stores provider type, display name, enable/archive status, an external instance reference, diagnostic metadata, and timestamps. `RoomClimateSourceMapping` stores role-specific external source references, mapping health, provider and room references, priority, archive/enable state, and diagnostics.

`ClimateProviderMappingEndpoints.GetCapabilities` currently returns role-level setup health for all climate source roles. The role summary is derived from active mappings, provider enabled/archive state, and mapping health. It also detects shared heating sources by checking whether another non-archived mapping uses the same provider/source pair. This is useful but not yet sufficient for command controls because it does not expose actions, target bounds, durations, provider availability, blockers, active override, or last command status.

### Runtime read-only `Klimaat in huis`

`RoomClimateReadModelService` accepts current observations per source mapping and stores only the current row per `(RoomId, SourceMappingId)`. It validates timestamp freshness, target temperature bounds, mapping/provider health, room activity, and enabled climate configuration. `BuildRoom` produces `RoomClimateStateDto` with current observation, operating state, freshness, provider availability, issues, spatial status, and floor-plan references.

Important implications for Slice 11:

- command capability must depend on this read model but should not mutate it optimistically;
- command success can optionally be reconciled from later read-model observations;
- stale or unavailable observations should block new temporary heating commands;
- `CurrentObservation.TargetTemperatureCelsius` and `OperatingState` are the best existing signals for active status and eventual confirmation.

### Provider interfaces and scheduler patterns

There is no existing climate command provider interface. Provider-style seams exist for weather, avatar catalog, iCalendar, Google Calendar, and birthdays. Calendar synchronization uses a scoped engine plus a singleton runner and a `BackgroundService` registered outside Testing and VisualReview. That is the best existing pattern if command expiry needs a hosted tick.

There is no generic scheduler framework to reuse. Therefore Slice 11 should introduce only a climate-specific reconciliation service and a small hosted scheduling hook, not a new scheduler abstraction.

### Idempotency and concurrency patterns

No reusable idempotency service or generic command table was found. Existing code relies on EF constraints, explicit validation, and transaction boundaries. Calendar synchronization uses transactions for multi-step provider sync. Mapping endpoints use unique indexes for domain constraints. The new command service should follow those conventions:

- explicit unique indexes for idempotency keys;
- database transaction around command creation, superseding, and provider dispatch status update;
- conflict response for duplicate idempotency key with different request fingerprint;
- stale provider completions guarded by command id and superseded status checks.

### EF, migration, API, and OpenAPI conventions

`HomeOpsDbContext` uses explicit `DbSet<>` declarations and fluent model configuration. Enums are stored as strings with max lengths. Decimal temperatures use precision `(5, 2)`. Runtime current observations use relationship indexes and a unique `(RoomId, SourceMappingId)` index.

Minimal APIs are grouped under `/api/...`, use typed records in the FloorPlans namespace, return `Results.Ok`, `Results.Created`, `Results.NoContent`, `Results.NotFound`, and validation errors through `Results.ValidationProblem` or `Results.BadRequest` dictionaries. OpenAPI is generated through NSwag from `nswag.json`, producing `src/HomeOps.Contracts/openapi.json` and `src/HomeOps.Client/src/api/homeOpsApiClient.ts`.

### Portability conventions

`CalendarPortabilityService` currently exports floors, rooms, climate configuration, providers, and climate source mappings. On restore, mapping health is reset to `Unverified` and last checked/successful timestamps are cleared, which confirms that provider runtime health is non-portable even when mapping definitions are portable. Heating command history, active override records, idempotency records, and provider command references are runtime operational state and must not be added to export DTOs or restore paths.

## Recommended domain model

Add a small Room Heating Control domain under `HomeOps.Api/FloorPlans`:

### Enums

- `RoomHeatingCommandAction`
  - `TemporaryWarmer`
  - `ResumeSchedule`
  - `TemporaryCooler` only accepted if provider capability allows cooling/decrease override.
- `RoomHeatingCommandStatus`
  - `Pending`
  - `Accepted`
  - `Succeeded`
  - `Failed`
  - `Superseded`
  - `Expired`
- `RoomHeatingProviderCommandOutcome`
  - `Accepted`
  - `Rejected`
  - `Unavailable`
- `RoomHeatingOverrideDirection`
  - `Warmer`
  - `Cooler`

### Entity: `RoomHeatingCommand`

Single source of truth for history, current status, idempotency, active override derivation, and provider reference.

Recommended fields:

- `Id`, `HouseholdId`, `RoomId`, `ProviderId`, `ControlMappingId`;
- `Action`;
- `Status`;
- `RequestedTargetTemperatureCelsius` nullable for resume;
- `RequestedDurationMinutes` nullable for resume;
- `EffectiveUntilUtc` nullable for resume;
- `RequestedUtc`, `UpdatedUtc`, `CompletedUtc` nullable;
- `IdempotencyKey` required;
- `RequestFingerprint` required;
- `SupersededByCommandId` nullable;
- `ProviderCommandReference` nullable, max 240;
- `ProviderAcceptedUtc` nullable;
- `ProviderConfirmedTargetTemperatureCelsius` nullable;
- `ProviderScheduleResumed` nullable;
- `FailureCode` nullable, max 80;
- `FailureMessage` nullable, max 500;
- optional `RowVersion`/concurrency token only if using provider completion endpoints that can race; otherwise transactional status predicates are enough for foundation.

Do not add a separate active override table in the foundation. Active temporary override is safely derived as the newest non-superseded `Accepted` or `Succeeded` temporary command with `EffectiveUntilUtc > now` and no later `ResumeSchedule` command in `Accepted`/`Succeeded` state for the same room.

## Supported actions

### TemporaryWarmer

Required in foundation. It creates a bounded temporary target above the current or observed target, subject to comfort/control bounds and provider capabilities.

Minimum request shape:

- idempotency key from `Idempotency-Key` header or `IdempotencyKey` body field; prefer header in API plan;
- `targetTemperatureCelsius` or provider-independent `deltaCelsius` decision.

Recommended choice: accept explicit `targetTemperatureCelsius`, not a hard-coded delta. The Dutch UI can label presets as `Tijdelijk warmer`, but the backend should command an explicit bounded target. This avoids backend guessing based on stale readings and aligns with target bounds.

### ResumeSchedule

Required in foundation. It clears/supersedes any active or pending temporary override for the room and asks the provider to resume its normal schedule/program.

Request body can be empty except idempotency key. It should be allowed while an override is `Pending` or `Accepted`; the pending override becomes `Superseded` before or in the same transaction as the resume command acceptance path.

### TemporaryCooler

Optional and deferred unless the provider boundary can report decrease/cooling override capability independent of Home Assistant details. Existing `RoomClimateOperatingState.Cooling` proves read-model vocabulary exists, but no existing mapping or capability model proves safe provider command support. Therefore the foundation should include enum/API vocabulary for `TemporaryCooler` only if tests provide a fake provider capability that returns `SupportsTemporaryCooler = true`; otherwise the endpoint returns a validation blocker and the capability model omits the action.

## Capability model

Add a new control-focused capability DTO rather than overloading the existing mapping role summary:

`RoomHeatingControlCapabilityDto`:

- `RoomId`;
- `IsControllable`;
- `SupportedActions: IReadOnlyCollection<RoomHeatingCommandAction>`;
- `TargetRange: ClimateRangeDto?`;
- `AllowedDurationsMinutes: IReadOnlyCollection<int>` or `{ Minimum, Maximum, Step }`;
- `ProviderAvailability` with values such as `Available`, `Unavailable`, `Unknown`, `Misconfigured`;
- `Blockers: IReadOnlyCollection<RoomHeatingControlBlockerDto>`;
- `AffectedRoomIds` and `IsSharedZone`;
- `CurrentOverride: RoomHeatingOverrideDto?`;
- `LastCommand: RoomHeatingCommandStatusDto?`.

Capability derivation should require:

1. active, enabled room;
2. existing climate configuration with `IsClimateEnabled = true`;
3. `HeatingPolicyIntent.BoundedControl`;
4. active, enabled, non-archived `HeatingControl` mapping;
5. active provider, mapping health not `Missing` or `Unavailable`;
6. fresh or aging current observation for provider availability and current state; stale/unavailable blocks temporary commands;
7. configured temperature range, tightened by provider-reported min/max/step if available;
8. duration within backend-supported bounds, recommended `15..240` minutes with a small allowed preset set such as `15, 30, 60, 120` for V1.

Blockers should be stable strings/enums, for example:

- `RoomNotFoundOrArchived`;
- `ClimateDisabled`;
- `HeatingControlNotEnabled`;
- `MissingHeatingControlMapping`;
- `ProviderDisabledOrArchived`;
- `MappingUnavailableOrMissing`;
- `ProviderUnavailable`;
- `NoFreshObservation`;
- `TargetRangeUnavailable`;
- `UnsupportedAction`;
- `SharedZoneDisclosureRequired` as warning, not hard blocker.

Provider availability should combine provider/mapping state and the latest observation's `IsProviderAvailable`/freshness. If provider capability cannot be queried, report `Unknown` and block commands unless a fake/in-memory provider explicitly says available in tests.

## Command lifecycle

### States

Use exactly these states in the foundation:

- `Pending`: command row created and validated but provider dispatch not completed yet. Runtime-active only for UI pending status, not for actual override.
- `Accepted`: provider accepted the command but no read-model confirmation has arrived. Runtime-active for pending/active override display if temporary and not superseded/expired.
- `Succeeded`: provider acceptance has been confirmed by a later provider completion callback or reconciled observation. Runtime-active if temporary and within `EffectiveUntilUtc`.
- `Failed`: provider rejected/unavailable or validation became impossible before dispatch. Not active.
- `Superseded`: newer command for the same room/action family replaced it. Not active.
- `Expired`: temporary command reached `EffectiveUntilUtc` and reconciliation marked it complete/expired. Not active.

### Transitions

1. Request validates capability and idempotency.
2. Create `Pending` command inside a transaction; mark previous pending/accepted/succeeded temporary commands for the room as `Superseded` when submitting a new temporary command or resume.
3. Dispatch through provider boundary.
4. Provider `Accepted` -> command `Accepted`, provider reference stored.
5. Provider `Rejected`/`Unavailable` -> command `Failed`, code/message stored. If a resume command fails after superseding a pending override, it remains failed and capability/last command reports the failure; do not resurrect the old pending override.
6. Later confirmation endpoint or reconciliation can move `Accepted` to `Succeeded` only if the command is still latest and not superseded/expired.
7. Expiry reconciliation marks temporary `Accepted`/`Succeeded` commands with `EffectiveUntilUtc <= now` as `Expired`.

### Stale completion

Provider completion or observation-based confirmation must include `CommandId` or provider command reference. The service updates only when `Status` is still `Accepted` or `Pending` and `SupersededByCommandId` is null. If status is `Superseded` or `Expired`, ignore the completion and optionally record diagnostics in logs, not in current state.

## Provider boundary

Introduce the smallest provider-neutral command interface:

```csharp
public interface IRoomHeatingControlProvider
{
    Task<RoomHeatingProviderCapability> GetCapabilityAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken);
    Task<RoomHeatingProviderCommandResult> SetTemporaryTargetAsync(RoomHeatingTemporaryTargetCommand command, CancellationToken cancellationToken);
    Task<RoomHeatingProviderCommandResult> ResumeScheduleAsync(RoomHeatingResumeScheduleCommand command, CancellationToken cancellationToken);
}
```

Provider DTOs should contain only safe FamilyBoard references:

- `HouseholdId`, `RoomId`, `ProviderId`, `ControlMappingId`;
- `ExternalSourceReference` copied from the selected mapping but not exposed as Home Assistant entity semantics;
- requested target/duration/effective until;
- command id for correlation.

Provider result:

- `Outcome`: accepted/rejected/unavailable;
- `ProviderCommandReference`: nullable opaque string;
- `ConfirmedTargetTemperatureCelsius`: optional;
- `ScheduleResumed`: optional;
- `FailureCode`, `FailureMessage`.

Do not include Home Assistant service names, entity IDs as first-class command fields, JSON payloads, or HA-specific modes in domain entities or API contracts. The existing `ExternalSourceId` remains a mapping attribute and is passed through as an opaque source reference to provider adapters only.

Foundation can ship with a no-op/unavailable provider or fake test provider. A real Home Assistant client/setup is out of scope.

## Persistence design

Add one new operational table in foundation:

### `RoomHeatingCommands`

Indexes:

- primary key `Id`;
- `HouseholdId, RoomId, RequestedUtc` for history;
- `RoomId, Status, EffectiveUntilUtc` for active override/expiry queries;
- unique `HouseholdId, RoomId, IdempotencyKey`;
- optional `ProviderId, ProviderCommandReference` non-unique or filtered for provider callback lookup.

Relationships:

- `Household` restrict;
- `Room` restrict;
- `ClimateProvider` restrict;
- `RoomClimateSourceMapping` restrict;
- self-reference `SupersededByCommandId` restrict/no action.

Do not add:

- active override table;
- command outbox table;
- provider-specific payload table;
- backup/restore DTOs.

Idempotency metadata is stored on `RoomHeatingCommand` itself. A separate idempotency table is unnecessary for this single command family.

## Idempotency and concurrency rules

### Same key + same payload

Return the existing command DTO and status without dispatching again. Same payload is determined by a stable request fingerprint containing room id, action, target, duration, and normalized command options.

### Same key + different payload

Return `409 Conflict` or validation problem with code `IdempotencyKeyConflict`. Prefer `409` because the key is semantically bound to another request, not merely invalid field content.

### Two simultaneous overrides

Within a transaction, a new temporary command supersedes previous active/pending temporary commands for the same room. If both requests race with different idempotency keys, the command with the later successful transaction is current; the earlier command becomes `Superseded`. Use `Serializable` transaction or transactional update predicates to avoid both remaining active.

### Resume while override pending

Resume creates a `ResumeSchedule` command and marks the pending/accepted temporary command as `Superseded`. Provider completion of the old temporary command is ignored because `SupersededByCommandId` is no longer null.

### Completion of superseded command

Ignore for current state. Do not update `Succeeded`. Optionally keep a debug log entry. Last command status should remain the newer command.

### Expiry while provider unavailable

When `EffectiveUntilUtc <= now`, mark the command `Expired` even if provider is unavailable. Do not attempt blind retries. Capability should show provider unavailable and no active override; last command is `Expired` unless a later failure exists. A future hardening slice may add explicit resume-on-expiry if provider capability supports it, but foundation should avoid hidden automation.

## Expiry/reconciliation approach

Use a testable `RoomHeatingControlReconciliationService` with methods such as:

- `ExpireDueOverridesAsync(now, ct)`;
- `ReconcileAcceptedCommandsAsync(now, ct)`.

Reuse the calendar hosted-service pattern only for a small climate-specific `BackgroundService`, registered outside Testing and VisualReview, with a modest periodic timer (for example every minute). The hosted service should create a scope and call the reconciliation service. It should not introduce a generic scheduler or automation framework.

Observation-based confirmation can be conservative in foundation:

- temporary command succeeds if a later fresh observation for the selected room/control mapping reports target temperature within provider tolerance of requested target;
- resume succeeds if a later fresh observation indicates no temporary provider reference only if provider supplies such confirmation; otherwise remain `Accepted` until expired or superseded.

If confirmation is ambiguous, keep `Accepted`; do not invent success.

## API contract plan

Add endpoints under existing Room Climate tags or a new `Room Heating Control` tag:

- `GET /api/rooms/{roomId}/heating-control/capability`
  - returns `RoomHeatingControlCapabilityDto`;
- `POST /api/rooms/{roomId}/heating-control/temporary-warmer`
  - request: target temperature, duration minutes;
  - idempotency key required;
  - returns command status DTO;
- `POST /api/rooms/{roomId}/heating-control/resume-schedule`
  - request body empty or nullable reason;
  - idempotency key required;
  - returns command status DTO;
- optional `POST /api/rooms/{roomId}/heating-control/temporary-cooler`
  - only when capability model supports it;
- `GET /api/rooms/{roomId}/heating-control/commands/{commandId}`
  - returns command status DTO;
- optional `GET /api/rooms/{roomId}/heating-control/commands?limit=...`
  - foundation can omit history listing unless tests need it.

Validation conventions:

- `404` for missing room;
- `400` validation problem for target/duration/action blockers;
- `409` for idempotency key conflict or concurrency conflict;
- `503` is not recommended for provider unavailable because command capability is room-specific domain state; return validation/problem status with `ProviderUnavailable` blocker instead.

The existing room climate state DTO should gain `HeatingControl` summary only after the command DTOs exist, so `Klimaat in huis` can show active override and last command without a second request if desired. Minimal foundation can keep capability endpoint separate to avoid bloating read-only state.

## OpenAPI/client impact

Implementation must update:

- backend DTO records under `FloorPlans`;
- endpoint mapping in `Program.cs` through a new `MapRoomHeatingControlEndpoints`;
- `src/HomeOps.Contracts/openapi.json` via `npx --yes nswag run nswag.json` or existing repository command;
- generated TypeScript client `src/HomeOps.Client/src/api/homeOpsApiClient.ts`.

Backend tests should assert OpenAPI contains the new operations and generated client exposes the methods, following existing FloorPlans API test style.

## Portability decision

Do not export or restore:

- `RoomHeatingCommands`;
- idempotency keys/fingerprints;
- active override derived state;
- provider command references;
- provider acceptance/completion statuses;
- command failure/runtime diagnostics.

Rationale: these are operational runtime state tied to current provider availability and command side effects. Restoring them would risk replaying stale commands or showing false active heating status after moving backups between provider environments.

Portable control configuration remains limited to existing climate configuration, provider definitions/mappings, and any future provider capability diagnostics explicitly classified as portable. Existing restore behavior that resets mapping health to unverified should remain unchanged.

## Proposed implementation slices

### 1. Foundation implementation

- Add `RoomHeatingCommand` entity/enums/DTOs.
- Add EF mapping and migration for `RoomHeatingCommands`.
- Add provider-neutral command interface plus unavailable/default implementation for non-configured providers and fake provider for tests.
- Add command application service with capability derivation, idempotency, superseding, and dispatch handling.
- Add endpoints for capability, temporary warmer, resume schedule, command status, and optionally temporary cooler behind explicit provider capability.
- Update OpenAPI and generated client.
- Add focused tests for persistence, API contracts, idempotency, superseding, blockers, and OpenAPI/client generation.
- Do not add backup/restore coverage for command state.

### 2. Hardening and verification

- Add reconciliation service and hosted scheduling hook.
- Add expiry tests and observation/provider confirmation tests.
- Add concurrency tests for simultaneous overrides and resume-during-pending.
- Add stale completion tests.
- Add operational tests proving backup/export omits command rows and restore does not create active overrides.
- Add API tests for ProblemDetails/validation edge cases and provider unavailable responses.

## Expected modified files

Foundation implementation is expected to modify or add only backend FloorPlans/API/contracts/tests plus generated OpenAPI/client files:

- `src/HomeOps.Api/FloorPlans/RoomHeatingCommand.cs` (new);
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlDtos.cs` (new);
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlProvider.cs` (new);
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlService.cs` (new);
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlEndpoints.cs` (new);
- `src/HomeOps.Api/FloorPlans/RoomClimateDtos.cs` only if read model summary is extended;
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`;
- `src/HomeOps.Api/Program.cs`;
- `src/HomeOps.Api/Migrations/*AddRoomHeatingCommands*`;
- `src/HomeOps.Contracts/openapi.json`;
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`;
- `tests/HomeOps.Api.Tests/FloorPlans/*RoomHeatingControl*Tests.cs`;
- `tests/HomeOps.Api.Tests/FloorPlans/*Persistence*Tests.cs` if model metadata is covered separately.

Hardening may add:

- `src/HomeOps.Api/FloorPlans/RoomHeatingControlReconciliationService.cs`;
- `src/HomeOps.Api/FloorPlans/RoomHeatingControlHostedService.cs`;
- additional tests in the same FloorPlans test boundary.

It should not modify frontend controls, Home Assistant setup/client code, calendar portability DTOs, floor-plan rendering, shopping/tasks/motivation, or unrelated infrastructure.

## Risks and open blockers

- No real Home Assistant command client exists in the repository; foundation must use a provider-neutral seam and cannot prove real provider execution.
- Existing capability summaries are mapping-health summaries, not action capability contracts; Slice 11 must add a control-specific capability model.
- `TemporaryCooler` is not safely supported by current repository evidence; it should stay optional and hidden/blocked until provider capability explicitly allows it.
- Confirmation of `ResumeSchedule` may be provider-specific. Foundation should represent provider acceptance without falsely claiming success.
- Concurrency needs careful transaction/index design because no reusable idempotency/concurrency framework exists.
- Expiry should not silently send provider commands while unavailable; this may leave provider-side temporary state unresolved, but avoids unsafe blind retries in the foundation.
- Adding generated OpenAPI/client files can produce large diffs; scope sanity check must ensure only expected generated files change.

## Concrete two-step implementation plan

### Step 1 — foundation implementation

Implement the command foundation only: entity, EF mapping/migration, provider-neutral interface with fake/unavailable provider, capability DTO, command service, endpoints, idempotency/superseding logic, typed contracts, OpenAPI/client generation, and focused backend tests. Include `TemporaryWarmer` and `ResumeSchedule`; include `TemporaryCooler` only as an unsupported/omitted action unless the fake provider capability explicitly supports it. Do not implement scheduler expiry yet beyond fields needed for `EffectiveUntilUtc`.

### Step 2 — hardening and verification

Add reconciliation/expiry and verification: scoped reconciliation service, hosted-service scheduling hook using the existing background-service pattern, expiry handling, observation/provider confirmation, stale completion ignoring, concurrency race tests, backup/restore omission tests, and additional ProblemDetails/OpenAPI verification. Do not add frontend controls or Home Assistant-specific client logic in this step.
