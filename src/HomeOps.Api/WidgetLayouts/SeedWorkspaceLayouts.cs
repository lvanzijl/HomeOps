namespace HomeOps.Api.WidgetLayouts;

public static class SeedWorkspaceLayouts
{
    public static readonly DateTimeOffset SeededUtc = new(2026, 6, 19, 0, 0, 0, TimeSpan.Zero);

    public static readonly Guid HomeLayoutId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public static readonly Guid HouseLayoutId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    public static readonly Guid MediaLayoutId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    public static readonly Guid SettingsLayoutId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    public static readonly Guid HomeAgendaPlacementId = Guid.Parse("a1111111-1111-1111-1111-111111111111");
    public static readonly Guid HomeShoppingPlacementId = Guid.Parse("a2222222-2222-2222-2222-222222222222");
    public static readonly Guid HomeWelcomePlacementId = Guid.Parse("a3333333-3333-3333-3333-333333333333");
    public static readonly Guid HousePlaceholderPlacementId = Guid.Parse("b1111111-1111-1111-1111-111111111111");
    public static readonly Guid MediaPlaceholderPlacementId = Guid.Parse("c1111111-1111-1111-1111-111111111111");
    public static readonly Guid SettingsPlaceholderPlacementId = Guid.Parse("d1111111-1111-1111-1111-111111111111");
}
