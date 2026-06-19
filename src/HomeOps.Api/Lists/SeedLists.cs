namespace HomeOps.Api.Lists;

public static class SeedLists
{
    public static readonly Guid ShoppingListId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid VacationPackingListId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    public static readonly Guid BreadItemId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public static readonly Guid MilkItemId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    public static readonly Guid CoffeeItemId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    public static readonly Guid PassportItemId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    public static readonly Guid ChargersItemId = Guid.Parse("88888888-8888-8888-8888-888888888888");
    public static readonly Guid SwimwearItemId = Guid.Parse("99999999-9999-9999-9999-999999999999");

    public static readonly DateTimeOffset SeededUtc = new(2026, 6, 19, 0, 0, 0, TimeSpan.Zero);
}
