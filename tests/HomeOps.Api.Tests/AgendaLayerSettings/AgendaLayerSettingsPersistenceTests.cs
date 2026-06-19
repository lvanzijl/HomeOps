using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.AgendaLayerSettings;

public sealed class AgendaLayerSettingsPersistenceTests
{
    [Fact]
    public async Task DbContextPersistsDeviceAndViewScopedLayerSettings()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();
        var now = DateTimeOffset.UtcNow;
        dbContext.AgendaLayerSettings.AddRange(
            CreateSetting("device-a", "Week", "manual-source", false, now),
            CreateSetting("device-a", "Months", "manual-source", true, now),
            CreateSetting("device-b", "Week", "manual-source", true, now));
        await dbContext.SaveChangesAsync();

        var deviceASettings = await dbContext.AgendaLayerSettings.AsNoTracking().Where(setting => setting.DeviceKey == "device-a").ToListAsync();

        Assert.Equal(2, deviceASettings.Count);
        Assert.False(deviceASettings.Single(setting => setting.ViewType == "Week").IsEnabled);
        Assert.True(deviceASettings.Single(setting => setting.ViewType == "Months").IsEnabled);
    }

    private static AgendaLayerSetting CreateSetting(string deviceKey, string viewType, string sourceId, bool isEnabled, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        DeviceKey = deviceKey,
        ViewType = viewType,
        SourceId = sourceId,
        IsEnabled = isEnabled,
        CreatedUtc = now,
        UpdatedUtc = now,
    };

    private static HomeOpsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"agenda-layer-settings-{Guid.NewGuid()}")
            .Options;

        return new HomeOpsDbContext(options);
    }
}
