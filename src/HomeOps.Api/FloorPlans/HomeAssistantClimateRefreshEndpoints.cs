using Microsoft.AspNetCore.Http.HttpResults;

namespace HomeOps.Api.FloorPlans;

public static class HomeAssistantClimateRefreshEndpoints
{
    public static IEndpointRouteBuilder MapHomeAssistantClimateRefreshEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/home-assistant/climate").WithTags("Home Assistant Climate Refresh");
        group.MapPost("/providers/{providerId:guid}/refresh", async Task<Ok<HomeAssistantClimateRefreshSummary>> (Guid providerId, HomeAssistantClimateRefreshService service, CancellationToken ct) => TypedResults.Ok(await service.RefreshProviderAsync(providerId, ct))).WithName("RefreshHomeAssistantClimateProvider");
        group.MapPost("/rooms/{roomId:guid}/refresh", async Task<Results<Ok<HomeAssistantClimateRefreshSummary>, NotFound>> (Guid roomId, HomeAssistantClimateRefreshService service, CancellationToken ct) =>
        {
            var result = await service.RefreshRoomAsync(roomId, ct);
            return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
        }).WithName("RefreshHomeAssistantClimateRoom");
        group.MapPost("/mappings/{mappingId:guid}/refresh", async Task<Results<Ok<HomeAssistantClimateRefreshSummary>, NotFound>> (Guid mappingId, HomeAssistantClimateRefreshService service, CancellationToken ct) =>
        {
            var result = await service.RefreshMappingAsync(mappingId, ct);
            return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
        }).WithName("RefreshHomeAssistantClimateMapping");
        group.MapGet("/providers/{providerId:guid}/diagnostics", async Task<Results<Ok<HomeAssistantClimateRefreshDiagnosticsDto>, NotFound>> (Guid providerId, HomeAssistantClimateRefreshService service, CancellationToken ct) =>
        {
            var result = await service.GetProviderDiagnosticsAsync(providerId, ct);
            return result is null ? TypedResults.NotFound() : TypedResults.Ok(result);
        }).WithName("GetHomeAssistantClimateProviderDiagnostics");
        return app;
    }
}
