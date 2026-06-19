using HomeOps.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.AgendaLayerSettings;

public static class AgendaLayerSettingsEndpoints
{
    private const string WeekView = "Week";
    private const string MonthsView = "Months";

    public static IEndpointRouteBuilder MapAgendaLayerSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var settings = app.MapGroup("/api/agenda/layer-settings").WithTags("Agenda Layer Settings");

        settings.MapGet("/", async ([FromHeader(Name = "X-HomeOps-Device-Key")] string? deviceKey, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var normalizedDeviceKey = NormalizeDeviceKey(deviceKey);
            if (normalizedDeviceKey is null)
            {
                return Results.BadRequest(new { error = "Device key is required." });
            }

            var rows = await dbContext.AgendaLayerSettings
                .AsNoTracking()
                .Where(setting => setting.DeviceKey == normalizedDeviceKey)
                .OrderBy(setting => setting.ViewType)
                .ThenBy(setting => setting.SourceId)
                .ToListAsync(cancellationToken);

            return Results.Ok(ToDto(rows));
        }).WithName("GetAgendaLayerSettings").Produces<AgendaLayerSettingsDto>().Produces(StatusCodes.Status400BadRequest);

        settings.MapPut("/", async ([FromHeader(Name = "X-HomeOps-Device-Key")] string? deviceKey, SaveAgendaLayerSettingsRequest request, HomeOpsDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var normalizedDeviceKey = NormalizeDeviceKey(deviceKey);
            if (normalizedDeviceKey is null)
            {
                return Results.BadRequest(new { error = "Device key is required." });
            }

            var existing = await dbContext.AgendaLayerSettings
                .Where(setting => setting.DeviceKey == normalizedDeviceKey)
                .ToListAsync(cancellationToken);
            dbContext.AgendaLayerSettings.RemoveRange(existing);

            var now = DateTimeOffset.UtcNow;
            dbContext.AgendaLayerSettings.AddRange(ToRows(normalizedDeviceKey, WeekView, request.Week, now));
            dbContext.AgendaLayerSettings.AddRange(ToRows(normalizedDeviceKey, MonthsView, request.Months, now));
            await dbContext.SaveChangesAsync(cancellationToken);

            var saved = await dbContext.AgendaLayerSettings
                .AsNoTracking()
                .Where(setting => setting.DeviceKey == normalizedDeviceKey)
                .OrderBy(setting => setting.ViewType)
                .ThenBy(setting => setting.SourceId)
                .ToListAsync(cancellationToken);

            return Results.Ok(ToDto(saved));
        }).WithName("SaveAgendaLayerSettings").Produces<AgendaLayerSettingsDto>().Produces(StatusCodes.Status400BadRequest);

        return app;
    }

    private static AgendaLayerSettingsDto ToDto(IEnumerable<AgendaLayerSetting> settings)
    {
        var byView = settings.GroupBy(setting => setting.ViewType).ToDictionary(group => group.Key, group => group.ToDictionary(setting => setting.SourceId, setting => setting.IsEnabled));
        return new AgendaLayerSettingsDto(
            byView.GetValueOrDefault(WeekView) ?? new Dictionary<string, bool>(),
            byView.GetValueOrDefault(MonthsView) ?? new Dictionary<string, bool>());
    }

    private static IEnumerable<AgendaLayerSetting> ToRows(string deviceKey, string viewType, IReadOnlyDictionary<string, bool>? values, DateTimeOffset now)
    {
        foreach (var (sourceId, isEnabled) in values ?? new Dictionary<string, bool>())
        {
            if (string.IsNullOrWhiteSpace(sourceId))
            {
                continue;
            }

            yield return new AgendaLayerSetting
            {
                Id = Guid.NewGuid(),
                DeviceKey = deviceKey,
                ViewType = viewType,
                SourceId = sourceId.Trim(),
                IsEnabled = isEnabled,
                CreatedUtc = now,
                UpdatedUtc = now,
            };
        }
    }

    private static string? NormalizeDeviceKey(string? deviceKey)
    {
        return string.IsNullOrWhiteSpace(deviceKey) ? null : deviceKey.Trim();
    }
}
