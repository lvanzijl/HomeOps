using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using HomeOps.Api.Data;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Tests.Lists;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Contracts;

public sealed class FamilyMemberFrontendContractTests
{
    [Fact]
    public async Task MixedAvatarPayloadIsRejectedWithoutPersistingMember()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var payload = WritePayload("Mixed Contract Rejected", "MR", AvatarPayloadKind.Mixed);

        var response = await client.PostAsync("/api/family-members", JsonContent.Create(payload));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(
            "Provide either avatarSelection or avatarV2Config, not both.",
            body.GetProperty("errors").GetProperty("avatarSelection")[0].GetString());
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.False(await dbContext.FamilyMembers.AnyAsync(member => member.Name == "Mixed Contract Rejected"));
    }

    [Fact]
    public async Task LegacyCreatePayloadPersistsAndNormalizesAvatarSelection()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var payload = WritePayload("Legacy Contract Create", "LC", AvatarPayloadKind.LegacyV2);

        var response = await client.PostAsync("/api/family-members", JsonContent.Create(payload));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<FamilyMemberDto>();
        Assert.NotNull(created);
        Assert.Equal("hair.style.long-soft", created.AvatarSelection.Selections["hairStyle"]);
        Assert.DoesNotContain("avatarSelection", payload.Keys);
    }

    [Fact]
    public async Task LegacyUpdatePayloadPersistsAndNormalizesAvatarSelection()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var payload = WritePayload("Alex Legacy Updated", "AL", AvatarPayloadKind.LegacyV2);

        var response = await client.PutAsync("/api/family-members/alex", JsonContent.Create(payload));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var after = await client.GetFromJsonAsync<FamilyMemberDto>("/api/family-members/alex");
        Assert.NotNull(after);
        Assert.Equal("Alex Legacy Updated", after.Name);
        Assert.Equal("hair.style.long-soft", after.AvatarSelection.Selections["hairStyle"]);
        Assert.DoesNotContain("avatarSelection", payload.Keys);
    }

    [Fact]
    public async Task CanonicalCreatePayloadPersistsAndRoundTripsAvatarSelection()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var payload = WritePayload("Contract Create", "CC", AvatarPayloadKind.CanonicalSelection);

        var response = await client.PostAsync("/api/family-members", JsonContent.Create(payload));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.DoesNotContain("avatarV2Config", payload.Keys);
        var created = await response.Content.ReadFromJsonAsync<FamilyMemberDto>();
        Assert.NotNull(created);
        Assert.Equal("hair.style.long-soft", created.AvatarSelection.Selections["hairStyle"]);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var persisted = await dbContext.FamilyMembers.AsNoTracking().SingleAsync(member => member.Id == created.Id);
            Assert.Equal("Contract Create", persisted.Name);
            Assert.Equal("hair.style.long-soft", persisted.AvatarSelection!.Selections["hairStyle"]);
        }

        var loaded = await client.GetFromJsonAsync<FamilyMemberDto>($"/api/family-members/{created.Id}");
        Assert.NotNull(loaded);
        Assert.Equal(created.Name, loaded.Name);
        AssertAvatarSelectionEqual(created.AvatarSelection, loaded.AvatarSelection);
    }

    [Fact]
    public async Task CanonicalUpdatePayloadPersistsAndRoundTripsAvatarSelection()
    {
        await using var factory = new HomeOpsWebApplicationFactory();
        var client = factory.CreateClient();
        var payload = WritePayload("Alex Contract Updated", "AC", AvatarPayloadKind.CanonicalSelection);

        var response = await client.PutAsync("/api/family-members/alex", JsonContent.Create(payload));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain("avatarV2Config", payload.Keys);
        var updated = await response.Content.ReadFromJsonAsync<FamilyMemberDto>();
        Assert.NotNull(updated);
        Assert.Equal("Alex Contract Updated", updated.Name);
        Assert.Equal("hair.style.long-soft", updated.AvatarSelection.Selections["hairStyle"]);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            var persisted = await dbContext.FamilyMembers.AsNoTracking().SingleAsync(member => member.Id == "alex");
            Assert.Equal("Alex Contract Updated", persisted.Name);
            Assert.Equal("hair.style.long-soft", persisted.AvatarSelection!.Selections["hairStyle"]);
        }

        var loaded = await client.GetFromJsonAsync<FamilyMemberDto>("/api/family-members/alex");
        Assert.NotNull(loaded);
        Assert.Equal(updated.Name, loaded.Name);
        AssertAvatarSelectionEqual(updated.AvatarSelection, loaded.AvatarSelection);
    }

    private static Dictionary<string, object> WritePayload(string name, string initials, AvatarPayloadKind avatarPayloadKind)
    {
        var payload = new Dictionary<string, object>
        {
            ["name"] = name,
            ["displayColor"] = "#c7d2fe",
            ["initials"] = initials,
            ["memberKind"] = (int)FamilyMemberKind.Adult,
        };

        if (avatarPayloadKind is AvatarPayloadKind.CanonicalSelection or AvatarPayloadKind.Mixed)
        {
            payload["avatarSelection"] = new
            {
                schemaVersion = "1.0",
                selections = AvatarSelections(),
            };
        }

        if (avatarPayloadKind is AvatarPayloadKind.LegacyV2 or AvatarPayloadKind.Mixed)
        {
            payload["avatarV2Config"] = new
            {
                headVariant = "round",
                hairStyle = "longSoft",
                hairColor = "hairCocoa",
                clothingStyle = "hoodie",
                clothingColor = "shirtSky",
                accessory = "star",
                accessoryColor = "accessoryCoral",
            };
        }

        return payload;
    }

    private static Dictionary<string, string> AvatarSelections() => new()
    {
        ["headVariant"] = "head.variant.round",
        ["skinTone"] = "skin.tone.medium",
        ["hairStyle"] = "hair.style.long-soft",
        ["hairColor"] = "hair.color.cocoa",
        ["clothingStyle"] = "clothing.style.hoodie",
        ["clothingColor"] = "clothing.color.sky",
        ["accessoryStyle"] = "accessory.style.star",
        ["accessoryColor"] = "accessory.color.mint",
        ["eyeStyle"] = "eye.style.classic-round",
        ["mouthStyle"] = "mouth.style.neutral",
        ["eyewearStyle"] = "eyewear.style.none",
        ["clothingSecondaryColor"] = "clothing.secondary-color.white",
    };

    private static void AssertAvatarSelectionEqual(
        HomeOps.Api.AvatarCatalog.AvatarSelectionDto expected,
        HomeOps.Api.AvatarCatalog.AvatarSelectionDto actual)
    {
        Assert.Equal(expected.SchemaVersion, actual.SchemaVersion);
        Assert.Equal(
            expected.Selections.OrderBy(pair => pair.Key),
            actual.Selections.OrderBy(pair => pair.Key));
    }

    private enum AvatarPayloadKind
    {
        CanonicalSelection,
        LegacyV2,
        Mixed,
    }
}
