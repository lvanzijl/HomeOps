[CmdletBinding()]
param(
    [string]$Configuration = "Release",
    [string]$SynologySharePath,
    [string]$ImageArchiveOutputPath,
    [string]$SynologyImageRepository = "familyboard-app",
    [string]$SynologyImageTag = "dev",
    [string]$SynologySshHost,
    [string]$SynologyProjectPath = "/volume1/docker/familyboard",
    [switch]$DeployRemote,
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [string]$SettingsPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) { Write-Host "==> $Message" }
function Fail([string]$Message) { Write-Error $Message; exit 1 }
function Resolve-RepoRoot {
    $candidate = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    if (-not (Test-Path (Join-Path $candidate "HomeOps.sln"))) {
        Fail "Could not resolve repository root from script path: $PSScriptRoot"
    }
    return $candidate
}
function Invoke-Checked([string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory) {
    Write-Host "> $FilePath $($Arguments -join ' ')"
    Push-Location -LiteralPath $WorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) { Fail "Command failed with exit code $LASTEXITCODE: $FilePath" }
    }
    finally {
        Pop-Location
    }
}
function Apply-SettingsFile([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { return }
    if (-not (Test-Path -LiteralPath $Path)) { Fail "Settings file not found: $Path" }
    $settings = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    foreach ($property in $settings.PSObject.Properties) {
        switch ($property.Name) {
            "SynologySharePath" { if (-not $SynologySharePath) { Set-Variable -Name SynologySharePath -Scope Script -Value ([string]$property.Value) } }
            "SynologySshHost" { if (-not $SynologySshHost) { Set-Variable -Name SynologySshHost -Scope Script -Value ([string]$property.Value) } }
            "SynologyProjectPath" { if ($SynologyProjectPath -eq "/volume1/docker/familyboard") { Set-Variable -Name SynologyProjectPath -Scope Script -Value ([string]$property.Value) } }
            "SynologyImageRepository" { if ($SynologyImageRepository -eq "familyboard-app") { Set-Variable -Name SynologyImageRepository -Scope Script -Value ([string]$property.Value) } }
            "SynologyImageTag" { if ($SynologyImageTag -eq "dev") { Set-Variable -Name SynologyImageTag -Scope Script -Value ([string]$property.Value) } }
        }
    }
}

$repoRoot = Resolve-RepoRoot
if (-not $SettingsPath) {
    $defaultSettingsPath = Join-Path $repoRoot "build/synology-deploy.local.json"
    if (Test-Path -LiteralPath $defaultSettingsPath) { $SettingsPath = $defaultSettingsPath }
}
Apply-SettingsFile $SettingsPath

if ([string]::IsNullOrWhiteSpace($SynologySharePath)) { Fail "SynologySharePath is required. Pass -SynologySharePath or create build/synology-deploy.local.json." }
if ($DeployRemote -and [string]::IsNullOrWhiteSpace($SynologySshHost)) { Fail "SynologySshHost is required when -DeployRemote is passed." }

$archiveName = "$SynologyImageRepository-$SynologyImageTag.tar.gz"
if ([string]::IsNullOrWhiteSpace($ImageArchiveOutputPath)) {
    $ImageArchiveOutputPath = Join-Path $repoRoot "artifacts/container/$archiveName"
}
$ImageArchiveOutputPath = [System.IO.Path]::GetFullPath($ImageArchiveOutputPath)
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("homeops-synology-" + [Guid]::NewGuid().ToString("N"))
$tempArchive = Join-Path $tempRoot $archiveName
$shareImagesPath = Join-Path $SynologySharePath "images"
$shareFinal = Join-Path $shareImagesPath "familyboard-app.tar.gz"
$shareStaged = "$shareFinal.uploading"

try {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ImageArchiveOutputPath), $tempRoot | Out-Null
    if (-not $SkipBuild) {
        Write-Step "Restoring and building HomeOps.sln ($Configuration)"
        Invoke-Checked "dotnet" @("restore", "HomeOps.sln") $repoRoot
        Invoke-Checked "dotnet" @("build", "HomeOps.sln", "--configuration", $Configuration, "--no-restore") $repoRoot
    } else { Write-Step "Skipping restore/build because -SkipBuild was passed" }

    if (-not $SkipTests) {
        Write-Step "Running automated tests"
        Invoke-Checked "dotnet" @("test", "HomeOps.sln", "--configuration", $Configuration, "--no-build") $repoRoot
    } else { Write-Step "Skipping tests because -SkipTests was passed" }

    Write-Step "Publishing linux/amd64 container archive to temporary local path"
    Invoke-Checked "dotnet" @(
        "publish", "src/HomeOps.Api/HomeOps.Api.csproj",
        "--configuration", $Configuration,
        "--os", "linux",
        "--arch", "x64",
        "/t:PublishContainer",
        "/p:ContainerRepository=$SynologyImageRepository",
        "/p:ContainerImageTag=$SynologyImageTag",
        "/p:ContainerArchiveOutputPath=$tempArchive"
    ) $repoRoot

    if (-not (Test-Path -LiteralPath $tempArchive)) { Fail "Container archive was not created: $tempArchive" }
    if ((Get-Item -LiteralPath $tempArchive).Length -le 0) { Fail "Container archive is empty: $tempArchive" }
    Copy-Item -LiteralPath $tempArchive -Destination $ImageArchiveOutputPath -Force

    Write-Step "Copying archive safely to Synology share"
    New-Item -ItemType Directory -Force -Path $shareImagesPath | Out-Null
    Copy-Item -LiteralPath $tempArchive -Destination $shareStaged -Force
    Move-Item -LiteralPath $shareStaged -Destination $shareFinal -Force
    Write-Host "Copied archive to $shareFinal"

    if ($DeployRemote) {
        Write-Step "Invoking remote Synology deployment"
        Invoke-Checked "ssh" @($SynologySshHost, "cd '$SynologyProjectPath' && FAMILYBOARD_IMAGE_REPOSITORY='$SynologyImageRepository' FAMILYBOARD_IMAGE_TAG='$SynologyImageTag' sh ./deploy.sh") $repoRoot
    }

    Write-Step "Synology deployment package is ready"
}
finally {
    if (Test-Path -LiteralPath $tempRoot) { Remove-Item -LiteralPath $tempRoot -Recurse -Force }
}
