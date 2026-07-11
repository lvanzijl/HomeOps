namespace HomeOps.Api.Lists;

public sealed record ListSummaryDto(Guid Id, string Name, bool IsArchived, bool IsDeleted, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, Guid HouseholdId, int ItemCount);

public sealed record ListDto(Guid Id, string Name, bool IsArchived, bool IsDeleted, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, Guid HouseholdId, IReadOnlyCollection<ListItemDto> Items);

public sealed record DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType? ReferenceType, string? ReferenceId);

public sealed record ListItemDto(Guid Id, Guid ListId, string Text, bool IsCompleted, DateTimeOffset? CompletedUtc, bool IsDeleted, DateTimeOffset? DeletedUtc, string? PreferredStore, DecorativeAvatarReferenceDto? DecorativeAvatar, IReadOnlyCollection<ShoppingStoreSuggestionDto> StoreSuggestions, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);

public sealed record ShoppingStoreSuggestionDto(string Store, int PurchaseCount);

public sealed record ShoppingItemSuggestionDto(string Text, IReadOnlyCollection<ShoppingStoreSuggestionDto> StoreSuggestions);

public sealed record CreateListRequest(string Name);

public sealed record AddListItemRequest(string Text, DecorativeAvatarReferenceDto? DecorativeAvatar = null);

public sealed record RenameListRequest(string Name);

public sealed record UpdateListItemStoreRequest(string? PreferredStore);

public sealed record UpdateListItemDecorativeAvatarRequest(DecorativeAvatarReferenceDto? DecorativeAvatar);
