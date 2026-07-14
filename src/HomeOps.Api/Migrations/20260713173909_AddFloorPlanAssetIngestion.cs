using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFloorPlanAssetIngestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FloorPlanAssets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    FloorId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalFilename = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    DetectedMediaType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ContentHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    SourceContentReference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DerivativeContentReference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SourceWidth = table.Column<int>(type: "integer", nullable: true),
                    SourceHeight = table.Column<int>(type: "integer", nullable: true),
                    CoordinateBasisWidth = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CoordinateBasisHeight = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    AspectRatio = table.Column<decimal>(type: "numeric(12,6)", precision: 12, scale: 6, nullable: false),
                    State = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ReplacementOfAssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    UploadedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ValidationSummary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SourceAvailability = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    DerivativeAvailability = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FloorPlanAssets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FloorPlanAssets_FloorPlanAssets_ReplacementOfAssetId",
                        column: x => x.ReplacementOfAssetId,
                        principalTable: "FloorPlanAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanAssets_Floors_FloorId",
                        column: x => x.FloorId,
                        principalTable: "Floors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanAssets_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanAssets_FloorId_State",
                table: "FloorPlanAssets",
                columns: new[] { "FloorId", "State" },
                unique: true,
                filter: "\"State\" = 'Active'");

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanAssets_HouseholdId_ContentHash",
                table: "FloorPlanAssets",
                columns: new[] { "HouseholdId", "ContentHash" });

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanAssets_ReplacementOfAssetId",
                table: "FloorPlanAssets",
                column: "ReplacementOfAssetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FloorPlanAssets");
        }
    }
}
