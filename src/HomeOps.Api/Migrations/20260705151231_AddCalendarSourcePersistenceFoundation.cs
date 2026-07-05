using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarSourcePersistenceFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventSources_HouseholdId_SourceType",
                table: "EventSources");

            migrationBuilder.AddColumn<string>(
                name: "HealthStatus",
                table: "EventSources",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Healthy");

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "EventSources",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "📅");

            migrationBuilder.AddColumn<bool>(
                name: "IsEnabled",
                table: "EventSources",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "LastErrorCode",
                table: "EventSources",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastErrorDetail",
                table: "EventSources",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastErrorMessage",
                table: "EventSources",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastFailedSyncUtc",
                table: "EventSources",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastSuccessfulSyncUtc",
                table: "EventSources",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastSyncAttemptUtc",
                table: "EventSources",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "NextSyncAfterUtc",
                table: "EventSources",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PollInterval",
                table: "EventSources",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Every8Hours");

            migrationBuilder.AddColumn<string>(
                name: "ProviderSourceId",
                table: "EventSources",
                type: "character varying(240)",
                maxLength: 240,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentFingerprint",
                table: "EventSeries",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ImportedAtUtc",
                table: "EventSeries",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastImportedUtc",
                table: "EventSeries",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastSeenSyncAttemptUtc",
                table: "EventSeries",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "EventSeries",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderEventId",
                table: "EventSeries",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderInstanceId",
                table: "EventSeries",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderRevision",
                table: "EventSeries",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EventSourceConfigurations",
                columns: table => new
                {
                    EventSourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSourceConfigurations", x => x.EventSourceId);
                    table.ForeignKey(
                        name: "FK_EventSourceConfigurations_EventSources_EventSourceId",
                        column: x => x.EventSourceId,
                        principalTable: "EventSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ICalFeedSourceConfigurations",
                columns: table => new
                {
                    EventSourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    FeedUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    ETag = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    LastModified = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    LastContentHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ICalFeedSourceConfigurations", x => x.EventSourceId);
                    table.ForeignKey(
                        name: "FK_ICalFeedSourceConfigurations_EventSourceConfigurations_Even~",
                        column: x => x.EventSourceId,
                        principalTable: "EventSourceConfigurations",
                        principalColumn: "EventSourceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ICalFileSourceConfigurations",
                columns: table => new
                {
                    EventSourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileReference = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    OriginalFilename = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    ContentHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UploadedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ICalFileSourceConfigurations", x => x.EventSourceId);
                    table.ForeignKey(
                        name: "FK_ICalFileSourceConfigurations_EventSourceConfigurations_Even~",
                        column: x => x.EventSourceId,
                        principalTable: "EventSourceConfigurations",
                        principalColumn: "EventSourceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("13131313-1313-1313-1313-131313131313"),
                columns: new[] { "ContentFingerprint", "ImportedAtUtc", "LastImportedUtc", "LastSeenSyncAttemptUtc", "Location", "ProviderEventId", "ProviderInstanceId", "ProviderRevision" },
                values: new object[] { null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("14141414-1414-1414-1414-141414141414"),
                columns: new[] { "ContentFingerprint", "ImportedAtUtc", "LastImportedUtc", "LastSeenSyncAttemptUtc", "Location", "ProviderEventId", "ProviderInstanceId", "ProviderRevision" },
                values: new object[] { null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("15151515-1515-1515-1515-151515151515"),
                columns: new[] { "ContentFingerprint", "ImportedAtUtc", "LastImportedUtc", "LastSeenSyncAttemptUtc", "Location", "ProviderEventId", "ProviderInstanceId", "ProviderRevision" },
                values: new object[] { null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("16161616-1616-1616-1616-161616161616"),
                columns: new[] { "ContentFingerprint", "ImportedAtUtc", "LastImportedUtc", "LastSeenSyncAttemptUtc", "Location", "ProviderEventId", "ProviderInstanceId", "ProviderRevision" },
                values: new object[] { null, null, null, null, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "EventSources",
                keyColumn: "Id",
                keyValue: new Guid("12121212-1212-1212-1212-121212121212"),
                columns: new[] { "HealthStatus", "Icon", "IsEnabled", "LastErrorCode", "LastErrorDetail", "LastErrorMessage", "LastFailedSyncUtc", "LastSuccessfulSyncUtc", "LastSyncAttemptUtc", "NextSyncAfterUtc", "PollInterval", "ProviderSourceId", "SourceType" },
                values: new object[] { "Healthy", "📅", true, null, null, null, null, null, null, null, "Every8Hours", null, "Manual" });

            migrationBuilder.CreateIndex(
                name: "IX_EventSources_HouseholdId_IsEnabled_HealthStatus",
                table: "EventSources",
                columns: new[] { "HouseholdId", "IsEnabled", "HealthStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_EventSources_HouseholdId_SourceType",
                table: "EventSources",
                columns: new[] { "HouseholdId", "SourceType" });

            migrationBuilder.CreateIndex(
                name: "IX_EventSources_NextSyncAfterUtc",
                table: "EventSources",
                column: "NextSyncAfterUtc");

            migrationBuilder.CreateIndex(
                name: "IX_EventSeries_EventSourceId_LastSeenSyncAttemptUtc",
                table: "EventSeries",
                columns: new[] { "EventSourceId", "LastSeenSyncAttemptUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_EventSeries_EventSourceId_ProviderEventId",
                table: "EventSeries",
                columns: new[] { "EventSourceId", "ProviderEventId" },
                unique: true,
                filter: "\"ProviderEventId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ICalFeedSourceConfigurations");

            migrationBuilder.DropTable(
                name: "ICalFileSourceConfigurations");

            migrationBuilder.DropTable(
                name: "EventSourceConfigurations");

            migrationBuilder.DropIndex(
                name: "IX_EventSources_HouseholdId_IsEnabled_HealthStatus",
                table: "EventSources");

            migrationBuilder.DropIndex(
                name: "IX_EventSources_HouseholdId_SourceType",
                table: "EventSources");

            migrationBuilder.DropIndex(
                name: "IX_EventSources_NextSyncAfterUtc",
                table: "EventSources");

            migrationBuilder.DropIndex(
                name: "IX_EventSeries_EventSourceId_LastSeenSyncAttemptUtc",
                table: "EventSeries");

            migrationBuilder.DropIndex(
                name: "IX_EventSeries_EventSourceId_ProviderEventId",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "HealthStatus",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "IsEnabled",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "LastErrorCode",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "LastErrorDetail",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "LastErrorMessage",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "LastFailedSyncUtc",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "LastSuccessfulSyncUtc",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "LastSyncAttemptUtc",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "NextSyncAfterUtc",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "PollInterval",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "ProviderSourceId",
                table: "EventSources");

            migrationBuilder.DropColumn(
                name: "ContentFingerprint",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "ImportedAtUtc",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "LastImportedUtc",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "LastSeenSyncAttemptUtc",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "ProviderEventId",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "ProviderInstanceId",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "ProviderRevision",
                table: "EventSeries");

            migrationBuilder.UpdateData(
                table: "EventSources",
                keyColumn: "Id",
                keyValue: new Guid("12121212-1212-1212-1212-121212121212"),
                column: "SourceType",
                value: "manual");

            migrationBuilder.CreateIndex(
                name: "IX_EventSources_HouseholdId_SourceType",
                table: "EventSources",
                columns: new[] { "HouseholdId", "SourceType" },
                unique: true);
        }
    }
}
