using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeOps.Api.Migrations
{
    /// <inheritdoc />
    public partial class SanitizeClimateProviderDiagnostics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "ClimateProviders"
                SET "DiagnosticMetadata" = NULL
                WHERE "DiagnosticMetadata" IS NOT NULL
                  AND "DiagnosticMetadata" NOT IN (
                    'ha-refresh:Healthy',
                    'ha-refresh:AuthenticationFailure',
                    'ha-refresh:ProviderUnavailable',
                    'ha-refresh:InvalidConnectionConfiguration',
                    'ha-refresh:PartialFailure',
                    'ha-refresh:Unverified',
                    'ha-refresh:Skipped',
                    'ha-refresh:Cancelled'
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
