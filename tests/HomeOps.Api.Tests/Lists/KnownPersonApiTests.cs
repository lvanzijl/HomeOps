using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.Data;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Households;
using HomeOps.Api.KnownPeople;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Lists;

public sealed class KnownPersonApiTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreateSharedKnownPersonDefaultsAvatarAndInitials()
    {
        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Oma Joke", KnownPersonRelationshipType.Grandparent));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<KnownPersonDto>();
        Assert.NotNull(created);
        Assert.Equal(KnownPersonScope.Shared, created.Scope);
        Assert.Null(created.FamilyMemberId);
        Assert.Equal("OJ", created.Initials);
        Assert.Equal("hair.style.short-messy", created.AvatarSelection.Selections[AvatarSelectionSlots.HairStyle]);
    }

    [Fact]
    public async Task CreatePrivateToMemberKnownPersonPersistsMemberReference()
    {
        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Vic", KnownPersonRelationshipType.Friend, scope: KnownPersonScope.PrivateToMember, familyMemberId: "riley"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<KnownPersonDto>();
        Assert.NotNull(created);
        Assert.Equal(KnownPersonScope.PrivateToMember, created.Scope);
        Assert.Equal("riley", created.FamilyMemberId);
    }

    [Fact]
    public async Task CreateAcceptsExplicitValidAvatarSelection()
    {
        var selection = ValidSelection();
        selection[AvatarSelectionSlots.HairStyle] = "hair.style.side-bob";
        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Sophie", KnownPersonRelationshipType.Teacher, avatarSelection: new AvatarSelectionDto(AvatarCatalogConstants.SchemaVersion, selection)));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<KnownPersonDto>();
        Assert.NotNull(created);
        Assert.Equal("hair.style.side-bob", created.AvatarSelection.Selections[AvatarSelectionSlots.HairStyle]);
    }

    [Theory]
    [InlineData("unsupported", AvatarSelectionSlots.HairStyle, "hair.style.short-messy")]
    [InlineData(AvatarCatalogConstants.SchemaVersion, "missingSlot", "hair.style.short-messy")]
    [InlineData(AvatarCatalogConstants.SchemaVersion, AvatarSelectionSlots.HairStyle, "hair.style.missing")]
    [InlineData(AvatarCatalogConstants.SchemaVersion, AvatarSelectionSlots.HairStyle, "clothing.style.hoodie")]
    public async Task CreateRejectsInvalidAvatarSelection(string schemaVersion, string slot, string item)
    {
        var selection = ValidSelection();
        selection[slot] = item;
        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Invalid Avatar", KnownPersonRelationshipType.Other, avatarSelection: new AvatarSelectionDto(schemaVersion, selection)));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }


    [Theory]
    [InlineData(160, HttpStatusCode.Created)]
    [InlineData(161, HttpStatusCode.BadRequest)]
    public async Task DisplayNameLengthMatchesContract(int length, HttpStatusCode expectedStatus)
    {
        var response = await _client.PostAsJsonAsync("/api/known-people", Request(new string('D', length), KnownPersonRelationshipType.Other));
        Assert.Equal(expectedStatus, response.StatusCode);
    }

    [Theory]
    [InlineData(80, HttpStatusCode.Created)]
    [InlineData(81, HttpStatusCode.BadRequest)]
    public async Task NicknameLengthMatchesContract(int length, HttpStatusCode expectedStatus)
    {
        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Nickname Limit", KnownPersonRelationshipType.Other, nickname: new string('N', length)));
        Assert.Equal(expectedStatus, response.StatusCode);
    }

    [Theory]
    [InlineData(80, HttpStatusCode.Created)]
    [InlineData(81, HttpStatusCode.BadRequest)]
    public async Task CustomRelationshipLabelLengthMatchesContract(int length, HttpStatusCode expectedStatus)
    {
        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Label Limit", KnownPersonRelationshipType.Other, customRelationshipLabel: new string('L', length)));
        Assert.Equal(expectedStatus, response.StatusCode);
    }

    [Theory]
    [InlineData(8, HttpStatusCode.Created)]
    [InlineData(9, HttpStatusCode.BadRequest)]
    public async Task InitialsLengthMatchesContract(int length, HttpStatusCode expectedStatus)
    {
        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Initials Limit", KnownPersonRelationshipType.Other, initials: new string('I', length)));
        Assert.Equal(expectedStatus, response.StatusCode);
    }

    [Fact]
    public async Task ScopeAndFamilyMemberValidationRejectsInvalidReferences()
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync("/api/known-people", Request("Bad Shared", KnownPersonRelationshipType.Friend, familyMemberId: "riley"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync("/api/known-people", Request("Bad Private", KnownPersonRelationshipType.Friend, scope: KnownPersonScope.PrivateToMember))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync("/api/known-people", Request("Unknown Member", KnownPersonRelationshipType.Friend, scope: KnownPersonScope.PrivateToMember, familyMemberId: "missing"))).StatusCode);
    }

    [Fact]
    public async Task CreateRejectsSoftDeletedFamilyMember()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        db.FamilyMembers.Add(new() { Id = "deleted-member", HouseholdId = SeedHousehold.Id, Name = "Deleted", DisplayColor = "#ffffff", Initials = "D", MemberKind = FamilyMemberKind.Adult, IsDeleted = true, DeletedUtc = DateTimeOffset.UtcNow, CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();

        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Deleted Friend", KnownPersonRelationshipType.Friend, scope: KnownPersonScope.PrivateToMember, familyMemberId: "deleted-member"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRejectsCrossHouseholdFamilyMember()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var otherHouseholdId = Guid.NewGuid();
        db.Households.Add(new() { Id = otherHouseholdId, Name = "Other", TimeZoneId = "Europe/Amsterdam", CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow });
        db.FamilyMembers.Add(new() { Id = "other-member", HouseholdId = otherHouseholdId, Name = "Other", DisplayColor = "#ffffff", Initials = "O", MemberKind = FamilyMemberKind.Adult, CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();

        var response = await _client.PostAsJsonAsync("/api/known-people", Request("Cross", KnownPersonRelationshipType.Friend, scope: KnownPersonScope.PrivateToMember, familyMemberId: "other-member"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }


    [Fact]
    public async Task ListAndGetHidePrivateKnownPersonWhenFamilyMemberIsSoftDeleted()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        db.FamilyMembers.Add(new() { Id = "temporary-member", HouseholdId = SeedHousehold.Id, Name = "Temporary", DisplayColor = "#ffffff", Initials = "T", MemberKind = FamilyMemberKind.Adult, CreatedUtc = DateTimeOffset.UtcNow, UpdatedUtc = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();

        var create = await _client.PostAsJsonAsync("/api/known-people", Request("Temporary Friend", KnownPersonRelationshipType.Friend, scope: KnownPersonScope.PrivateToMember, familyMemberId: "temporary-member"));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await create.Content.ReadFromJsonAsync<KnownPersonDto>();
        Assert.NotNull(created);

        var member = db.FamilyMembers.Single(member => member.Id == "temporary-member");
        member.IsDeleted = true;
        member.DeletedUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/known-people/{created.Id}")).StatusCode);
        var list = await _client.GetFromJsonAsync<IReadOnlyCollection<KnownPersonDto>>("/api/known-people");
        Assert.NotNull(list);
        Assert.DoesNotContain(list, person => person.Id == created.Id);
    }

    [Fact]
    public async Task DuplicateDisplayNamesAreAllowed()
    {
        var first = await _client.PostAsJsonAsync("/api/known-people", Request("Noor", KnownPersonRelationshipType.Friend));
        var second = await _client.PostAsJsonAsync("/api/known-people", Request("Noor", KnownPersonRelationshipType.Classmate));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, second.StatusCode);
    }

    [Fact]
    public async Task DeleteSoftDeletesAndListAndGetExcludeDeletedRecords()
    {
        var create = await _client.PostAsJsonAsync("/api/known-people", Request("Delete Me", KnownPersonRelationshipType.Other));
        var created = await create.Content.ReadFromJsonAsync<KnownPersonDto>();
        Assert.NotNull(created);
        var delete = await _client.DeleteAsync($"/api/known-people/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/known-people/{created.Id}")).StatusCode);
        var list = await _client.GetFromJsonAsync<IReadOnlyCollection<KnownPersonDto>>("/api/known-people");
        Assert.NotNull(list);
        Assert.DoesNotContain(list, person => person.Id == created.Id);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.True(db.KnownPeople.Single(person => person.Id == created.Id).IsDeleted);
    }

    [Fact]
    public async Task UpdatePersistsFieldsAndPrivateToSharedClearsMemberReference()
    {
        var create = await _client.PostAsJsonAsync("/api/known-people", Request("Old", KnownPersonRelationshipType.Friend, scope: KnownPersonScope.PrivateToMember, familyMemberId: "riley"));
        var created = await create.Content.ReadFromJsonAsync<KnownPersonDto>();
        Assert.NotNull(created);
        var selection = ValidSelection();
        selection[AvatarSelectionSlots.ClothingColor] = "clothing.color.mint";
        var update = new UpdateKnownPersonRequest("New", "Nick", KnownPersonRelationshipType.Teacher, "Juf", KnownPersonScope.Shared, null, "NW", new AvatarSelectionDto(AvatarCatalogConstants.SchemaVersion, selection));
        var response = await _client.PutAsJsonAsync($"/api/known-people/{created.Id}", update);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<KnownPersonDto>();
        Assert.NotNull(updated);
        Assert.Equal("New", updated.DisplayName);
        Assert.Equal("Nick", updated.Nickname);
        Assert.Equal(KnownPersonRelationshipType.Teacher, updated.RelationshipType);
        Assert.Equal("Juf", updated.CustomRelationshipLabel);
        Assert.Equal(KnownPersonScope.Shared, updated.Scope);
        Assert.Null(updated.FamilyMemberId);
        Assert.Equal("NW", updated.Initials);
        Assert.Equal("clothing.color.mint", updated.AvatarSelection.Selections[AvatarSelectionSlots.ClothingColor]);
    }

    private static CreateKnownPersonRequest Request(string name, KnownPersonRelationshipType relationshipType, KnownPersonScope scope = KnownPersonScope.Shared, string? familyMemberId = null, string? initials = null, AvatarSelectionDto? avatarSelection = null, string? nickname = null, string? customRelationshipLabel = null) =>
        new(name, nickname, relationshipType, customRelationshipLabel, scope, familyMemberId, initials, avatarSelection);

    private static Dictionary<string, string> ValidSelection() => new(StringComparer.Ordinal)
    {
        [AvatarSelectionSlots.HeadVariant] = "head.variant.round",
        [AvatarSelectionSlots.SkinTone] = "skin.tone.medium",
        [AvatarSelectionSlots.HairStyle] = "hair.style.short-messy",
        [AvatarSelectionSlots.HairColor] = "hair.color.cocoa",
        [AvatarSelectionSlots.ClothingStyle] = "clothing.style.hoodie",
        [AvatarSelectionSlots.ClothingColor] = "clothing.color.sky",
        [AvatarSelectionSlots.AccessoryStyle] = "accessory.style.star",
        [AvatarSelectionSlots.AccessoryColor] = "accessory.color.mint",
    };
}
