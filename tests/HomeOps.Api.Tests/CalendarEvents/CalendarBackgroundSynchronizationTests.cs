using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarBackgroundSynchronizationTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 5, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(EventSourcePollInterval.EveryHour, -61, true)]
    [InlineData(EventSourcePollInterval.EveryHour, -30, false)]
    [InlineData(EventSourcePollInterval.Every8Hours, -481, true)]
    [InlineData(EventSourcePollInterval.Every8Hours, -60, false)]
    [InlineData(EventSourcePollInterval.EveryDay, -1441, true)]
    [InlineData(EventSourcePollInterval.EveryDay, -120, false)]
    public void PollIntervalDueCalculationIsRespected(EventSourcePollInterval pollInterval, int lastAttemptMinutes, bool expectedDue)
    {
        var source = new EventSource { PollInterval = pollInterval, LastSyncAttemptUtc = Now.AddMinutes(lastAttemptMinutes) };

        Assert.Equal(expectedDue, CalendarBackgroundSynchronizationRunner.IsDue(source, Now));
    }

    [Fact]
    public async Task DueSourceIsProcessed()
    {
        await using var harness = await SchedulerHarness.CreateAsync();
        var source = await harness.AddSourceAsync(EventSourceTypes.ICalFeed, nextSyncAfterUtc: Now.AddMinutes(-1));

        await harness.Runner.RunDueSynchronizationsAsync();

        Assert.Equal([source.Id], harness.Dispatcher.Calls.Select(call => call.Id).ToArray());
    }

    [Fact]
    public async Task SelectionSkipsDisabledManualUnsupportedAndNotDueSources()
    {
        await using var harness = await SchedulerHarness.CreateAsync();
        var due = await harness.AddSourceAsync(EventSourceTypes.ICalFeed, name: "Due", nextSyncAfterUtc: Now.AddMinutes(-1));
        await harness.AddSourceAsync(EventSourceTypes.ICalFeed, name: "Disabled", enabled: false, nextSyncAfterUtc: Now.AddMinutes(-1));
        await harness.AddSourceAsync(EventSourceTypes.Manual, name: "Manual", writable: true, nextSyncAfterUtc: Now.AddMinutes(-1));
        await harness.AddSourceAsync(EventSourceTypes.GoogleCalendar, name: "Google", nextSyncAfterUtc: Now.AddMinutes(-1));
        await harness.AddSourceAsync(EventSourceTypes.ICalFile, name: "Not due", nextSyncAfterUtc: Now.AddMinutes(10));

        await harness.Runner.RunDueSynchronizationsAsync();

        Assert.Equal([due.Id], harness.Dispatcher.Calls.Select(call => call.Id).ToArray());
    }

    [Fact]
    public async Task SameSourceNeverSynchronizesConcurrently()
    {
        await using var harness = await SchedulerHarness.CreateAsync();
        await harness.AddSourceAsync(EventSourceTypes.ICalFeed, nextSyncAfterUtc: Now.AddMinutes(-1));
        harness.Dispatcher.BlockUntilReleased = true;

        var firstRun = harness.Runner.RunDueSynchronizationsAsync();
        await harness.Dispatcher.WaitForCallAsync();
        var secondRun = harness.Runner.RunDueSynchronizationsAsync();
        await Task.Delay(100);
        harness.Dispatcher.ReleaseBlockedCalls();
        await Task.WhenAll(firstRun, secondRun);

        Assert.Single(harness.Dispatcher.Calls);
    }

    [Fact]
    public async Task MultipleSourcesAreProcessedIndependently()
    {
        await using var harness = await SchedulerHarness.CreateAsync();
        var feed = await harness.AddSourceAsync(EventSourceTypes.ICalFeed, name: "Feed", nextSyncAfterUtc: Now.AddMinutes(-1));
        var file = await harness.AddSourceAsync(EventSourceTypes.ICalFile, name: "File", nextSyncAfterUtc: Now.AddMinutes(-1));

        await harness.Runner.RunDueSynchronizationsAsync();

        Assert.Equal(new[] { feed.Id, file.Id }.Order().ToArray(), harness.Dispatcher.Calls.Select(call => call.Id).Order().ToArray());
    }

    [Fact]
    public async Task SynchronizationFailureDoesNotStopRemainingSources()
    {
        await using var harness = await SchedulerHarness.CreateAsync();
        var failing = await harness.AddSourceAsync(EventSourceTypes.ICalFeed, name: "A", nextSyncAfterUtc: Now.AddMinutes(-1));
        var succeeding = await harness.AddSourceAsync(EventSourceTypes.ICalFile, name: "B", nextSyncAfterUtc: Now.AddMinutes(-1));
        harness.Dispatcher.ThrowForSourceId = failing.Id;

        await harness.Runner.RunDueSynchronizationsAsync();

        Assert.Contains(harness.Dispatcher.Calls, call => call.Id == failing.Id);
        Assert.Contains(harness.Dispatcher.Calls, call => call.Id == succeeding.Id);
    }

    [Fact]
    public async Task SchedulerIterationFailureIsCaught()
    {
        var services = new ServiceCollection()
            .AddLogging()
            .BuildServiceProvider();
        var runner = new CalendarBackgroundSynchronizationRunner(services.GetRequiredService<IServiceScopeFactory>(), NullLogger<CalendarBackgroundSynchronizationRunner>.Instance, new FixedTimeProvider(Now));

        await runner.RunDueSynchronizationsAsync();
    }

    [Fact]
    public async Task HostedServiceStartsAndStopsCleanly()
    {
        await using var harness = await SchedulerHarness.CreateAsync();
        var hostedService = new CalendarBackgroundSynchronizationHostedService(harness.Runner, NullLogger<CalendarBackgroundSynchronizationHostedService>.Instance);

        await hostedService.StartAsync(CancellationToken.None);
        await hostedService.StopAsync(CancellationToken.None);
    }

    private sealed class SchedulerHarness : IAsyncDisposable
    {
        private readonly SqliteConnection connection;
        private readonly ServiceProvider serviceProvider;

        private SchedulerHarness(SqliteConnection connection, ServiceProvider serviceProvider, RecordingDispatcher dispatcher, CalendarBackgroundSynchronizationRunner runner)
        {
            this.connection = connection;
            this.serviceProvider = serviceProvider;
            Dispatcher = dispatcher;
            Runner = runner;
        }

        public RecordingDispatcher Dispatcher { get; }
        public CalendarBackgroundSynchronizationRunner Runner { get; }

        public static async Task<SchedulerHarness> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var dispatcher = new RecordingDispatcher();
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddDbContext<HomeOpsDbContext>(options => options.UseSqlite(connection));
            services.AddSingleton<ICalendarSourceRefreshDispatcher>(dispatcher);
            services.AddSingleton<CalendarBackgroundSynchronizationRunner>(provider => new CalendarBackgroundSynchronizationRunner(
                provider.GetRequiredService<IServiceScopeFactory>(),
                NullLogger<CalendarBackgroundSynchronizationRunner>.Instance,
                new FixedTimeProvider(Now)));
            var serviceProvider = services.BuildServiceProvider();
            using (var scope = serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
                await dbContext.Database.EnsureCreatedAsync();
            }

            return new SchedulerHarness(connection, serviceProvider, dispatcher, serviceProvider.GetRequiredService<CalendarBackgroundSynchronizationRunner>());
        }

        public async Task<EventSource> AddSourceAsync(
            string sourceType,
            string name = "Source",
            bool enabled = true,
            bool writable = false,
            EventSourcePollInterval pollInterval = EventSourcePollInterval.Every8Hours,
            DateTimeOffset? nextSyncAfterUtc = null,
            DateTimeOffset? lastAttemptUtc = null)
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var source = new EventSource
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                Name = name,
                SourceType = sourceType,
                Icon = "📅",
                IsEnabled = enabled,
                IsWritable = writable,
                HealthStatus = writable ? EventSourceHealthStatus.Healthy : EventSourceHealthStatus.NeverSynced,
                PollInterval = pollInterval,
                NextSyncAfterUtc = nextSyncAfterUtc,
                LastSyncAttemptUtc = lastAttemptUtc,
                CreatedUtc = Now.AddDays(-1),
                UpdatedUtc = Now.AddDays(-1),
            };
            dbContext.EventSources.Add(source);
            await dbContext.SaveChangesAsync();
            return source;
        }

        public async ValueTask DisposeAsync()
        {
            await serviceProvider.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    private sealed class RecordingDispatcher : ICalendarSourceRefreshDispatcher
    {
        private readonly TaskCompletionSource firstCall = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly TaskCompletionSource releaseCalls = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly object gate = new();
        private readonly List<EventSource> calls = [];

        public IReadOnlyList<EventSource> Calls
        {
            get
            {
                lock (gate) return calls.ToList();
            }
        }

        public bool BlockUntilReleased { get; set; }
        public Guid? ThrowForSourceId { get; set; }

        public async Task<CalendarSourceRefreshDispatchResult> RefreshAsync(EventSource source, CancellationToken cancellationToken = default)
        {
            lock (gate) calls.Add(source);
            firstCall.TrySetResult();
            if (BlockUntilReleased)
            {
                await releaseCalls.Task.WaitAsync(cancellationToken);
            }

            if (ThrowForSourceId == source.Id)
            {
                throw new InvalidOperationException("simulated dispatcher failure");
            }

            return CalendarSourceRefreshDispatchResult.FromSupported(CalendarSourceSynchronizationResult.Success(0, 0, 0, 0, 0, [], TimeSpan.Zero, Now));
        }

        public Task WaitForCallAsync() => firstCall.Task;
        public void ReleaseBlockedCalls() => releaseCalls.TrySetResult();
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
