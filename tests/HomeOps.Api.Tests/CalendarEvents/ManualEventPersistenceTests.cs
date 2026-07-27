using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.CalendarEvents;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class EventSeriesPersistenceTests
{
    [Fact]
    public async Task FreshDbContextSeedsOnlyTheStructuralManualSource()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();

        var source = await dbContext.EventSources.SingleAsync(source => source.Id == SeedCalendarEvents.EventSourceId);
        var events = await dbContext.EventSeries.OrderBy(eventSeries => eventSeries.StartDate).ToListAsync();

        Assert.Equal(SeedHousehold.Id, source.HouseholdId);
        Assert.True(source.IsWritable);
        Assert.Empty(events);
    }

    [Fact]
    public async Task NormalizesEventSeriesIntoWritableNormalizedEvents()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();
        var eventSeries = new EventSeries
        {
            Id = SeedCalendarEvents.DentistAppointmentId,
            EventSourceId = SeedCalendarEvents.EventSourceId,
            Title = "Dentist Appointment",
            Description = "Routine check-up",
            IsAllDay = false,
            StartDate = new DateOnly(2026, 6, 18),
            StartTime = new TimeOnly(9, 30),
            EndDate = new DateOnly(2026, 6, 18),
            EndTime = new TimeOnly(10, 15),
            CreatedUtc = SeedCalendarEvents.SeededUtc,
            UpdatedUtc = SeedCalendarEvents.SeededUtc,
        };
        dbContext.EventSeries.Add(eventSeries);
        await dbContext.SaveChangesAsync();

        var normalized = EventSeriesNormalizer.ToNormalizedEvent(eventSeries);

        Assert.Equal(eventSeries.Id.ToString(), normalized.Id);
        Assert.Equal(SeedCalendarEvents.EventSourceId.ToString(), normalized.SourceId);
        Assert.True(normalized.Editable);
        Assert.Equal("Dentist Appointment", normalized.Title);
    }

    [Fact]
    public async Task DbContextPersistsEventSeriesCrudBehavior()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureCreatedAsync();
        var now = DateTimeOffset.UtcNow;
        var eventSeries = new EventSeries
        {
            Id = Guid.NewGuid(),
            EventSourceId = SeedCalendarEvents.EventSourceId,
            Title = "Test Event",
            IsAllDay = false,
            StartDate = DateOnly.FromDateTime(now.UtcDateTime),
            StartTime = TimeOnly.FromDateTime(now.UtcDateTime),
            EndDate = DateOnly.FromDateTime(now.AddHours(1).UtcDateTime),
            EndTime = TimeOnly.FromDateTime(now.AddHours(1).UtcDateTime),
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        dbContext.EventSeries.Add(eventSeries);
        await dbContext.SaveChangesAsync();

        eventSeries.Title = "Updated Test Event";
        eventSeries.UpdatedUtc = now.AddMinutes(1);
        await dbContext.SaveChangesAsync();

        dbContext.EventSeries.Remove(eventSeries);
        await dbContext.SaveChangesAsync();

        Assert.False(await dbContext.EventSeries.AnyAsync(candidate => candidate.Id == eventSeries.Id));
    }

    private static HomeOpsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase($"manual-events-{Guid.NewGuid()}")
            .Options;

        return new HomeOpsDbContext(options);
    }
}
