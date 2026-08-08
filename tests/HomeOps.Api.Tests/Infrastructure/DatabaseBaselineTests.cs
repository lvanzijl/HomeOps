using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.Households;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Npgsql;

namespace HomeOps.Api.Tests.Infrastructure;

public sealed class DatabaseBaselineTests
{
    private const string LatestDiscoverableMigration = "20260808090440_PersistWeeklyResetAggregate";

    private static readonly string[] ResumeStrategyColumns =
    [
        "HomeAssistantResumeClimateEntityReference",
        "HomeAssistantResumePresetValue",
        "HomeAssistantResumeScriptEntityReference",
        "HomeAssistantResumeStrategyType",
        "HomeAssistantResumeStrategyUpdatedUtc"
    ];

    [Fact]
    public async Task Clean_database_applies_every_discoverable_migration_and_records_known_schema_drift()
    {
        await using var database = await PostgresTestDatabase.TryCreateAsync();
        if (database is null)
        {
            return;
        }

        Assert.StartsWith(PostgresTestDatabase.DatabaseNamePrefix, database.DatabaseName, StringComparison.Ordinal);
        Assert.NotEqual("homeops", database.DatabaseName);

        await database.MigrateAsync();

        await using var context = database.CreateContext();
        var discoverableMigrations = context.Database.GetMigrations().ToArray();
        var appliedMigrations = (await context.Database.GetAppliedMigrationsAsync()).ToArray();

        Assert.NotEmpty(discoverableMigrations);
        Assert.Equal(discoverableMigrations, appliedMigrations);
        Assert.Equal(LatestDiscoverableMigration, appliedMigrations[^1]);

        var household = await context.Households.AsNoTracking().SingleAsync();
        Assert.False(household.OnboardingCompleted);
        Assert.Null(household.SetupChecklistDismissedUtc);
        Assert.False(household.LegacyDemoDataReviewRequired);
        Assert.Empty(await context.FamilyMembers.AsNoTracking().ToListAsync());
        Assert.Empty(await context.Lists.AsNoTracking().ToListAsync());
        Assert.Empty(await context.EventSeries.AsNoTracking().ToListAsync());
        Assert.Empty(await context.MotivationFamilyGoals.AsNoTracking().ToListAsync());
        Assert.Empty(await context.WeeklyResetSessions.AsNoTracking().ToListAsync());
        Assert.Empty(await context.WeeklyResetCandidates.AsNoTracking().ToListAsync());
        Assert.Single(await context.EventSources.AsNoTracking().ToListAsync());
        Assert.Equal(4, await context.WorkspaceLayouts.CountAsync());
        Assert.Equal(5, await context.TaskTemplates.CountAsync());

        var modelProperties = context.Model.FindEntityType(typeof(ClimateProvider))!
            .GetProperties()
            .Select(property => property.Name)
            .ToHashSet(StringComparer.Ordinal);
        Assert.All(ResumeStrategyColumns, column => Assert.Contains(column, modelProperties));

        var missingColumns = await database.FindMissingColumnsAsync("ClimateProviders", ResumeStrategyColumns);

        Assert.Empty(missingColumns);
    }

    [Fact]
    public async Task Resume_strategy_migration_upgrades_active_provider_and_provider_endpoint_loads()
    {
        await using var database = await PostgresTestDatabase.TryCreateAsync();
        if (database is null)
        {
            return;
        }

        const string targetMigration = "20260717124500_AddHomeAssistantResumeStrategyConfiguration";
        string previousMigration;
        await using (var context = database.CreateContext())
        {
            var migrations = context.Database.GetMigrations().ToArray();
            var targetIndex = Array.IndexOf(migrations, targetMigration);
            Assert.True(targetIndex > 0);
            previousMigration = migrations[targetIndex - 1];
            Assert.Equal("20260715205518_AddRoomHeatingCommands", previousMigration);
        }

        await database.MigrateAsync(previousMigration);
        Assert.Equal(
            ResumeStrategyColumns.Order(StringComparer.Ordinal),
            await database.FindMissingColumnsAsync("ClimateProviders", ResumeStrategyColumns));

        var providerId = Guid.NewGuid();
        var updatedUtc = DateTimeOffset.Parse("2026-07-17T10:30:00Z");
        await using (var connection = new NpgsqlConnection(database.ConnectionString))
        {
            await connection.OpenAsync();
            await using var insertProvider = new NpgsqlCommand(
                """
                INSERT INTO "ClimateProviders"
                    ("Id", "HouseholdId", "ProviderType", "DisplayName", "IsEnabled", "IsArchived",
                     "ArchivedUtc", "ExternalInstanceReference", "DiagnosticMetadata", "CreatedUtc", "UpdatedUtc")
                VALUES
                    (@id, @household, 'HomeAssistant', 'Active Home Assistant', TRUE, FALSE,
                     NULL, 'home-assistant', 'ha-resume:script:turn_on:script.resume_heating', @updated, @updated)
                """,
                connection);
            insertProvider.Parameters.AddWithValue("id", providerId);
            insertProvider.Parameters.AddWithValue("household", SeedHousehold.Id);
            insertProvider.Parameters.AddWithValue("updated", updatedUtc);
            Assert.Equal(1, await insertProvider.ExecuteNonQueryAsync());
        }

        await database.MigrateAsync(targetMigration);

        Assert.Empty(await database.FindMissingColumnsAsync("ClimateProviders", ResumeStrategyColumns));
        await using (var upgradedConnection = new NpgsqlConnection(database.ConnectionString))
        {
            await upgradedConnection.OpenAsync();
            Assert.Equal(
                "Script",
                await ScalarAsync<string>(
                    upgradedConnection,
                    """SELECT "HomeAssistantResumeStrategyType" FROM "ClimateProviders" WHERE "Id" = @id""",
                    new NpgsqlParameter("id", providerId)));
            Assert.Equal(
                "script.resume_heating",
                await ScalarAsync<string>(
                    upgradedConnection,
                    """SELECT "HomeAssistantResumeScriptEntityReference" FROM "ClimateProviders" WHERE "Id" = @id""",
                    new NpgsqlParameter("id", providerId)));
            Assert.Equal(
                updatedUtc.UtcDateTime,
                await ScalarAsync<DateTime>(
                    upgradedConnection,
                    """SELECT "HomeAssistantResumeStrategyUpdatedUtc" FROM "ClimateProviders" WHERE "Id" = @id""",
                    new NpgsqlParameter("id", providerId)));
        }

        await database.MigrateAsync();
        await using var factory = new PostgreSqlApiFactory(database.ConnectionString);
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/climate-providers/");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var providers = await response.Content.ReadFromJsonAsync<IReadOnlyCollection<ClimateProviderDto>>();
        Assert.Contains(providers!, provider => provider.Id == providerId && provider.DisplayName == "Active Home Assistant");
    }

