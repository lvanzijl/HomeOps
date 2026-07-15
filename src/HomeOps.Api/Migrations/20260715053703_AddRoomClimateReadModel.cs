using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomClimateReadModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RoomClimateObservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceMappingId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObservedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReceivedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    TemperatureCelsius = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    RelativeHumidity = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    TargetTemperatureCelsius = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    OperatingState = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    IsProviderAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    SourceReference = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    StatusDetail = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomClimateObservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomClimateObservations_ClimateProviders_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "ClimateProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomClimateObservations_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomClimateObservations_RoomClimateSourceMappings_SourceMap~",
                        column: x => x.SourceMappingId,
                        principalTable: "RoomClimateSourceMappings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RoomClimateObservations_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoomClimateObservations_HouseholdId_ReceivedUtc",
                table: "RoomClimateObservations",
                columns: new[] { "HouseholdId", "ReceivedUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomClimateObservations_HouseholdId_RoomId",
                table: "RoomClimateObservations",
                columns: new[] { "HouseholdId", "RoomId" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomClimateObservations_ProviderId",
                table: "RoomClimateObservations",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomClimateObservations_RoomId_SourceMappingId",
                table: "RoomClimateObservations",
                columns: new[] { "RoomId", "SourceMappingId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoomClimateObservations_SourceMappingId",
                table: "RoomClimateObservations",
                column: "SourceMappingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoomClimateObservations");
        }
    }
}
