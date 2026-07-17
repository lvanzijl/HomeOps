using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public sealed class RoomHeatingControlReconciliationService(HomeOpsDbContext db, TimeProvider clock, IRoomHeatingControlProvider provider)
{
    public static readonly TimeSpan PendingTimeout = TimeSpan.FromMinutes(5);
    public static readonly decimal TargetToleranceCelsius = 0.1m;

    public async Task<RoomHeatingReconciliationResult> ReconcileAsync(DateTimeOffset? suppliedNow = null, CancellationToken ct = default)
    {
        var now = suppliedNow ?? clock.GetUtcNow();
        var expired = 0; var timedOut = 0; var resumed = 0; var confirmed = 0;

        var pendingCutoff = now.Subtract(PendingTimeout);
        var pending = (await db.RoomHeatingCommands
            .Where(c => c.Status == RoomHeatingCommandStatus.Pending)
            .ToListAsync(ct))
            .Where(c => c.RequestedUtc <= pendingCutoff)
            .ToList();
        foreach (var c in pending)
        {
            c.Status = RoomHeatingCommandStatus.Failed;
            c.FailureCode = "PendingTimeout";
            c.FailureMessage = "Heating command was not accepted before the timeout.";
            c.UpdatedUtc = now;
            c.CompletedUtc = now;
            timedOut++;
        }
        await db.SaveChangesAsync(ct);

        var due = (await db.RoomHeatingCommands
            .Where(c => c.Action != RoomHeatingCommandAction.ResumeSchedule
                && (c.Status == RoomHeatingCommandStatus.Accepted || c.Status == RoomHeatingCommandStatus.Succeeded)
                && c.EffectiveUntilUtc != null && c.SupersededByCommandId == null)
            .ToListAsync(ct))
            .Where(c => c.EffectiveUntilUtc <= now)
            .OrderBy(c => c.RequestedUtc)
            .ToList();

        foreach (var c in due)
        {
            var hasResume = await db.RoomHeatingCommands.AnyAsync(r => r.RoomId == c.RoomId && r.Action == RoomHeatingCommandAction.ResumeSchedule && r.IdempotencyKey == ResumeKey(c), ct);
            c.Status = RoomHeatingCommandStatus.Expired;
            c.UpdatedUtc = now;
            c.CompletedUtc = now;
            expired++;
            if (!hasResume)
            {
                var cap = await CapabilityFor(c, ct);
                if (cap.IsAvailable && cap.SupportsScheduleResume)
                {
                    var resume = new RoomHeatingCommand
                    {
                        Id = Guid.NewGuid(), HouseholdId = c.HouseholdId, RoomId = c.RoomId, ProviderId = c.ProviderId, SourceMappingId = c.SourceMappingId,
                        Action = RoomHeatingCommandAction.ResumeSchedule, Status = RoomHeatingCommandStatus.Pending, RequestedUtc = now, UpdatedUtc = now,
                        IdempotencyKey = ResumeKey(c), RequestFingerprint = $"auto-resume|{c.Id:N}"
                    };
                    db.RoomHeatingCommands.Add(resume);
                    await db.SaveChangesAsync(ct);
                    var result = await SafeResume(resume, ct);
                    ApplyProviderResult(resume, result, clock.GetUtcNow());
                    resumed++;
                }
                else
                {
                    c.FailureCode = cap.IsAvailable ? "ScheduleResumeUnsupported" : (cap.BlockerCode ?? "ProviderUnavailable");
                    c.FailureMessage = cap.IsAvailable ? "Provider does not support automatic schedule resume." : (cap.BlockerMessage ?? "Heating control provider is unavailable.");
                }
            }
        }
        await db.SaveChangesAsync(ct);

        confirmed += await ConfirmFromObservations(now, ct);
        return new(expired, timedOut, resumed, confirmed);
    }

    public async Task<RoomHeatingCompletionResult> ProcessCompletionAsync(RoomHeatingProviderCompletion completion, CancellationToken ct = default)
    {
        var q = db.RoomHeatingCommands.AsQueryable();
        var cmd = completion.CommandId is { } id
            ? await q.FirstOrDefaultAsync(c => c.Id == id, ct)
            : await q.FirstOrDefaultAsync(c => c.ProviderId == completion.ProviderId && c.ProviderCommandReference == completion.ProviderCommandReference, ct);
        if (cmd is null) return new(RoomHeatingCompletionResultKind.Conflict, "CommandNotFound");
        if (cmd.RoomId != completion.RoomId || cmd.ProviderId != completion.ProviderId || cmd.SourceMappingId != completion.SourceMappingId) return new(RoomHeatingCompletionResultKind.Conflict, "OwnershipMismatch");
        if (completion.CompletedUtc < (cmd.AcceptedUtc ?? cmd.RequestedUtc)) return new(RoomHeatingCompletionResultKind.Ignored, "StaleCompletionTimestamp");
        if (cmd.Status is not (RoomHeatingCommandStatus.Pending or RoomHeatingCommandStatus.Accepted)) return new(RoomHeatingCompletionResultKind.Ignored, "TerminalCommand");
        if (cmd.SupersededByCommandId is not null) return new(RoomHeatingCompletionResultKind.Ignored, "SupersededCommand");
        var newer = (await db.RoomHeatingCommands.AsNoTracking().Where(c => c.RoomId == cmd.RoomId && c.Status != RoomHeatingCommandStatus.Failed).ToListAsync(ct)).Any(c => c.RequestedUtc > cmd.RequestedUtc);
        if (newer) return new(RoomHeatingCompletionResultKind.Ignored, "StaleCommand");
        cmd.UpdatedUtc = completion.CompletedUtc;
        cmd.CompletedUtc = completion.CompletedUtc;
        if (completion.Outcome == RoomHeatingCompletionOutcome.Succeeded)
        {
            cmd.Status = RoomHeatingCommandStatus.Succeeded;
            cmd.ConfirmedTargetTemperatureCelsius = completion.ConfirmedTargetTemperatureCelsius ?? cmd.ConfirmedTargetTemperatureCelsius;
            cmd.ScheduleResumed = completion.ScheduleResumed ?? cmd.ScheduleResumed;
        }
        else
        {
            cmd.Status = RoomHeatingCommandStatus.Failed;
            cmd.FailureCode = Safe(completion.FailureCode, 120) ?? "ProviderFailed";
            cmd.FailureMessage = Safe(completion.FailureMessage, 500) ?? "Heating provider reported command failure.";
        }
        await db.SaveChangesAsync(ct);
        return new(RoomHeatingCompletionResultKind.Applied, "Applied");
    }

    private async Task<int> ConfirmFromObservations(DateTimeOffset now, CancellationToken ct)
    {
        var cmds = await db.RoomHeatingCommands.Where(c => c.Status == RoomHeatingCommandStatus.Accepted && c.Action != RoomHeatingCommandAction.ResumeSchedule && c.SupersededByCommandId == null).ToListAsync(ct);
        var count = 0;
        foreach (var c in cmds)
        {
            var o = (await db.RoomClimateObservations.AsNoTracking().Where(o => o.RoomId == c.RoomId && o.SourceMappingId == c.SourceMappingId && o.ProviderId == c.ProviderId).ToListAsync(ct)).OrderByDescending(o => o.ObservedUtc).FirstOrDefault();
            if (o is null || !o.IsProviderAvailable || o.ObservedUtc <= (c.AcceptedUtc ?? c.RequestedUtc) || o.TargetTemperatureCelsius is null || c.RequestedTargetTemperatureCelsius is null) continue;
            if (Math.Abs(o.TargetTemperatureCelsius.Value - c.RequestedTargetTemperatureCelsius.Value) <= TargetToleranceCelsius)
            { c.Status = RoomHeatingCommandStatus.Succeeded; c.ConfirmedTargetTemperatureCelsius = o.TargetTemperatureCelsius; c.CompletedUtc = now; c.UpdatedUtc = now; count++; }
        }
        await db.SaveChangesAsync(ct); return count;
    }

    private async Task<RoomHeatingControlProviderCapability> CapabilityFor(RoomHeatingCommand c, CancellationToken ct)
    {
        var mapping = await db.RoomClimateSourceMappings.AsNoTracking().FirstOrDefaultAsync(m => m.Id == c.SourceMappingId, ct);
        return await provider.GetCapabilityAsync(new(c.HouseholdId, c.RoomId, c.ProviderId, c.SourceMappingId, mapping?.ExternalSourceId ?? string.Empty, c.Id, c.RequestedTargetTemperatureCelsius, c.DurationMinutes, c.EffectiveUntilUtc), ct);
    }
    private async Task<RoomHeatingProviderResult> SafeResume(RoomHeatingCommand c, CancellationToken ct) { try { var mapping = await db.RoomClimateSourceMappings.AsNoTracking().FirstOrDefaultAsync(m => m.Id == c.SourceMappingId, ct); return await provider.ResumeScheduleAsync(new(c.HouseholdId, c.RoomId, c.ProviderId, c.SourceMappingId, mapping?.ExternalSourceId ?? string.Empty, c.Id, null, null, null), ct); } catch { return new(RoomHeatingProviderOutcome.Rejected, FailureCode: "ProviderException", FailureMessage: "Heating control provider failed safely."); } }
    private static void ApplyProviderResult(RoomHeatingCommand c, RoomHeatingProviderResult r, DateTimeOffset now) { c.UpdatedUtc = now; c.ProviderCommandReference = r.ProviderCommandReference; c.ConfirmedTargetTemperatureCelsius = r.ConfirmedTargetTemperatureCelsius; c.ScheduleResumed = r.ScheduleResumed; c.FailureCode = r.FailureCode; c.FailureMessage = r.FailureMessage; if (r.Outcome == RoomHeatingProviderOutcome.Accepted) { c.Status = r.Completed ? RoomHeatingCommandStatus.Succeeded : RoomHeatingCommandStatus.Accepted; c.AcceptedUtc = now; if (r.Completed) c.CompletedUtc = now; } else { c.Status = RoomHeatingCommandStatus.Failed; c.CompletedUtc = now; } }
    private static string ResumeKey(RoomHeatingCommand c) => $"system:auto-resume:{c.Id:N}";
    private static string? Safe(string? value, int max) => string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, max)];
}
