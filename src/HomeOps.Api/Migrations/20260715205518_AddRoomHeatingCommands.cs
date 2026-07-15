using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomHeatingCommands : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RoomHeatingCommands",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceMappingId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    RequestedTargetTemperatureCelsius = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    EffectiveUntilUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RequestedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AcceptedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IdempotencyKey = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    RequestFingerprint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SupersededByCommandId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProviderCommandReference = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    ConfirmedTargetTemperatureCelsius = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    ScheduleResumed = table.Column<bool>(type: "boolean", nullable: true),
                    FailureCode = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    FailureMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomHeatingCommands", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomHeatingCommands_ClimateProviders_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "ClimateProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomHeatingCommands_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomHeatingCommands_RoomClimateSourceMappings_SourceMapping~",
                        column: x => x.SourceMappingId,
                        principalTable: "RoomClimateSourceMappings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomHeatingCommands_RoomHeatingCommands_SupersededByCommand~",
                        column: x => x.SupersededByCommandId,
                        principalTable: "RoomHeatingCommands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomHeatingCommands_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoomHeatingCommands_HouseholdId_RoomId_IdempotencyKey",
                table: "RoomHeatingCommands",
                columns: new[] { "HouseholdId", "RoomId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoomHeatingCommands_HouseholdId_RoomId_RequestedUtc",
                table: "RoomHeatingCommands",
                columns: new[] { "HouseholdId", "RoomId", "RequestedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomHeatingCommands_ProviderId_ProviderCommandReference",
                table: "RoomHeatingCommands",
                columns: new[] { "ProviderId", "ProviderCommandReference" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomHeatingCommands_RoomId_Status_EffectiveUntilUtc",
                table: "RoomHeatingCommands",
                columns: new[] { "RoomId", "Status", "EffectiveUntilUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomHeatingCommands_SourceMappingId",
                table: "RoomHeatingCommands",
                column: "SourceMappingId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomHeatingCommands_SupersededByCommandId",
                table: "RoomHeatingCommands",
                column: "SupersededByCommandId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoomHeatingCommands");
        }
    }
}
