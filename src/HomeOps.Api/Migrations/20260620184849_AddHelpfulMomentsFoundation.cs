using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHelpfulMomentsFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HelpfulMoments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    FamilyMemberId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RecognitionTag = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HelpfulMoments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HelpfulMoments_FamilyMembers_FamilyMemberId",
                        column: x => x.FamilyMemberId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HelpfulMoments_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HelpfulMoments_FamilyMemberId",
                table: "HelpfulMoments",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_HelpfulMoments_HouseholdId_CreatedUtc",
                table: "HelpfulMoments",
                columns: new[] { "HouseholdId", "CreatedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_HelpfulMoments_HouseholdId_FamilyMemberId_CreatedUtc",
                table: "HelpfulMoments",
                columns: new[] { "HouseholdId", "FamilyMemberId", "CreatedUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HelpfulMoments");
        }
    }
}
