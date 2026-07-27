param(
    [switch]$SkipPostgres,
    [switch]$StopPostgresOnExit,
    [switch]$Headed,
    [switch]$KeepDatabase
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$clientRoot = Join-Path $repoRoot "src\HomeOps.Client"
$e2eRoot = Join-Path $repoRoot "tests\HomeOps.E2E"
$apiProject = Join-Path $repoRoot "src\HomeOps.Api\HomeOps.Api.csproj"
$apiUrl = "http://127.0.0.1:5252"
$clientUrl = "http://127.0.0.1:5273"
$databaseName = "homeops_e2e_$([Guid]::NewGuid().ToString('N'))"

function Require-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$InstallHint,
        [string[]]$FallbackPaths = @()
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    foreach ($fallbackPath in $FallbackPaths) {
        if (Test-Path -LiteralPath $fallbackPath) {
            return $fallbackPath
        }
    }

    throw "$Name is required. $InstallHint"
}

function Join-ProcessArguments {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    return ($Arguments | ForEach-Object {
        if ($_ -match '[\s"]') {
            '"' + ($_ -replace '"', '\"') + '"'
        }
        else {
            $_
        }
    }) -join " "
}

function Start-BackgroundProcess {
    param(
        [Parameter(Mandatory = $true)][string]$FileName,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [hashtable]$Environment = @{}
    )

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $FileName
    $startInfo.Arguments = Join-ProcessArguments -Arguments $Arguments
    $startInfo.WorkingDirectory = $WorkingDirectory
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    foreach ($key in $Environment.Keys) {
        $startInfo.EnvironmentVariables[$key] = [string]$Environment[$key]
    }

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    if (-not $process.Start()) {
        throw "Could not start '$FileName'."
    }

    return $process
}

function Wait-ForTcpPort {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutSeconds = 90
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $client = [System.Net.Sockets.TcpClient]::new()
        try {
            $connection = $client.BeginConnect($HostName, $Port, $null, $null)
            if ($connection.AsyncWaitHandle.WaitOne(500)) {
                $client.EndConnect($connection)
                return
            }
        }
        catch {
            Start-Sleep -Milliseconds 250
        }
        finally {
            $client.Dispose()
        }
    }

    throw "Timed out waiting for $HostName`:$Port."
}

function Wait-ForHttp {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [Parameter(Mandatory = $true)][System.Diagnostics.Process]$Process,
        [int]$TimeoutSeconds = 90
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if ($Process.HasExited) {
            throw "Process exited with code $($Process.ExitCode) while waiting for $Uri."
        }

        try {
            $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return
            }
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }

    throw "Timed out waiting for $Uri."
}

function Assert-PortAvailable {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][int]$Port
    )

    $ipAddress = [System.Net.Dns]::GetHostAddresses($HostName) |
        Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork } |
        Select-Object -First 1
    if ($null -eq $ipAddress) {
        throw "Could not resolve an IPv4 address for $HostName."
    }

    $listener = [System.Net.Sockets.TcpListener]::new($ipAddress, $Port)
    try {
        $listener.Start()
    }
    catch {
        throw "E2E port $HostName`:$Port is already in use. Stop the existing process before running the isolated suite."
    }
    finally {
        $listener.Stop()
    }
}

function Stop-BackgroundProcessTree {
    param([System.Diagnostics.Process]$Process)

    if ($null -eq $Process -or $Process.HasExited) {
        return
    }

    if ($env:OS -eq "Windows_NT") {
        $taskKill = Join-Path $env:SystemRoot "System32\taskkill.exe"
        & $taskKill /PID $Process.Id /T /F *> $null
        if ($LASTEXITCODE -ne 0 -and -not $Process.HasExited) {
            throw "Could not stop process tree $($Process.Id)."
        }
    }
    else {
        $Process.Kill()
    }

    $Process.WaitForExit()
}

if ($databaseName -notmatch '^homeops_e2e_[a-f0-9]{32}$') {
    throw "Refusing to use unsafe E2E database name '$databaseName'."
}

$dotnet = Require-Command "dotnet" ".NET SDK 10 is needed to run the HomeOps API."
$docker = Require-Command "docker" "Rancher Desktop or Docker Desktop is needed for isolated PostgreSQL."
$node = Require-Command `
    -Name "node" `
    -InstallHint "Node.js is needed to run Vite and Playwright." `
    -FallbackPaths @(
        "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    )
$pnpm = Require-Command `
    -Name "pnpm" `
    -InstallHint "Install pnpm, or enable it through Corepack." `
    -FallbackPaths @(
        "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
    )
