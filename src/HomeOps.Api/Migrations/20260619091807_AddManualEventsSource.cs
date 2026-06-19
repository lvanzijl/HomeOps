using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddManualEventsSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventSources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    SourceType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    IsWritable = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSources_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ManualEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventSourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    StartUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsAllDay = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
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

            migrationBuilder.InsertData(
                table: "EventSources",
                columns: new[] { "Id", "CreatedUtc", "HouseholdId", "IsWritable", "Name", "SourceType", "UpdatedUtc" },
                values: new object[] { new Guid("12121212-1212-1212-1212-121212121212"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("11111111-1111-1111-1111-111111111111"), true, "HomeOps Manual Events", "manual", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.InsertData(
                table: "ManualEvents",
                columns: new[] { "Id", "CreatedUtc", "Description", "EndUtc", "EventSourceId", "IsAllDay", "StartUtc", "Title", "UpdatedUtc" },
                values: new object[,]
                {
                    { new Guid("13131313-1313-1313-1313-131313131313"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Routine check-up", new DateTimeOffset(new DateTime(2026, 6, 18, 10, 15, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("12121212-1212-1212-1212-121212121212"), false, new DateTimeOffset(new DateTime(2026, 6, 18, 9, 30, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Dentist Appointment", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("14141414-1414-1414-1414-141414141414"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "School hall", new DateTimeOffset(new DateTime(2026, 6, 19, 20, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("12121212-1212-1212-1212-121212121212"), false, new DateTimeOffset(new DateTime(2026, 6, 19, 18, 30, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Parent Evening", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("15151515-1515-1515-1515-151515151515"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Family trip", new DateTimeOffset(new DateTime(2026, 7, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("12121212-1212-1212-1212-121212121212"), true, new DateTimeOffset(new DateTime(2026, 7, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Vacation", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("16161616-1616-1616-1616-161616161616"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new DateTimeOffset(new DateTime(2026, 6, 21, 20, 10, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("12121212-1212-1212-1212-121212121212"), false, new DateTimeOffset(new DateTime(2026, 6, 21, 20, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Put Bins Outside", new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventSources_HouseholdId_SourceType",
                table: "EventSources",
                columns: new[] { "HouseholdId", "SourceType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ManualEvents_EventSourceId_StartUtc",
                table: "ManualEvents",
                columns: new[] { "EventSourceId", "StartUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ManualEvents");

            migrationBuilder.DropTable(
                name: "EventSources");
        }
    }
}
