using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMotivationProgressLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MotivationProgressLedgerEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    GoalType = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    GoalId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SourceId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Delta = table.Column<int>(type: "integer", nullable: false),
                    OccurredUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Reason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    CorrectionOfEntryId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MotivationProgressLedgerEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MotivationProgressLedgerEntries_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MotivationProgressLedgerEntries_CorrectionOfEntryId",
                table: "MotivationProgressLedgerEntries",
                column: "CorrectionOfEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_MotivationProgressLedgerEntries_HouseholdId_GoalType_GoalId~",
                table: "MotivationProgressLedgerEntries",
                columns: new[] { "HouseholdId", "GoalType", "GoalId", "OccurredUtc" });

            migrationBuilder.Sql(
                """
                INSERT INTO "MotivationProgressLedgerEntries"
                    ("Id", "HouseholdId", "GoalType", "GoalId", "SourceType", "SourceId", "Delta", "OccurredUtc", "Reason", "CorrectionOfEntryId")
                SELECT
                    md5("Id"::text || ':motivation-progress-baseline')::uuid,
                    "HouseholdId",
                    'Family',
                    "Id",
                    'MigrationBaseline',
                    "Id"::text,
                    "CurrentProgress",
                    TIMESTAMPTZ '2026-08-08 00:00:00+00',
                    'Bestaande voortgang bij invoering van het voortgangslogboek.',
                    NULL
                FROM "MotivationFamilyGoals";

                INSERT INTO "MotivationProgressLedgerEntries"
                    ("Id", "HouseholdId", "GoalType", "GoalId", "SourceType", "SourceId", "Delta", "OccurredUtc", "Reason", "CorrectionOfEntryId")
                SELECT
                    md5("Id"::text || ':motivation-progress-baseline')::uuid,
                    "HouseholdId",
                    'Individual',
                    "Id",
                    'MigrationBaseline',
                    "Id"::text,
                    "CurrentProgress",
                    TIMESTAMPTZ '2026-08-08 00:00:00+00',
                    'Bestaande voortgang bij invoering van het voortgangslogboek.',
                    NULL
                FROM "MotivationIndividualGoals";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MotivationProgressLedgerEntries");
        }
    }
}
