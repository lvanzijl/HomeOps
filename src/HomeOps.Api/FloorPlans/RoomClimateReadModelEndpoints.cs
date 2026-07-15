using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public static class RoomClimateReadModelEndpoints
{
    public static IEndpointRouteBuilder MapRoomClimateReadModelEndpoints(this IEndpointRouteBuilder app)
    {
        var rooms = app.MapGroup("/api/rooms").WithTags("Room Climate State");
        rooms.MapGet("/{roomId:guid}/climate-state", GetRoom).WithName("GetRoomClimateState").Produces<RoomClimateStateDto>().Produces(404);
        rooms.MapPut("/{roomId:guid}/climate-observations/current", Submit).WithName("SubmitRoomClimateObservation").Produces<SubmitRoomClimateObservationResponse>().ProducesValidationProblem().Produces(404);
        var floors = app.MapGroup("/api/floors").WithTags("Room Climate State");
        floors.MapGet("/{floorId:guid}/climate-state", GetFloor).WithName("GetFloorClimateState").Produces<FloorClimateStateDto>().Produces(404);
        app.MapGet("/api/households/{householdId:guid}/climate-summary", GetHousehold).WithTags("Room Climate State").WithName("GetHouseholdClimateSummary").Produces<HouseholdClimateSummaryDto>().Produces(404);
        return app;
    }

    private static async Task<IResult> GetRoom(Guid roomId, RoomClimateReadModelService service, CancellationToken ct)
        => await service.GetRoom(roomId, ct) is { } state ? Results.Ok(state) : Results.NotFound();

    private static async Task<IResult> GetFloor(Guid floorId, RoomClimateReadModelService service, CancellationToken ct)
        => await service.GetFloor(floorId, ct) is { } state ? Results.Ok(state) : Results.NotFound();

    private static async Task<IResult> GetHousehold(Guid householdId, HomeOpsDbContext db, RoomClimateReadModelService service, CancellationToken ct)
    {
        if (householdId != SeedHousehold.Id || !await db.Households.AnyAsync(h => h.Id == householdId, ct)) return Results.NotFound();
        return Results.Ok(await service.GetHousehold(householdId, ct));
    }

    private static async Task<IResult> Submit(Guid roomId, SubmitRoomClimateObservationRequest request, RoomClimateReadModelService service, CancellationToken ct)
    {
        var result = await service.Submit(roomId, request, ct);
        return result.ok ? Results.Ok(result.response) : Results.ValidationProblem(new Dictionary<string, string[]> { [result.field!] = [result.message!] });
    }
}
