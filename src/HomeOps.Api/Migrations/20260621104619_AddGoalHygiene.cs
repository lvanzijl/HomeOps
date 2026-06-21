using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGoalHygiene : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "MotivationFamilyGoals" AS goal
                SET "IsActive" = FALSE
                WHERE goal."IsActive" = TRUE
                  AND EXISTS (
                      SELECT 1
                      FROM "MotivationFamilyGoals" AS newer
                      WHERE newer."HouseholdId" = goal."HouseholdId"
                        AND newer."IsActive" = TRUE
                        AND newer."Id" > goal."Id"
                  );
                """);

            migrationBuilder.Sql("""
                UPDATE "MotivationIndividualGoals" AS goal
                SET "IsActive" = FALSE
                WHERE goal."IsActive" = TRUE
                  AND EXISTS (
                      SELECT 1
                      FROM "MotivationIndividualGoals" AS newer
                      WHERE newer."HouseholdId" = goal."HouseholdId"
                        AND newer."FamilyMemberId" = goal."FamilyMemberId"
                        AND newer."IsActive" = TRUE
                        AND newer."Id" > goal."Id"
                  );
                """);

            migrationBuilder.CreateIndex(
                name: "IX_MotivationIndividualGoals_HouseholdId_FamilyMemberId",
                table: "MotivationIndividualGoals",
                columns: new[] { "HouseholdId", "FamilyMemberId" },
                unique: true,
                filter: "\"IsActive\"");

            migrationBuilder.CreateIndex(
                name: "IX_MotivationFamilyGoals_HouseholdId",
                table: "MotivationFamilyGoals",
                column: "HouseholdId",
                unique: true,
                filter: "\"IsActive\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MotivationIndividualGoals_HouseholdId_FamilyMemberId",
                table: "MotivationIndividualGoals");

            migrationBuilder.DropIndex(
                name: "IX_MotivationFamilyGoals_HouseholdId",
                table: "MotivationFamilyGoals");
        }
    }
}
