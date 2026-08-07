using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.AgendaLayerSettings;

public sealed class DeviceSettingsCleanupService(HomeOpsDbContext dbContext, TimeProvider timeProvider)
{
    public const int InactivityThresholdDays = 180;

    public async Task<int> CleanupAsync(CancellationToken cancellationToken = default)
    {
        var cutoff = timeProvider.GetUtcNow().AddDays(-InactivityThresholdDays);
        var inactiveIds = await dbContext.DeviceSettingsIdentities
            .Where(identity => identity.LastSeenUtc < cutoff)
            .Select(identity => identity.DeviceId)
            .ToListAsync(cancellationToken);
        if (inactiveIds.Count == 0) return 0;

        var layerSettings = await dbContext.AgendaLayerSettings
            .Where(setting => inactiveIds.Contains(setting.DeviceId))
            .ToListAsync(cancellationToken);
        dbContext.AgendaLayerSettings.RemoveRange(layerSettings);
        var identities = await dbContext.DeviceSettingsIdentities
            .Where(identity => inactiveIds.Contains(identity.DeviceId))
            .ToListAsync(cancellationToken);
        dbContext.DeviceSettingsIdentities.RemoveRange(identities);
        await dbContext.SaveChangesAsync(cancellationToken);
        return identities.Count;
    }
}

public sealed class DeviceSettingsCleanupHostedService(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<DeviceSettingsCleanupHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var removed = await scope.ServiceProvider.GetRequiredService<DeviceSettingsCleanupService>().CleanupAsync(stoppingToken);
                if (removed > 0) logger.LogInformation("Removed {Count} inactive device settings identities.", removed);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Device settings cleanup failed.");
            }

            await Task.Delay(TimeSpan.FromDays(1), timeProvider, stoppingToken);
        }
    }
}
