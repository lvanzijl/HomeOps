using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;

namespace HomeOps.Api.Tests.Infrastructure;

public sealed class PostgresTestDatabase : IAsyncDisposable
{
    public const string DatabaseNamePrefix = "homeops_test_";
    public const string RequirePostgresEnvironmentVariable = "HOMEOPS_REQUIRE_POSTGRES_TESTS";
    public const string TestConnectionEnvironmentVariable = "HOMEOPS_TEST_POSTGRES_CONNECTION";

    private const string DefaultAdminConnection =
        "Host=127.0.0.1;Port=5432;Database=postgres;Username=homeops;Password=homeops_dev_password";

    private readonly string adminConnectionString;
    private bool disposed;

    private PostgresTestDatabase(string adminConnectionString, string databaseName, string connectionString)
    {
        this.adminConnectionString = adminConnectionString;
        DatabaseName = databaseName;
        ConnectionString = connectionString;
    }

    public string DatabaseName { get; }

    public string ConnectionString { get; }

    public static async Task<PostgresTestDatabase?> TryCreateAsync(CancellationToken cancellationToken = default)
    {
        var configuredConnection = Environment.GetEnvironmentVariable(TestConnectionEnvironmentVariable);
        var adminBuilder = new NpgsqlConnectionStringBuilder(
            string.IsNullOrWhiteSpace(configuredConnection) ? DefaultAdminConnection : configuredConnection)
        {
            Database = "postgres",
            Pooling = false,
            Timeout = 3,
            CommandTimeout = 30
        };

        try
        {
            await using var connection = new NpgsqlConnection(adminBuilder.ConnectionString);
            await connection.OpenAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is NpgsqlException or TimeoutException)
        {
            if (IsPostgresRequired())
            {
                throw new InvalidOperationException(
                    $"PostgreSQL migration tests require a reachable server at {adminBuilder.Host}:{adminBuilder.Port}. " +
                    $"Start the repository PostgreSQL service or set {TestConnectionEnvironmentVariable}.",
                    exception);
            }

            return null;
        }

        var databaseName = $"{DatabaseNamePrefix}{Guid.NewGuid():N}";
        await ExecuteAdminCommandAsync(
            adminBuilder.ConnectionString,
            $"CREATE DATABASE {QuoteIdentifier(databaseName)}",
            cancellationToken);

        var databaseBuilder = new NpgsqlConnectionStringBuilder(adminBuilder.ConnectionString)
        {
            Database = databaseName,
            Pooling = false
        };

        return new PostgresTestDatabase(
            adminBuilder.ConnectionString,
            databaseName,
            databaseBuilder.ConnectionString);
    }

    public HomeOpsDbContext CreateContext()
    {
        ObjectDisposedException.ThrowIf(disposed, this);

        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseNpgsql(ConnectionString)
            .EnableDetailedErrors()
            .Options;

        return new HomeOpsDbContext(options);
    }

    public async Task MigrateAsync(string? targetMigration = null, CancellationToken cancellationToken = default)
    {
        await using var context = CreateContext();
        var migrator = context.Database.GetService<IMigrator>();
        await migrator.MigrateAsync(targetMigration, cancellationToken);
    }

    public async Task<IReadOnlyList<string>> FindMissingColumnsAsync(
        string tableName,
        IEnumerable<string> expectedColumns,
        CancellationToken cancellationToken = default)
    {
        var actualColumns = new HashSet<string>(StringComparer.Ordinal);

        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = @table_name
            """,
            connection);
        command.Parameters.AddWithValue("table_name", tableName);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            actualColumns.Add(reader.GetString(0));
        }

        return expectedColumns
            .Where(column => !actualColumns.Contains(column))
            .Order(StringComparer.Ordinal)
            .ToArray();
    }

    public async ValueTask DisposeAsync()
    {
        if (disposed)
        {
            return;
        }

        disposed = true;
        NpgsqlConnection.ClearAllPools();

        if (!DatabaseName.StartsWith(DatabaseNamePrefix, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Refusing to drop database '{DatabaseName}' because it is outside the test prefix.");
        }

        await ExecuteAdminCommandAsync(
            adminConnectionString,
            $"DROP DATABASE IF EXISTS {QuoteIdentifier(DatabaseName)} WITH (FORCE)",
            CancellationToken.None);
    }

    private static bool IsPostgresRequired() =>
        string.Equals(
            Environment.GetEnvironmentVariable(RequirePostgresEnvironmentVariable),
            "true",
            StringComparison.OrdinalIgnoreCase);

    private static async Task ExecuteAdminCommandAsync(
        string connectionString,
        string commandText,
        CancellationToken cancellationToken)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(commandText, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static string QuoteIdentifier(string identifier) =>
        $"\"{identifier.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
}
