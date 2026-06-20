using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Lists;

namespace HomeOps.Api.Tests.Lists;

public sealed class ListApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetListsReturnsSeededLists()
    {
        var lists = await _client.GetFromJsonAsync<ListSummaryDto[]>("/api/lists");

        Assert.NotNull(lists);
        Assert.Equal(["Shopping", "Vacation Packing"], lists.Select(list => list.Name).Order().ToArray());
    }

    [Fact]
    public async Task GetListByIdReturnsSeededItems()
    {
        var list = await _client.GetFromJsonAsync<ListDto>($"/api/lists/{SeedLists.ShoppingListId}");

        Assert.NotNull(list);
        Assert.Equal("Shopping", list.Name);
        Assert.Equal(["Bread", "Coffee", "Milk"], list.Items.Select(item => item.Text).Order().ToArray());
    }

    [Fact]
    public async Task CreateListAddsList()
    {
        var response = await _client.PostAsJsonAsync("/api/lists", new CreateListRequest("Hardware Store"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ListDto>();
        Assert.NotNull(created);
        Assert.Equal("Hardware Store", created.Name);
    }

    [Fact]
    public async Task AddToggleAndRemoveItemUpdatesListItems()
    {
        var addResponse = await _client.PostAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items", new AddListItemRequest("Apples"));
        Assert.Equal(HttpStatusCode.Created, addResponse.StatusCode);
        var added = await addResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(added);
        Assert.Equal("Apples", added.Text);
        Assert.False(added.IsCompleted);

        var toggleResponse = await _client.PostAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{added.Id}/toggle", null);
        Assert.Equal(HttpStatusCode.OK, toggleResponse.StatusCode);
        var toggled = await toggleResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(toggled);
        Assert.True(toggled.IsCompleted);

        var removeResponse = await _client.DeleteAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{added.Id}");
        Assert.Equal(HttpStatusCode.NoContent, removeResponse.StatusCode);

        var list = await _client.GetFromJsonAsync<ListDto>($"/api/lists/{SeedLists.ShoppingListId}");
        Assert.NotNull(list);
        Assert.DoesNotContain(list.Items, item => item.Id == added.Id);
    }
    [Fact]
    public async Task StorePreferenceIsLearnedInheritedAndOverridden()
    {
        var firstResponse = await _client.PostAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items", new AddListItemRequest("Shampoo"));
        var first = await firstResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(first);
        Assert.Null(first.PreferredStore);

        var learnResponse = await _client.PatchAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{first.Id}/store", new UpdateListItemStoreRequest("Drugstore"));
        Assert.Equal(HttpStatusCode.OK, learnResponse.StatusCode);
        var learned = await learnResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(learned);
        Assert.Equal("Drugstore", learned.PreferredStore);

        var secondResponse = await _client.PostAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items", new AddListItemRequest("shampoo"));
        var inherited = await secondResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(inherited);
        Assert.Equal("Drugstore", inherited.PreferredStore);

        var overrideResponse = await _client.PatchAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{inherited.Id}/store", new UpdateListItemStoreRequest("Supermarket"));
        Assert.Equal(HttpStatusCode.OK, overrideResponse.StatusCode);
        var overridden = await overrideResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(overridden);
        Assert.Equal("Supermarket", overridden.PreferredStore);
    }

}
