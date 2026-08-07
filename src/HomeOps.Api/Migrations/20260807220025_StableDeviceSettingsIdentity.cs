using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class StableDeviceSettingsIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DeviceKey",
                table: "AgendaLayerSettings",
                newName: "DeviceId");

            migrationBuilder.RenameIndex(
                name: "IX_AgendaLayerSettings_DeviceKey_ViewType_SourceId",
                table: "AgendaLayerSettings",
                newName: "IX_AgendaLayerSettings_DeviceId_ViewType_SourceId");

            migrationBuilder.CreateTable(
                name: "DeviceSettingsIdentities",
                columns: table => new
                {
                    DeviceId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    SchemaVersion = table.Column<int>(type: "integer", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastSeenUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceSettingsIdentities", x => x.DeviceId);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO "DeviceSettingsIdentities" ("DeviceId", "SchemaVersion", "CreatedUtc", "LastSeenUtc")
                SELECT "DeviceId", 1, MIN("CreatedUtc"), MAX("UpdatedUtc")
                FROM "AgendaLayerSettings"
                GROUP BY "DeviceId";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_DeviceSettingsIdentities_LastSeenUtc",
                table: "DeviceSettingsIdentities",
                column: "LastSeenUtc");

            migrationBuilder.AddForeignKey(
                name: "FK_AgendaLayerSettings_DeviceSettingsIdentities_DeviceId",
                table: "AgendaLayerSettings",
                column: "DeviceId",
                principalTable: "DeviceSettingsIdentities",
                principalColumn: "DeviceId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AgendaLayerSettings_DeviceSettingsIdentities_DeviceId",
                table: "AgendaLayerSettings");

            migrationBuilder.DropTable(
                name: "DeviceSettingsIdentities");

            migrationBuilder.RenameColumn(
                name: "DeviceId",
                table: "AgendaLayerSettings",
                newName: "DeviceKey");

            migrationBuilder.RenameIndex(
                name: "IX_AgendaLayerSettings_DeviceId_ViewType_SourceId",
                table: "AgendaLayerSettings",
                newName: "IX_AgendaLayerSettings_DeviceKey_ViewType_SourceId");
        }
    }
}
