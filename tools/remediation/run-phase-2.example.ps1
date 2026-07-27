[CmdletBinding()]
param(
    [switch]$Execute
)

$orchestrator = Join-Path $PSScriptRoot "Invoke-RemediationPlan.ps1"

$arguments = @{
    StartSlice = "2.4"
    EndSlice = "3.7"
    MaxSlices = 22
    MaxAttemptsPerSlice = 3
}

if ($Execute) {
    $arguments.Execute = $true
    $arguments.CommitAfterSlice = $true
}

& $orchestrator @arguments
exit $LASTEXITCODE