    [Fact]
    public async Task Database_one_migration_behind_upgrades_without_losing_household_or_user_rows()
    {
        await using var database = await PostgresTestDatabase.TryCreateAsync();
        if (database is null)
        {
            return;
        }

        string previousMigration;
        await using (var context = database.CreateContext())
        {
            var migrations = context.Database.GetMigrations().ToArray();
            Assert.True(migrations.Length >= 2);
            Assert.Equal(LatestDiscoverableMigration, migrations[^1]);
            previousMigration = migrations[^2];
        }

        await database.MigrateAsync(previousMigration);

        var userFloorId = Guid.NewGuid();
        await InsertRepresentativeUserDataAsync(database.ConnectionString, userFloorId);
        await using (var legacyConnection = new NpgsqlConnection(database.ConnectionString))
        {
            await legacyConnection.OpenAsync();
            await using var insertDeviceSetting = new NpgsqlCommand(
                """
                INSERT INTO "DeviceSettingsIdentities" ("DeviceId", "SchemaVersion", "CreatedUtc", "LastSeenUtc")
                VALUES ('legacy-device', 1, @created, @updated);
                INSERT INTO "AgendaLayerSettings" ("Id", "DeviceId", "ViewType", "SourceId", "IsEnabled", "CreatedUtc", "UpdatedUtc")
                VALUES (@id, 'legacy-device', 'Week', 'manual-source', FALSE, @created, @updated);
                """,
                legacyConnection);
            insertDeviceSetting.Parameters.AddWithValue("id", Guid.NewGuid());
            insertDeviceSetting.Parameters.AddWithValue("created", DateTimeOffset.Parse("2026-01-01T10:00:00Z"));
            insertDeviceSetting.Parameters.AddWithValue("updated", DateTimeOffset.Parse("2026-02-01T10:00:00Z"));
            await insertDeviceSetting.ExecuteNonQueryAsync();
        }

        await database.MigrateAsync();

        await using var upgradedContext = database.CreateContext();
        var appliedMigrations = (await upgradedContext.Database.GetAppliedMigrationsAsync()).ToArray();
        Assert.Equal(LatestDiscoverableMigration, appliedMigrations[^1]);

        await using var connection = new NpgsqlConnection(database.ConnectionString);
        await connection.OpenAsync();

        Assert.Equal(
            "Upgrade fixture household",
            await ScalarAsync<string>(
                connection,
                """SELECT "Name" FROM "Households" WHERE "Id" = '11111111-1111-1111-1111-111111111111'"""));
        Assert.Equal(
            "User-created floor",
            await ScalarAsync<string>(
                connection,
                """SELECT "Name" FROM "Floors" WHERE "Id" = @id""",
                new NpgsqlParameter("id", userFloorId)));
        Assert.True(
            await ScalarAsync<bool>(
                connection,
                """SELECT "OnboardingCompleted" FROM "Households" WHERE "Id" = '11111111-1111-1111-1111-111111111111'"""));
        Assert.True(
            await ScalarAsync<bool>(
                connection,
                """SELECT "LegacyDemoDataReviewRequired" FROM "Households" WHERE "Id" = '11111111-1111-1111-1111-111111111111'"""));
        Assert.True(
            await ScalarAsync<bool>(
                connection,
                """SELECT "SetupChecklistDismissedUtc" IS NOT NULL FROM "Households" WHERE "Id" = '11111111-1111-1111-1111-111111111111'"""));
        Assert.True(
            await ScalarAsync<bool>(
                connection,
                """SELECT to_regclass('public."RoomHeatingCommands"') IS NOT NULL"""));
        Assert.Equal(
            1,
            await ScalarAsync<int>(
                connection,
                """SELECT "SchemaVersion" FROM "DeviceSettingsIdentities" WHERE "DeviceId" = 'legacy-device'"""));
        Assert.False(
            await ScalarAsync<bool>(
                connection,
                """SELECT "IsEnabled" FROM "AgendaLayerSettings" WHERE "DeviceId" = 'legacy-device' AND "SourceId" = 'manual-source'"""));
    }

