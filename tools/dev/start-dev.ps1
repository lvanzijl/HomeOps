param(
    [switch]$SkipPostgres,
    [switch]$StopPostgresOnExit,
    [string]$BindHost = "0.0.0.0",
    [string]$PublicHost
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$clientRoot = Join-Path $repoRoot "src\HomeOps.Client"
$apiProject = Join-Path $repoRoot "src\HomeOps.Api\HomeOps.Api.csproj"

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

function Wait-ForTcpPort {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostName,

        [Parameter(Mandatory = $true)]
        [int]$Port,

        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $client = [System.Net.Sockets.TcpClient]::new()
        try {
            $connection = $client.BeginConnect($HostName, $Port, $null, $null)
            if ($connection.AsyncWaitHandle.WaitOne(1000)) {
                $client.EndConnect($connection)
                return
            }
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
        finally {
            $client.Dispose()
        }
    }

    throw "Timed out waiting for $HostName`:$Port."
}

function Join-ProcessArguments {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    return ($Arguments | ForEach-Object {
        if ($_ -match '[\s"]') {
            '"' + ($_ -replace '"', '\"') + '"'
        }
        else {
            $_
        }
    }) -join " "
}

function Get-DefaultLanIPv4 {
    $ipconfig = ipconfig
    $adapter = @()
    foreach ($line in $ipconfig) {
        if ($line -match '^\S.*adapter\s+(.+):\s*$') {
            if ($adapter.Count -gt 0) {
                $candidate = Get-IPv4FromAdapter -AdapterLines $adapter
                if ($candidate) {
                    return $candidate
                }
            }

            $adapter = @($line)
            continue
        }

        if ($adapter.Count -gt 0) {
            $adapter += $line
        }
    }

    if ($adapter.Count -gt 0) {
        return Get-IPv4FromAdapter -AdapterLines $adapter
    }

    return $null
}

function Get-IPv4FromAdapter {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string[]]$AdapterLines
    )

    $hasGateway = $false
    $ipv4 = $null
    foreach ($line in $AdapterLines) {
        if ($line -match 'IPv4 Address.*:\s*(\d+\.\d+\.\d+\.\d+)') {
            $ipv4 = $matches[1]
        }
        elseif ($line -match 'Default Gateway.*:\s*(\d+\.\d+\.\d+\.\d+)') {
            $hasGateway = $true
        }
    }

    if ($hasGateway -and $ipv4 -and $ipv4 -notmatch '^(127|169\.254|172\.)\.') {
        return $ipv4
    }

    return $null
}

function Start-LoggedProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$FileName,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,

        [hashtable]$Environment = @{}
    )

    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $FileName
    $psi.Arguments = Join-ProcessArguments -Arguments $Arguments
    $psi.WorkingDirectory = $WorkingDirectory
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    foreach ($key in $Environment.Keys) {
        $psi.EnvironmentVariables[$key] = [string]$Environment[$key]
    }

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $psi
    $process.EnableRaisingEvents = $true

    $process.add_OutputDataReceived({
        param($sender, $eventArgs)
        if ($null -ne $eventArgs.Data) {
            Write-Host "[$Name] $($eventArgs.Data)"
        }
    })
    $process.add_ErrorDataReceived({
        param($sender, $eventArgs)
        if ($null -ne $eventArgs.Data) {
            Write-Host "[$Name] $($eventArgs.Data)" -ForegroundColor DarkYellow
        }
    })

    [void]$process.Start()
    $process.BeginOutputReadLine()
    $process.BeginErrorReadLine()

    return $process
}

$dotnet = Require-Command "dotnet" ".NET SDK 10 is needed to run the HomeOps API."
$pnpm = Require-Command `
    -Name "pnpm" `
    -InstallHint "Install pnpm, or enable it through Corepack, to run the Vite client." `
    -FallbackPaths @(
        "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
    )

if (-not $SkipPostgres) {
    $compose = Require-Command `
        -Name "docker-compose" `
        -InstallHint "Install Rancher Desktop or Docker Desktop, or start PostgreSQL manually and rerun with -SkipPostgres." `
        -FallbackPaths @(
            "C:\Program Files\Rancher Desktop\resources\resources\win32\docker-cli-plugins\docker-compose.exe",
            "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\cli-plugins\docker-compose.exe",
            "C:\Program Files\Docker\Docker\resources\cli-plugins\docker-compose.exe"
        )
    Write-Host "[dev] Starting PostgreSQL with docker compose..."
    Push-Location $repoRoot
    try {
        & $compose up -d postgres
        if ($LASTEXITCODE -ne 0) {
            throw "docker compose failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }

    Write-Host "[dev] Waiting for PostgreSQL on localhost:5432..."
    Wait-ForTcpPort -HostName "127.0.0.1" -Port 5432 -TimeoutSeconds 90
}

$networkHost = if ($PublicHost) { $PublicHost } else { Get-DefaultLanIPv4 }
$displayHost = if ($networkHost) { $networkHost } else { "localhost" }
$apiUrl = "http://$BindHost`:5152"

Write-Host "[dev] Starting HomeOps API at $apiUrl"
$api = Start-LoggedProcess `
    -Name "api" `
    -FileName $dotnet `
    -Arguments @("run", "--no-launch-profile", "--project", $apiProject) `
    -WorkingDirectory $repoRoot `
    -Environment @{
        "ASPNETCORE_ENVIRONMENT" = "Development"
        "ASPNETCORE_URLS" = $apiUrl
    }

Write-Host "[dev] Starting HomeOps client at http://$BindHost`:5173"
$client = Start-LoggedProcess `
    -Name "vite" `
    -FileName $pnpm `
    -Arguments @("exec", "vite", "--host", $BindHost, "--port", "5173", "--strictPort") `
    -WorkingDirectory $clientRoot

try {
    Write-Host "[dev] Ready. Open http://$displayHost`:5173/ from this network and press Ctrl+C here to stop the app."
    while (-not $api.HasExited -and -not $client.HasExited) {
        Start-Sleep -Seconds 1
    }

    if ($api.HasExited) {
        throw "The API process exited with code $($api.ExitCode)."
    }

    if ($client.HasExited) {
        throw "The Vite process exited with code $($client.ExitCode)."
    }
}
finally {
    foreach ($process in @($api, $client)) {
        if ($null -ne $process -and -not $process.HasExited) {
            $process.Kill($true)
            $process.WaitForExit()
        }
    }

    if ($StopPostgresOnExit -and -not $SkipPostgres) {
        Push-Location $repoRoot
        try {
            & $compose stop postgres
        }
        finally {
            Pop-Location
        }
    }
}
