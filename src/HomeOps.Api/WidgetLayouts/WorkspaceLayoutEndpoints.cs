using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.WidgetLayouts;

public static class WorkspaceLayoutEndpoints
{
    private const int MaxPlacements = 24;

    public static IEndpointRouteBuilder MapWorkspaceLayoutEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/workspaces/{workspaceKey}/layout").WithTags("Workspace Layout");

        group.MapGet("/", async (string workspaceKey, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var layout = await LoadLayout(dbContext, workspaceKey, cancellationToken);
            return layout is null ? Results.NotFound() : Results.Ok(layout);
        }).WithName("GetWorkspaceLayout").Produces<WorkspaceLayoutDto>().Produces(StatusCodes.Status404NotFound);

        group.MapPut("/", async (string workspaceKey, SaveWorkspaceLayoutRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            if (request.Placements.Count > MaxPlacements)
            {
                return Results.BadRequest(new { error = $"A workspace layout cannot contain more than {MaxPlacements} widget placements." });
            }

            var now = DateTimeOffset.UtcNow;
            var normalizedWorkspaceKey = workspaceKey.Trim().ToLowerInvariant();
            var layoutId = await dbContext.WorkspaceLayouts
                .Where(existingLayout => existingLayout.HouseholdId == SeedHousehold.Id && existingLayout.WorkspaceKey == normalizedWorkspaceKey)
                .Select(existingLayout => (Guid?)existingLayout.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (layoutId is null)
            {
                layoutId = Guid.NewGuid();
                dbContext.WorkspaceLayouts.Add(new WorkspaceLayout
                {
                    Id = layoutId.Value,
                    HouseholdId = SeedHousehold.Id,
                    WorkspaceKey = normalizedWorkspaceKey,
                    CreatedUtc = now,
                    UpdatedUtc = now,
                });
            }
            else
            {
                await dbContext.WidgetPlacements
                    .Where(placement => placement.WorkspaceLayoutId == layoutId.Value)
                    .ExecuteDeleteAsync(cancellationToken);
            }

            foreach (var placement in request.Placements.OrderBy(placement => placement.Position))
            {
                var widgetType = placement.WidgetType.Trim();
                var size = placement.Size.Trim();

                if (widgetType.Length == 0 || size.Length == 0)
                {
                    return Results.BadRequest(new { error = "Widget type and size are required." });
                }

                dbContext.WidgetPlacements.Add(new WidgetPlacement
                {
                    Id = Guid.NewGuid(),
                    WorkspaceLayoutId = layoutId.Value,
                    WidgetType = widgetType,
                    Position = placement.Position,
                    Size = size,
                    ConfigurationJson = string.IsNullOrWhiteSpace(placement.ConfigurationJson) ? "{}" : placement.ConfigurationJson,
                });
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            var saved = await LoadLayout(dbContext, normalizedWorkspaceKey, cancellationToken);
            return Results.Ok(saved);
        }).WithName("SaveWorkspaceLayout").Produces<WorkspaceLayoutDto>().Produces(StatusCodes.Status400BadRequest);

        return app;
    }

    private static async Task<WorkspaceLayoutDto?> LoadLayout(HomeOpsDbContext dbContext, string workspaceKey, CancellationToken cancellationToken)
    {
        var normalizedWorkspaceKey = workspaceKey.Trim().ToLowerInvariant();
        return await dbContext.WorkspaceLayouts
            .AsNoTracking()
            .Where(layout => layout.HouseholdId == SeedHousehold.Id && layout.WorkspaceKey == normalizedWorkspaceKey)
            .Select(layout => new WorkspaceLayoutDto(
                layout.Id,
                layout.HouseholdId,
                layout.WorkspaceKey,
                layout.CreatedUtc,
                layout.UpdatedUtc,
                layout.Placements
                    .OrderBy(placement => placement.Position)
                    .Select(placement => new WidgetPlacementDto(
                        placement.Id,
                        placement.WidgetType,
                        placement.Position,
                        placement.Size,
                        placement.ConfigurationJson))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
