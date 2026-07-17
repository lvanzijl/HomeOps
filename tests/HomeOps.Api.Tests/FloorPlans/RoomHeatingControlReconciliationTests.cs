using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.FloorPlans;

public sealed class RoomHeatingControlReconciliationTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 15, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task AcceptedOverrideExpiresAtBoundaryAndCreatesOneResumeWhenSupported()
    {
        using var db = Db(); var fx = Seed(db); var fake = new FakeProvider { Capability = new(true, SupportsScheduleResume: true), ResumeResult = new(RoomHeatingProviderOutcome.Accepted, "resume-ref") };
        var cmd = Command(fx, RoomHeatingCommandStatus.Accepted, Now.AddMinutes(-30), Now, accepted: Now.AddMinutes(-30)); db.RoomHeatingCommands.Add(cmd); await db.SaveChangesAsync();
        var service = Reconcile(db, fake);

        var result = await service.ReconcileAsync(Now);
        var again = await service.ReconcileAsync(Now.AddMinutes(1));

        Assert.Equal(1, result.ExpiredCount); Assert.Equal(1, result.ResumeCreatedCount); Assert.Equal(0, again.ResumeCreatedCount);
        Assert.Equal(RoomHeatingCommandStatus.Expired, (await db.RoomHeatingCommands.FindAsync(cmd.Id))!.Status);
        var resume = await db.RoomHeatingCommands.SingleAsync(c => c.Action == RoomHeatingCommandAction.ResumeSchedule);
        Assert.Equal(RoomHeatingCommandStatus.Accepted, resume.Status); Assert.Equal("system:auto-resume:" + cmd.Id.ToString("N"), resume.IdempotencyKey); Assert.Equal(1, fake.ResumeCalls);
    }

    [Fact]
    public async Task ExpiryDoesNotChangeSupersededFailedOrJustBeforeBoundaryCommands()
    {
        using var db = Db(); var fx = Seed(db); var service = Reconcile(db, new FakeProvider());
        db.RoomHeatingCommands.Add(Command(fx, RoomHeatingCommandStatus.Accepted, Now.AddMinutes(-10), Now.AddTicks(1), accepted: Now.AddMinutes(-10), key: "active"));
        db.RoomHeatingCommands.Add(Command(fx, RoomHeatingCommandStatus.Superseded, Now.AddMinutes(-10), Now.AddMinutes(-1), key: "sup"));
        db.RoomHeatingCommands.Add(Command(fx, RoomHeatingCommandStatus.Failed, Now.AddMinutes(-10), Now.AddMinutes(-1), key: "fail"));
        await db.SaveChangesAsync();

        var result = await service.ReconcileAsync(Now);

        Assert.Equal(0, result.ExpiredCount);
        Assert.Equal(RoomHeatingCommandStatus.Accepted, (await db.RoomHeatingCommands.SingleAsync(c => c.IdempotencyKey == "active")).Status);
        Assert.Equal(RoomHeatingCommandStatus.Superseded, (await db.RoomHeatingCommands.SingleAsync(c => c.IdempotencyKey == "sup")).Status);
        Assert.Equal(RoomHeatingCommandStatus.Failed, (await db.RoomHeatingCommands.SingleAsync(c => c.IdempotencyKey == "fail")).Status);
    }

    [Fact]
    public async Task PendingCommandsTimeoutFactuallyWithoutProviderSuccess()
    {
        using var db = Db(); var fx = Seed(db); var pending = Command(fx, RoomHeatingCommandStatus.Pending, Now.AddMinutes(-10), Now.AddMinutes(30)); db.RoomHeatingCommands.Add(pending); await db.SaveChangesAsync();
        var result = await Reconcile(db, new FakeProvider()).ReconcileAsync(Now);
        var stored = await db.RoomHeatingCommands.FindAsync(pending.Id);
        Assert.Equal(1, result.PendingTimedOutCount); Assert.Equal(RoomHeatingCommandStatus.Failed, stored!.Status); Assert.Equal("PendingTimeout", stored.FailureCode); Assert.Equal(Now, stored.CompletedUtc);
    }

    [Fact]
    public async Task UnsupportedOrUnavailableResumeExpiresWithStableBlockerAndNoProviderDispatch()
    {
        foreach (var cap in new[] { new RoomHeatingControlProviderCapability(true, SupportsScheduleResume: false), new RoomHeatingControlProviderCapability(false, BlockerCode: "ProviderUnavailable", BlockerMessage: "Provider unavailable", SupportsScheduleResume: true) })
        {
            using var db = Db(); var fx = Seed(db); var fake = new FakeProvider { Capability = cap }; var cmd = Command(fx, RoomHeatingCommandStatus.Accepted, Now.AddMinutes(-10), Now.AddMinutes(-1), accepted: Now.AddMinutes(-10)); db.RoomHeatingCommands.Add(cmd); await db.SaveChangesAsync();
            await Reconcile(db, fake).ReconcileAsync(Now);
            var stored = await db.RoomHeatingCommands.FindAsync(cmd.Id);
            Assert.Equal(RoomHeatingCommandStatus.Expired, stored!.Status); Assert.NotNull(stored.FailureCode); Assert.Equal(0, fake.ResumeCalls); Assert.DoesNotContain(await db.RoomHeatingCommands.ToListAsync(), c => c.Action == RoomHeatingCommandAction.ResumeSchedule);
        }
    }

    [Fact]
    public async Task CompletionIsAppliedIdempotentlyAndStaleOrWrongOwnershipIsIgnoredOrConflicted()
    {
        using var db = Db(); var fx = Seed(db); var cmd = Command(fx, RoomHeatingCommandStatus.Accepted, Now.AddMinutes(-5), Now.AddMinutes(30), accepted: Now.AddMinutes(-4)); db.RoomHeatingCommands.Add(cmd); await db.SaveChangesAsync(); var service = Reconcile(db, new FakeProvider());
        var ok = new RoomHeatingProviderCompletion(cmd.Id, null, fx.Room.Id, fx.Provider.Id, fx.Mapping.Id, RoomHeatingCompletionOutcome.Succeeded, Now, 21, null);
        Assert.Equal(RoomHeatingCompletionResultKind.Applied, (await service.ProcessCompletionAsync(ok)).Kind);
        Assert.Equal(RoomHeatingCommandStatus.Succeeded, (await db.RoomHeatingCommands.FindAsync(cmd.Id))!.Status);
        Assert.Equal(RoomHeatingCompletionResultKind.Ignored, (await service.ProcessCompletionAsync(ok)).Kind);
        Assert.Equal(RoomHeatingCompletionResultKind.Conflict, (await service.ProcessCompletionAsync(ok with { RoomId = Guid.NewGuid() })).Kind);

        var stale = Command(fx, RoomHeatingCommandStatus.Accepted, Now.AddMinutes(-5), Now.AddMinutes(30), accepted: Now, key: "stale"); db.RoomHeatingCommands.Add(stale); await db.SaveChangesAsync();
        Assert.Equal(RoomHeatingCompletionResultKind.Ignored, (await service.ProcessCompletionAsync(ok with { CommandId = stale.Id, CompletedUtc = Now.AddMinutes(-1) })).Kind);
    }

    [Fact]
    public async Task ObservationConfirmationRequiresNewerMatchingTargetSameMappingAndAvailability()
    {
        using var db = Db(); var fx = Seed(db); var cmd = Command(fx, RoomHeatingCommandStatus.Accepted, Now.AddMinutes(-10), Now.AddMinutes(20), accepted: Now.AddMinutes(-9)); db.RoomHeatingCommands.Add(cmd); await db.SaveChangesAsync();
        fx.Observation.ObservedUtc = Now.AddMinutes(-1); fx.Observation.TargetTemperatureCelsius = 21.05m; fx.Observation.TemperatureCelsius = 18m; await db.SaveChangesAsync();
        var result = await Reconcile(db, new FakeProvider()).ReconcileAsync(Now);
        Assert.Equal(1, result.ObservationsConfirmedCount); Assert.Equal(RoomHeatingCommandStatus.Succeeded, (await db.RoomHeatingCommands.FindAsync(cmd.Id))!.Status); Assert.Equal(21.05m, (await db.RoomHeatingCommands.FindAsync(cmd.Id))!.ConfirmedTargetTemperatureCelsius);

        using var db2 = Db(); var fx2 = Seed(db2); var cmd2 = Command(fx2, RoomHeatingCommandStatus.Accepted, Now.AddMinutes(-10), Now.AddMinutes(20), accepted: Now.AddMinutes(-9)); db2.RoomHeatingCommands.Add(cmd2); fx2.Observation.ObservedUtc = Now.AddMinutes(-1); fx2.Observation.TargetTemperatureCelsius = null; fx2.Observation.TemperatureCelsius = 21m; await db2.SaveChangesAsync();
        await Reconcile(db2, new FakeProvider()).ReconcileAsync(Now); Assert.Equal(RoomHeatingCommandStatus.Accepted, (await db2.RoomHeatingCommands.FindAsync(cmd2.Id))!.Status);
    }

    private static RoomHeatingControlReconciliationService Reconcile(HomeOpsDbContext db, FakeProvider fake) => new(db, new FixedClock(Now), fake);
    private static HomeOpsDbContext Db() => new(new DbContextOptionsBuilder<HomeOpsDbContext>().UseInMemoryDatabase($"reconcile-{Guid.NewGuid()}").Options);
    private static RoomHeatingCommand Command(Fixture fx, RoomHeatingCommandStatus status, DateTimeOffset requested, DateTimeOffset? until, DateTimeOffset? accepted = null, string key = "key") => new() { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = fx.Room.Id, ProviderId = fx.Provider.Id, SourceMappingId = fx.Mapping.Id, Action = RoomHeatingCommandAction.TemporaryWarmer, Status = status, RequestedTargetTemperatureCelsius = 21, DurationMinutes = 30, EffectiveUntilUtc = until, RequestedUtc = requested, UpdatedUtc = requested, AcceptedUtc = accepted, IdempotencyKey = key, RequestFingerprint = key };
    private static Fixture Seed(HomeOpsDbContext db)
    {
        if (!db.Households.Any(h => h.Id == SeedHousehold.Id)) db.Households.Add(new Household { Id = SeedHousehold.Id, Name = "Home", TimeZoneId = "UTC", CreatedUtc = Now, UpdatedUtc = Now });
        var floor = new Floor { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = "Floor", SortOrder = 0, CreatedUtc = Now, UpdatedUtc = Now };
        var room = new Room { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, FloorId = floor.Id, Name = "Room", RoomType = RoomType.Bedroom, SortOrder = 0, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now };
        var provider = new ClimateProvider { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, DisplayName = "Provider", ProviderType = ProviderType.Other, IsEnabled = true, CreatedUtc = Now, UpdatedUtc = Now };
        var mapping = new RoomClimateSourceMapping { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = room.Id, ProviderId = provider.Id, SourceRole = ClimateSourceRole.HeatingControl, ExternalSourceId = "climate.room", Priority = 0, IsEnabled = true, Health = MappingHealth.Healthy, CreatedUtc = Now, UpdatedUtc = Now };
        var obs = new RoomClimateObservation { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, RoomId = room.Id, ProviderId = provider.Id, SourceMappingId = mapping.Id, ObservedUtc = Now.AddMinutes(-2), ReceivedUtc = Now.AddMinutes(-2), TemperatureCelsius = 20, OperatingState = RoomClimateOperatingState.Idle, IsProviderAvailable = true, CreatedUtc = Now, UpdatedUtc = Now };
        db.AddRange(floor, room, provider, mapping, obs); db.SaveChanges(); return new(room, provider, mapping, obs);
    }
    private sealed record Fixture(Room Room, ClimateProvider Provider, RoomClimateSourceMapping Mapping, RoomClimateObservation Observation);
    private sealed class FixedClock(DateTimeOffset now) : TimeProvider { public override DateTimeOffset GetUtcNow() => now; }
    private sealed class FakeProvider : IRoomHeatingControlProvider
    {
        public RoomHeatingControlProviderCapability Capability { get; set; } = new(true, SupportsScheduleResume: true);
        public RoomHeatingProviderResult ResumeResult { get; set; } = new(RoomHeatingProviderOutcome.Accepted, "resume-ref");
        public int ResumeCalls { get; private set; }
        public Task<RoomHeatingControlProviderCapability> GetCapabilityAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) => Task.FromResult(Capability);
        public Task<RoomHeatingProviderResult> SubmitTemporaryTargetAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) => Task.FromResult(new RoomHeatingProviderResult(RoomHeatingProviderOutcome.Accepted));
        public Task<RoomHeatingProviderResult> ResumeScheduleAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken) { ResumeCalls++; return Task.FromResult(ResumeResult); }
    }
}
