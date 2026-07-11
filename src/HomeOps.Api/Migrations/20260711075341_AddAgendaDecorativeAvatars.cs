using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAgendaDecorativeAvatars : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DecorativeAvatarReferenceId",
                table: "EventSeries",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DecorativeAvatarReferenceType",
                table: "EventSeries",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("13131313-1313-1313-1313-131313131313"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("14141414-1414-1414-1414-141414141414"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("15151515-1515-1515-1515-151515151515"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "EventSeries",
                keyColumn: "Id",
                keyValue: new Guid("16161616-1616-1616-1616-161616161616"),
                columns: new[] { "DecorativeAvatarReferenceId", "DecorativeAvatarReferenceType" },
                values: new object[] { null, null });

            migrationBuilder.CreateIndex(
                name: "IX_EventSeries_DecorativeAvatarReferenceType_DecorativeAvatarR~",
                table: "EventSeries",
                columns: new[] { "DecorativeAvatarReferenceType", "DecorativeAvatarReferenceId" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_EventSeries_DecorativeAvatar_NullablePair",
                table: "EventSeries",
                sql: "(\"DecorativeAvatarReferenceType\" IS NULL AND \"DecorativeAvatarReferenceId\" IS NULL) OR (\"DecorativeAvatarReferenceType\" IS NOT NULL AND \"DecorativeAvatarReferenceId\" IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventSeries_DecorativeAvatarReferenceType_DecorativeAvatarR~",
                table: "EventSeries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_EventSeries_DecorativeAvatar_NullablePair",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "DecorativeAvatarReferenceId",
                table: "EventSeries");

            migrationBuilder.DropColumn(
                name: "DecorativeAvatarReferenceType",
                table: "EventSeries");
        }
    }
}
