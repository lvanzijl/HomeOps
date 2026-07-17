using HomeOps.Api.FloorPlans;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class HomeAssistantClimateRefreshCoordinatorTests
{
    [Fact]
    public async Task SameProviderConcurrentRefreshSharesSingleWorkAndReleasesAfterCompletion()
    {
        var coordinator = new HomeAssistantClimateRefreshCoordinator();
        var providerId = Guid.NewGuid();
        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var executions = 0;

        var first = coordinator.RunProviderAsync(providerId, async _ =>
        {
            Interlocked.Increment(ref executions);
            started.SetResult();
            await release.Task;
            return Summary(providerId);
        }, CancellationToken.None);
        await started.Task;
        var second = coordinator.RunProviderAsync(providerId, _ =>
        {
            Interlocked.Increment(ref executions);
            return Task.FromResult(Summary(providerId));
        }, CancellationToken.None);

        release.SetResult();
        await Task.WhenAll(first, second);

        Assert.Equal(1, executions);
        await coordinator.RunProviderAsync(providerId, _ =>
        {
            Interlocked.Increment(ref executions);
            return Task.FromResult(Summary(providerId));
        }, CancellationToken.None);
        Assert.Equal(2, executions);
    }

    [Fact]
    public async Task DifferentProvidersRefreshIndependently()
    {
        var coordinator = new HomeAssistantClimateRefreshCoordinator();
        var firstProvider = Guid.NewGuid();
        var secondProvider = Guid.NewGuid();
        var firstStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var secondStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        var first = coordinator.RunProviderAsync(firstProvider, async _ => { firstStarted.SetResult(); await release.Task; return Summary(firstProvider); }, CancellationToken.None);
        var second = coordinator.RunProviderAsync(secondProvider, async _ => { secondStarted.SetResult(); await release.Task; return Summary(secondProvider); }, CancellationToken.None);

        await Task.WhenAll(firstStarted.Task, secondStarted.Task);
        release.SetResult();
        await Task.WhenAll(first, second);
    }

    private static HomeAssistantClimateRefreshSummary Summary(Guid providerId) => new(providerId, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, HomeAssistantClimateRefreshOutcome.Healthy, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false, []);
}
