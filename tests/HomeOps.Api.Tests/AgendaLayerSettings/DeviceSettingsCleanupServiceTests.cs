using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.AgendaLayerSettings;

public sealed class DeviceSettingsCleanupServiceTests
{
    [Fact]
    public async Task Cleanup_removes_only_identities_inactive_for_more_than_180_days()
    {
        await using var db = CreateDbContext();
        await db.Database.EnsureCreatedAsync();
        var now = new DateTimeOffset(2026, 8, 7, 12, 0, 0, TimeSpan.Zero);
        AddDevice(db, "expired", now.AddDays(-181));
        AddDevice(db, "boundary", now.AddDays(-180));
        AddDevice(db, "active", now.AddDays(-20));
        await db.SaveChangesAsync();

        var removed = await new DeviceSettingsCleanupService(db, new TestTimeProvider(now)).CleanupAsync();

        Assert.Equal(1, removed);
        Assert.False(await db.DeviceSettingsIdentities.AnyAsync(item => item.DeviceId == "expired"));
        Assert.False(await db.AgendaLayerSettings.AnyAsync(item => item.DeviceId == "expired"));
        Assert.True(await db.DeviceSettingsIdentities.AnyAsync(item => item.DeviceId == "boundary"));
        Assert.True(await db.DeviceSettingsIdentities.AnyAsync(item => item.DeviceId == "active"));
    }

    private static void AddDevice(HomeOpsDbContext db, string deviceId, DateTimeOffset lastSeen)
    {
        db.DeviceSettingsIdentities.Add(new DeviceSettingsIdentity
        {
            DeviceId = deviceId,
            SchemaVersion = 1,
            CreatedUtc = lastSeen,
            LastSeenUtc = lastSeen,
        });
        db.AgendaLayerSettings.Add(new AgendaLayerSetting
        {
            Id = Guid.NewGuid(),
            DeviceId = deviceId,
            ViewType = "Week",
            SourceId = "manual-source",
            IsEnabled = false,
            CreatedUtc = lastSeen,
            UpdatedUtc = lastSeen,
        });
    }

    private static HomeOpsDbContext CreateDbContext() => new(
        new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"device-cleanup-{Guid.NewGuid()}")
            .Options);

    private sealed class TestTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
