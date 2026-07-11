using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringTaskSeriesDecorativeAvatars : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DecorativeAvatarReferenceId",
                table: "RecurringTaskSeries",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecorativeAvatarReferenceType",
                table: "RecurringTaskSeries",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTaskSeries_DecorativeAvatarReferenceType_Decorativ~",
                table: "RecurringTaskSeries",
                columns: new[] { "DecorativeAvatarReferenceType", "DecorativeAvatarReferenceId" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_RecurringTaskSeries_DecorativeAvatar_NullablePair",
                table: "RecurringTaskSeries",
                sql: "(\"DecorativeAvatarReferenceType\" IS NULL AND \"DecorativeAvatarReferenceId\" IS NULL) OR (\"DecorativeAvatarReferenceType\" IS NOT NULL AND \"DecorativeAvatarReferenceId\" IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RecurringTaskSeries_DecorativeAvatarReferenceType_Decorativ~",
                table: "RecurringTaskSeries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_RecurringTaskSeries_DecorativeAvatar_NullablePair",
                table: "RecurringTaskSeries");

            migrationBuilder.DropColumn(
                name: "DecorativeAvatarReferenceId",
                table: "RecurringTaskSeries");

            migrationBuilder.DropColumn(
                name: "DecorativeAvatarReferenceType",
                table: "RecurringTaskSeries");
        }
    }
}
