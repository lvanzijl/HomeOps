using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FamilyMembers;

public static class FamilyMemberEndpoints
{
    public static IEndpointRouteBuilder MapFamilyMemberEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/family-members").WithTags("Family Members");

        group.MapGet("/", async (HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var members = await dbContext.FamilyMembers.AsNoTracking()
                .Where(member => member.HouseholdId == SeedHousehold.Id)
                .OrderBy(member => member.Name)
                .Select(member => ToDto(member))
                .ToListAsync(cancellationToken);
            return Results.Ok(members);
        }).WithName("GetFamilyMembers").Produces<IReadOnlyCollection<FamilyMemberDto>>();

        group.MapGet("/{memberId}", async (string memberId, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var member = await dbContext.FamilyMembers.AsNoTracking()
                .FirstOrDefaultAsync(member => member.Id == memberId && member.HouseholdId == SeedHousehold.Id, cancellationToken);
            return member is null ? Results.NotFound() : Results.Ok(ToDto(member));
        }).WithName("GetFamilyMember").Produces<FamilyMemberDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPut("/{memberId}", async (string memberId, UpdateFamilyMemberRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var member = await dbContext.FamilyMembers.FirstOrDefaultAsync(member => member.Id == memberId && member.HouseholdId == SeedHousehold.Id, cancellationToken);
            if (member is null) return Results.NotFound();
            var name = request.Name.Trim();
            var displayColor = request.DisplayColor.Trim();
            var initials = request.Initials.Trim();
            if (name.Length == 0 || displayColor.Length == 0 || initials.Length == 0) return Results.BadRequest(new { error = "Name, display color, and initials are required." });
            member.Name = name; member.DisplayColor = displayColor; member.Initials = initials;
            member.AgeGroup = request.Avatar.AgeGroup; member.Presentation = request.Avatar.Presentation;
            member.SkinTone = request.Avatar.SkinTone.Trim(); member.HairColor = request.Avatar.HairColor.Trim();
            member.HairStyle = request.Avatar.HairStyle; member.Glasses = request.Avatar.Glasses; member.ShirtColor = request.Avatar.ShirtColor.Trim();
            member.UpdatedUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(ToDto(member));
        }).WithName("UpdateFamilyMember").Produces<FamilyMemberDto>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static FamilyMemberDto ToDto(FamilyMember member) => new(member.Id, member.Name, member.DisplayColor, member.Initials,
        new FamilyMemberAvatarDto(member.AgeGroup, member.Presentation, member.SkinTone, member.HairColor, member.HairStyle, member.Glasses, member.ShirtColor));
}
