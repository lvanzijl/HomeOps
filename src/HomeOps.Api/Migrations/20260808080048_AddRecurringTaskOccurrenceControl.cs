using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecurringTaskOccurrenceControl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "EndDate",
                table: "RecurringTaskSeries",
                type: "date",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RecurringTaskExceptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecurringTaskSeriesId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalDueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ExceptionType = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ReplacementTaskId = table.Column<Guid>(type: "uuid", nullable: true),
                    Title = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    OwnershipKind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    FamilyMemberId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DecorativeAvatarReferenceType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    DecorativeAvatarReferenceId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringTaskExceptions", x => x.Id);
                    table.CheckConstraint("CK_RecurringTaskExceptions_DecorativeAvatar_NullablePair", "(\"DecorativeAvatarReferenceType\" IS NULL AND \"DecorativeAvatarReferenceId\" IS NULL) OR (\"DecorativeAvatarReferenceType\" IS NOT NULL AND \"DecorativeAvatarReferenceId\" IS NOT NULL)");
                    table.CheckConstraint("CK_RecurringTaskExceptions_ModifiedFields", "(\"ExceptionType\" = 'Skipped' AND \"ReplacementTaskId\" IS NULL AND \"Title\" IS NULL AND \"DueDate\" IS NULL AND \"OwnershipKind\" IS NULL) OR (\"ExceptionType\" = 'Modified' AND \"ReplacementTaskId\" IS NOT NULL AND \"Title\" IS NOT NULL AND \"DueDate\" IS NOT NULL AND \"OwnershipKind\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_RecurringTaskExceptions_FamilyMembers_FamilyMemberId",
                        column: x => x.FamilyMemberId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringTaskExceptions_RecurringTaskSeries_RecurringTaskSe~",
                        column: x => x.RecurringTaskSeriesId,
                        principalTable: "RecurringTaskSeries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTaskExceptions_DecorativeAvatarReferenceType_Decor~",
                table: "RecurringTaskExceptions",
                columns: new[] { "DecorativeAvatarReferenceType", "DecorativeAvatarReferenceId" });

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTaskExceptions_FamilyMemberId",
                table: "RecurringTaskExceptions",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTaskExceptions_RecurringTaskSeriesId_OriginalDueDa~",
                table: "RecurringTaskExceptions",
                columns: new[] { "RecurringTaskSeriesId", "OriginalDueDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecurringTaskExceptions_ReplacementTaskId",
                table: "RecurringTaskExceptions",
                column: "ReplacementTaskId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecurringTaskExceptions");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "RecurringTaskSeries");
        }
    }
}
