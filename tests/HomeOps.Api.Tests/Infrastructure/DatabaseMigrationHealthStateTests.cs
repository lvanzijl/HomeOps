using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Tests.Lists;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Infrastructure;

public sealed class DatabaseMigrationHealthStateTests
{
    [Fact]
    public async Task Health_endpoint_returns_service_unavailable_with_safe_failed_migration_detail()
    {
        using var factory = new HomeOpsWebApplicationFactory();
        factory.Services.GetRequiredService<DatabaseMigrationHealthState>().MarkFailed(1);

        var response = await factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var health = await response.Content.ReadFromJsonAsync<HomeOpsHealthResponse>();
        Assert.Equal("Degraded", health?.Status);
        Assert.Equal(DatabaseMigrationHealthStatuses.Failed, health?.DatabaseMigrations.Status);
        Assert.Equal(1, health?.DatabaseMigrations.PendingMigrationCount);
        Assert.Equal("MigrationApplyFailed", health?.DatabaseMigrations.FailureCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Password", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Host=", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Failed_migration_health_exposes_only_safe_diagnostic_detail()
    {
        var state = new DatabaseMigrationHealthState();

        state.MarkFailed(3);

        var detail = state.GetDetail();
        Assert.Equal(DatabaseMigrationHealthStatuses.Failed, detail.Status);
        Assert.Equal(3, detail.PendingMigrationCount);
        Assert.Equal("MigrationApplyFailed", detail.FailureCode);
        Assert.DoesNotContain("Password", detail.ToString(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Host=", detail.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Healthy_migration_health_clears_pending_and_failure_detail()
    {
        var state = new DatabaseMigrationHealthState();
        state.MarkFailed(2);

        state.MarkHealthy();

        var detail = state.GetDetail();
        Assert.Equal(DatabaseMigrationHealthStatuses.Healthy, detail.Status);
        Assert.Equal(0, detail.PendingMigrationCount);
        Assert.Null(detail.FailureCode);
    }
}
