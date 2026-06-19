using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventSeriesContract : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventSeries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventSourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsAllDay = table.Column<bool>(type: "boolean", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    TimeZoneId = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSeries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSeries_EventSources_EventSourceId",
                        column: x => x.EventSourceId,
                        principalTable: "EventSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                INSERT INTO "EventSeries" ("Id", "EventSourceId", "Title", "Description", "IsAllDay", "StartDate", "StartTime", "EndDate", "EndTime", "TimeZoneId", "CreatedUtc", "UpdatedUtc")
                SELECT
                    "Id",
                    "EventSourceId",
                    "Title",
                    "Description",
                    "IsAllDay",
                    ("StartUtc" AT TIME ZONE 'UTC')::date AS "StartDate",
                    CASE WHEN "IsAllDay" THEN NULL ELSE ("StartUtc" AT TIME ZONE 'UTC')::time END AS "StartTime",
                    (COALESCE("EndUtc", "StartUtc") AT TIME ZONE 'UTC')::date AS "EndDate",
                    CASE WHEN "IsAllDay" THEN NULL ELSE (COALESCE("EndUtc", "StartUtc") AT TIME ZONE 'UTC')::time END AS "EndTime",
                    'Europe/Amsterdam' AS "TimeZoneId",
                    "CreatedUtc",
                    "UpdatedUtc"
                FROM "ManualEvents";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_EventSeries_EventSourceId_StartDate",
                table: "EventSeries",
                columns: new[] { "EventSourceId", "StartDate" });

            migrationBuilder.DropTable(
                name: "ManualEvents");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ManualEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventSourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EndUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsAllDay = table.Column<bool>(type: "boolean", nullable: false),
                    StartUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManualEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ManualEvents_EventSources_EventSourceId",
                        column: x => x.EventSourceId,
                        principalTable: "EventSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                INSERT INTO "ManualEvents" ("Id", "EventSourceId", "Title", "Description", "StartUtc", "EndUtc", "IsAllDay", "CreatedUtc", "UpdatedUtc")
                SELECT
                    "Id",
                    "EventSourceId",
                    "Title",
                    "Description",
                    ("StartDate"::timestamp + COALESCE("StartTime", time '00:00')) AT TIME ZONE 'UTC' AS "StartUtc",
                    ("EndDate"::timestamp + COALESCE("EndTime", time '00:00')) AT TIME ZONE 'UTC' AS "EndUtc",
                    "IsAllDay",
                    "CreatedUtc",
                    "UpdatedUtc"
                FROM "EventSeries";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ManualEvents_EventSourceId_StartUtc",
                table: "ManualEvents",
                columns: new[] { "EventSourceId", "StartUtc" });

            migrationBuilder.DropTable(
                name: "EventSeries");
        }

    }
}
