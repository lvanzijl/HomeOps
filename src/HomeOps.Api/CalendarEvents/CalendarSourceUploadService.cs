using System.Text;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace HomeOps.Api.CalendarEvents;

public sealed class CalendarSourceUploadService(
    HomeOpsDbContext dbContext,
    ICalFileContentStore contentStore,
    CalendarSourceSynchronizationEngine synchronizationEngine,
    TimeProvider? timeProvider = null)
{
    private readonly TimeProvider timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<CalendarSourceUploadResult> CreateAsync(string name, string icon, EventSourcePollInterval pollInterval, bool enabled, IFormFile file, CancellationToken cancellationToken = default)
    {
        var validation = await ValidateUploadAsync(file, cancellationToken);
        if (!validation.Succeeded) return CalendarSourceUploadResult.Invalid(validation.Errors);
        var household = await dbContext.Households.AsNoTracking().SingleAsync(item => item.Id == SeedHousehold.Id, cancellationToken);
        var parsed = Parse(validation.Content!, household.TimeZoneId);
        if (!parsed.Succeeded) return CalendarSourceUploadResult.Invalid(parsed.Errors);
        await using var stream = new MemoryStream(validation.Bytes!, writable: false);
        var saved = await contentStore.SaveAsync(stream, cancellationToken);
        if (!saved.Succeeded) return CalendarSourceUploadResult.Invalid(new Dictionary<string, string[]> { ["file"] = [saved.Error ?? "Het iCal-bestand kon niet worden opgeslagen."] });

        var now = timeProvider.GetUtcNow();
        var source = new EventSource
        {
            Id = Guid.NewGuid(), HouseholdId = household.Id, Name = name.Trim(), Icon = icon.Trim(), SourceType = EventSourceTypes.ICalFile,
            IsEnabled = enabled, IsWritable = false, IsSystem = false, HealthStatus = EventSourceHealthStatus.NeverSynced,
            PollInterval = pollInterval, CreatedUtc = now, UpdatedUtc = now,
        };
        IDbContextTransaction? transaction = null;
        try
        {
            if (dbContext.Database.IsRelational()) transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            dbContext.EventSources.Add(source);
            dbContext.ICalFileSourceConfigurations.Add(new ICalFileSourceConfiguration
            {
                EventSourceId = source.Id, FileReference = saved.FileReference!, OriginalFilename = Path.GetFileName(file.FileName),
                ContentHash = saved.Sha256!, ContentLength = saved.Size, UploadedUtc = saved.UploadedUtc, CreatedUtc = now, UpdatedUtc = now,
            });
            await dbContext.SaveChangesAsync(cancellationToken);
            await synchronizationEngine.ApplyPreparedSnapshotAsync(source.Id, parsed.Snapshot!, household.TimeZoneId, now, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            if (transaction is not null) await transaction.CommitAsync(cancellationToken);
            return CalendarSourceUploadResult.Success(source.Id);
        }
        catch
        {
            if (transaction is not null) await transaction.RollbackAsync(CancellationToken.None);
            await contentStore.DeleteAsync(saved.FileReference!, CancellationToken.None);
            throw;
        }
        finally
        {
            if (transaction is not null) await transaction.DisposeAsync();
        }
    }

    public async Task<CalendarSourceUploadResult> ReplaceAsync(Guid sourceId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var validation = await ValidateUploadAsync(file, cancellationToken);
        if (!validation.Succeeded) return CalendarSourceUploadResult.Invalid(validation.Errors);
        var source = await dbContext.EventSources.AsNoTracking().SingleOrDefaultAsync(item => item.Id == sourceId && item.HouseholdId == SeedHousehold.Id, cancellationToken);
        if (source is null) return CalendarSourceUploadResult.NotFound();
        if (source.SourceType != EventSourceTypes.ICalFile) return CalendarSourceUploadResult.Invalid(new Dictionary<string, string[]> { ["sourceId"] = ["Alleen een iCal-bestandsbron kan een vervangend bestand ontvangen."] });
        var household = await dbContext.Households.AsNoTracking().SingleAsync(item => item.Id == source.HouseholdId, cancellationToken);
        var parsed = Parse(validation.Content!, household.TimeZoneId);
        if (!parsed.Succeeded) return CalendarSourceUploadResult.Invalid(parsed.Errors);
        var existing = await dbContext.ICalFileSourceConfigurations.AsNoTracking().SingleAsync(item => item.EventSourceId == sourceId, cancellationToken);
        await using var stream = new MemoryStream(validation.Bytes!, writable: false);
        var saved = await contentStore.ReplaceAsync(existing.FileReference, stream, cancellationToken);
        if (!saved.Succeeded) return CalendarSourceUploadResult.Invalid(new Dictionary<string, string[]> { ["file"] = [saved.Error ?? "Het vervangende iCal-bestand kon niet worden opgeslagen."] });

        IDbContextTransaction? transaction = null;
        try
        {
            if (dbContext.Database.IsRelational()) transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            var tracked = await dbContext.ICalFileSourceConfigurations.SingleAsync(item => item.EventSourceId == sourceId, cancellationToken);
            var oldReference = tracked.FileReference;
            var now = timeProvider.GetUtcNow();
            tracked.FileReference = saved.FileReference!;
            tracked.OriginalFilename = Path.GetFileName(file.FileName);
            tracked.ContentHash = saved.Sha256!;
            tracked.ContentLength = saved.Size;
            tracked.UploadedUtc = saved.UploadedUtc;
            tracked.UpdatedUtc = now;
            await synchronizationEngine.ApplyPreparedSnapshotAsync(sourceId, parsed.Snapshot!, household.TimeZoneId, now, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            if (transaction is not null) await transaction.CommitAsync(cancellationToken);
            await contentStore.DeleteAsync(oldReference, cancellationToken);
            return CalendarSourceUploadResult.Success(sourceId);
        }
        catch
        {
            if (transaction is not null) await transaction.RollbackAsync(CancellationToken.None);
            await contentStore.DeleteAsync(saved.FileReference!, CancellationToken.None);
            throw;
        }
        finally
        {
            if (transaction is not null) await transaction.DisposeAsync();
        }
    }

    private static async Task<UploadValidation> ValidateUploadAsync(IFormFile file, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (!string.Equals(Path.GetExtension(file.FileName), ".ics", StringComparison.OrdinalIgnoreCase)) errors["file"] = ["Kies een bestand met de extensie .ics."];
        if (Path.GetFileName(file.FileName).Length > 260) errors["file"] = ["De bestandsnaam mag maximaal 260 tekens bevatten."];
        if (file.Length == 0) errors["file"] = ["Het iCal-bestand is leeg."];
        if (file.Length > FileSystemICalFileContentStore.MaximumUploadBytes) errors["file"] = ["Een iCal-bestand mag maximaal 5 MiB groot zijn."];
        if (errors.Count > 0) return UploadValidation.Invalid(errors);
        await using var input = file.OpenReadStream();
        await using var buffer = new MemoryStream();
        await input.CopyToAsync(buffer, cancellationToken);
        if (buffer.Length > FileSystemICalFileContentStore.MaximumUploadBytes) return UploadValidation.Invalid(new Dictionary<string, string[]> { ["file"] = ["Een iCal-bestand mag maximaal 5 MiB groot zijn."] });
        try
        {
            var bytes = buffer.ToArray();
            return UploadValidation.Valid(bytes, new UTF8Encoding(false, true).GetString(bytes));
        }
        catch (DecoderFallbackException)
        {
            return UploadValidation.Invalid(new Dictionary<string, string[]> { ["file"] = ["Het iCal-bestand moet geldige UTF-8-tekst bevatten."] });
        }
    }

    private static ParsedUpload Parse(string content, string householdTimeZoneId)
    {
        var parsed = ICalendarParser.Parse(content, householdTimeZoneId);
        var errors = parsed.Diagnostics.Where(item => item.Severity == ICalendarParseDiagnosticSeverity.Error).Select(item => item.Message).Distinct().ToArray();
        var duplicateProviderIds = parsed.Events
            .GroupBy(item => item.ProviderEventId, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();
        if (errors.Length > 0 || duplicateProviderIds.Length > 0 || parsed.Events.Count == 0)
        {
            var messages = errors.Length > 0
                ? errors
                : duplicateProviderIds.Length > 0
                    ? ["Het bestand bevat dubbele agenda-items met dezelfde UID."]
                    : ["Het bestand bevat geen geldige agenda-items."];
            return ParsedUpload.Invalid(new Dictionary<string, string[]> { ["file"] = messages });
        }
        return ParsedUpload.Valid(CalendarProviderSnapshot.Successful(parsed.Events.Select(NormalizedProviderEvent.FromICalendar).ToList(), parsed.Diagnostics));
    }

    private sealed record UploadValidation(bool Succeeded, byte[]? Bytes, string? Content, Dictionary<string, string[]> Errors)
    {
        public static UploadValidation Valid(byte[] bytes, string content) => new(true, bytes, content, []);
        public static UploadValidation Invalid(Dictionary<string, string[]> errors) => new(false, null, null, errors);
    }
    private sealed record ParsedUpload(bool Succeeded, CalendarProviderSnapshot? Snapshot, Dictionary<string, string[]> Errors)
    {
        public static ParsedUpload Valid(CalendarProviderSnapshot snapshot) => new(true, snapshot, []);
        public static ParsedUpload Invalid(Dictionary<string, string[]> errors) => new(false, null, errors);
    }
}

public sealed record CalendarSourceUploadResult(bool Succeeded, bool Missing, Guid? SourceId, Dictionary<string, string[]> Errors)
{
    public static CalendarSourceUploadResult Success(Guid sourceId) => new(true, false, sourceId, []);
    public static CalendarSourceUploadResult Invalid(Dictionary<string, string[]> errors) => new(false, false, null, errors);
    public static CalendarSourceUploadResult NotFound() => new(false, true, null, []);
}
