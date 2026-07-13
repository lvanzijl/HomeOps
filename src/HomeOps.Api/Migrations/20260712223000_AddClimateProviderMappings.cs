using System;
using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    [DbContext(typeof(HomeOpsDbContext))]
    [Migration("20260712223000_AddClimateProviderMappings")]
    public partial class AddClimateProviderMappings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClimateProviders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    ArchivedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ExternalInstanceReference = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    DiagnosticMetadata = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClimateProviders", x => x.Id);
                    table.ForeignKey("FK_ClimateProviders_Households_HouseholdId", x => x.HouseholdId, "Households", "Id", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomClimateSourceMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceRole = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ExternalSourceId = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    ExternalDisplayName = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    ExternalSourceKind = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    ExternalAreaId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    ExternalAreaName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    ExternalDeviceId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    ExternalDeviceName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    ArchivedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Health = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    LastCheckedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastSuccessfulUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DiagnosticSummary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomClimateSourceMappings", x => x.Id);
                    table.ForeignKey("FK_RoomClimateSourceMappings_ClimateProviders_ProviderId", x => x.ProviderId, "ClimateProviders", "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_RoomClimateSourceMappings_Households_HouseholdId", x => x.HouseholdId, "Households", "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_RoomClimateSourceMappings_Rooms_RoomId", x => x.RoomId, "Rooms", "Id", onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex("IX_ClimateProviders_HouseholdId_DisplayName", "ClimateProviders", new[] { "HouseholdId", "DisplayName" }, unique: true, filter: "\"IsArchived\" = false");
            migrationBuilder.CreateIndex("IX_ClimateProviders_HouseholdId_IsArchived_DisplayName", "ClimateProviders", new[] { "HouseholdId", "IsArchived", "DisplayName" });
            migrationBuilder.CreateIndex("IX_RoomClimateSourceMappings_HouseholdId", "RoomClimateSourceMappings", "HouseholdId");
            migrationBuilder.CreateIndex("IX_RoomClimateSourceMappings_ProviderId_ExternalSourceId", "RoomClimateSourceMappings", new[] { "ProviderId", "ExternalSourceId" });
            migrationBuilder.CreateIndex("IX_RoomClimateSourceMappings_RoomId_SourceRole_IsArchived_Priority", "RoomClimateSourceMappings", new[] { "RoomId", "SourceRole", "IsArchived", "Priority" });
            migrationBuilder.CreateIndex("IX_RoomClimateSourceMappings_RoomId_SourceRole_Priority", "RoomClimateSourceMappings", new[] { "RoomId", "SourceRole", "Priority" }, unique: true, filter: "\"IsArchived\" = false");
            migrationBuilder.CreateIndex("IX_RoomClimateSourceMappings_RoomId_SourceRole_ProviderId_ExternalSourceId", "RoomClimateSourceMappings", new[] { "RoomId", "SourceRole", "ProviderId", "ExternalSourceId" }, unique: true, filter: "\"IsArchived\" = false");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RoomClimateSourceMappings");
            migrationBuilder.DropTable(name: "ClimateProviders");
        }
    }
}