$viteScript = Join-Path $clientRoot "node_modules\vite\bin\vite.js"
$playwrightPackage = Join-Path $e2eRoot "node_modules\@playwright\test\package.json"

if (-not (Test-Path -LiteralPath $viteScript)) {
    throw "Frontend dependencies are missing. Run 'pnpm --dir src/HomeOps.Client install'."
}
if (-not (Test-Path -LiteralPath $playwrightPackage)) {
    throw "E2E dependencies are missing. Run 'pnpm --dir tests/HomeOps.E2E install'."
}

$env:Path = "$(Split-Path -Parent $node);$env:Path"
$api = $null
$client = $null
$databaseCreated = $false
$testExitCode = 1

Push-Location $repoRoot
try {
    Assert-PortAvailable -HostName "127.0.0.1" -Port 5252
    Assert-PortAvailable -HostName "127.0.0.1" -Port 5273

    if (-not $SkipPostgres) {
        Write-Host "[e2e] Starting PostgreSQL..."
        & $docker compose up -d postgres
        if ($LASTEXITCODE -ne 0) {
            throw "docker compose failed with exit code $LASTEXITCODE."
        }
    }

    Wait-ForTcpPort -HostName "127.0.0.1" -Port 5432

    Write-Host "[e2e] Creating isolated database $databaseName..."
    $createSql = "CREATE DATABASE `"$databaseName`";"
    & $docker compose exec -T postgres psql -U homeops -d postgres -v ON_ERROR_STOP=1 -c $createSql
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create isolated E2E database."
    }
    $databaseCreated = $true

    $connectionString = "Host=127.0.0.1;Port=5432;Database=$databaseName;Username=homeops;Password=homeops_dev_password"
    Write-Host "[e2e] Starting API at $apiUrl..."
    $api = Start-BackgroundProcess `
        -FileName $dotnet `
        -Arguments @("run", "--no-launch-profile", "--project", $apiProject) `
        -WorkingDirectory $repoRoot `
        -Environment @{
            "ASPNETCORE_ENVIRONMENT" = "E2E"
            "ASPNETCORE_URLS" = $apiUrl
            "ConnectionStrings__HomeOps" = $connectionString
        }
    Wait-ForHttp -Uri "$apiUrl/health" -Process $api

    Write-Host "[e2e] Starting client at $clientUrl..."
    $client = Start-BackgroundProcess `
        -FileName $node `
        -Arguments @($viteScript, "--host", "127.0.0.1", "--port", "5273", "--strictPort") `
        -WorkingDirectory $clientRoot `
        -Environment @{
            "HOMEOPS_API_PROXY_TARGET" = $apiUrl
        }
    Wait-ForHttp -Uri $clientUrl -Process $client

    $env:HOMEOPS_E2E_BASE_URL = $clientUrl
    Write-Host "[e2e] Running Playwright smoke tests..."
    $playwrightArguments = @("exec", "playwright", "test")
    if ($Headed) {
        $playwrightArguments += "--headed"
    }
    Push-Location $e2eRoot
    try {
        & $pnpm @playwrightArguments
        $testExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
}
finally {
    foreach ($process in @($client, $api)) {
        try {
            Stop-BackgroundProcessTree -Process $process
        }
        catch {
            Write-Warning $_
            $testExitCode = 1
        }
    }

    if ($databaseCreated -and -not $KeepDatabase) {
        Write-Host "[e2e] Dropping isolated database $databaseName..."
        $dropSql = "DROP DATABASE IF EXISTS `"$databaseName`" WITH (FORCE);"
        & $docker compose exec -T postgres psql -U homeops -d postgres -v ON_ERROR_STOP=1 -c $dropSql
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not drop isolated E2E database '$databaseName'."
            $testExitCode = 1
        }
    }

    if ($StopPostgresOnExit -and -not $SkipPostgres) {
        & $docker compose stop postgres
    }

    foreach ($port in @(5252, 5273)) {
        try {
            Assert-PortAvailable -HostName "127.0.0.1" -Port $port
        }
        catch {
            Write-Warning "E2E cleanup left port 127.0.0.1`:$port in use."
            $testExitCode = 1
        }
    }

    Pop-Location
}

exit $testExitCode
