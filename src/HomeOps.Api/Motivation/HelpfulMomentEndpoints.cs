using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Motivation;

public static class HelpfulMomentEndpoints
{
    public static IEndpointRouteBuilder MapHelpfulMomentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/helpful-moments").WithTags("Helpful Moments");

        group.MapGet("/", async (string? familyMemberId, int? limit, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var take = Math.Clamp(limit ?? 12, 1, 50);
            var query = dbContext.HelpfulMoments.AsNoTracking()
                .Where(moment => moment.HouseholdId == SeedHousehold.Id && moment.FamilyMember != null && !moment.FamilyMember.IsDeleted);
            if (!string.IsNullOrWhiteSpace(familyMemberId)) query = query.Where(moment => moment.FamilyMemberId == familyMemberId);
            var moments = await query.Include(moment => moment.FamilyMember).OrderByDescending(moment => moment.CreatedUtc).Take(take).Select(moment => ToDto(moment)).ToListAsync(cancellationToken);
            return Results.Ok(moments);
        }).WithName("GetHelpfulMoments").Produces<IReadOnlyCollection<HelpfulMomentDto>>();

        group.MapPost("/", async (CreateHelpfulMomentRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validation = Validate(request);
            if (validation is not null) return validation;
            var member = await dbContext.FamilyMembers.AsNoTracking().FirstOrDefaultAsync(item => item.HouseholdId == SeedHousehold.Id && item.Id == request.FamilyMemberId && !item.IsDeleted, cancellationToken);
            if (member is null) return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.FamilyMemberId)] = ["Choose an active family member."] });
            var moment = new HelpfulMoment
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                FamilyMemberId = member.Id,
                Title = request.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                RecognitionTag = NormalizeTag(request.RecognitionTag),
                CreatedUtc = DateTimeOffset.UtcNow,
            };
            dbContext.HelpfulMoments.Add(moment);
            await dbContext.SaveChangesAsync(cancellationToken);
            moment.FamilyMember = member;
            return Results.Created($"/api/helpful-moments/{moment.Id}", ToDto(moment));
        }).WithName("CreateHelpfulMoment").Produces<HelpfulMomentDto>(StatusCodes.Status201Created).ProducesValidationProblem();

        return app;
    }

    private static IResult? Validate(CreateHelpfulMomentRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.FamilyMemberId)) errors[nameof(request.FamilyMemberId)] = ["Family member is required."];
        if (string.IsNullOrWhiteSpace(request.Title)) errors[nameof(request.Title)] = ["Title is required."];
        if (request.Title?.Length > 160) errors[nameof(request.Title)] = ["Title must be 160 characters or fewer."];
        if (request.Description?.Length > 500) errors[nameof(request.Description)] = ["Description must be 500 characters or fewer."];
        if (!string.IsNullOrWhiteSpace(request.RecognitionTag) && !HelpfulMomentTags.All.Contains(request.RecognitionTag.Trim(), StringComparer.OrdinalIgnoreCase)) errors[nameof(request.RecognitionTag)] = ["Recognition tag is not supported."];
        return errors.Count == 0 ? null : Results.ValidationProblem(errors);
    }

    private static string NormalizeTag(string? tag) => HelpfulMomentTags.All.FirstOrDefault(item => string.Equals(item, tag?.Trim(), StringComparison.OrdinalIgnoreCase)) ?? HelpfulMomentTags.Kindness;

    private static HelpfulMomentDto ToDto(HelpfulMoment moment) => new(moment.Id, moment.HouseholdId.ToString(), moment.FamilyMemberId, moment.FamilyMember?.Name ?? string.Empty, moment.FamilyMember?.DisplayColor ?? "#f8c8dc", moment.FamilyMember?.Initials ?? "?", moment.Title, moment.Description, moment.RecognitionTag, moment.CreatedUtc);
}
