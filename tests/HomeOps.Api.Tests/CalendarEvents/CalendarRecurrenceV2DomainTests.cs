using System.Text.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Contracts.Events;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarRecurrenceV2DomainTests
{
    [Fact]
    public void WeeklyDaysSerializesInCanonicalOrder()
    {
        var serialized = WeeklyDays.Serialize([DayOfWeek.Wednesday, DayOfWeek.Monday, DayOfWeek.Sunday]);

        Assert.Equal("Monday,Wednesday,Sunday", serialized);
    }

    [Fact]
    public void WeeklyDaysParsesCanonicalValuesAndRejectsDuplicatesAndInvalidValues()
    {
        var parsed = WeeklyDays.Parse("Wednesday,Monday");

        Assert.Equal([DayOfWeek.Monday, DayOfWeek.Wednesday], parsed);
        Assert.Throws<ArgumentException>(() => WeeklyDays.Parse("Monday,Monday"));
        Assert.Throws<ArgumentException>(() => WeeklyDays.Parse("Funday"));
    }

    [Fact]
    public void OccurrenceKeyFormatsParsesComparesAndUsesValueEquality()
    {
        var dateOnlyKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 6));
        var timedKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 6), new TimeOnly(9, 30));
        var laterKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 7));

        Assert.Equal("2026-07-06", dateOnlyKey.Serialize());
        Assert.Equal("2026-07-06T09:30:00", timedKey.Serialize());
        Assert.Equal(timedKey, OccurrenceKey.Parse("2026-07-06T09:30:00"));
        Assert.True(timedKey.CompareTo(laterKey) < 0);
        Assert.True(OccurrenceKey.TryParse("2026-07-06", out var parsed));
        Assert.Equal(dateOnlyKey, parsed);
        Assert.False(OccurrenceKey.TryParse("07/06/2026", out _));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void RecurrenceRuleRejectsInvalidIntervals(int interval)
    {
        var result = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = interval, EndMode = RecurrenceEndMode.Never });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("Interval", StringComparison.Ordinal));
    }

    [Fact]
    public void RecurrenceRuleValidatesDailyFrequencyFields()
    {
        var valid = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.Never });
        var invalid = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Monday" });

        Assert.True(valid.IsValid);
        Assert.False(invalid.IsValid);
    }

    [Fact]
    public void RecurrenceRuleValidatesWeeklyCanonicalDays()
    {
        var valid = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Monday,Wednesday" });
        var duplicate = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Monday,Monday" });
        var nonCanonical = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Wednesday,Monday" });

        Assert.True(valid.IsValid);
        Assert.False(duplicate.IsValid);
        Assert.False(nonCanonical.IsValid);
    }

    [Theory]
    [InlineData(1, true)]
    [InlineData(31, true)]
    [InlineData(0, false)]
    [InlineData(32, false)]
    public void RecurrenceRuleValidatesMonthlyDayOfMonth(int day, bool expectedValid)
    {
        var result = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Monthly, Interval = 1, EndMode = RecurrenceEndMode.Never, MonthlyDayOfMonth = day });

        Assert.Equal(expectedValid, result.IsValid);
    }

    [Theory]
    [InlineData(2, 29, true)]
    [InlineData(2, 30, false)]
    [InlineData(4, 31, false)]
    [InlineData(12, 31, true)]
    public void RecurrenceRuleValidatesYearlyMonthDayIncludingLeapDay(int month, int day, bool expectedValid)
    {
        var result = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Yearly, Interval = 1, EndMode = RecurrenceEndMode.Never, YearlyMonth = month, YearlyDayOfMonth = day });

        Assert.Equal(expectedValid, result.IsValid);
    }

    [Fact]
    public void RecurrenceRuleValidatesEndModeCombinations()
    {
        var never = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.Never });
        var onDate = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.OnDate, UntilDate = new DateOnly(2026, 7, 31) }, new DateOnly(2026, 7, 1));
        var afterCount = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.AfterCount, Count = 3 });
        var invalidBoth = EventRecurrenceRuleValidation.Validate(new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.AfterCount, Count = 3, UntilDate = new DateOnly(2026, 7, 31) });

        Assert.True(never.IsValid);
        Assert.True(onDate.IsValid);
        Assert.True(afterCount.IsValid);
        Assert.False(invalidBoth.IsValid);
    }

    [Fact]
    public void RecurrenceContractsSerializeAndDeserializeWithBackwardCompatibleOptionalFields()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var dto = new RecurrenceRuleDto("Weekly", 2, "OnDate", new DateOnly(2026, 7, 31), WeeklyDays: ["Monday", "Wednesday"]);
        var normalizedEventJson = """
            {
              "id":"event-1",
              "sourceId":"source-1",
              "title":"Dinner",
              "startsAt":"2026-07-06T18:00:00+00:00",
              "endsAt":"2026-07-06T19:00:00+00:00",
              "allDay":false,
              "editable":true
            }
            """;

        var serialized = JsonSerializer.Serialize(dto, options);
        var roundTripped = JsonSerializer.Deserialize<RecurrenceRuleDto>(serialized, options);
        var legacyEvent = JsonSerializer.Deserialize<NormalizedEvent>(normalizedEventJson, options);

        Assert.NotNull(roundTripped);
        Assert.Equal(dto.Frequency, roundTripped.Frequency);
        Assert.Equal(dto.Interval, roundTripped.Interval);
        Assert.Equal(dto.EndMode, roundTripped.EndMode);
        Assert.Equal(dto.UntilDate, roundTripped.UntilDate);
        Assert.Equal(dto.WeeklyDays, roundTripped.WeeklyDays);
        Assert.NotNull(legacyEvent);
        Assert.False(legacyEvent.IsRecurring);
        Assert.Null(legacyEvent.OccurrenceKey);
        Assert.Null(legacyEvent.Recurrence);
    }
}
