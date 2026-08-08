namespace HomeOps.Api.Data;

public static class DatabaseMigrationHealthStatuses
{
    public const string NotRequired = "NotRequired";
    public const string Pending = "Pending";
    public const string Healthy = "Healthy";
    public const string Failed = "Failed";
}

public sealed record DatabaseMigrationHealthDetail(
    string Status,
    int PendingMigrationCount,
    string? FailureCode,
    DateTimeOffset CheckedUtc);

public sealed record HomeOpsHealthResponse(
    string Status,
    DatabaseMigrationHealthDetail DatabaseMigrations);

public sealed class DatabaseMigrationHealthState
{
    private readonly object sync = new();
    private DatabaseMigrationHealthDetail detail = new(
        DatabaseMigrationHealthStatuses.Pending,
        0,
        null,
        DateTimeOffset.UtcNow);

    public DatabaseMigrationHealthDetail GetDetail()
    {
        lock (sync)
        {
            return detail;
        }
    }

    public void MarkNotRequired() => Set(DatabaseMigrationHealthStatuses.NotRequired, 0, null);

    public void MarkPending(int count) => Set(DatabaseMigrationHealthStatuses.Pending, count, null);

    public void MarkHealthy() => Set(DatabaseMigrationHealthStatuses.Healthy, 0, null);

    public void MarkFailed(int pendingCount) =>
        Set(DatabaseMigrationHealthStatuses.Failed, pendingCount, "MigrationApplyFailed");

    private void Set(string status, int pendingCount, string? failureCode)
    {
        lock (sync)
        {
            detail = new DatabaseMigrationHealthDetail(
                status,
                Math.Max(0, pendingCount),
                failureCode,
                DateTimeOffset.UtcNow);
        }
    }
}
