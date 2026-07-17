using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HomeOps.Api.FloorPlans;

public sealed class RoomHeatingControlReconciliationHostedService(IServiceScopeFactory scopeFactory, ILogger<RoomHeatingControlReconciliationHostedService> logger) : BackgroundService
{
    public static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        while (!stoppingToken.IsCancellationRequested)
        {
            await RunOnce(stoppingToken);
            try { await timer.WaitForNextTickAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }

    internal async Task RunOnce(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            await scope.ServiceProvider.GetRequiredService<RoomHeatingControlReconciliationService>().ReconcileAsync(ct: cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Room heating control reconciliation cycle failed safely.");
        }
    }
}
