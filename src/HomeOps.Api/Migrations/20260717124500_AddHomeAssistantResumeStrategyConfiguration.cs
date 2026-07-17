using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHomeAssistantResumeStrategyConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "HomeAssistantResumeStrategyType", table: "ClimateProviders", type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "None");
            migrationBuilder.AddColumn<string>(name: "HomeAssistantResumeScriptEntityReference", table: "ClimateProviders", type: "character varying(240)", maxLength: 240, nullable: true);
            migrationBuilder.AddColumn<string>(name: "HomeAssistantResumeClimateEntityReference", table: "ClimateProviders", type: "character varying(240)", maxLength: 240, nullable: true);
            migrationBuilder.AddColumn<string>(name: "HomeAssistantResumePresetValue", table: "ClimateProviders", type: "character varying(80)", maxLength: 80, nullable: true);
            migrationBuilder.AddColumn<DateTimeOffset>(name: "HomeAssistantResumeStrategyUpdatedUtc", table: "ClimateProviders", type: "timestamp with time zone", nullable: true);

            migrationBuilder.Sql("""
                UPDATE "ClimateProviders"
                SET "HomeAssistantResumeStrategyType" = 'Script',
                    "HomeAssistantResumeScriptEntityReference" = split_part("DiagnosticMetadata", ':', 4),
                    "HomeAssistantResumeStrategyUpdatedUtc" = "UpdatedUtc"
                WHERE "ProviderType" = 'HomeAssistant'
                  AND "DiagnosticMetadata" LIKE 'ha-resume:script:turn_on:script.%'
                  AND "DiagnosticMetadata" NOT LIKE '% %'
                  AND array_length(string_to_array("DiagnosticMetadata", ':'), 1) = 4;

                UPDATE "ClimateProviders"
                SET "HomeAssistantResumeStrategyType" = 'ClimatePreset',
                    "HomeAssistantResumePresetValue" = split_part("DiagnosticMetadata", ':', 4),
                    "HomeAssistantResumeClimateEntityReference" = split_part("DiagnosticMetadata", ':', 5),
                    "HomeAssistantResumeStrategyUpdatedUtc" = "UpdatedUtc"
                WHERE "ProviderType" = 'HomeAssistant'
                  AND "DiagnosticMetadata" LIKE 'ha-resume:climate:set_preset_mode:%:climate.%'
                  AND "DiagnosticMetadata" NOT LIKE '% %'
                  AND array_length(string_to_array("DiagnosticMetadata", ':'), 1) = 5;
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "HomeAssistantResumeStrategyUpdatedUtc", table: "ClimateProviders");
            migrationBuilder.DropColumn(name: "HomeAssistantResumePresetValue", table: "ClimateProviders");
            migrationBuilder.DropColumn(name: "HomeAssistantResumeClimateEntityReference", table: "ClimateProviders");
            migrationBuilder.DropColumn(name: "HomeAssistantResumeScriptEntityReference", table: "ClimateProviders");
            migrationBuilder.DropColumn(name: "HomeAssistantResumeStrategyType", table: "ClimateProviders");
        }
    }
}
