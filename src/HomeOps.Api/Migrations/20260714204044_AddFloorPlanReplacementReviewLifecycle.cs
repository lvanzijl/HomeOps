using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFloorPlanReplacementReviewLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FloorPlanReplacementReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    FloorId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentAssetId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReplacementAssetId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SameCoordinateBasisDimensions = table.Column<bool>(type: "boolean", nullable: false),
                    SameAspectRatio = table.Column<bool>(type: "boolean", nullable: false),
                    SameDerivativeBasis = table.Column<bool>(type: "boolean", nullable: false),
                    ReuseCandidatesAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    ActivatedAssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    RollbackAssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ActivatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancelledUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FloorPlanReplacementReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviews_FloorPlanAssets_CurrentAssetId",
                        column: x => x.CurrentAssetId,
                        principalTable: "FloorPlanAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviews_FloorPlanAssets_ReplacementAsse~",
                        column: x => x.ReplacementAssetId,
                        principalTable: "FloorPlanAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviews_Floors_FloorId",
                        column: x => x.FloorId,
                        principalTable: "Floors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviews_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FloorPlanReplacementReviewItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewId = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    FloorId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Disposition = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ReuseCandidateOverlayId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReplacementOverlayId = table.Column<Guid>(type: "uuid", nullable: true),
                    LabelAnchorApproved = table.Column<bool>(type: "boolean", nullable: false),
                    FallbackReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FloorPlanReplacementReviewItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviewItems_FloorPlanReplacementReviews~",
                        column: x => x.ReviewId,
                        principalTable: "FloorPlanReplacementReviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviewItems_Floors_FloorId",
                        column: x => x.FloorId,
                        principalTable: "Floors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviewItems_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviewItems_RoomOverlays_ReplacementOve~",
                        column: x => x.ReplacementOverlayId,
                        principalTable: "RoomOverlays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviewItems_RoomOverlays_ReuseCandidate~",
                        column: x => x.ReuseCandidateOverlayId,
                        principalTable: "RoomOverlays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FloorPlanReplacementReviewItems_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviewItems_FloorId_RoomId",
                table: "FloorPlanReplacementReviewItems",
                columns: new[] { "FloorId", "RoomId" });

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviewItems_HouseholdId",
                table: "FloorPlanReplacementReviewItems",
                column: "HouseholdId");

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviewItems_ReplacementOverlayId",
                table: "FloorPlanReplacementReviewItems",
                column: "ReplacementOverlayId");

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviewItems_ReuseCandidateOverlayId",
                table: "FloorPlanReplacementReviewItems",
                column: "ReuseCandidateOverlayId");

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviewItems_ReviewId_RoomId",
                table: "FloorPlanReplacementReviewItems",
                columns: new[] { "ReviewId", "RoomId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviewItems_RoomId",
                table: "FloorPlanReplacementReviewItems",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviews_CurrentAssetId",
                table: "FloorPlanReplacementReviews",
                column: "CurrentAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviews_FloorId",
                table: "FloorPlanReplacementReviews",
                column: "FloorId",
                unique: true,
                filter: "\"Status\" IN ('Draft','InReview','ReadyToActivate')");

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviews_FloorId_Status",
                table: "FloorPlanReplacementReviews",
                columns: new[] { "FloorId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviews_HouseholdId",
                table: "FloorPlanReplacementReviews",
                column: "HouseholdId");

            migrationBuilder.CreateIndex(
                name: "IX_FloorPlanReplacementReviews_ReplacementAssetId",
                table: "FloorPlanReplacementReviews",
                column: "ReplacementAssetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FloorPlanReplacementReviewItems");

            migrationBuilder.DropTable(
                name: "FloorPlanReplacementReviews");
        }
    }
}
