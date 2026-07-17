using HomeOps.Api.AgendaLayerSettings;
using HomeOps.Api.AvatarCatalog;
using HomeOps.Api.Data;
using HomeOps.Api.Lists;
using HomeOps.Api.Households;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Api.FamilyMembers;
using HomeOps.Api.FloorPlans;
using HomeOps.Api.KnownPeople;
using HomeOps.Api.Motivation;
using HomeOps.Api.WidgetLayouts;
using HomeOps.Api.Tasks;
using HomeOps.Api.WeeklyReset;
using HomeOps.Api.VisualReviewFixtures;
using HomeOps.Api.Weather;
using HomeOps.Api.Weather.OpenMeteo;
using HomeOps.Api.Weather.Projections;
using Microsoft.EntityFrameworkCore;
using NSwag.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

CalendarPortabilityService.ConfigurePreRestoreSnapshotDirectory(
    builder.Configuration["CalendarPortability:PreRestoreSnapshotDirectory"]);
CalendarPortabilityService.ConfigureFloorPlanAssetStorage(
    builder.Configuration["FloorPlanAssets:StorageRoot"]);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApiDocument();
builder.Services.AddSingleton<VisualReviewMarketingTimeProvider>();
builder.Services.AddSingleton<IAvatarCatalogSource, SharedAvatarCatalogSource>();
builder.Services.AddSingleton<AvatarCatalogService>();

builder.Services.AddHttpClient<OpenMeteoWeatherProvider>();
if (builder.Environment.IsEnvironment("VisualReview"))
{
    builder.Services.AddSingleton<IWeatherSnapshotSource, VisualReviewMarketingWeatherSnapshotSource>();
}
else
{
    builder.Services.AddSingleton<IWeatherSnapshotSource, OpenMeteoWeatherSnapshotSource>();
}
builder.Services.AddSingleton(new WeatherLocationOptions(
    builder.Configuration.GetValue<decimal?>("Weather:Latitude") ?? 52.3676m,
    builder.Configuration.GetValue<decimal?>("Weather:Longitude") ?? 4.9041m));
builder.Services.AddSingleton<WeatherSnapshotCache>();
builder.Services.AddSingleton<DepartureAdviceEngine>();
builder.Services.AddSingleton<WeatherProjectionBuilder>();
builder.Services.AddSingleton<WeatherApplicationService>();
builder.Services.Configure<FloorPlanAssetOptions>(builder.Configuration.GetSection("FloorPlanAssets"));
builder.Services.AddScoped<FloorPlanAssetService>();
builder.Services.AddScoped<ClimateMappingValidationService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<RoomClimateReadModelService>();
builder.Services.AddScoped<RoomHeatingControlService>();
builder.Services.AddScoped<RoomHeatingControlReconciliationService>();
builder.Services.AddOptions<HomeAssistantClimateRefreshOptions>()
    .Bind(builder.Configuration.GetSection("HomeAssistantClimateRefresh"))
    .ValidateDataAnnotations()
    .ValidateOnStart();
builder.Services.AddHttpClient("HomeAssistantClimate", client =>
{
    var seconds = builder.Configuration.GetValue<int?>("HomeAssistantClimateRefresh:ProviderRequestTimeoutSeconds") ?? 10;
    client.Timeout = TimeSpan.FromSeconds(seconds);
});
builder.Services.AddScoped<HomeAssistantClimateProvider>();
builder.Services.AddScoped<IRoomHeatingControlProvider>(sp => sp.GetRequiredService<HomeAssistantClimateProvider>());
builder.Services.AddSingleton<HomeAssistantClimateRefreshCoordinator>();
builder.Services.AddScoped<HomeAssistantClimateRefreshService>();
builder.Services.AddHttpClient<IICalFeedImporter, ICalFeedImporter>();
builder.Services.AddScoped<ICalFileContentStore, FileSystemICalFileContentStore>();
builder.Services.AddScoped<IICalFileImporter, ICalFileImporter>();
builder.Services.AddScoped<CalendarSourceSynchronizationEngine>();
builder.Services.AddScoped<ICalendarSourceRefreshDispatcher, CalendarSourceRefreshDispatcher>();
builder.Services.AddSingleton<CalendarBackgroundSynchronizationRunner>();
if (!builder.Environment.IsEnvironment("Testing") && !builder.Environment.IsEnvironment("VisualReview"))
{
    builder.Services.AddHostedService<CalendarBackgroundSynchronizationHostedService>();
    builder.Services.AddHostedService<RoomHeatingControlReconciliationHostedService>();
    builder.Services.AddHostedService<HomeAssistantClimateRefreshHostedService>();
}
if (builder.Environment.IsEnvironment("VisualReview"))
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("VisualReviewCors", policy => policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowAnyOrigin());
    });
}

if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<HomeOpsDbContext>();
}
else if (builder.Environment.IsEnvironment("VisualReview"))
{
    builder.Services.AddDbContext<HomeOpsDbContext>(options =>
        options.UseInMemoryDatabase("homeops-visual-review"));
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
_ = app.Services.GetRequiredService<AvatarCatalogService>();

if (!app.Environment.IsEnvironment("Testing") && !app.Environment.IsEnvironment("VisualReview"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
    dbContext.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseOpenApi(settings => settings.Path = "/openapi/{documentName}.json");
}

if (app.Environment.IsEnvironment("VisualReview"))
{
    app.UseCors("VisualReviewCors");
}

app.MapGet("/health", () => Results.Ok(new { status = "Healthy" }))
    .WithName("Health");

app.MapAgendaLayerSettingsEndpoints();
app.MapListEndpoints();
app.MapWorkspaceLayoutEndpoints();
app.MapEventSourceManagementEndpoints();
app.MapEventSeriesEndpoints();
app.MapFamilyMemberEndpoints();
app.MapFloorPlanEndpoints();
app.MapFloorPlanAssetEndpoints();
app.MapRoomOverlayEndpoints();
app.MapFloorPlanReplacementReviewEndpoints();
app.MapClimateProviderMappingEndpoints();
app.MapRoomClimateReadModelEndpoints();
app.MapRoomHeatingControlEndpoints();
app.MapHomeAssistantClimateRefreshEndpoints();
app.MapHomeAssistantResumeStrategyEndpoints();
app.MapKnownPersonEndpoints();
app.MapOnboardingEndpoints();
app.MapTaskEndpoints();
app.MapTaskTemplateEndpoints();
app.MapMotivationEndpoints();
app.MapHelpfulMomentEndpoints();
app.MapWeeklyResetEndpoints();
app.MapWeatherEndpoints();
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing") || app.Environment.IsEnvironment("VisualReview"))
{
    app.MapVisualReviewFixtureEndpoints();
}

app.Run();

public partial class Program;
