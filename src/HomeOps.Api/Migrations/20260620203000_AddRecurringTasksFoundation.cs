using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringTasksFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecurrenceFrequency",
                table: "HouseholdTasks",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "RecurringTaskSeriesId",
                table: "HouseholdTasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RecurringTaskSeries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Frequency = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    OwnershipKind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    FamilyMemberId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringTaskSeries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurringTaskSeries_FamilyMembers_FamilyMemberId",
                        column: x => x.FamilyMemberId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringTaskSeries_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdTasks_RecurringTaskSeriesId_DueDate",
                table: "HouseholdTasks",
                columns: new[] { "RecurringTaskSeriesId", "DueDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTaskSeries_FamilyMemberId",
                table: "RecurringTaskSeries",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTaskSeries_HouseholdId_IsDeleted_StartDate",
                table: "RecurringTaskSeries",
                columns: new[] { "HouseholdId", "IsDeleted", "StartDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_HouseholdTasks_RecurringTaskSeries_RecurringTaskSeriesId",
                table: "HouseholdTasks",
                column: "RecurringTaskSeriesId",
                principalTable: "RecurringTaskSeries",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HouseholdTasks_RecurringTaskSeries_RecurringTaskSeriesId",
                table: "HouseholdTasks");

            migrationBuilder.DropTable(
                name: "RecurringTaskSeries");

            migrationBuilder.DropIndex(
                name: "IX_HouseholdTasks_RecurringTaskSeriesId_DueDate",
                table: "HouseholdTasks");

            migrationBuilder.DropColumn(
                name: "RecurrenceFrequency",
                table: "HouseholdTasks");

            migrationBuilder.DropColumn(
                name: "RecurringTaskSeriesId",
                table: "HouseholdTasks");
        }
    }
}
