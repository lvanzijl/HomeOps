namespace HomeOps.Contracts.Events;

public sealed record RecurrenceRuleDto(
    string Frequency,
    int Interval,
    string EndMode,
    DateOnly? UntilDate = null,
    int? Count = null,
    IReadOnlyCollection<string>? WeeklyDays = null,
    int? MonthlyDayOfMonth = null,
    int? YearlyMonth = null,
    int? YearlyDayOfMonth = null);

public sealed record EventExceptionDto(
    Guid EventSeriesId,
    string OccurrenceKey,
    string ExceptionType,
    string? Title = null,
    string? Description = null,
    string? Location = null,
    bool? IsAllDay = null,
    DateTimeOffset? StartsAt = null,
    DateTimeOffset? EndsAt = null);

public sealed record RecurrenceSummaryDto(
    bool IsRecurring,
    string? Frequency = null,
    int? Interval = null,
    string? EndMode = null);
