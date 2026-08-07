using HomeOps.Api.FloorPlans;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace HomeOps.Api.Tests.Infrastructure;

public sealed class DatabaseBaselineTests
{
    private const string LatestDiscoverableMigration = "20260807220025_StableDeviceSettingsIdentity";

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
        Assert.Single(await context.EventSources.AsNoTracking().ToListAsync());
        Assert.Equal(4, await context.WorkspaceLayouts.CountAsync());
        Assert.Equal(5, await context.TaskTemplates.CountAsync());

        var modelProperties = context.Model.FindEntityType(typeof(ClimateProvider))!
            .GetProperties()
            .Select(property => property.Name)
            .ToHashSet(StringComparer.Ordinal);
        Assert.All(ResumeStrategyColumns, column => Assert.Contains(column, modelProperties));

        var missingColumns = await database.FindMissingColumnsAsync("ClimateProviders", ResumeStrategyColumns);

        // This is a characterization baseline for HOUSE-04. Phase 5 Slice 5.1 must
        // register the existing resume-strategy migration and change this assertion
        // to Assert.Empty(missingColumns).
        Assert.Equal(ResumeStrategyColumns.Order(StringComparer.Ordinal), missingColumns);
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
            await using var insertLegacyDeviceSetting = new NpgsqlCommand(
                """
                INSERT INTO "AgendaLayerSettings" ("Id", "DeviceKey", "ViewType", "SourceId", "IsEnabled", "CreatedUtc", "UpdatedUtc")
                VALUES (@id, 'legacy-device', 'Week', 'manual-source', FALSE, @created, @updated)
                """,
                legacyConnection);
            insertLegacyDeviceSetting.Parameters.AddWithValue("id", Guid.NewGuid());
            insertLegacyDeviceSetting.Parameters.AddWithValue("created", DateTimeOffset.Parse("2026-01-01T10:00:00Z"));
            insertLegacyDeviceSetting.Parameters.AddWithValue("updated", DateTimeOffset.Parse("2026-02-01T10:00:00Z"));
            await insertLegacyDeviceSetting.ExecuteNonQueryAsync();
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

}
