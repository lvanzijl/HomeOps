using System.Security.Cryptography;
using System.Text;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public sealed class RoomHeatingControlService(HomeOpsDbContext db, TimeProvider clock, IRoomHeatingControlProvider provider)
{
    private static readonly int[] Durations = [15, 30, 60, 120];
    private const decimal GlobalMin = 5m, GlobalMax = 35m;

    public async Task<RoomHeatingControlCapabilityDto?> GetCapability(Guid roomId, CancellationToken ct)
    {
        var ctx = await Load(roomId, ct);
        if (ctx.Room is null) return null;
        var blockers = Blockers(ctx).ToList();
        var current = await CurrentOverride(roomId, ct);
        var latestCommand = (await db.RoomHeatingCommands.AsNoTracking().Where(c => c.RoomId == roomId).ToListAsync(ct)).OrderByDescending(c => c.RequestedUtc).FirstOrDefault();
        var latest = latestCommand is null ? null : new RoomHeatingCommandSummaryDto(latestCommand.Id, latestCommand.Action, latestCommand.Status, latestCommand.RequestedUtc, latestCommand.UpdatedUtc);
        RoomHeatingControlProviderCapability pc = new(false);
        if (blockers.Count == 0) pc = await provider.GetCapabilityAsync(ProviderContext(ctx, Guid.Empty, null, null, null), ct);
        if (!pc.IsAvailable) blockers.Add(new(pc.BlockerCode ?? "ProviderUnavailable", pc.BlockerMessage ?? "Heating control provider is unavailable."));
        var min = Math.Max(GlobalMin, Math.Max(ctx.Config?.MinimumPreferredTemperatureCelsius ?? GlobalMin, pc.MinimumTargetTemperatureCelsius ?? GlobalMin));
        var max = Math.Min(GlobalMax, Math.Min(ctx.Config?.MaximumPreferredTemperatureCelsius ?? GlobalMax, pc.MaximumTargetTemperatureCelsius ?? GlobalMax));
        var controllable = blockers.Count == 0 && min <= max;
        if (min > max) blockers.Add(new("UnsafeTargetRange", "Heating target range is not usable."));
        var actions = new List<RoomHeatingCommandAction>();
        if (controllable) actions.Add(RoomHeatingCommandAction.TemporaryWarmer);
        if (controllable || current is not null) actions.Add(RoomHeatingCommandAction.ResumeSchedule);
        if (controllable && pc.SupportsTemporaryCooler) actions.Add(RoomHeatingCommandAction.TemporaryCooler);
        var affected = await AffectedRooms(ctx, ct);
        return new(roomId, controllable, actions, min <= max ? new(min, max) : null, Durations, pc.IsAvailable, blockers, affected.Count > 1, affected, current, latest);
    }

    public Task<(RoomHeatingCommandResponse? response, int status, string? error)> Temporary(Guid roomId, RoomHeatingCommandAction action, RoomHeatingTemporaryCommandRequest request, string? headerKey, CancellationToken ct) => Submit(roomId, action, request.TargetTemperatureCelsius, request.DurationMinutes, headerKey ?? request.IdempotencyKey, ct);
    public Task<(RoomHeatingCommandResponse? response, int status, string? error)> Resume(Guid roomId, RoomHeatingResumeScheduleRequest request, string? headerKey, CancellationToken ct) => Submit(roomId, RoomHeatingCommandAction.ResumeSchedule, null, null, headerKey ?? request.IdempotencyKey, ct);

    private async Task<(RoomHeatingCommandResponse?, int, string?)> Submit(Guid roomId, RoomHeatingCommandAction action, decimal? target, int? duration, string? key, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(key)) return (null, 400, "IdempotencyKeyRequired");
        var fp = Fingerprint(roomId, action, target, duration);
        var existing = await db.RoomHeatingCommands.FirstOrDefaultAsync(c => c.RoomId == roomId && c.IdempotencyKey == key, ct);
        if (existing is not null) return existing.RequestFingerprint == fp ? (await Response(existing, ct), 200, null) : (null, 409, "IdempotencyKeyConflict");
        var cap = await GetCapability(roomId, ct); if (cap is null) return (null, 404, null);
        if (action != RoomHeatingCommandAction.ResumeSchedule && !cap.SupportedActions.Contains(action)) return (null, 400, "UnsupportedAction");
        if (action == RoomHeatingCommandAction.ResumeSchedule && !cap.SupportedActions.Contains(RoomHeatingCommandAction.ResumeSchedule)) return (null, 400, "UnsupportedAction");
        if (action != RoomHeatingCommandAction.ResumeSchedule)
        {
            if (target is null || duration is null) return (null, 400, "TargetAndDurationRequired");
            if (!Durations.Contains(duration.Value)) return (null, 400, "InvalidDuration");
            if (cap.TargetRange is null || target < cap.TargetRange.Minimum || target > cap.TargetRange.Maximum) return (null, 400, "TargetOutOfRange");
            var observed = (await Load(roomId, ct)).Observation?.TemperatureCelsius;
            if (action == RoomHeatingCommandAction.TemporaryWarmer && observed is not null && target < observed) return (null, 400, "UnsupportedDirection");
            if (action == RoomHeatingCommandAction.TemporaryCooler && observed is not null && target > observed) return (null, 400, "UnsupportedDirection");
            if (action == RoomHeatingCommandAction.TemporaryCooler && !cap.SupportedActions.Contains(RoomHeatingCommandAction.TemporaryCooler)) return (null, 400, "UnsupportedAction");
        }
        var ctx = await Load(roomId, ct); var now = clock.GetUtcNow();
        var normalizedKey = key.Trim();
        var cmd = new RoomHeatingCommand { Id = Guid.NewGuid(), HouseholdId = ctx.Room!.HouseholdId, RoomId = roomId, ProviderId = ctx.Mapping!.ProviderId, SourceMappingId = ctx.Mapping.Id, Action = action, Status = RoomHeatingCommandStatus.Pending, RequestedTargetTemperatureCelsius = target, DurationMinutes = duration, EffectiveUntilUtc = duration is null ? null : now.AddMinutes(duration.Value), RequestedUtc = now, UpdatedUtc = now, IdempotencyKey = normalizedKey, RequestFingerprint = fp };
        db.RoomHeatingCommands.Add(cmd);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            db.Entry(cmd).State = EntityState.Detached;
            var conflicted = await db.RoomHeatingCommands.AsNoTracking().FirstOrDefaultAsync(c => c.RoomId == roomId && c.IdempotencyKey == normalizedKey, ct);
            if (conflicted is not null) return conflicted.RequestFingerprint == fp ? (await Response(conflicted, ct), 200, null) : (null, 409, "IdempotencyKeyConflict");
            throw;
        }
        RoomHeatingProviderResult result;
        try
        {
            result = action == RoomHeatingCommandAction.ResumeSchedule ? await provider.ResumeScheduleAsync(ProviderContext(ctx, cmd.Id, target, duration, cmd.EffectiveUntilUtc), ct) : await provider.SubmitTemporaryTargetAsync(ProviderContext(ctx, cmd.Id, target, duration, cmd.EffectiveUntilUtc), ct);
        }
        catch
        {
            result = new RoomHeatingProviderResult(RoomHeatingProviderOutcome.Rejected, FailureCode: "ProviderException", FailureMessage: "Heating control provider failed safely.");
        }
        cmd.UpdatedUtc = clock.GetUtcNow(); cmd.ProviderCommandReference = result.ProviderCommandReference; cmd.ConfirmedTargetTemperatureCelsius = result.ConfirmedTargetTemperatureCelsius; cmd.ScheduleResumed = result.ScheduleResumed; cmd.FailureCode = result.FailureCode; cmd.FailureMessage = result.FailureMessage;
        if (result.Outcome == RoomHeatingProviderOutcome.Accepted) { cmd.Status = result.Completed ? RoomHeatingCommandStatus.Succeeded : RoomHeatingCommandStatus.Accepted; cmd.AcceptedUtc = cmd.UpdatedUtc; if (result.Completed) cmd.CompletedUtc = cmd.UpdatedUtc; await SupersedePrior(cmd, ct); }
        else { cmd.Status = RoomHeatingCommandStatus.Failed; cmd.CompletedUtc = cmd.UpdatedUtc; }
        await db.SaveChangesAsync(ct); return (await Response(cmd, ct), 200, null);
    }

    private async Task SupersedePrior(RoomHeatingCommand cmd, CancellationToken ct)
    { var current = await db.RoomHeatingCommands.Where(c => c.RoomId == cmd.RoomId && c.Id != cmd.Id && c.SupersededByCommandId == null && (c.Status == RoomHeatingCommandStatus.Pending || c.Status == RoomHeatingCommandStatus.Accepted || c.Status == RoomHeatingCommandStatus.Succeeded) && c.Action != RoomHeatingCommandAction.ResumeSchedule).ToListAsync(ct); foreach (var c in current) { c.Status = RoomHeatingCommandStatus.Superseded; c.SupersededByCommandId = cmd.Id; c.UpdatedUtc = cmd.UpdatedUtc; } }
    public async Task<RoomHeatingCommandDto?> GetCommand(Guid roomId, Guid commandId, CancellationToken ct) { var c = await db.RoomHeatingCommands.AsNoTracking().FirstOrDefaultAsync(x => x.RoomId == roomId && x.Id == commandId, ct); return c is null ? null : ToDto(c, await CurrentOverride(roomId, ct)); }
    private async Task<RoomHeatingCommandResponse> Response(RoomHeatingCommand c, CancellationToken ct) { var ov = await CurrentOverride(c.RoomId, ct); return new(ToDto(c, ov), c.Status != RoomHeatingCommandStatus.Failed || c.FailureCode != "ProviderUnavailable", ov); }
    private static RoomHeatingCommandDto ToDto(RoomHeatingCommand c, RoomHeatingCurrentOverrideDto? ov) => new(c.Id, c.RoomId, c.Action, c.Status, c.RequestedTargetTemperatureCelsius, c.DurationMinutes, c.EffectiveUntilUtc, c.ConfirmedTargetTemperatureCelsius, c.ScheduleResumed, c.FailureCode, c.FailureMessage, c.RequestedUtc, c.UpdatedUtc, c.AcceptedUtc, c.CompletedUtc, ov);
    private async Task<RoomHeatingCurrentOverrideDto?> CurrentOverride(Guid roomId, CancellationToken ct) { var now = clock.GetUtcNow(); var c = (await db.RoomHeatingCommands.AsNoTracking().Where(c => c.RoomId == roomId && c.SupersededByCommandId == null && c.Status != RoomHeatingCommandStatus.Failed && c.Status != RoomHeatingCommandStatus.Superseded && c.Status != RoomHeatingCommandStatus.Expired).ToListAsync(ct)).Where(c => c.EffectiveUntilUtc == null || c.EffectiveUntilUtc > now).OrderByDescending(c => c.RequestedUtc).FirstOrDefault(); if (c is null) return null; var state = c.Action == RoomHeatingCommandAction.ResumeSchedule ? "ResumePending" : c.Status == RoomHeatingCommandStatus.Pending ? "PendingTemporary" : c.Status == RoomHeatingCommandStatus.Succeeded ? "SucceededTemporary" : "AcceptedTemporary"; return new(state, c.Id, c.Action, c.RequestedTargetTemperatureCelsius, c.ConfirmedTargetTemperatureCelsius, c.EffectiveUntilUtc, c.FailureCode, c.FailureMessage); }
    private IEnumerable<RoomHeatingControlBlockerDto> Blockers(LoadContext c) { if (!c.Room!.IsEnabled || c.Room.IsArchived) yield return new("RoomInactive", "Room is not active."); if (c.Config is null || !c.Config.IsClimateEnabled) yield return new("ClimateDisabled", "Room climate configuration is disabled."); if (c.Config?.HeatingPolicyIntent != HeatingPolicyIntent.BoundedControl) yield return new("PolicyNotBoundedControl", "Room heating policy is not bounded control."); if (c.Config is not null && (c.Config.MinimumPreferredTemperatureCelsius is null || c.Config.MaximumPreferredTemperatureCelsius is null)) yield return new("TargetRangeUnavailable", "Room target temperature range is unavailable."); if (c.Observation is null || !c.Observation.IsProviderAvailable || c.Observation.OperatingState == RoomClimateOperatingState.Unavailable) yield return new("CurrentObservationUnavailable", "Current heating state is unavailable."); if (c.Mapping is null) yield return new("MissingControlMapping", "Room has no heating control mapping."); else if (!c.Mapping.IsEnabled || c.Mapping.IsArchived || c.Mapping.Health != MappingHealth.Healthy) yield return new("InvalidControlMapping", "Room heating control mapping is not usable."); if (c.Provider is null || !c.Provider.IsEnabled || c.Provider.IsArchived) yield return new("ProviderInactive", "Heating control provider is inactive."); }
    private async Task<LoadContext> Load(Guid roomId, CancellationToken ct) { var room = await db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == roomId && r.HouseholdId == SeedHousehold.Id, ct); var config = await db.RoomClimateConfigurations.AsNoTracking().FirstOrDefaultAsync(c => c.RoomId == roomId, ct); var mapping = await db.RoomClimateSourceMappings.AsNoTracking().Where(m => m.RoomId == roomId && (m.SourceRole == ClimateSourceRole.HeatingControl || m.SourceRole == ClimateSourceRole.HeatingControlTemperature)).OrderBy(m => m.Priority).FirstOrDefaultAsync(ct); ClimateProvider? p = mapping is null ? null : await db.ClimateProviders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == mapping.ProviderId, ct); var observation = (await db.RoomClimateObservations.AsNoTracking().Where(o => o.RoomId == roomId).ToListAsync(ct)).OrderByDescending(o => o.ReceivedUtc).FirstOrDefault(); return new(room, config, mapping, p, observation); }
    private static RoomHeatingProviderContext ProviderContext(LoadContext c, Guid id, decimal? target, int? dur, DateTimeOffset? until) => new(c.Room!.HouseholdId, c.Room.Id, c.Mapping?.ProviderId ?? Guid.Empty, c.Mapping?.Id ?? Guid.Empty, c.Mapping?.ExternalSourceId ?? string.Empty, id, target, dur, until);
    private async Task<IReadOnlyCollection<Guid>> AffectedRooms(LoadContext c, CancellationToken ct) => c.Mapping is null ? [] : await db.RoomClimateSourceMappings.AsNoTracking().Where(m => m.ProviderId == c.Mapping.ProviderId && m.ExternalSourceId == c.Mapping.ExternalSourceId && !m.IsArchived).Select(m => m.RoomId).Distinct().ToListAsync(ct);
    private static string Fingerprint(Guid room, RoomHeatingCommandAction action, decimal? target, int? duration) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{room:N}|{action}|{target:0.00}|{duration}"))).ToLowerInvariant();
    private sealed record LoadContext(Room? Room, RoomClimateConfiguration? Config, RoomClimateSourceMapping? Mapping, ClimateProvider? Provider, RoomClimateObservation? Observation);
}
