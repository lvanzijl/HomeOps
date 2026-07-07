using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarRecurrenceV2PersistenceFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventExceptions_EventSeriesId_OccurrenceDate",
                table: "EventExceptions");

            migrationBuilder.AddColumn<string>(
                name: "RawProviderRecurrenceRule",
                table: "EventSeries",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceCount",
                table: "EventSeries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceEndMode",
                table: "EventSeries",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceFrequency",
                table: "EventSeries",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceInterval",
                table: "EventSeries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceMonthlyDayOfMonth",
                table: "EventSeries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RecurrenceUntilDate",
                table: "EventSeries",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceWeeklyDays",
                table: "EventSeries",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceYearlyDayOfMonth",
                table: "EventSeries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceYearlyMonth",
                table: "EventSeries",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnsupportedRecurrenceReason",
                table: "EventSeries",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnsupportedRecurrenceStatus",
                table: "EventSeries",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DetachedContentFingerprint",
                table: "EventExceptions",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DetachedProviderEventId",
                table: "EventExceptions",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DetachedProviderRevision",
                table: "EventExceptions",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExceptionType",
                table: "EventExceptions",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsAllDay",
                table: "EventExceptions",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "EventExceptions",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NormalizedProviderRecurrenceId",
                table: "EventExceptions",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OccurrenceKey",
                table: "EventExceptions",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RawDetachedRecurrenceMetadata",
                table: "EventExceptions",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawProviderRecurrenceId",
                table: "EventExceptions",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "EventExceptions"
                SET "OccurrenceKey" = to_char("OccurrenceDate", 'YYYY-MM-DD'),
                    "ExceptionType" = CASE WHEN "IsSkipped" THEN 'Skipped' ELSE 'Modified' END;
                """);

            migrationBuilder.Sql("""
                UPDATE "EventSeries"
                SET "RecurrenceFrequency" = "RecurrenceType",
                    "RecurrenceInterval" = 1,
                    "RecurrenceEndMode" = 'Never',
                    "RecurrenceWeeklyDays" = CASE EXTRACT(DOW FROM "StartDate")::int
                        WHEN 0 THEN 'Sunday'
                        WHEN 1 THEN 'Monday'
                        WHEN 2 THEN 'Tuesday'
                        WHEN 3 THEN 'Wednesday'
                        WHEN 4 THEN 'Thursday'
                        WHEN 5 THEN 'Friday'
                        WHEN 6 THEN 'Saturday'
                    END,
                    "RecurrenceMonthlyDayOfMonth" = EXTRACT(DAY FROM "StartDate")::int,
                    "RecurrenceYearlyMonth" = EXTRACT(MONTH FROM "StartDate")::int,
                    "RecurrenceYearlyDayOfMonth" = EXTRACT(DAY FROM "StartDate")::int,
                    "UnsupportedRecurrenceStatus" = 'Supported'
                WHERE "RecurrenceType" IN ('Daily', 'Weekly', 'Monthly', 'Yearly');
                """);

            migrationBuilder.CreateIndex(
                name: "IX_EventExceptions_EventSeriesId_OccurrenceDate",
                table: "EventExceptions",
                columns: new[] { "EventSeriesId", "OccurrenceDate" });

            migrationBuilder.CreateIndex(
                name: "IX_EventExceptions_EventSeriesId_OccurrenceKey",
                table: "EventExceptions",
                columns: new[] { "EventSeriesId", "OccurrenceKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventExceptions_EventSeriesId_OccurrenceDate",
                table: "EventExceptions");

            migrationBuilder.DropIndex(
                name: "IX_EventExceptions_EventSeriesId_OccurrenceKey",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "RawProviderRecurrenceRule",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceCount",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceEndMode",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceFrequency",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceInterval",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceMonthlyDayOfMonth",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceUntilDate",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceWeeklyDays",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceYearlyDayOfMonth",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "RecurrenceYearlyMonth",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "UnsupportedRecurrenceReason",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "UnsupportedRecurrenceStatus",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "DetachedContentFingerprint",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "DetachedProviderEventId",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "DetachedProviderRevision",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "ExceptionType",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "IsAllDay",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "NormalizedProviderRecurrenceId",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "OccurrenceKey",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "RawDetachedRecurrenceMetadata",
                table: "EventExceptions");

            migrationBuilder.DropColumn(
                name: "RawProviderRecurrenceId",
                table: "EventExceptions");

            migrationBuilder.CreateIndex(
                name: "IX_EventExceptions_EventSeriesId_OccurrenceDate",
                table: "EventExceptions",
                columns: new[] { "EventSeriesId", "OccurrenceDate" },
                unique: true);
        }
    }
}
