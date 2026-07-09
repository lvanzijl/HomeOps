using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.FamilyMembers;

namespace HomeOps.Api.Tests.Lists;

public sealed class AvatarCatalogTests(HomeOpsWebApplicationFactory factory) : IClassFixture<HomeOpsWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public void StartupCatalogValidationAcceptsBundledCatalog()
    {
        var service = new AvatarCatalogService(new SharedAvatarCatalogSource());
        Assert.Equal("hair.style.short-messy", service.DefaultSelection().Selections[AvatarSelectionSlots.HairStyle]);
        Assert.Contains(service.Catalog.Items, item => item.Id == "skin.tone.medium" && item.AccessibilityLabels.ContainsKey("nl-NL"));
    }

    [Fact]
    public void StartupCatalogValidationRejectsInvalidCatalog()
    {
        var source = new SharedAvatarCatalogSource();
        var catalog = source.LoadCatalog() with { Defaults = new Dictionary<string, string> { [AvatarSelectionSlots.HairStyle] = "missing.item" } };
        var error = Assert.Throws<InvalidOperationException>(() => AvatarCatalogValidator.Validate(catalog));
        Assert.Contains("missing.item", error.Message);
    }

    [Fact]
    public async Task CreateRejectsUnknownCatalogItemId()
    {
        var selection = ValidSelection();
        selection[AvatarSelectionSlots.HairStyle] = "hair.style.missing";
        var response = await _client.PostAsJsonAsync("/api/family-members", Request(selection));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRejectsCategoryMismatchedCatalogItemId()
    {
        var selection = ValidSelection();
        selection[AvatarSelectionSlots.HairStyle] = "clothing.style.hoodie";
        var response = await _client.PostAsJsonAsync("/api/family-members", Request(selection));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRequiresRequiredSelections()
    {
        var selection = ValidSelection();
        selection.Remove(AvatarSelectionSlots.AccessoryStyle);
        var response = await _client.PostAsJsonAsync("/api/family-members", Request(selection));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task LegacyAvatarV2ConfigMapsToCatalogIdsAndPreservesV2Response()
    {
        var legacy = new AvatarV2ConfigDto("oval", "sideBob", "hairChestnut", "sweater", "shirtRose", "flower", "accessoryLilac");
        var response = await _client.PostAsJsonAsync("/api/family-members", new CreateFamilyMemberRequest("Catalog Legacy", FamilyMemberKind.Adult, null, null, null, legacy));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<FamilyMemberDto>();
        Assert.NotNull(created);
        Assert.Equal("sideBob", created.AvatarV2Config.HairStyle);
        Assert.Equal("hair.style.side-bob", created.AvatarSelection.Selections[AvatarSelectionSlots.HairStyle]);
        Assert.Equal("accessory.color.sky", created.AvatarSelection.Selections[AvatarSelectionSlots.AccessoryColor]);
    }

    [Fact]
    public async Task ExistingAvatarV2ConfigurationsReadAsCatalogSelections()
    {
        var legacy = new AvatarV2ConfigDto("oval", "curlyPlayful", "hairPlum", "overall", "shirtMint", "tinyCrown", "accessoryCoral");
        var create = await _client.PostAsJsonAsync("/api/family-members", new CreateFamilyMemberRequest("Catalog Existing", FamilyMemberKind.Adult, null, null, null, legacy));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await create.Content.ReadFromJsonAsync<FamilyMemberDto>();
        Assert.NotNull(created);

        var member = await _client.GetFromJsonAsync<FamilyMemberDto>($"/api/family-members/{created.Id}");
        Assert.NotNull(member);
        Assert.Equal("head.variant.oval", member.AvatarSelection.Selections[AvatarSelectionSlots.HeadVariant]);
        Assert.Equal("hair.style.curly-playful", member.AvatarSelection.Selections[AvatarSelectionSlots.HairStyle]);
        Assert.Equal("clothing.color.mint", member.AvatarSelection.Selections[AvatarSelectionSlots.ClothingColor]);
    }

    private static CreateFamilyMemberRequest Request(Dictionary<string, string> selections) =>
        new("Catalog Kid", FamilyMemberKind.Child, new DateOnly(2020, 1, 2), null, null, null, new AvatarSelectionDto(AvatarCatalogConstants.SchemaVersion, selections));

    private static Dictionary<string, string> ValidSelection() => new(StringComparer.Ordinal)
    {
        [AvatarSelectionSlots.HeadVariant] = "head.variant.round",
        [AvatarSelectionSlots.SkinTone] = "skin.tone.peach",
        [AvatarSelectionSlots.HairStyle] = "hair.style.short-messy",
        [AvatarSelectionSlots.HairColor] = "hair.color.cocoa",
        [AvatarSelectionSlots.ClothingStyle] = "clothing.style.hoodie",
        [AvatarSelectionSlots.ClothingColor] = "clothing.color.sky",
        [AvatarSelectionSlots.AccessoryStyle] = "accessory.style.star",
        [AvatarSelectionSlots.AccessoryColor] = "accessory.color.mint",
    };
}
