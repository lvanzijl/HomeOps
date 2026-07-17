using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class RoomHeatingControlRelationalConcurrencyTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 17, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task DifferentKeyOverrideCommitOrdersLeaveOneFactualCurrentCommandAndPreserveObservation()
    {
        await using var fixture = await RelationalFixture.Create(); var fx = fixture.Seed(); var provider = new ImmediateProvider();
        var first = await Service(fixture.Options(), provider, Now).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "k1"), null, default);
        var second = await Service(fixture.Options(), provider, Now.AddSeconds(1)).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(22, 30, "k2"), null, default);
        await using var verify = fixture.Context(); var commands = (await verify.RoomHeatingCommands.ToListAsync()).OrderBy(c => c.RequestedUtc).ToList();
        Assert.Equal(2, commands.Count); Assert.Equal(RoomHeatingCommandStatus.Superseded, commands[0].Status); Assert.Equal(RoomHeatingCommandStatus.Accepted, commands[1].Status); Assert.Equal(second.response!.Command.CommandId, commands[1].Id); Assert.Equal(commands[1].Id, commands[0].SupersededByCommandId); Assert.Equal(2, provider.TemporaryCalls);
        var cap = await Service(fixture.Options(), provider, Now.AddSeconds(2)).GetCapability(fx.RoomId, default);
        Assert.Equal(second.response.Command.CommandId, cap!.CurrentOverride!.CommandId); Assert.Equal(second.response.Command.CommandId, cap.LatestCommand!.CommandId); Assert.Equal(20, (await verify.RoomClimateObservations.SingleAsync()).TemperatureCelsius); Assert.NotNull(await Service(fixture.Options(), provider, Now).GetCommand(fx.RoomId, first.response!.Command.CommandId, default));
    }

    [Fact]
    public async Task FailedNewerDifferentKeyDoesNotDestroyPreviousCurrentOverride()
    {
        await using var fixture = await RelationalFixture.Create(); var fx = fixture.Seed(); var provider = new ImmediateProvider();
        var ok = await Service(fixture.Options(), provider, Now).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "ok"), null, default);
        provider.TemporaryResult = new(RoomHeatingProviderOutcome.Rejected, FailureCode: "Rejected", FailureMessage: "Safe failure");
        var failed = await Service(fixture.Options(), provider, Now.AddSeconds(1)).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(22, 30, "bad"), null, default);
        var cap = await Service(fixture.Options(), provider, Now.AddSeconds(2)).GetCapability(fx.RoomId, default);
        Assert.Equal(RoomHeatingCommandStatus.Failed, failed.response!.Command.Status); Assert.Equal(ok.response!.Command.CommandId, cap!.CurrentOverride!.CommandId); Assert.Equal(20, (await fixture.Context().RoomClimateObservations.SingleAsync()).TemperatureCelsius);
    }

    [Fact]
    public async Task SameKeyRaceRecoversUniqueConflictAndDispatchesProviderOnce()
    {
        await using var fixture = await RelationalFixture.Create(); var fx = fixture.Seed(); var provider = new ImmediateProvider();
        var results = await Task.WhenAll(
            Task.Run(() => Service(fixture.Options(), provider, Now).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "same"), null, default)),
            Task.Run(() => Service(fixture.Options(), provider, Now).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "same"), null, default)));
        await using var verify = fixture.Context(); var rows = await verify.RoomHeatingCommands.ToListAsync();
        Assert.Single(rows); Assert.Equal(1, provider.TemporaryCalls); Assert.Equal(rows[0].Id, results[0].response!.Command.CommandId); Assert.Equal(rows[0].Id, results[1].response!.Command.CommandId);
        var conflict = await Service(fixture.Options(), provider, Now.AddSeconds(1)).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(22, 30, "same"), null, default);
        Assert.Equal(409, conflict.status); Assert.Equal("IdempotencyKeyConflict", conflict.error); Assert.Equal(1, provider.TemporaryCalls);
    }

    [Fact]
    public async Task ResumeVersusOverrideCommitOrderDeterminesCurrentStateAndStaleCompletionIsIgnored()
    {
        await using var fixture = await RelationalFixture.Create(); var fx = fixture.Seed(); var provider = new ImmediateProvider();
        var temp = await Service(fixture.Options(), provider, Now).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(21, 30, "temp"), null, default);
        var resume = await Service(fixture.Options(), provider, Now.AddSeconds(1)).Resume(fx.RoomId, new("resume"), null, default);
        Assert.Equal(RoomHeatingCommandAction.ResumeSchedule, (await Service(fixture.Options(), provider, Now.AddSeconds(2)).GetCapability(fx.RoomId, default))!.CurrentOverride!.Action);
        var newer = await Service(fixture.Options(), provider, Now.AddSeconds(3)).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(22, 30, "newer"), null, default);
        var cap = await Service(fixture.Options(), provider, Now.AddSeconds(4)).GetCapability(fx.RoomId, default);
        Assert.Equal(newer.response!.Command.CommandId, cap!.CurrentOverride!.CommandId); Assert.Equal(newer.response.Command.CommandId, cap.LatestCommand!.CommandId); Assert.NotNull(resume.response);
        var ignored = await Reconcile(fixture.Options(), provider, Now.AddSeconds(5)).ProcessCompletionAsync(new(temp.response!.Command.CommandId, null, fx.RoomId, fx.ProviderId, fx.MappingId, RoomHeatingCompletionOutcome.Succeeded, Now.AddSeconds(5), 21));
        Assert.Equal(RoomHeatingCompletionResultKind.Ignored, ignored.Kind); Assert.Equal(newer.response.Command.CommandId, (await Service(fixture.Options(), provider, Now.AddSeconds(6)).GetCapability(fx.RoomId, default))!.CurrentOverride!.CommandId);
    }

    [Fact]
    public async Task ExpiryVersusNewOverrideAndManualResumeKeepSingleCurrentStateAndNoDuplicateSystemResume()
    {
        await using var fixture = await RelationalFixture.Create(); var fx = fixture.Seed(); var provider = new ImmediateProvider { Capability = new(true, SupportsScheduleResume: true) };
        await using (var db = fixture.Context()) { db.RoomHeatingCommands.Add(Command(fx, "old", Now.AddMinutes(-30), Now.AddMinutes(-1), RoomHeatingCommandStatus.Accepted)); await db.SaveChangesAsync(); }
        var expired = await Reconcile(fixture.Options(), provider, Now).ReconcileAsync(Now);
        var newer = await Service(fixture.Options(), provider, Now.AddSeconds(1)).Temporary(fx.RoomId, RoomHeatingCommandAction.TemporaryWarmer, new(22, 30, "newer"), null, default);
        var manual = await Service(fixture.Options(), provider, Now.AddSeconds(2)).Resume(fx.RoomId, new("manual"), null, default);
        var again = await Reconcile(fixture.Options(), provider, Now.AddSeconds(3)).ReconcileAsync(Now.AddSeconds(3));
        await using var verify = fixture.Context();
        Assert.Equal(1, expired.ResumeCreatedCount); Assert.Equal(0, again.ResumeCreatedCount); Assert.Single(await verify.RoomHeatingCommands.Where(c => c.IdempotencyKey.StartsWith("system:auto-resume:")).ToListAsync()); Assert.Equal(2, provider.ResumeCalls);
        var cap = await Service(fixture.Options(), provider, Now.AddSeconds(4)).GetCapability(fx.RoomId, default);
        Assert.Equal(manual.response!.Command.CommandId, cap!.CurrentOverride!.CommandId); Assert.Equal(RoomHeatingCommandAction.ResumeSchedule, cap.CurrentOverride.Action); Assert.NotNull(await Service(fixture.Options(), provider, Now).GetCommand(fx.RoomId, newer.response!.Command.CommandId, default));
    }

    [Fact]
    public async Task CompletionExpiryAndPendingTimeoutRacesAreTerminalAndDoNotOscillate()
    {
        await using var fixture = await RelationalFixture.Create(); var fx = fixture.Seed(); var provider = new ImmediateProvider();
        await using (var db = fixture.Context()) { db.RoomHeatingCommands.Add(Command(fx, "pending", Now.AddMinutes(-10), Now.AddMinutes(20), RoomHeatingCommandStatus.Pending)); await db.SaveChangesAsync(); }
        var pending = await fixture.Context().RoomHeatingCommands.AsNoTracking().SingleAsync(c => c.IdempotencyKey == "pending");
        var completion = new RoomHeatingProviderCompletion(pending.Id, null, fx.RoomId, fx.ProviderId, fx.MappingId, RoomHeatingCompletionOutcome.Succeeded, Now, 21);
        Assert.Equal(RoomHeatingCompletionResultKind.Applied, (await Reconcile(fixture.Options(), provider, Now).ProcessCompletionAsync(completion)).Kind);
        await Reconcile(fixture.Options(), provider, Now.AddMinutes(1)).ReconcileAsync(Now.AddMinutes(1)); Assert.Equal(RoomHeatingCommandStatus.Succeeded, (await fixture.Context().RoomHeatingCommands.AsNoTracking().SingleAsync()).Status);

        await using var fixture2 = await RelationalFixture.Create(); var fx2 = fixture2.Seed(); await using (var db = fixture2.Context()) { db.RoomHeatingCommands.Add(Command(fx2, "pending", Now.AddMinutes(-10), Now.AddMinutes(20), RoomHeatingCommandStatus.Pending)); await db.SaveChangesAsync(); }
        var pending2 = await fixture2.Context().RoomHeatingCommands.AsNoTracking().SingleAsync(c => c.IdempotencyKey == "pending");
        await Reconcile(fixture2.Options(), provider, Now).ReconcileAsync(Now);
        var ignored = await Reconcile(fixture2.Options(), provider, Now.AddSeconds(1)).ProcessCompletionAsync(completion with { CommandId = pending2.Id, RoomId = fx2.RoomId, ProviderId = fx2.ProviderId, SourceMappingId = fx2.MappingId });
        Assert.Equal(RoomHeatingCompletionResultKind.Ignored, ignored.Kind); Assert.Equal(RoomHeatingCommandStatus.Failed, (await fixture2.Context().RoomHeatingCommands.AsNoTracking().SingleAsync()).Status);
    }

    private static RoomHeatingControlService Service(DbContextOptions<HomeOpsDbContext> options, ImmediateProvider provider, DateTimeOffset now) => new(new HomeOpsDbContext(options), new FixedClock(now), provider);
    private static RoomHeatingControlReconciliationService Reconcile(DbContextOptions<HomeOpsDbContext> options, ImmediateProvider provider, DateTimeOffset now) => new(new HomeOpsDbContext(options), new FixedClock(now), provider);
    private static RoomHeatingCommand Command(SeedIds fx, string key, DateTimeOffset requested, DateTimeOffset until, RoomHeatingCommandStatus status) => new() { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.RoomId, ProviderId = fx.ProviderId, SourceMappingId = fx.MappingId, Action = RoomHeatingCommandAction.TemporaryWarmer, Status = status, RequestedTargetTemperatureCelsius = 21, DurationMinutes = 30, EffectiveUntilUtc = until, RequestedUtc = requested, UpdatedUtc = requested, AcceptedUtc = status == RoomHeatingCommandStatus.Accepted ? requested : null, IdempotencyKey = key, RequestFingerprint = key };

    private sealed class RelationalFixture : IAsyncDisposable
    {
        private readonly SqliteConnection keepAlive; private readonly string connectionString;
        private RelationalFixture(SqliteConnection keepAlive, string connectionString) { this.keepAlive = keepAlive; this.connectionString = connectionString; }
        public static async Task<RelationalFixture> Create() { var cs = $"Data Source=file:{Guid.NewGuid():N}?mode=memory&cache=shared"; var keep = new SqliteConnection(cs); await keep.OpenAsync(); var f = new RelationalFixture(keep, cs); await using var db = f.Context(); await db.Database.EnsureCreatedAsync(); return f; }
        public DbContextOptions<HomeOpsDbContext> Options() => new DbContextOptionsBuilder<HomeOpsDbContext>().UseSqlite(connectionString).Options;
        public HomeOpsDbContext Context() => new(Options());
        public SeedIds Seed() { using var db = Context(); if (!db.Households.Any(h => h.Id == SeedHousehold.Id)) db.Households.Add(new Household { Id = SeedHousehold.Id, Name = "Home", TimeZoneId = "UTC", CreatedUtc = Now, UpdatedUtc = Now }); var floor = new Floor { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = "Floor", SortOrder = 0, CreatedUtc = Now, UpdatedUtc = Now }; var room = new Room { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, Name = "Room", RoomType = RoomType.Bedroom, SortOrder = 0, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now }; var config = new RoomClimateConfiguration { RoomId = room.Id, HouseholdId = SeedHousehold.Id, IsClimateEnabled = true, MinimumPreferredTemperatureCelsius = 18, MaximumPreferredTemperatureCelsius = 24, HeatingPolicyIntent = HeatingPolicyIntent.BoundedControl, CreatedUtc = Now, UpdatedUtc = Now }; var provider = new ClimateProvider { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, DisplayName = "Provider", ProviderType = ProviderType.Other, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now }; var mapping = new RoomClimateSourceMapping { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = room.Id, ProviderId = provider.Id, SourceRole = ClimateSourceRole.HeatingControl, ExternalSourceId = "climate.room", Priority = 0, IsEnabled = true, Health = MappingHealth.Healthy, CreatedUtc = Now, UpdatedUtc = Now }; var obs = new RoomClimateObservation { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = room.Id, ProviderId = provider.Id, SourceMappingId = mapping.Id, ObservedUtc = Now.AddMinutes(-1), ReceivedUtc = Now.AddMinutes(-1), TemperatureCelsius = 20, OperatingState = RoomClimateOperatingState.Idle, IsProviderAvailable = true, CreatedUtc = Now, UpdatedUtc = Now }; db.AddRange(floor, room, config, provider, mapping, obs); db.SaveChanges(); return new(room.Id, provider.Id, mapping.Id); }
        public ValueTask DisposeAsync() => keepAlive.DisposeAsync();
    }
    private sealed record SeedIds(Guid RoomId, Guid ProviderId, Guid MappingId);
    private sealed class FixedClock(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }
    private sealed class ImmediateProvider : IRoomHeatingControlProvider
    {
        public RoomHeatingControlProviderCapability Capability { get; set; } = new(true, SupportsScheduleResume: true);
        public RoomHeatingProviderResult TemporaryResult { get; set; } = new(RoomHeatingProviderOutcome.Accepted, "temp-ref");
        public RoomHeatingProviderResult ResumeResult { get; set; } = new(RoomHeatingProviderOutcome.Accepted, "resume-ref");
        public int TemporaryCalls { get; private set; } public int ResumeCalls { get; private set; }
        public Task<RoomHeatingControlProviderCapability> GetCapabilityAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) => Task.FromResult(Capability);
        public Task<RoomHeatingProviderResult> SubmitTemporaryTargetAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) { TemporaryCalls++; return Task.FromResult(TemporaryResult with { ProviderCommandReference = $"temp-{TemporaryCalls}" }); }
        public Task<RoomHeatingProviderResult> ResumeScheduleAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) { ResumeCalls++; return Task.FromResult(ResumeResult with { ProviderCommandReference = $"resume-{ResumeCalls}" }); }
    }
}
