using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
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
        Assert.Equal(HttpStatusCode.OK, removeResponse.StatusCode);

        var list = await _client.GetFromJsonAsync<ListDto>($"/api/lists/{SeedLists.ShoppingListId}");
        Assert.NotNull(list);
        Assert.Contains(list.Items, item => item.Id == added.Id && item.IsDeleted);
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

    [Fact]
    public async Task RenameArchiveAndDeleteListLifecycleHidesListsFromNormalViews()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/lists", new CreateListRequest("Camping Trip"));
        var created = await createResponse.Content.ReadFromJsonAsync<ListDto>();
        Assert.NotNull(created);

        var renameResponse = await _client.PatchAsJsonAsync($"/api/lists/{created.Id}/name", new RenameListRequest("Summer Camping"));
        Assert.Equal(HttpStatusCode.OK, renameResponse.StatusCode);
        var renamed = await renameResponse.Content.ReadFromJsonAsync<ListDto>();
        Assert.NotNull(renamed);
        Assert.Equal("Summer Camping", renamed.Name);

        var archiveResponse = await _client.PostAsync($"/api/lists/{created.Id}/archive", null);
        Assert.Equal(HttpStatusCode.OK, archiveResponse.StatusCode);
        var listsAfterArchive = await _client.GetFromJsonAsync<ListSummaryDto[]>("/api/lists");
        Assert.NotNull(listsAfterArchive);
        Assert.DoesNotContain(listsAfterArchive, list => list.Id == created.Id);

        var deleteCreateResponse = await _client.PostAsJsonAsync("/api/lists", new CreateListRequest("Birthday Party"));
        var deleteCandidate = await deleteCreateResponse.Content.ReadFromJsonAsync<ListDto>();
        Assert.NotNull(deleteCandidate);

        var deleteResponse = await _client.DeleteAsync($"/api/lists/{deleteCandidate.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        var listsAfterDelete = await _client.GetFromJsonAsync<ListSummaryDto[]>("/api/lists");
        Assert.NotNull(listsAfterDelete);
        Assert.DoesNotContain(listsAfterDelete, list => list.Id == deleteCandidate.Id);
    }

    [Fact]
    public async Task CompletedAndDeletedItemsRemainTemporarilyVisibleAndCanBeUndone()
    {
        var addResponse = await _client.PostAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items", new AddListItemRequest("Bananas"));
        var added = await addResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(added);

        var toggleResponse = await _client.PostAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{added.Id}/toggle", null);
        var completed = await toggleResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(completed);
        Assert.True(completed.IsCompleted);
        Assert.NotNull(completed.CompletedUtc);

        var listWithCompleted = await _client.GetFromJsonAsync<ListDto>($"/api/lists/{SeedLists.ShoppingListId}");
        Assert.NotNull(listWithCompleted);
        Assert.Contains(listWithCompleted.Items, item => item.Id == added.Id && item.IsCompleted);

        var undoCompletedResponse = await _client.PostAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{added.Id}/undo", null);
        var undoneCompleted = await undoCompletedResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(undoneCompleted);
        Assert.False(undoneCompleted.IsCompleted);
        Assert.Null(undoneCompleted.CompletedUtc);

        var deleteResponse = await _client.DeleteAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{added.Id}");
        Assert.Equal(HttpStatusCode.OK, deleteResponse.StatusCode);
        var deleted = await deleteResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(deleted);
        Assert.True(deleted.IsDeleted);
        Assert.NotNull(deleted.DeletedUtc);

        var listWithDeleted = await _client.GetFromJsonAsync<ListDto>($"/api/lists/{SeedLists.ShoppingListId}");
        Assert.NotNull(listWithDeleted);
        Assert.Contains(listWithDeleted.Items, item => item.Id == added.Id && item.IsDeleted);

        var undoDeletedResponse = await _client.PostAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{added.Id}/undo", null);
        var undoneDeleted = await undoDeletedResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(undoneDeleted);
        Assert.False(undoneDeleted.IsDeleted);
        Assert.Null(undoneDeleted.DeletedUtc);
    }

    [Fact]
    public async Task ExpiredCompletedAndDeletedItemsAreCleanedFromActiveListView()
    {
        var expiredCompletedId = Guid.NewGuid();
        var expiredDeletedId = Guid.NewGuid();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOps.Api.Data.HomeOpsDbContext>();
            var now = DateTimeOffset.UtcNow;
            dbContext.ListItems.AddRange(
                new ListItem
                {
                    Id = expiredCompletedId,
                    ListId = SeedLists.ShoppingListId,
                    Text = "Expired completed",
                    IsCompleted = true,
                    CompletedUtc = now.AddHours(-25),
                    CreatedUtc = now.AddHours(-26),
                    UpdatedUtc = now.AddHours(-25),
                },
                new ListItem
                {
                    Id = expiredDeletedId,
                    ListId = SeedLists.ShoppingListId,
                    Text = "Expired deleted",
                    IsDeleted = true,
                    DeletedUtc = now.AddHours(-25),
                    CreatedUtc = now.AddHours(-26),
                    UpdatedUtc = now.AddHours(-25),
                });
            await dbContext.SaveChangesAsync();
        }

        var list = await _client.GetFromJsonAsync<ListDto>($"/api/lists/{SeedLists.ShoppingListId}");
        Assert.NotNull(list);
        Assert.DoesNotContain(list.Items, item => item.Id == expiredCompletedId);
        Assert.DoesNotContain(list.Items, item => item.Id == expiredDeletedId);
    }

}
