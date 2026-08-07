using HomeOps.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.AgendaLayerSettings;

public static class AgendaLayerSettingsEndpoints
{
    public const int CurrentDeviceSchemaVersion = 1;
    private const string WeekView = "Week";
    private const string MonthsView = "Months";

    public static IEndpointRouteBuilder MapAgendaLayerSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var settings = app.MapGroup("/api/agenda/layer-settings").WithTags("Agenda Layer Settings");

        settings.MapGet("/", async (
            [FromHeader(Name = "X-HomeOps-Device-Key")] string? deviceKey,
            [FromHeader(Name = "X-HomeOps-Device-Version")] int? deviceVersion,
            HomeOpsDbContext dbContext,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var normalizedDeviceId = NormalizeDeviceId(deviceKey);
            if (normalizedDeviceId is null || deviceVersion != CurrentDeviceSchemaVersion)
            {
                return InvalidDeviceHeaders();
            }

            await TouchIdentity(dbContext, normalizedDeviceId, deviceVersion.Value, timeProvider.GetUtcNow(), cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            var rows = await dbContext.AgendaLayerSettings
                .AsNoTracking()
                .Where(setting => setting.DeviceId == normalizedDeviceId)
                .OrderBy(setting => setting.ViewType)
                .ThenBy(setting => setting.SourceId)
                .ToListAsync(cancellationToken);

            return Results.Ok(ToDto(rows));
        }).WithName("GetAgendaLayerSettings").Produces<AgendaLayerSettingsDto>().Produces(StatusCodes.Status400BadRequest);

        settings.MapPut("/", async (
            [FromHeader(Name = "X-HomeOps-Device-Key")] string? deviceKey,
            [FromHeader(Name = "X-HomeOps-Device-Version")] int? deviceVersion,
            SaveAgendaLayerSettingsRequest request,
            HomeOpsDbContext dbContext,
            TimeProvider timeProvider,
            CancellationToken cancellationToken) =>
        {
            var normalizedDeviceId = NormalizeDeviceId(deviceKey);
            if (normalizedDeviceId is null || deviceVersion != CurrentDeviceSchemaVersion)
            {
                return InvalidDeviceHeaders();
            }

            var existing = await dbContext.AgendaLayerSettings
                .Where(setting => setting.DeviceId == normalizedDeviceId)
                .ToListAsync(cancellationToken);
            dbContext.AgendaLayerSettings.RemoveRange(existing);

            var now = timeProvider.GetUtcNow();
            await TouchIdentity(dbContext, normalizedDeviceId, deviceVersion.Value, now, cancellationToken);
            dbContext.AgendaLayerSettings.AddRange(ToRows(normalizedDeviceId, WeekView, request.Week, now));
            dbContext.AgendaLayerSettings.AddRange(ToRows(normalizedDeviceId, MonthsView, request.Months, now));
            await dbContext.SaveChangesAsync(cancellationToken);

            var saved = await dbContext.AgendaLayerSettings
                .AsNoTracking()
                .Where(setting => setting.DeviceId == normalizedDeviceId)
                .OrderBy(setting => setting.ViewType)
                .ThenBy(setting => setting.SourceId)
                .ToListAsync(cancellationToken);

            return Results.Ok(ToDto(saved));
        }).WithName("SaveAgendaLayerSettings").Produces<AgendaLayerSettingsDto>().Produces(StatusCodes.Status400BadRequest);

        settings.MapDelete("/device", async (
            [FromHeader(Name = "X-HomeOps-Device-Key")] string? deviceKey,
            [FromHeader(Name = "X-HomeOps-Device-Version")] int? deviceVersion,
            HomeOpsDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var normalizedDeviceId = NormalizeDeviceId(deviceKey);
            if (normalizedDeviceId is null || deviceVersion != CurrentDeviceSchemaVersion)
            {
                return InvalidDeviceHeaders();
            }

            var rows = await dbContext.AgendaLayerSettings
                .Where(setting => setting.DeviceId == normalizedDeviceId)
                .ToListAsync(cancellationToken);
            dbContext.AgendaLayerSettings.RemoveRange(rows);
            var identity = await dbContext.DeviceSettingsIdentities.FindAsync([normalizedDeviceId], cancellationToken);
            if (identity is not null)
            {
                dbContext.DeviceSettingsIdentities.Remove(identity);
            }
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        }).WithName("ResetAgendaLayerSettingsDevice").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status400BadRequest);

        return app;
    }

    private static AgendaLayerSettingsDto ToDto(IEnumerable<AgendaLayerSetting> settings)
    {
        var byView = settings.GroupBy(setting => setting.ViewType).ToDictionary(group => group.Key, group => group.ToDictionary(setting => setting.SourceId, setting => setting.IsEnabled));
        return new AgendaLayerSettingsDto(
            byView.GetValueOrDefault(WeekView) ?? new Dictionary<string, bool>(),
            byView.GetValueOrDefault(MonthsView) ?? new Dictionary<string, bool>());
    }

    private static IEnumerable<AgendaLayerSetting> ToRows(string deviceId, string viewType, IReadOnlyDictionary<string, bool>? values, DateTimeOffset now)
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
                DeviceId = deviceId,
                ViewType = viewType,
                SourceId = sourceId.Trim(),
                IsEnabled = isEnabled,
                CreatedUtc = now,
                UpdatedUtc = now,
            };
        }
    }

    private static string? NormalizeDeviceId(string? deviceKey)
    {
        if (string.IsNullOrWhiteSpace(deviceKey)) return null;
        var normalized = deviceKey.Trim();
        return normalized.Length <= 160 && normalized.All(character => char.IsAsciiLetterOrDigit(character) || character is '-' or '_' or '.' or ':')
            ? normalized
            : null;
    }

    private static IResult InvalidDeviceHeaders() => Results.BadRequest(new
    {
        error = $"X-HomeOps-Device-Key and X-HomeOps-Device-Version: {CurrentDeviceSchemaVersion} are required.",
    });

    private static async Task TouchIdentity(HomeOpsDbContext dbContext, string deviceId, int schemaVersion, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var identity = await dbContext.DeviceSettingsIdentities.FindAsync([deviceId], cancellationToken);
        if (identity is null)
        {
            dbContext.DeviceSettingsIdentities.Add(new DeviceSettingsIdentity
            {
                DeviceId = deviceId,
                SchemaVersion = schemaVersion,
                CreatedUtc = now,
                LastSeenUtc = now,
            });
            return;
        }

        identity.SchemaVersion = schemaVersion;
        identity.LastSeenUtc = now;
    }
}
