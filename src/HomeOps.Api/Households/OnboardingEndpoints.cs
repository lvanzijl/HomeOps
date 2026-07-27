using HomeOps.Api.Data;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.FamilyMembers;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Households;

public static class OnboardingEndpoints
{
    public static IEndpointRouteBuilder MapOnboardingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/onboarding").WithTags("Onboarding");

        group.MapGet("/status", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var household = await dbContext.Households.AsNoTracking().FirstAsync(h => h.Id == SeedHousehold.Id, cancellationToken);
            var hasActiveMembers = await dbContext.FamilyMembers.AsNoTracking().AnyAsync(m => m.HouseholdId == SeedHousehold.Id && !m.IsDeleted, cancellationToken);
            return Results.Ok(new OnboardingStatusDto(household.OnboardingCompleted, hasActiveMembers, !household.OnboardingCompleted || !hasActiveMembers));
        }).WithName("GetOnboardingStatus").Produces<OnboardingStatusDto>();

        group.MapPost("/complete", async (CompleteOnboardingRequest request, HomeOpsDbContext dbContext, AvatarCatalogService avatarCatalog, CancellationToken cancellationToken) =>
        {
            var household = await dbContext.Households.FirstAsync(h => h.Id == SeedHousehold.Id, cancellationToken);
            if (household.OnboardingCompleted)
            {
                return Results.Ok(await Status(dbContext, household, cancellationToken));
            }

            var validationErrors = Validate(request, avatarCatalog, out var avatarSelections);
            if (validationErrors.Count > 0) return Results.ValidationProblem(validationErrors);

            await using var transaction = dbContext.Database.IsRelational()
                ? await dbContext.Database.BeginTransactionAsync(cancellationToken)
                : null;

            // Re-read inside the transaction so a retry that follows a lost response cannot add a second collection.
            household = await dbContext.Households.FirstAsync(h => h.Id == SeedHousehold.Id, cancellationToken);
            if (household.OnboardingCompleted)
            {
                if (transaction is not null) await transaction.CommitAsync(cancellationToken);
                return Results.Ok(await Status(dbContext, household, cancellationToken));
            }

            var now = DateTimeOffset.UtcNow;
            var usedIds = (await dbContext.FamilyMembers.Select(member => member.Id).ToListAsync(cancellationToken)).ToHashSet(StringComparer.Ordinal);
            for (var index = 0; index < request.Members.Count; index++)
            {
                var memberRequest = request.Members.ElementAt(index);
                var name = memberRequest.Name.Trim();
                var id = BuildMemberId(name, usedIds);
                dbContext.FamilyMembers.Add(new FamilyMember
                {
                    Id = id,
                    HouseholdId = SeedHousehold.Id,
                    Name = name,
                    DisplayColor = memberRequest.DisplayColor.Trim(),
                    Initials = memberRequest.Initials.Trim(),
                    MemberKind = memberRequest.MemberKind,
                    DateOfBirth = memberRequest.DateOfBirth,
                    AvatarSelection = avatarSelections[index],
                    AvatarV2Config = avatarCatalog.ToLegacyAvatarV2(avatarSelections[index]),
                    CreatedUtc = now,
                    UpdatedUtc = now,
                });
            }

            household.Name = request.HouseholdName.Trim();
            household.TimeZoneId = request.TimeZoneId.Trim();
            household.OnboardingCompleted = true;
            household.UpdatedUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            if (transaction is not null) await transaction.CommitAsync(cancellationToken);
            return Results.Ok(await Status(dbContext, household, cancellationToken));
        }).WithName("CompleteOnboarding").Produces<OnboardingStatusDto>().ProducesValidationProblem();

        return app;
    }

    private static async Task<OnboardingStatusDto> Status(HomeOpsDbContext dbContext, Household household, CancellationToken cancellationToken)
    {
        var hasActiveMembers = await dbContext.FamilyMembers.AsNoTracking().AnyAsync(m => m.HouseholdId == SeedHousehold.Id && !m.IsDeleted, cancellationToken);
        return new OnboardingStatusDto(household.OnboardingCompleted, hasActiveMembers, !household.OnboardingCompleted || !hasActiveMembers);
    }

    private static Dictionary<string, string[]> Validate(CompleteOnboardingRequest request, AvatarCatalogService avatarCatalog, out List<AvatarSelection> avatarSelections)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);
        avatarSelections = [];
        if (string.IsNullOrWhiteSpace(request.HouseholdName)) errors["householdName"] = ["Household name is required."];
        if (!HouseholdTimeZone.IsSupportedIanaTimeZone(request.TimeZoneId)) errors["timeZoneId"] = ["A supported IANA time zone is required."];
        if (request.Members is null || request.Members.Count == 0 || !request.Members.Any(member => member.MemberKind == FamilyMemberKind.Adult)) errors["members"] = ["At least one adult is required."];

        var members = request.Members ?? [];
        for (var index = 0; index < members.Count; index++)
        {
            var member = members.ElementAt(index);
            var prefix = $"members[{index}]";
            if (string.IsNullOrWhiteSpace(member.Name)) errors[$"{prefix}.name"] = ["Name is required."];
            if (string.IsNullOrWhiteSpace(member.DisplayColor)) errors[$"{prefix}.displayColor"] = ["Display color is required."];
            if (string.IsNullOrWhiteSpace(member.Initials)) errors[$"{prefix}.initials"] = ["Initials are required."];
            if (member.MemberKind == FamilyMemberKind.Child && member.DateOfBirth is null) errors[$"{prefix}.dateOfBirth"] = ["Date of birth is required for children."];
            if (member.AvatarSelection is null || member.AvatarSelection.Selections is null)
            {
                errors[$"{prefix}.avatarSelection"] = ["Avatar selection is required."];
                continue;
            }
            var selection = new AvatarSelection { SchemaVersion = member.AvatarSelection.SchemaVersion, Selections = member.AvatarSelection.Selections.ToDictionary(StringComparer.Ordinal) };
            var avatarResult = avatarCatalog.ValidateForWrite(selection);
            if (!avatarResult.IsValid)
            {
                foreach (var error in avatarResult.Errors) errors[$"{prefix}.{error.Key}"] = error.Value;
            }
            else avatarSelections.Add(avatarResult.Selection!);
        }

        if (avatarSelections.Count != members.Count) avatarSelections = [];
        return errors;
    }

    private static string BuildMemberId(string name, ISet<string> usedIds)
    {
        var slug = new string(name.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) ? ch : '-').ToArray()).Trim('-');
        if (string.IsNullOrWhiteSpace(slug)) slug = "member";
        var candidate = slug;
        var suffix = 2;
        while (!usedIds.Add(candidate)) candidate = $"{slug}-{suffix++}";
        return candidate;
    }

}
