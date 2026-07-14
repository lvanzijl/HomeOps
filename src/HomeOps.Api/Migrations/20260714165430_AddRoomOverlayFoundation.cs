using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomOverlayFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RoomOverlays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    FloorId = table.Column<Guid>(type: "uuid", nullable: false),
                    FloorPlanAssetId = table.Column<Guid>(type: "uuid", nullable: false),
                    State = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PolygonJson = table.Column<string>(type: "jsonb", nullable: false),
                    LabelAnchorX = table.Column<decimal>(type: "numeric(18,12)", precision: 18, scale: 12, nullable: true),
                    LabelAnchorY = table.Column<decimal>(type: "numeric(18,12)", precision: 18, scale: 12, nullable: true),
                    ArchivedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomOverlays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomOverlays_FloorPlanAssets_FloorPlanAssetId",
                        column: x => x.FloorPlanAssetId,
                        principalTable: "FloorPlanAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomOverlays_Floors_FloorId",
                        column: x => x.FloorId,
                        principalTable: "Floors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomOverlays_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomOverlays_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoomOverlays_FloorId_FloorPlanAssetId_State",
                table: "RoomOverlays",
                columns: new[] { "FloorId", "FloorPlanAssetId", "State" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomOverlays_FloorPlanAssetId",
                table: "RoomOverlays",
                column: "FloorPlanAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomOverlays_HouseholdId",
                table: "RoomOverlays",
                column: "HouseholdId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomOverlays_RoomId_FloorPlanAssetId",
                table: "RoomOverlays",
                columns: new[] { "RoomId", "FloorPlanAssetId" },
                unique: true,
                filter: "\"State\" = 'Trusted'");

            migrationBuilder.CreateIndex(
                name: "IX_RoomOverlays_RoomId_FloorPlanAssetId_State",
                table: "RoomOverlays",
                columns: new[] { "RoomId", "FloorPlanAssetId", "State" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoomOverlays");
        }
    }
}
