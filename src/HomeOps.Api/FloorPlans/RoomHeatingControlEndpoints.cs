namespace HomeOps.Api.FloorPlans;

public static class RoomHeatingControlEndpoints
{
    public static IEndpointRouteBuilder MapRoomHeatingControlEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/rooms/{roomId:guid}/heating-control");
        group.MapGet("/capability", async (Guid roomId, RoomHeatingControlService service, CancellationToken ct) =>
            await service.GetCapability(roomId, ct) is { } dto ? Results.Ok(dto) : Results.NotFound()).WithName("GetRoomHeatingControlCapability").Produces<RoomHeatingControlCapabilityDto>().Produces(404);
        group.MapPost("/temporary-warmer", SubmitWarmer).WithName("SubmitRoomHeatingTemporaryWarmer").Produces<RoomHeatingCommandResponse>().Produces(400).Produces(404).Produces(409);
        group.MapPost("/temporary-cooler", SubmitCooler).WithName("SubmitRoomHeatingTemporaryCooler").Produces<RoomHeatingCommandResponse>().Produces(400).Produces(404).Produces(409);
        group.MapPost("/resume-schedule", SubmitResume).WithName("SubmitRoomHeatingResumeSchedule").Produces<RoomHeatingCommandResponse>().Produces(400).Produces(404).Produces(409);
        group.MapGet("/commands/{commandId:guid}", async (Guid roomId, Guid commandId, RoomHeatingControlService service, CancellationToken ct) =>
            await service.GetCommand(roomId, commandId, ct) is { } dto ? Results.Ok(dto) : Results.NotFound()).WithName("GetRoomHeatingCommand").Produces<RoomHeatingCommandDto>().Produces(404);
        return app;
    }

    private static async Task<IResult> SubmitWarmer(Guid roomId, RoomHeatingTemporaryCommandRequest request, HttpRequest http, RoomHeatingControlService service, CancellationToken ct) => ToResult(await service.Temporary(roomId, RoomHeatingCommandAction.TemporaryWarmer, request, http.Headers["Idempotency-Key"].FirstOrDefault(), ct));
    private static async Task<IResult> SubmitCooler(Guid roomId, RoomHeatingTemporaryCommandRequest request, HttpRequest http, RoomHeatingControlService service, CancellationToken ct) => ToResult(await service.Temporary(roomId, RoomHeatingCommandAction.TemporaryCooler, request, http.Headers["Idempotency-Key"].FirstOrDefault(), ct));
    private static async Task<IResult> SubmitResume(Guid roomId, RoomHeatingResumeScheduleRequest request, HttpRequest http, RoomHeatingControlService service, CancellationToken ct) => ToResult(await service.Resume(roomId, request, http.Headers["Idempotency-Key"].FirstOrDefault(), ct));
    private static IResult ToResult((RoomHeatingCommandResponse? response, int status, string? error) r) => r.status switch { 200 => Results.Ok(r.response), 404 => Results.NotFound(), 409 => Results.Conflict(new { code = r.error, message = "Idempotency key was already used with different request content." }), _ => Results.ValidationProblem(new Dictionary<string, string[]> { [r.error ?? "Validation"] = [r.error ?? "Validation failed."] }) };
}