    [Fact]
    public async Task Database_upgrade_preserves_a_legacy_member_when_only_the_avatar_payload_changed()
    {
        await using var database = await PostgresTestDatabase.TryCreateAsync();
        if (database is null)
        {
            return;
        }

        string previousMigration;
        await using (var context = database.CreateContext())
        {
            var migrations = context.Database.GetMigrations().ToArray();
            var separationIndex = Array.IndexOf(migrations, "20260727121951_SeparateProductionBootstrapFromDemoData");
            Assert.True(separationIndex > 0);
            Assert.Equal(LatestDiscoverableMigration, migrations[^1]);
            previousMigration = migrations[separationIndex - 1];
        }

        await database.MigrateAsync(previousMigration);

        await using (var connection = new NpgsqlConnection(database.ConnectionString))
        {
            await connection.OpenAsync();
            await using var updateAvatar = new NpgsqlCommand(
                """
                UPDATE "FamilyMembers"
                SET "AvatarSelection" = jsonb_set(
                    "AvatarSelection",
                    '{Selections,headVariant}',
                    '"head.variant.oval"'::jsonb)
                WHERE "Id" = 'alex'
                """,
                connection);
            Assert.Equal(1, await updateAvatar.ExecuteNonQueryAsync());
        }

        await database.MigrateAsync();

        await using var upgradedConnection = new NpgsqlConnection(database.ConnectionString);
        await upgradedConnection.OpenAsync();
        Assert.Equal(
            4L,
            await ScalarAsync<long>(
                upgradedConnection,
                """SELECT COUNT(*) FROM "FamilyMembers" WHERE "HouseholdId" = '11111111-1111-1111-1111-111111111111'"""));
        Assert.Equal(
            "head.variant.oval",
            await ScalarAsync<string>(
                upgradedConnection,
                """SELECT "AvatarSelection" -> 'Selections' ->> 'headVariant' FROM "FamilyMembers" WHERE "Id" = 'alex'"""));
        Assert.True(
            await ScalarAsync<bool>(
                upgradedConnection,
                """SELECT "LegacyDemoDataReviewRequired" FROM "Households" WHERE "Id" = '11111111-1111-1111-1111-111111111111'"""));
    }

    private static async Task InsertRepresentativeUserDataAsync(string connectionString, Guid floorId)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        await using (var updateHousehold = new NpgsqlCommand(
            """
            UPDATE "Households"
            SET "Name" = 'Upgrade fixture household',
                "OnboardingCompleted" = TRUE,
                "LegacyDemoDataReviewRequired" = TRUE,
                "SetupChecklistDismissedUtc" = @now
            WHERE "Id" = '11111111-1111-1111-1111-111111111111'
            """,
            connection,
            transaction))
        {
            updateHousehold.Parameters.AddWithValue("now", DateTimeOffset.UtcNow);
            Assert.Equal(1, await updateHousehold.ExecuteNonQueryAsync());
        }

        await using (var insertFloor = new NpgsqlCommand(
            """
            INSERT INTO "Floors"
                ("Id", "HouseholdId", "Name", "SortOrder", "IsEnabled", "IsArchived", "ArchivedUtc", "CreatedUtc", "UpdatedUtc")
            VALUES
                (@id, '11111111-1111-1111-1111-111111111111', 'User-created floor', 500, TRUE, FALSE, NULL, @now, @now)
            """,
            connection,
            transaction))
        {
            insertFloor.Parameters.AddWithValue("id", floorId);
            insertFloor.Parameters.AddWithValue("now", DateTimeOffset.UtcNow);
            Assert.Equal(1, await insertFloor.ExecuteNonQueryAsync());
        }

        await transaction.CommitAsync();
    }

    private static async Task<T> ScalarAsync<T>(
        NpgsqlConnection connection,
        string commandText,
        params NpgsqlParameter[] parameters)
    {
        await using var command = new NpgsqlCommand(commandText, connection);
        command.Parameters.AddRange(parameters);
        var result = await command.ExecuteScalarAsync();
        return Assert.IsType<T>(result);
    }

    private sealed class PostgreSqlApiFactory(string connectionString) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<HomeOpsDbContext>>();
                services.AddDbContext<HomeOpsDbContext>(options => options.UseNpgsql(connectionString));
            });
        }
    }

}
