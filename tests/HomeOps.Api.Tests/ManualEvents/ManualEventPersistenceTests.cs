using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.ManualEvents;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.ManualEvents;

public sealed class ManualEventPersistenceTests
{
    [Fact]
    public async Task DbContextSeedsManualEventSourceAndEvents()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();

        var source = await dbContext.EventSources.SingleAsync(source => source.Id == SeedManualEvents.ManualEventSourceId);
        var events = await dbContext.ManualEvents.OrderBy(manualEvent => manualEvent.StartUtc).ToListAsync();

        Assert.Equal(SeedHousehold.Id, source.HouseholdId);
        Assert.True(source.IsWritable);
        Assert.Equal(["Dentist Appointment", "Parent Evening", "Put Bins Outside", "Vacation"], events.Select(manualEvent => manualEvent.Title).Order().ToArray());
    }

    [Fact]
    public async Task NormalizesManualEventsIntoWritableNormalizedEvents()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();
        var manualEvent = await dbContext.ManualEvents.SingleAsync(candidate => candidate.Id == SeedManualEvents.DentistAppointmentId);

        var normalized = ManualEventNormalizer.ToNormalizedEvent(manualEvent);

        Assert.Equal(manualEvent.Id.ToString(), normalized.Id);
        Assert.Equal(SeedManualEvents.ManualEventSourceId.ToString(), normalized.SourceId);
        Assert.True(normalized.Editable);
        Assert.Equal("Dentist Appointment", normalized.Title);
    }

    [Fact]
    public async Task DbContextPersistsManualEventCrudBehavior()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();
        var now = DateTimeOffset.UtcNow;
        var manualEvent = new ManualEvent
        {
            Id = Guid.NewGuid(),
            EventSourceId = SeedManualEvents.ManualEventSourceId,
            Title = "Test Event",
            StartUtc = now,
            EndUtc = now.AddHours(1),
            IsAllDay = false,
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        dbContext.ManualEvents.Add(manualEvent);
        await dbContext.SaveChangesAsync();

        manualEvent.Title = "Updated Test Event";
        manualEvent.UpdatedUtc = now.AddMinutes(1);
        await dbContext.SaveChangesAsync();

        dbContext.ManualEvents.Remove(manualEvent);
        await dbContext.SaveChangesAsync();

        Assert.False(await dbContext.ManualEvents.AnyAsync(candidate => candidate.Id == manualEvent.Id));
    }

    private static HomeOpsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"manual-events-{Guid.NewGuid()}")
            .Options;

        return new HomeOpsDbContext(options);
    }
}
