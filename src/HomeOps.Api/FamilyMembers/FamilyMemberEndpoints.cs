using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FamilyMembers;

public static class FamilyMemberEndpoints
{
    private static readonly string[] DefaultColors = ["#f8c8dc", "#c7d2fe", "#bbf7d0", "#fde68a", "#fed7aa", "#ddd6fe"];

    public static IEndpointRouteBuilder MapFamilyMemberEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/family-members").WithTags("Family Members");

        group.MapGet("/", async (HomeOpsDbContext dbContext, AvatarCatalogService avatarCatalog, CancellationToken cancellationToken) =>
        {
            var members = await dbContext.FamilyMembers.AsNoTracking()
                .Where(member => member.HouseholdId == SeedHousehold.Id && !member.IsDeleted)
                .OrderBy(member => member.Name)
                .ToListAsync(cancellationToken);
            return Results.Ok(members.Select(member => ToDto(member, avatarCatalog)).ToList());
        }).WithName("GetFamilyMembers").Produces<IReadOnlyCollection<FamilyMemberDto>>();

        group.MapGet("/{memberId}", async (string memberId, HomeOpsDbContext dbContext, AvatarCatalogService avatarCatalog, CancellationToken cancellationToken) =>
        {
            var member = await dbContext.FamilyMembers.AsNoTracking()
                .FirstOrDefaultAsync(member => member.Id == memberId && member.HouseholdId == SeedHousehold.Id, cancellationToken);
            return member is null ? Results.NotFound() : Results.Ok(ToDto(member, avatarCatalog));
        }).WithName("GetFamilyMember").Produces<FamilyMemberDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateFamilyMemberRequest request, HomeOpsDbContext dbContext, AvatarCatalogService avatarCatalog, CancellationToken cancellationToken) =>
        {
            var validation = Validate(request.Name, request.MemberKind, request.DateOfBirth);
            if (validation is not null) return validation;
            var avatarResult = ResolveAvatarSelection(request.AvatarSelection, request.AvatarV2Config, avatarCatalog);
            if (!avatarResult.IsValid) return Results.BadRequest(new { errors = avatarResult.Errors });
            var now = DateTimeOffset.UtcNow;
            var name = request.Name.Trim();
            var initials = string.IsNullOrWhiteSpace(request.Initials) ? BuildInitials(name) : request.Initials.Trim();
            var count = await dbContext.FamilyMembers.CountAsync(member => member.HouseholdId == SeedHousehold.Id, cancellationToken);
            var avatarSelection = avatarResult.Selection!;
            var member = new FamilyMember
            {
                Id = await BuildMemberId(dbContext, name, cancellationToken),
                HouseholdId = SeedHousehold.Id,
                Name = name,
                DisplayColor = string.IsNullOrWhiteSpace(request.DisplayColor) ? DefaultColors[count % DefaultColors.Length] : request.DisplayColor.Trim(),
                Initials = initials,
                MemberKind = request.MemberKind,
                DateOfBirth = request.DateOfBirth,
                AvatarSelection = avatarSelection,
                AvatarV2Config = avatarCatalog.ToLegacyAvatarV2(avatarSelection),
                CreatedUtc = now,
                UpdatedUtc = now,
            };
            dbContext.FamilyMembers.Add(member);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/family-members/{member.Id}", ToDto(member, avatarCatalog));
        }).WithName("CreateFamilyMember").Produces<FamilyMemberDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/{memberId}", async (string memberId, UpdateFamilyMemberRequest request, HomeOpsDbContext dbContext, AvatarCatalogService avatarCatalog, CancellationToken cancellationToken) =>
        {
            var member = await dbContext.FamilyMembers.FirstOrDefaultAsync(member => member.Id == memberId && member.HouseholdId == SeedHousehold.Id, cancellationToken);
            if (member is null) return Results.NotFound();
            var validation = Validate(request.Name, request.MemberKind, request.DateOfBirth);
            if (validation is not null) return validation;
            var avatarResult = ResolveAvatarSelection(request.AvatarSelection, request.AvatarV2Config, avatarCatalog);
            if (!avatarResult.IsValid) return Results.BadRequest(new { errors = avatarResult.Errors });
            var displayColor = request.DisplayColor.Trim();
            var initials = request.Initials.Trim();
            if (displayColor.Length == 0 || initials.Length == 0) return Results.BadRequest(new { error = "Display color and initials are required." });
            member.Name = request.Name.Trim(); member.DisplayColor = displayColor; member.Initials = initials;
            member.MemberKind = request.MemberKind; member.DateOfBirth = request.DateOfBirth;
            member.AvatarSelection = avatarResult.Selection;
            member.AvatarV2Config = avatarCatalog.ToLegacyAvatarV2(avatarResult.Selection);
            member.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(member, avatarCatalog));
        }).WithName("UpdateFamilyMember").Produces<FamilyMemberDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{memberId}", async (string memberId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var member = await dbContext.FamilyMembers.FirstOrDefaultAsync(member => member.Id == memberId && member.HouseholdId == SeedHousehold.Id, cancellationToken);
            if (member is null) return Results.NotFound();
            if (!member.IsDeleted)
            {
                member.IsDeleted = true;
                member.DeletedUtc = DateTimeOffset.UtcNow;
                member.UpdatedUtc = member.DeletedUtc.Value;
                var decoratedItems = await dbContext.ListItems
                    .Where(item => item.DecorativeAvatarReferenceType == Lists.DecorativeAvatarReferenceType.FamilyMember && item.DecorativeAvatarReferenceId == memberId)
                    .ToListAsync(cancellationToken);
                foreach (var item in decoratedItems)
                {
                    item.DecorativeAvatarReferenceType = null;
                    item.DecorativeAvatarReferenceId = null;
                    item.UpdatedUtc = member.UpdatedUtc;
                }
                var decoratedTasks = await dbContext.HouseholdTasks
                    .Where(task => task.DecorativeAvatarReferenceType == Lists.DecorativeAvatarReferenceType.FamilyMember && task.DecorativeAvatarReferenceId == memberId)
                    .ToListAsync(cancellationToken);
                foreach (var task in decoratedTasks)
                {
                    task.DecorativeAvatarReferenceType = null;
                    task.DecorativeAvatarReferenceId = null;
                    task.UpdatedUtc = member.UpdatedUtc;
                }
                var decoratedSeries = await dbContext.RecurringTaskSeries
                    .Where(series => series.DecorativeAvatarReferenceType == Lists.DecorativeAvatarReferenceType.FamilyMember && series.DecorativeAvatarReferenceId == memberId)
                    .ToListAsync(cancellationToken);
                foreach (var series in decoratedSeries)
                {
                    series.DecorativeAvatarReferenceType = null;
                    series.DecorativeAvatarReferenceId = null;
                    series.UpdatedUtc = member.UpdatedUtc;
                }
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            return Results.NoContent();
        }).WithName("DeleteFamilyMember").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static AvatarSelectionValidationResult ResolveAvatarSelection(AvatarSelectionDto? selectionDto, AvatarV2ConfigDto? legacyDto, AvatarCatalogService avatarCatalog)
    {
        if (selectionDto is not null && legacyDto is not null) return AvatarSelectionValidationResult.Invalid(new Dictionary<string, string[]> { ["avatarSelection"] = ["Provide either avatarSelection or avatarV2Config, not both."] });
        if (selectionDto is not null) return avatarCatalog.ValidateForWrite(new AvatarSelection { SchemaVersion = selectionDto.SchemaVersion, Selections = selectionDto.Selections.ToDictionary(StringComparer.Ordinal) });
        return AvatarSelectionValidationResult.Valid(avatarCatalog.MapLegacyAvatarV2(NormalizeAvatarV2Config(legacyDto)));
    }

    private static IResult? Validate(string name, FamilyMemberKind kind, DateOnly? dob)
    {
        if (string.IsNullOrWhiteSpace(name)) return Results.BadRequest(new { error = "Name is required." });
        if (kind == FamilyMemberKind.Child && dob is null) return Results.BadRequest(new { error = "Date of birth is required for children." });
        return null;
    }

    private static async Task<string> BuildMemberId(HomeOpsDbContext dbContext, string name, CancellationToken cancellationToken)
    {
        var slug = new string(name.Trim().ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) ? ch : '-').ToArray()).Trim('-');
        if (string.IsNullOrWhiteSpace(slug)) slug = "member";
        var candidate = slug;
        var suffix = 2;
        while (await dbContext.FamilyMembers.AnyAsync(member => member.Id == candidate, cancellationToken)) candidate = $"{slug}-{suffix++}";
        return candidate;
    }

    private static string BuildInitials(string name) => string.Concat(name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(part => char.ToUpperInvariant(part[0])))[..Math.Min(2, string.Concat(name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(part => char.ToUpperInvariant(part[0]))).Length)];

    private static AvatarV2Config NormalizeAvatarV2Config(AvatarV2ConfigDto? config)
    {
        var defaults = new AvatarV2Config();
        return config is null ? defaults : new AvatarV2Config
        {
            HeadVariant = Clean(config.HeadVariant, defaults.HeadVariant),
            HairStyle = Clean(config.HairStyle, defaults.HairStyle),
            HairColor = Clean(config.HairColor, defaults.HairColor),
            ClothingStyle = Clean(config.ClothingStyle, defaults.ClothingStyle),
            ClothingColor = Clean(config.ClothingColor, defaults.ClothingColor),
            Accessory = Clean(config.Accessory, defaults.Accessory),
            AccessoryColor = Clean(config.AccessoryColor, defaults.AccessoryColor),
        };
    }

    private static string Clean(string? value, string fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    private static AvatarV2ConfigDto ToAvatarV2Dto(AvatarV2Config config) => new(config.HeadVariant, config.HairStyle, config.HairColor, config.ClothingStyle, config.ClothingColor, config.Accessory, config.AccessoryColor);
    private static AvatarSelectionDto ToAvatarSelectionDto(AvatarSelection selection) => new(selection.SchemaVersion, selection.Selections);
    private static FamilyMemberDto ToDto(FamilyMember member, AvatarCatalogService avatarCatalog)
    {
        var selection = member.AvatarSelection ?? avatarCatalog.MapLegacyAvatarV2(member.AvatarV2Config);
        return new(member.Id, member.Name, member.DisplayColor, member.Initials, member.MemberKind, member.DateOfBirth, ToAvatarV2Dto(avatarCatalog.ToLegacyAvatarV2(selection)), ToAvatarSelectionDto(selection));
    }
}
