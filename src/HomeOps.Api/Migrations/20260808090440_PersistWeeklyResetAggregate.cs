using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class PersistWeeklyResetAggregate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeeklyResetSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    WeekStart = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Outcome = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyResetSessions", x => x.Id);
                    table.CheckConstraint("CK_WeeklyResetSessions_Completion", "(\"Status\" = 'Open' AND \"Outcome\" IS NULL AND \"CompletedUtc\" IS NULL) OR (\"Status\" = 'Completed' AND \"Outcome\" IS NOT NULL AND \"CompletedUtc\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_WeeklyResetSessions_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WeeklyResetCandidates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WeeklyResetSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateType = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    SourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayLabel = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    ContextLabel = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Decision = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: true),
                    ActorLabel = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DecidedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeeklyResetCandidates", x => x.Id);
                    table.CheckConstraint("CK_WeeklyResetCandidates_Decision", "(\"Decision\" IS NULL AND \"ActorLabel\" IS NULL AND \"DecidedUtc\" IS NULL) OR (\"Decision\" IS NOT NULL AND \"DecidedUtc\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_WeeklyResetCandidates_WeeklyResetSessions_WeeklyResetSessio~",
                        column: x => x.WeeklyResetSessionId,
                        principalTable: "WeeklyResetSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyResetCandidates_WeeklyResetSessionId_CandidateType_So~",
                table: "WeeklyResetCandidates",
                columns: new[] { "WeeklyResetSessionId", "CandidateType", "SourceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyResetCandidates_WeeklyResetSessionId_Decision",
                table: "WeeklyResetCandidates",
                columns: new[] { "WeeklyResetSessionId", "Decision" });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyResetSessions_HouseholdId_Status_WeekStart",
                table: "WeeklyResetSessions",
                columns: new[] { "HouseholdId", "Status", "WeekStart" });

            migrationBuilder.CreateIndex(
                name: "IX_WeeklyResetSessions_HouseholdId_WeekStart",
                table: "WeeklyResetSessions",
                columns: new[] { "HouseholdId", "WeekStart" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeeklyResetCandidates");

            migrationBuilder.DropTable(
                name: "WeeklyResetSessions");
        }
    }
}
