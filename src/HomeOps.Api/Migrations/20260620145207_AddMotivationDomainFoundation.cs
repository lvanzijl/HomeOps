using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMotivationDomainFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MotivationFamilyGoals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    TargetCount = table.Column<int>(type: "integer", nullable: false),
                    CurrentProgress = table.Column<int>(type: "integer", nullable: false),
                    UnitLabel = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    RewardLabel = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MotivationFamilyGoals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MotivationFamilyGoals_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MotivationIndividualGoals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    FamilyMemberId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    TargetCount = table.Column<int>(type: "integer", nullable: false),
                    CurrentProgress = table.Column<int>(type: "integer", nullable: false),
                    UnitLabel = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    VisualKind = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MotivationIndividualGoals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MotivationIndividualGoals_FamilyMembers_FamilyMemberId",
                        column: x => x.FamilyMemberId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MotivationIndividualGoals_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "MotivationFamilyGoals",
                columns: new[] { "Id", "CurrentProgress", "HouseholdId", "IsActive", "RewardLabel", "TargetCount", "Title", "UnitLabel" },
                values: new object[] { new Guid("8e7e795f-66cf-4c18-87cf-1d33d1b81f01"), 13, new Guid("11111111-1111-1111-1111-111111111111"), true, "Board game night together", 20, "Fill the family helper path", "helpful actions" });

            migrationBuilder.InsertData(
                table: "MotivationIndividualGoals",
                columns: new[] { "Id", "CurrentProgress", "FamilyMemberId", "HouseholdId", "IsActive", "TargetCount", "Title", "UnitLabel", "VisualKind" },
                values: new object[,]
                {
                    { new Guid("65489d30-8f51-4181-9fae-e61254f8a4dc"), 1, "jordan", new Guid("11111111-1111-1111-1111-111111111111"), true, 3, "Notice one helpful thing", "stars", "stars" },
                    { new Guid("7f9ad1f4-5af7-47c8-bf0a-c8232c1c6403"), 2, "riley", new Guid("11111111-1111-1111-1111-111111111111"), true, 4, "Tidy bedroom corner", "steps", "progress" },
                    { new Guid("d4c0882d-bf9a-4d4e-b925-1146e203f102"), 2, "sam", new Guid("11111111-1111-1111-1111-111111111111"), true, 3, "Help with dinner", "stars", "stars" },
                    { new Guid("e62d5716-a82a-4412-aacf-df78febbe301"), 3, "alex", new Guid("11111111-1111-1111-1111-111111111111"), true, 5, "Finish morning routine", "checkmarks", "checkmarks" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_MotivationFamilyGoals_HouseholdId_IsActive",
                table: "MotivationFamilyGoals",
                columns: new[] { "HouseholdId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_MotivationIndividualGoals_FamilyMemberId",
                table: "MotivationIndividualGoals",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_MotivationIndividualGoals_HouseholdId_FamilyMemberId_IsActi~",
                table: "MotivationIndividualGoals",
                columns: new[] { "HouseholdId", "FamilyMemberId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_MotivationIndividualGoals_HouseholdId_IsActive",
                table: "MotivationIndividualGoals",
                columns: new[] { "HouseholdId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MotivationFamilyGoals");

            migrationBuilder.DropTable(
                name: "MotivationIndividualGoals");
        }
    }
}
