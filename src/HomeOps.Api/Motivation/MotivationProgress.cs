using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Motivation;

public static class MotivationProgress
{
    public const string BaselineReason = "Bestaande voortgang bij invoering van het voortgangslogboek.";

    public static async Task<int> GetProjectedAsync(
        HomeOpsDbContext dbContext,
        MotivationGoalType goalType,
        Guid goalId,
        int targetCount,
        int legacyFallback,
        CancellationToken cancellationToken)
    {
        var deltas = await dbContext.MotivationProgressLedgerEntries.AsNoTracking()
            .Where(entry => entry.HouseholdId == SeedHousehold.Id && entry.GoalType == goalType && entry.GoalId == goalId)
            .Select(entry => entry.Delta)
            .ToListAsync(cancellationToken);
        return Project(deltas.Count == 0 ? legacyFallback : deltas.Sum(), targetCount);
    }

    public static async Task<int> GetProjectedIncludingPendingAsync(
        HomeOpsDbContext dbContext,
        MotivationGoalType goalType,
        Guid goalId,
        int targetCount,
        CancellationToken cancellationToken)
    {
        var persistedTotal = await dbContext.MotivationProgressLedgerEntries.AsNoTracking()
            .Where(entry => entry.HouseholdId == SeedHousehold.Id && entry.GoalType == goalType && entry.GoalId == goalId)
            .SumAsync(entry => (int?)entry.Delta, cancellationToken) ?? 0;
        var pendingTotal = dbContext.ChangeTracker.Entries<MotivationProgressLedgerEntry>()
            .Where(entry => entry.State == EntityState.Added
                && entry.Entity.HouseholdId == SeedHousehold.Id
                && entry.Entity.GoalType == goalType
                && entry.Entity.GoalId == goalId)
            .Sum(entry => entry.Entity.Delta);
        return Project(persistedTotal + pendingTotal, targetCount);
    }

    public static async Task EnsureBaselineAsync(
        HomeOpsDbContext dbContext,
        MotivationGoalType goalType,
        Guid goalId,
        int currentProgress,
        DateTimeOffset occurredUtc,
        CancellationToken cancellationToken)
    {
        var hasPending = dbContext.ChangeTracker.Entries<MotivationProgressLedgerEntry>()
            .Any(entry => entry.State == EntityState.Added
                && entry.Entity.HouseholdId == SeedHousehold.Id
                && entry.Entity.GoalType == goalType
                && entry.Entity.GoalId == goalId);
        if (hasPending || await dbContext.MotivationProgressLedgerEntries.AsNoTracking()
                .AnyAsync(entry => entry.HouseholdId == SeedHousehold.Id && entry.GoalType == goalType && entry.GoalId == goalId, cancellationToken))
        {
            return;
        }

        dbContext.MotivationProgressLedgerEntries.Add(new MotivationProgressLedgerEntry(
            Guid.NewGuid(),
            SeedHousehold.Id,
            goalType,
            goalId,
            MotivationProgressSourceType.MigrationBaseline,
            goalId.ToString("D"),
            currentProgress,
            occurredUtc,
            BaselineReason));
    }

    public static MotivationProgressLedgerEntry Append(
        HomeOpsDbContext dbContext,
        MotivationGoalType goalType,
        Guid goalId,
        MotivationProgressSourceType sourceType,
        string sourceId,
        int delta,
        DateTimeOffset occurredUtc,
        string reason,
        Guid? correctionOfEntryId = null)
    {
        var entry = new MotivationProgressLedgerEntry(
            Guid.NewGuid(),
            SeedHousehold.Id,
            goalType,
            goalId,
            sourceType,
            sourceId,
            delta,
            occurredUtc,
            reason,
            correctionOfEntryId);
        dbContext.MotivationProgressLedgerEntries.Add(entry);
        return entry;
    }

    public static int Project(int total, int targetCount) => Math.Min(Math.Max(total, 0), targetCount);
}
