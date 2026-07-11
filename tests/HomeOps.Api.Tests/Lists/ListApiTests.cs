using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using HomeOps.Api.Lists;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.Data;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;
using HomeOps.Api.KnownPeople;

namespace HomeOps.Api.Tests.Lists;

public sealed class ListApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetListsReturnsSeededLists()
    {
        var lists = await _client.GetFromJsonAsync<ListSummaryDto[]>("/api/lists");

        Assert.NotNull(lists);
        Assert.Contains(lists, list => list.Name == "Shopping");
        Assert.Contains(lists, list => list.Name == "Vacation Packing");
    }

    [Fact]
    public async Task GetListByIdReturnsSeededItems()
    {
        var list = await _client.GetFromJsonAsync<ListDto>($"/api/lists/{SeedLists.ShoppingListId}");

        Assert.NotNull(list);
        Assert.Equal("Shopping", list.Name);
        Assert.Contains(list.Items, item => item.Text == "Bread");
        Assert.Contains(list.Items, item => item.Text == "Coffee");
        Assert.Contains(list.Items, item => item.Text == "Milk");
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
    public async Task PurchaseHistoryRecordsMultipleStoresAndOrdersSuggestions()
    {
        var firstResponse = await _client.PostAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items", new AddListItemRequest("Shampoo"));
        var first = await firstResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(first);
        Assert.Null(first.PreferredStore);

        await _client.PatchAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{first.Id}/store", new UpdateListItemStoreRequest("Drugstore"));

        var secondResponse = await _client.PostAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items", new AddListItemRequest("shampoo"));
        var second = await secondResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(second);
        Assert.Null(second.PreferredStore);
        Assert.Equal(["Drugstore"], second.StoreSuggestions.Select(suggestion => suggestion.Store).ToArray());

        await _client.PatchAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{second.Id}/store", new UpdateListItemStoreRequest("Supermarket"));

        var thirdResponse = await _client.PostAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items", new AddListItemRequest("SHAMPOO"));
        var third = await thirdResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(third);
        await _client.PatchAsJsonAsync($"/api/lists/{SeedLists.ShoppingListId}/items/{third.Id}/store", new UpdateListItemStoreRequest("Drugstore"));

        var suggestions = await _client.GetFromJsonAsync<ShoppingItemSuggestionDto>("/api/lists/shopping/suggestions?text=shampoo");
        Assert.NotNull(suggestions);
        Assert.Equal(["Drugstore", "Supermarket"], suggestions.StoreSuggestions.Select(suggestion => suggestion.Store).ToArray());
        Assert.Equal([2, 1], suggestions.StoreSuggestions.Select(suggestion => suggestion.PurchaseCount).ToArray());
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

    [Fact]
    public async Task AddItemCanOmitDecorativeAvatar()
    {
        var listId = await CreateIsolatedListId();
        var response = await _client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Plain item"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(item);
        Assert.Null(item.DecorativeAvatar);
    }

    [Fact]
    public async Task AddItemCanReferenceFamilyMemberDecorativeAvatar()
    {
        var listId = await CreateIsolatedListId();
        var response = await _client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Riley snack", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.FamilyMember, "riley")));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(item);
        Assert.Equal(DecorativeAvatarReferenceType.FamilyMember, item.DecorativeAvatar?.ReferenceType);
        Assert.Equal("riley", item.DecorativeAvatar?.ReferenceId);
    }

    [Fact]
    public async Task AddUpdateAndClearKnownPersonDecorativeAvatar()
    {
        var listId = await CreateIsolatedListId();
        var knownPerson = await CreateKnownPerson("Grandma Picker");
        var addResponse = await _client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Birthday present", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.KnownPerson, knownPerson.Id.ToString())));
        var item = await addResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(item);
        Assert.Equal(DecorativeAvatarReferenceType.KnownPerson, item.DecorativeAvatar?.ReferenceType);

        var updateResponse = await _client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/decorative-avatar", new UpdateListItemDecorativeAvatarRequest(new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.FamilyMember, "riley")));
        var updated = await updateResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(updated);
        Assert.Equal("riley", updated.DecorativeAvatar?.ReferenceId);
        Assert.Equal("Birthday present", updated.Text);
        Assert.False(updated.IsCompleted);

        var clearResponse = await _client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/decorative-avatar", new UpdateListItemDecorativeAvatarRequest(null));
        var cleared = await clearResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(cleared);
        Assert.Null(cleared.DecorativeAvatar);
    }

    [Fact]
    public async Task DeleteKnownPersonClearsShoppingDecorativeReferenceWithoutChangingItem()
    {
        var listId = await CreateIsolatedListId();
        var knownPerson = await CreateKnownPerson("Delete Decoration");
        var addResponse = await _client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Flowers", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.KnownPerson, knownPerson.Id.ToString())));
        var item = await addResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(item);

        await _client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/store", new UpdateListItemStoreRequest("Florist"));
        var deleteResponse = await _client.DeleteAsync($"/api/known-people/{knownPerson.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var list = await _client.GetFromJsonAsync<ListDto>($"/api/lists/{listId}");
        var reloaded = Assert.Single(list!.Items, candidate => candidate.Id == item.Id);
        Assert.Null(reloaded.DecorativeAvatar);
        Assert.Equal("Flowers", reloaded.Text);
        Assert.False(reloaded.IsCompleted);
        Assert.Equal("Florist", reloaded.PreferredStore);
    }


    [Fact]
    public async Task AddDecorativeAvatarRejectsInvalidReferences()
    {
        var listId = await CreateIsolatedListId();
        var knownPerson = await CreateKnownPerson("Mismatch Candidate");

        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Unknown member", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.FamilyMember, "missing-member"))));
        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Unknown person", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.KnownPerson, Guid.NewGuid().ToString()))));
        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Mismatched member", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.KnownPerson, "riley"))));
        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Mismatched person", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.FamilyMember, knownPerson.Id.ToString()))));
    }

    [Fact]
    public async Task AddDecorativeAvatarRejectsSoftDeletedReferences()
    {
        var listId = await CreateIsolatedListId();
        var deletedPerson = await CreateKnownPerson("Deleted Decoration Candidate");
        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/known-people/{deletedPerson.Id}")).StatusCode);

        var deletedMemberId = $"deleted-decoration-{Guid.NewGuid():N}";
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var now = DateTimeOffset.UtcNow;
            dbContext.FamilyMembers.Add(new FamilyMember
            {
                Id = deletedMemberId,
                HouseholdId = SeedHousehold.Id,
                Name = "Deleted Decoration Member",
                DisplayColor = "#cccccc",
                Initials = "DD",
                MemberKind = FamilyMemberKind.Adult,
                IsDeleted = true,
                DeletedUtc = now,
                CreatedUtc = now,
                UpdatedUtc = now,
                AvatarSelection = DefaultAvatarSelection(),
            });
            await dbContext.SaveChangesAsync();
        }

        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Deleted member", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.FamilyMember, deletedMemberId))));
        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Deleted person", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.KnownPerson, deletedPerson.Id.ToString()))));
    }

    [Fact]
    public async Task AddDecorativeAvatarRejectsCrossHouseholdReferences()
    {
        var listId = await CreateIsolatedListId();
        var otherMemberId = $"other-household-{Guid.NewGuid():N}";
        var otherPersonId = Guid.NewGuid();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var now = DateTimeOffset.UtcNow;
            var otherHouseholdId = Guid.NewGuid();
            dbContext.Households.Add(new Household
            {
                Id = otherHouseholdId,
                Name = "Other Household",
                TimeZoneId = "UTC",
                OnboardingCompleted = true,
                CreatedUtc = now,
                UpdatedUtc = now,
            });
            dbContext.FamilyMembers.Add(new FamilyMember
            {
                Id = otherMemberId,
                HouseholdId = otherHouseholdId,
                Name = "Other Household Member",
                DisplayColor = "#cccccc",
                Initials = "OH",
                MemberKind = FamilyMemberKind.Adult,
                CreatedUtc = now,
                UpdatedUtc = now,
                AvatarSelection = DefaultAvatarSelection(),
            });
            dbContext.KnownPeople.Add(new KnownPerson
            {
                Id = otherPersonId,
                HouseholdId = otherHouseholdId,
                DisplayName = "Other Household Person",
                RelationshipType = KnownPersonRelationshipType.Other,
                Scope = KnownPersonScope.Shared,
                Initials = "OP",
                AvatarSelection = DefaultAvatarSelection(),
                CreatedUtc = now,
                UpdatedUtc = now,
            });
            await dbContext.SaveChangesAsync();
        }

        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Cross member", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.FamilyMember, otherMemberId))));
        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest("Cross person", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.KnownPerson, otherPersonId.ToString()))));
    }

    [Fact]
    public async Task DecorativeAvatarRejectsInvalidPairAndUnknownTypePayloads()
    {
        var listId = await CreateIsolatedListId();

        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new { text = "Type only", decorativeAvatar = new { referenceType = "FamilyMember" } }));
        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new { text = "Id only", decorativeAvatar = new { referenceId = "riley" } }));
        await AssertBadRequest(_client.PostAsJsonAsync($"/api/lists/{listId}/items", new { text = "Unknown type", decorativeAvatar = new { referenceType = 999, referenceId = "riley" } }));

        var item = await CreateItem(listId, "Patch target");
        await AssertBadRequest(_client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/decorative-avatar", new { decorativeAvatar = new { referenceType = "FamilyMember" } }));
        await AssertBadRequest(_client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/decorative-avatar", new { decorativeAvatar = new { referenceId = "riley" } }));
        await AssertBadRequest(_client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/decorative-avatar", new { decorativeAvatar = new { referenceType = 999, referenceId = "riley" } }));
    }

    [Fact]
    public async Task DecorativeAvatarClearSetsBothPersistedColumnsToNull()
    {
        var listId = await CreateIsolatedListId();
        var item = await CreateItem(listId, "Clear persisted pair", new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.FamilyMember, "riley"));

        var clearResponse = await _client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/decorative-avatar", new UpdateListItemDecorativeAvatarRequest(null));
        Assert.Equal(HttpStatusCode.OK, clearResponse.StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var persisted = await dbContext.ListItems.FindAsync(item.Id);
        Assert.NotNull(persisted);
        Assert.Null(persisted.DecorativeAvatarReferenceType);
        Assert.Null(persisted.DecorativeAvatarReferenceId);
    }

    [Fact]
    public async Task DecorativeAvatarUpdatePreservesUnrelatedShoppingFields()
    {
        var listId = await CreateIsolatedListId();
        var item = await CreateItem(listId, "Preserve fields");
        var storeResponse = await _client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/store", new UpdateListItemStoreRequest("Market"));
        var stored = await storeResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(stored);
        var toggleResponse = await _client.PostAsync($"/api/lists/{listId}/items/{item.Id}/toggle", null);
        var completed = await toggleResponse.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(completed);

        var updateResponse = await _client.PatchAsJsonAsync($"/api/lists/{listId}/items/{item.Id}/decorative-avatar", new UpdateListItemDecorativeAvatarRequest(new DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType.FamilyMember, "riley")));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<ListItemDto>();

        Assert.NotNull(updated);
        Assert.Equal(completed.Id, updated.Id);
        Assert.Equal("Preserve fields", updated.Text);
        Assert.True(updated.IsCompleted);
        Assert.Equal(completed.CompletedUtc, updated.CompletedUtc);
        Assert.False(updated.IsDeleted);
        Assert.Null(updated.DeletedUtc);
        Assert.Equal("Market", updated.PreferredStore);
        Assert.True(updated.UpdatedUtc >= completed.UpdatedUtc);
    }

    private async Task<Guid> CreateIsolatedListId()
    {
        var response = await _client.PostAsJsonAsync("/api/lists", new CreateListRequest($"Decorative Test {Guid.NewGuid():N}"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var list = await response.Content.ReadFromJsonAsync<ListDto>();
        Assert.NotNull(list);
        return list.Id;
    }


    private async Task<ListItemDto> CreateItem(Guid listId, string text, DecorativeAvatarReferenceDto? decorativeAvatar = null)
    {
        var response = await _client.PostAsJsonAsync($"/api/lists/{listId}/items", new AddListItemRequest(text, decorativeAvatar));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<ListItemDto>();
        Assert.NotNull(item);
        return item;
    }

    private static async Task AssertBadRequest(Task<HttpResponseMessage> responseTask)
    {
        var response = await responseTask;
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static AvatarSelection DefaultAvatarSelection() => new()
    {
        SchemaVersion = AvatarCatalogConstants.SchemaVersion,
        Selections = new Dictionary<string, string>
        {
            [AvatarSelectionSlots.HeadVariant] = "head.variant.round",
            [AvatarSelectionSlots.SkinTone] = "skin.tone.medium",
            [AvatarSelectionSlots.HairStyle] = "hair.style.short-messy",
            [AvatarSelectionSlots.HairColor] = "hair.color.cocoa",
            [AvatarSelectionSlots.ClothingStyle] = "clothing.style.hoodie",
            [AvatarSelectionSlots.ClothingColor] = "clothing.color.sky",
            [AvatarSelectionSlots.AccessoryStyle] = "accessory.style.star",
            [AvatarSelectionSlots.AccessoryColor] = "accessory.color.mint",
            [AvatarSelectionSlots.EyewearStyle] = "eyewear.style.none",
            [AvatarSelectionSlots.EyeStyle] = "eye.style.classic-round",
            [AvatarSelectionSlots.MouthStyle] = "mouth.style.neutral",
            [AvatarSelectionSlots.ClothingSecondaryColor] = "clothing.secondary-color.white",
        },
    };

    private async Task<KnownPersonDto> CreateKnownPerson(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/known-people", new CreateKnownPersonRequest(name, null, KnownPersonRelationshipType.Grandparent, null, KnownPersonScope.Shared, null, null, null));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var knownPerson = await response.Content.ReadFromJsonAsync<KnownPersonDto>();
        Assert.NotNull(knownPerson);
        return knownPerson;
    }

}
