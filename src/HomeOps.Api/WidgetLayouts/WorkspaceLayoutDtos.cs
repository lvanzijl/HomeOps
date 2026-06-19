namespace HomeOps.Api.WidgetLayouts;

public sealed record WorkspaceLayoutDto(Guid Id, Guid HouseholdId, string WorkspaceKey, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, IReadOnlyCollection<WidgetPlacementDto> Placements);

public sealed record WidgetPlacementDto(Guid Id, string WidgetType, int Position, string Size, string ConfigurationJson);

public sealed record SaveWorkspaceLayoutRequest(IReadOnlyCollection<SaveWidgetPlacementRequest> Placements);

public sealed record SaveWidgetPlacementRequest(string WidgetType, int Position, string Size, string? ConfigurationJson);
