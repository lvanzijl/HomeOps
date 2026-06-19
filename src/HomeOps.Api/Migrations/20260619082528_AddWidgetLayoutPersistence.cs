using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWidgetLayoutPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkspaceLayouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceKey = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkspaceLayouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkspaceLayouts_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WidgetPlacements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceLayoutId = table.Column<Guid>(type: "uuid", nullable: false),
                    WidgetType = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Size = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ConfigurationJson = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WidgetPlacements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WidgetPlacements_WorkspaceLayouts_WorkspaceLayoutId",
                        column: x => x.WorkspaceLayoutId,
                        principalTable: "WorkspaceLayouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "WorkspaceLayouts",
                columns: new[] { "Id", "CreatedUtc", "HouseholdId", "UpdatedUtc", "WorkspaceKey" },
                values: new object[,]
                {
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("11111111-1111-1111-1111-111111111111"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "home" },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("11111111-1111-1111-1111-111111111111"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "house" },
                    { new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("11111111-1111-1111-1111-111111111111"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "media" },
                    { new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("11111111-1111-1111-1111-111111111111"), new DateTimeOffset(new DateTime(2026, 6, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "settings" }
                });

            migrationBuilder.InsertData(
                table: "WidgetPlacements",
                columns: new[] { "Id", "ConfigurationJson", "Position", "Size", "WidgetType", "WorkspaceLayoutId" },
                values: new object[,]
                {
                    { new Guid("a1111111-1111-1111-1111-111111111111"), "{}", 0, "large", "agenda-mvp", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") },
                    { new Guid("a2222222-2222-2222-2222-222222222222"), "{}", 1, "medium", "shopping-list-mvp", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") },
                    { new Guid("a3333333-3333-3333-3333-333333333333"), "{}", 2, "medium", "welcome-text", new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa") },
                    { new Guid("b1111111-1111-1111-1111-111111111111"), "{}", 0, "medium", "house-placeholder", new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb") },
                    { new Guid("c1111111-1111-1111-1111-111111111111"), "{}", 0, "medium", "media-placeholder", new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc") },
                    { new Guid("d1111111-1111-1111-1111-111111111111"), "{}", 0, "medium", "settings-placeholder", new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_WidgetPlacements_WorkspaceLayoutId_Position",
                table: "WidgetPlacements",
                columns: new[] { "WorkspaceLayoutId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceLayouts_HouseholdId_WorkspaceKey",
                table: "WorkspaceLayouts",
                columns: new[] { "HouseholdId", "WorkspaceKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WidgetPlacements");

            migrationBuilder.DropTable(
                name: "WorkspaceLayouts");
        }
    }
}
