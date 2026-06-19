namespace HomeOps.Api.Lists;

public sealed record ListSummaryDto(Guid Id, string Name, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, Guid HouseholdId, int ItemCount);

public sealed record ListDto(Guid Id, string Name, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, Guid HouseholdId, IReadOnlyCollection<ListItemDto> Items);

public sealed record ListItemDto(Guid Id, Guid ListId, string Text, bool IsCompleted, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);

public sealed record CreateListRequest(string Name);

public sealed record AddListItemRequest(string Text);
