using Microsoft.Extensions.Options;

namespace HomeOps.Api.FloorPlans;

public sealed class HomeAssistantClimateRefreshHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<HomeAssistantClimateRefreshOptions> options,
    ILogger<HomeAssistantClimateRefreshHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled) return;
        using var timer = new PeriodicTimer(options.Value.Interval);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCycle(stoppingToken);
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception)
            {
                logger.LogWarning("Home Assistant climate refresh cycle failed safely.");
            }
        }
    }

    private async Task RunCycle(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<HomeAssistantClimateRefreshService>();
        var summaries = await service.RefreshEnabledProvidersAsync(cancellationToken);
        foreach (var summary in summaries)
        {
            logger.LogInformation("Home Assistant climate refresh provider {ProviderId} completed with {Outcome}: rooms {RoomsSucceeded}/{RoomsAttempted}, mappings healthy {MappingsHealthy}/{MappingsAttempted}, observations accepted {ObservationsAccepted}, failed {ObservationsFailed}.", summary.ProviderId, summary.Outcome, summary.RoomsSucceeded, summary.RoomsAttempted, summary.MappingsHealthy, summary.MappingsAttempted, summary.ObservationsAccepted, summary.ObservationsFailed);
        }
    }
}
