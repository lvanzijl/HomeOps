using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.Data;
using HomeOps.Api.Lists;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.Motivation;
using HomeOps.Api.WidgetLayouts;
using HomeOps.Api.Tasks;
using Microsoft.EntityFrameworkCore;
using NSwag.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

CalendarPortabilityService.ConfigurePreRestoreSnapshotDirectory(
    builder.Configuration["CalendarPortability:PreRestoreSnapshotDirectory"]);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApiDocument();
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<HomeOpsDbContext>();
}
else
{
    builder.Services.AddDbContext<HomeOpsDbContext>(options =>
    {
        var connectionString = builder.Configuration.GetConnectionString("HomeOps")
            ?? "Host=localhost;Port=5432;Database=homeops;Username=homeops;Password=homeops_dev_password";

        options.UseNpgsql(connectionString);
    });
}

var app = builder.Build();

if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
    dbContext.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseOpenApi(settings => settings.Path = "/openapi/{documentName}.json");
}

app.MapGet("/health", () => Results.Ok(new { status = "Healthy" }))
    .WithName("Health");

app.MapAgendaLayerSettingsEndpoints();
app.MapListEndpoints();
app.MapWorkspaceLayoutEndpoints();
app.MapEventSeriesEndpoints();
app.MapFamilyMemberEndpoints();
app.MapTaskEndpoints();
app.MapMotivationEndpoints();

app.Run();

public partial class Program;
