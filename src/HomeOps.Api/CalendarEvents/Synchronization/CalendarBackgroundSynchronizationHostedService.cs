namespace HomeOps.Api.CalendarEvents.Synchronization;

public sealed class CalendarBackgroundSynchronizationHostedService(
    CalendarBackgroundSynchronizationRunner runner,
    ILogger<CalendarBackgroundSynchronizationHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan SchedulerPeriod = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Calendar background synchronization service started.");
        try
        {
            await runner.RunDueSynchronizationsAsync(stoppingToken);
            using var timer = new PeriodicTimer(SchedulerPeriod);
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await runner.RunDueSynchronizationsAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Graceful shutdown.
        }
        finally
        {
            logger.LogInformation("Calendar background synchronization service stopped.");
        }
    }
}
