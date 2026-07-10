using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.KnownPeople;

public static class KnownPersonEndpoints
{

    public static IEndpointRouteBuilder MapKnownPersonEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/known-people").WithTags("Known People");

        group.MapGet("/", async (KnownPersonScope? scope, string? familyMemberId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var query = dbContext.KnownPeople.AsNoTracking()
                .Where(person => person.HouseholdId == SeedHousehold.Id && !person.IsDeleted && (person.Scope == KnownPersonScope.Shared || (person.FamilyMember != null && !person.FamilyMember.IsDeleted)));
            if (scope is not null) query = query.Where(person => person.Scope == scope.Value);
            if (!string.IsNullOrWhiteSpace(familyMemberId))
            {
                var memberId = familyMemberId.Trim();
                query = query.Where(person => person.FamilyMemberId == memberId);
            }

            var people = await query.OrderBy(person => person.DisplayName).ToListAsync(cancellationToken);
            return Results.Ok(people.Select(ToDto).ToList());
        }).WithName("GetKnownPeople").Produces<IReadOnlyCollection<KnownPersonDto>>();

        group.MapGet("/{knownPersonId:guid}", async (Guid knownPersonId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var person = await dbContext.KnownPeople.AsNoTracking()
                .FirstOrDefaultAsync(person => person.Id == knownPersonId && person.HouseholdId == SeedHousehold.Id && !person.IsDeleted && (person.Scope == KnownPersonScope.Shared || (person.FamilyMember != null && !person.FamilyMember.IsDeleted)), cancellationToken);
            return person is null ? Results.NotFound() : Results.Ok(ToDto(person));
        }).WithName("GetKnownPerson").Produces<KnownPersonDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateKnownPersonRequest request, HomeOpsDbContext dbContext, AvatarCatalogService avatarCatalog, CancellationToken cancellationToken) =>
        {
            var householdId = SeedHousehold.Id;
            var validation = await Validate(request.DisplayName, request.Nickname, request.CustomRelationshipLabel, request.Initials, request.RelationshipType, request.Scope, request.FamilyMemberId, request.AvatarSelection, householdId, dbContext, avatarCatalog, cancellationToken);
            if (!validation.IsValid) return Results.BadRequest(new { errors = validation.Errors });
            var now = DateTimeOffset.UtcNow;
            var person = new KnownPerson
            {
                Id = Guid.NewGuid(),
                HouseholdId = householdId,
                DisplayName = validation.DisplayName!,
                Nickname = validation.Nickname,
                RelationshipType = request.RelationshipType,
                CustomRelationshipLabel = validation.CustomRelationshipLabel,
                Scope = request.Scope,
                FamilyMemberId = validation.FamilyMemberId,
                Initials = validation.Initials!,
                AvatarSelection = validation.AvatarSelection!,
                CreatedUtc = now,
                UpdatedUtc = now,
            };
            dbContext.KnownPeople.Add(person);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Created($"/api/known-people/{person.Id}", ToDto(person));
        }).WithName("CreateKnownPerson").Produces<KnownPersonDto>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/{knownPersonId:guid}", async (Guid knownPersonId, UpdateKnownPersonRequest request, HomeOpsDbContext dbContext, AvatarCatalogService avatarCatalog, CancellationToken cancellationToken) =>
        {
            var person = await dbContext.KnownPeople.FirstOrDefaultAsync(person => person.Id == knownPersonId && person.HouseholdId == SeedHousehold.Id && !person.IsDeleted, cancellationToken);
            if (person is null) return Results.NotFound();
            var householdId = SeedHousehold.Id;
            var validation = await Validate(request.DisplayName, request.Nickname, request.CustomRelationshipLabel, request.Initials, request.RelationshipType, request.Scope, request.FamilyMemberId, request.AvatarSelection, householdId, dbContext, avatarCatalog, cancellationToken);
            if (!validation.IsValid) return Results.BadRequest(new { errors = validation.Errors });
            person.DisplayName = validation.DisplayName!;
            person.Nickname = validation.Nickname;
            person.RelationshipType = request.RelationshipType;
            person.CustomRelationshipLabel = validation.CustomRelationshipLabel;
            person.Scope = request.Scope;
            person.FamilyMemberId = validation.FamilyMemberId;
            person.Initials = validation.Initials!;
            person.AvatarSelection = validation.AvatarSelection!;
            person.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(person));
        }).WithName("UpdateKnownPerson").Produces<KnownPersonDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{knownPersonId:guid}", async (Guid knownPersonId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var person = await dbContext.KnownPeople.FirstOrDefaultAsync(person => person.Id == knownPersonId && person.HouseholdId == SeedHousehold.Id && !person.IsDeleted, cancellationToken);
            if (person is null) return Results.NotFound();
            person.IsDeleted = true;
            person.DeletedUtc = DateTimeOffset.UtcNow;
            person.UpdatedUtc = person.DeletedUtc.Value;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("DeleteKnownPerson").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static async Task<ValidationResult> Validate(string displayNameInput, string? nicknameInput, string? labelInput, string? initialsInput, KnownPersonRelationshipType relationshipType, KnownPersonScope scope, string? familyMemberIdInput, AvatarSelectionDto? avatarSelectionDto, Guid householdId, HomeOpsDbContext dbContext, AvatarCatalogService avatarCatalog, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        var displayName = displayNameInput?.Trim() ?? string.Empty;
        var nickname = CleanOptional(nicknameInput);
        var label = CleanOptional(labelInput);
        var initials = CleanOptional(initialsInput) ?? BuildInitials(displayName);
        var familyMemberId = CleanOptional(familyMemberIdInput);

        AddRequired(errors, nameof(displayNameInput), displayName, "Display name is required.");
        AddMax(errors, "displayName", displayName, KnownPersonFieldLimits.DisplayNameMaxLength);
        AddMax(errors, "nickname", nickname, KnownPersonFieldLimits.NicknameMaxLength);
        AddMax(errors, "customRelationshipLabel", label, KnownPersonFieldLimits.CustomRelationshipLabelMaxLength);
        AddMax(errors, "initials", initials, KnownPersonFieldLimits.InitialsMaxLength);
        if (!Enum.IsDefined(relationshipType)) errors["relationshipType"] = ["Relationship type is invalid."];
        if (!Enum.IsDefined(scope)) errors["scope"] = ["Scope is invalid."];

        if (scope == KnownPersonScope.Shared && familyMemberId is not null) errors["familyMemberId"] = ["Shared people cannot reference a family member."];
        if (scope == KnownPersonScope.PrivateToMember)
        {
            if (familyMemberId is null) errors["familyMemberId"] = ["Private people must reference a family member."];
            else if (!await dbContext.FamilyMembers.AsNoTracking().AnyAsync(member => member.Id == familyMemberId && member.HouseholdId == householdId && !member.IsDeleted, cancellationToken)) errors["familyMemberId"] = ["Family member id must reference an active family member in this household."];
        }

        AvatarSelectionValidationResult avatarResult;
        if (avatarSelectionDto is null) avatarResult = AvatarSelectionValidationResult.Valid(avatarCatalog.DefaultSelection());
        else avatarResult = avatarCatalog.ValidateForWrite(new AvatarSelection { SchemaVersion = avatarSelectionDto.SchemaVersion, Selections = avatarSelectionDto.Selections.ToDictionary(StringComparer.Ordinal) });
        if (!avatarResult.IsValid)
        {
            foreach (var error in avatarResult.Errors) errors[error.Key] = error.Value;
        }

        return errors.Count == 0
            ? ValidationResult.Valid(displayName, nickname, label, initials, scope == KnownPersonScope.Shared ? null : familyMemberId, avatarResult.Selection!)
            : ValidationResult.Invalid(errors);
    }

    private static void AddRequired(Dictionary<string, string[]> errors, string key, string value, string message)
    {
        if (string.IsNullOrWhiteSpace(value)) errors[key] = [message];
    }

    private static void AddMax(Dictionary<string, string[]> errors, string key, string? value, int maxLength)
    {
        if (value is { Length: > 0 } && value.Length > maxLength) errors[key] = [$"Must be {maxLength} characters or fewer."];
    }

    private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string BuildInitials(string name)
    {
        var initials = string.Concat(name.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(part => char.ToUpperInvariant(part[0])));
        return initials[..Math.Min(2, initials.Length)];
    }

    private static AvatarSelectionDto ToAvatarSelectionDto(AvatarSelection selection) => new(selection.SchemaVersion, selection.Selections);
    private static KnownPersonDto ToDto(KnownPerson person) => new(person.Id, person.DisplayName, person.Nickname, person.RelationshipType, person.CustomRelationshipLabel, person.Scope, person.FamilyMemberId, person.Initials, ToAvatarSelectionDto(person.AvatarSelection), person.CreatedUtc, person.UpdatedUtc);

    private sealed record ValidationResult(bool IsValid, Dictionary<string, string[]> Errors, string? DisplayName, string? Nickname, string? CustomRelationshipLabel, string? Initials, string? FamilyMemberId, AvatarSelection? AvatarSelection)
    {
        public static ValidationResult Valid(string displayName, string? nickname, string? label, string initials, string? familyMemberId, AvatarSelection avatarSelection) => new(true, [], displayName, nickname, label, initials, familyMemberId, avatarSelection);
        public static ValidationResult Invalid(Dictionary<string, string[]> errors) => new(false, errors, null, null, null, null, null, null);
    }
}
