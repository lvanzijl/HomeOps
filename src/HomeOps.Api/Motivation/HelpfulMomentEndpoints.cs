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
                .Where(moment => moment.HouseholdId == SeedHousehold.Id && !moment.IsDeleted && moment.FamilyMember != null);
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
            var now = ClientUtcNow();
            var moment = new HelpfulMoment
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                FamilyMemberId = member.Id,
                Title = request.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                RecognitionTag = NormalizeTag(request.RecognitionTag),
                CreatedUtc = now,
                UpdatedUtc = now,
            };
            dbContext.HelpfulMoments.Add(moment);
            await dbContext.SaveChangesAsync(cancellationToken);
            moment.FamilyMember = member;
            return Results.Created($"/api/helpful-moments/{moment.Id}", ToDto(moment));
        }).WithName("CreateHelpfulMoment").Produces<HelpfulMomentDto>(StatusCodes.Status201Created).ProducesValidationProblem();

        group.MapPut("/{id:guid}", async (Guid id, UpdateHelpfulMomentRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validation = Validate(request.FamilyMemberId, request.Title, request.Description, request.RecognitionTag);
            if (request.ExpectedUpdatedUtc == default)
            {
                validation ??= new Dictionary<string, string[]>();
                validation[nameof(request.ExpectedUpdatedUtc)] = ["The expected update time is required."];
            }
            if (validation is not null) return Results.ValidationProblem(validation);

            var moment = await dbContext.HelpfulMoments
                .FirstOrDefaultAsync(item => item.HouseholdId == SeedHousehold.Id && item.Id == id && !item.IsDeleted, cancellationToken);
            if (moment is null) return Results.NotFound();
            if (moment.UpdatedUtc.ToUnixTimeMilliseconds() != request.ExpectedUpdatedUtc.ToUnixTimeMilliseconds())
            {
                return Results.Conflict(new { message = "This appreciation changed after it was opened. Reload it and try again." });
            }

            var requestedMemberId = request.FamilyMemberId.Trim();
            var member = await dbContext.FamilyMembers.AsNoTracking()
                .FirstOrDefaultAsync(item => item.HouseholdId == SeedHousehold.Id && item.Id == requestedMemberId, cancellationToken);
            if (member is null || (member.IsDeleted && requestedMemberId != moment.FamilyMemberId))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [nameof(request.FamilyMemberId)] = ["Choose an active family member, or retain the removed historical member."] });
            }

            moment.FamilyMemberId = member.Id;
            moment.Title = request.Title.Trim();
            moment.Description = NormalizeOptional(request.Description);
            moment.RecognitionTag = NormalizeTag(request.RecognitionTag);
            moment.UpdatedUtc = ClientUtcNow();
            await dbContext.SaveChangesAsync(cancellationToken);
            moment.FamilyMember = member;
            return Results.Ok(ToDto(moment));
        }).WithName("UpdateHelpfulMoment").Produces<HelpfulMomentDto>().Produces(StatusCodes.Status404NotFound).Produces(StatusCodes.Status409Conflict).ProducesValidationProblem();

        group.MapDelete("/{id:guid}", async (Guid id, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var moment = await dbContext.HelpfulMoments
                .FirstOrDefaultAsync(item => item.HouseholdId == SeedHousehold.Id && item.Id == id && !item.IsDeleted, cancellationToken);
            if (moment is null) return Results.NotFound();
            moment.IsDeleted = true;
            moment.DeletedUtc = ClientUtcNow();
            moment.UpdatedUtc = moment.DeletedUtc.Value;
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("DeleteHelpfulMoment").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static IResult? Validate(CreateHelpfulMomentRequest request)
    {
        var errors = Validate(request.FamilyMemberId, request.Title, request.Description, request.RecognitionTag);
        return errors is null ? null : Results.ValidationProblem(errors);
    }

    private static Dictionary<string, string[]>? Validate(string familyMemberId, string title, string? description, string? recognitionTag)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(familyMemberId)) errors[nameof(familyMemberId)] = ["Family member is required."];
        if (string.IsNullOrWhiteSpace(title)) errors[nameof(title)] = ["Title is required."];
        if (title?.Length > 160) errors[nameof(title)] = ["Title must be 160 characters or fewer."];
        if (description?.Length > 500) errors[nameof(description)] = ["Description must be 500 characters or fewer."];
        if (!string.IsNullOrWhiteSpace(recognitionTag) && !HelpfulMomentTags.All.Contains(recognitionTag.Trim(), StringComparer.OrdinalIgnoreCase)) errors[nameof(recognitionTag)] = ["Recognition tag is not supported."];
        return errors.Count == 0 ? null : errors;
    }

    private static string NormalizeTag(string? tag) => HelpfulMomentTags.All.FirstOrDefault(item => string.Equals(item, tag?.Trim(), StringComparison.OrdinalIgnoreCase)) ?? HelpfulMomentTags.Kindness;

    private static string? NormalizeOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static DateTimeOffset ClientUtcNow()
    {
        var now = DateTimeOffset.UtcNow;
        return new DateTimeOffset(now.Ticks - (now.Ticks % TimeSpan.TicksPerMillisecond), TimeSpan.Zero);
    }

    private static HelpfulMomentDto ToDto(HelpfulMoment moment) => new(moment.Id, moment.HouseholdId.ToString(), moment.FamilyMemberId, moment.FamilyMember?.Name ?? string.Empty, moment.FamilyMember?.DisplayColor ?? "#f8c8dc", moment.FamilyMember?.Initials ?? "?", moment.FamilyMember?.IsDeleted ?? false, moment.Title, moment.Description, moment.RecognitionTag, moment.CreatedUtc, moment.UpdatedUtc);
}
