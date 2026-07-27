[CmdletBinding()]
param(
    [switch]$SkipPostgres,
    [switch]$StopPostgresOnExit,
    [string]$ConnectionString = "Host=127.0.0.1;Port=5432;Database=postgres;Username=homeops;Password=homeops_dev_password"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$dotnet = (Get-Command dotnet -ErrorAction Stop).Source

function Wait-ForPostgres {
    param([int]$TimeoutSeconds = 60)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        & docker compose exec -T postgres pg_isready -U homeops -d postgres *> $null
        if ($LASTEXITCODE -eq 0) {
            return
        }

        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)

    throw "PostgreSQL did not become ready within $TimeoutSeconds seconds."
}

Push-Location $repoRoot
try {
    if (-not $SkipPostgres) {
        Write-Host "[postgres-tests] Starting the repository PostgreSQL service..."
        & docker compose up -d postgres
        if ($LASTEXITCODE -ne 0) {
            throw "docker compose up failed with exit code $LASTEXITCODE."
        }

        Wait-ForPostgres
    }

    $env:HOMEOPS_TEST_POSTGRES_CONNECTION = $ConnectionString
    $env:HOMEOPS_REQUIRE_POSTGRES_TESTS = "true"

    Write-Host "[postgres-tests] Running isolated migration baseline tests..."
    & $dotnet test "tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj" `
        --filter "FullyQualifiedName~HomeOps.Api.Tests.Infrastructure.DatabaseBaselineTests"
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL migration tests failed with exit code $LASTEXITCODE."
    }
}
finally {
    Remove-Item Env:HOMEOPS_TEST_POSTGRES_CONNECTION -ErrorAction SilentlyContinue
    Remove-Item Env:HOMEOPS_REQUIRE_POSTGRES_TESTS -ErrorAction SilentlyContinue

    if ($StopPostgresOnExit -and -not $SkipPostgres) {
        & docker compose stop postgres
    }

    Pop-Location
}
