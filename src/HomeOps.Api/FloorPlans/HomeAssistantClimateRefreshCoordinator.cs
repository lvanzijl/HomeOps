using System.Collections.Concurrent;

namespace HomeOps.Api.FloorPlans;

public sealed class HomeAssistantClimateRefreshCoordinator
{
    private readonly ConcurrentDictionary<Guid, Lazy<Task<HomeAssistantClimateRefreshSummary>>> running = new();

    public Task<HomeAssistantClimateRefreshSummary> RunProviderAsync(Guid providerId, Func<CancellationToken, Task<HomeAssistantClimateRefreshSummary>> work, CancellationToken cancellationToken)
    {
        var lazy = running.GetOrAdd(providerId, _ => new Lazy<Task<HomeAssistantClimateRefreshSummary>>(() => RunAndRelease(providerId, work, cancellationToken), LazyThreadSafetyMode.ExecutionAndPublication));
        return lazy.Value;
    }

    private async Task<HomeAssistantClimateRefreshSummary> RunAndRelease(Guid providerId, Func<CancellationToken, Task<HomeAssistantClimateRefreshSummary>> work, CancellationToken cancellationToken)
    {
        try { return await work(cancellationToken); }
        finally { running.TryRemove(providerId, out _); }
    }
}
