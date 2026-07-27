[CmdletBinding()]
param(
    [string]$PlanPath = "docs/reports/2026-07-26-product-integrity-remediation-plan/phased-implementation-plan.md",
    [string]$StartSlice,
    [string]$EndSlice,
    [ValidateRange(1, 100)]
    [int]$MaxSlices = 1,
    [ValidateRange(1, 10)]
    [int]$MaxAttemptsPerSlice = 3,
    [switch]$Execute,
    [switch]$CommitAfterSlice,
    [switch]$AllowDirtyWorkingTree,
    [string]$CodexCommand = "codex",
    [ValidateSet("workspace-write", "read-only")]
    [string]$Sandbox = "workspace-write",
    [ValidateRange(1, 1440)]
    [int]$TimeoutMinutes = 240,
    [string]$Model,
    [string]$RunDirectory = ".codex-runs",
    [switch]$ShowPrompt
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$script:SlicePattern = '(?ms)^### Slice (?<id>[0-9]+(?:\.[0-9]+)?[A-Z]?)\s+[\u2013\u2014-]\s+(?<title>[^\r\n]+)\r?\n(?<body>.*?)(?=^### Slice |^## |\z)'
$script:StatusPattern = '(?m)^- \[(?<done>[ xX])\] \*\*Status: (?<status>Not started|In progress|Blocked|Completed)\*\*\s*$'

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [switch]$AllowFailure
    )

    $gitCommand = Get-Command git -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $gitCommand) {
        throw "Git was not found on PATH."
    }

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $gitCommand.Source
    $startInfo.Arguments = (($Arguments | ForEach-Object {
        ConvertTo-NativeArgument -Value $_
    }) -join " ")
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    try {
        if (-not $process.Start()) {
            throw "Git did not start."
        }

        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $process.WaitForExit()
        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $stderr = $stderrTask.GetAwaiter().GetResult()
        $exitCode = $process.ExitCode
    }
    finally {
        $process.Dispose()
    }

    $output = @(($stdout -split "\r?\n") |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $errorOutput = @(($stderr -split "\r?\n") |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if (-not $AllowFailure -and $exitCode -ne 0) {
        $details = @($output + $errorOutput) -join [Environment]::NewLine
        throw "git $($Arguments -join ' ') failed with exit code $exitCode.`n$details"
    }

    return [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($output)
        ErrorOutput = @($errorOutput)
    }
}

function Get-RepositoryRoot {
    $result = Invoke-Git -Arguments @("rev-parse", "--show-toplevel")
    return [System.IO.Path]::GetFullPath(($result.Output | Select-Object -First 1).Trim())
}

function Resolve-RepositoryPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot,
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $candidate = if ([System.IO.Path]::IsPathRooted($Path)) {
        [System.IO.Path]::GetFullPath($Path)
    }
    else {
        [System.IO.Path]::GetFullPath((Join-Path $RepositoryRoot $Path))
    }

    $rootWithSeparator = $RepositoryRoot.TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    ) + [System.IO.Path]::DirectorySeparatorChar

    if (-not $candidate.StartsWith($rootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Path must remain inside the repository: $candidate"
    }

    return $candidate
}

function Get-RepositoryRelativePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot,
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $resolvedPath = Resolve-RepositoryPath `
        -RepositoryRoot $RepositoryRoot `
        -Path $Path
    $rootWithSeparator = $RepositoryRoot.TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    ) + [System.IO.Path]::DirectorySeparatorChar

    return $resolvedPath.Substring($rootWithSeparator.Length).Replace("\", "/")
}

function Get-PlanSlices {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Text
    )

    $slices = @()
    foreach ($match in [regex]::Matches($Text, $script:SlicePattern)) {
        $raw = $match.Value
        $statusMatch = [regex]::Match($raw, $script:StatusPattern)
        if (-not $statusMatch.Success) {
            throw "Slice $($match.Groups['id'].Value) has no recognized status line."
        }

        $slices += [pscustomobject]@{
            Id = $match.Groups["id"].Value
            Title = $match.Groups["title"].Value.Trim()
            Status = $statusMatch.Groups["status"].Value
            Done = $statusMatch.Groups["done"].Value -match "[xX]"
            Index = $match.Index
            Length = $match.Length
            Raw = $raw
        }
    }

    if ($slices.Count -eq 0) {
        throw "No implementation slices were found in the plan."
    }

    return $slices
}

function Get-SliceIndex {
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Slices,
        [Parameter(Mandatory = $true)]
        [string]$SliceId
    )

    for ($index = 0; $index -lt $Slices.Count; $index++) {
        if ($Slices[$index].Id -eq $SliceId) {
            return $index
        }
    }

    throw "Slice '$SliceId' was not found in the plan."
}

function Select-InitialSliceIndex {
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Slices,
        [string]$RequestedStart
    )

    if ($RequestedStart) {
        $requestedIndex = Get-SliceIndex -Slices $Slices -SliceId $RequestedStart
        for ($index = $requestedIndex; $index -lt $Slices.Count; $index++) {
            if ($Slices[$index].Status -ne "Completed") {
                return $index
            }
        }

        return -1
    }

    for ($index = 0; $index -lt $Slices.Count; $index++) {
        if ($Slices[$index].Status -eq "In progress") {
            return $index
        }
    }

    for ($index = 0; $index -lt $Slices.Count; $index++) {
        if ($Slices[$index].Status -eq "Blocked") {
            return $index
        }
    }

    for ($index = 0; $index -lt $Slices.Count; $index++) {
        if ($Slices[$index].Status -eq "Not started") {
            return $index
        }
    }

    return -1
}

function Set-SliceInProgress {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ResolvedPlanPath,
        [Parameter(Mandatory = $true)]
        [string]$SliceId
    )

    $text = [System.IO.File]::ReadAllText($ResolvedPlanPath)
    $slices = @(Get-PlanSlices -Text $text)
    $sliceIndex = Get-SliceIndex -Slices $slices -SliceId $SliceId
    $slice = $slices[$sliceIndex]

    if ($slice.Status -eq "Completed") {
        throw "Slice $SliceId is already Completed."
    }

    if ($slice.Status -eq "In progress") {
        return
    }

    $updatedRaw = [regex]::Replace(
        $slice.Raw,
        $script:StatusPattern,
        '- [ ] **Status: In progress**',
        1
    )
    $updatedText = $text.Substring(0, $slice.Index) +
        $updatedRaw +
        $text.Substring($slice.Index + $slice.Length)
    [System.IO.File]::WriteAllText($ResolvedPlanPath, $updatedText, $script:Utf8NoBom)
}

function Reset-SliceForRetry {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ResolvedPlanPath,
        [Parameter(Mandatory = $true)]
        [string]$SliceId
    )

    $text = [System.IO.File]::ReadAllText($ResolvedPlanPath)
    $slices = @(Get-PlanSlices -Text $text)
    $sliceIndex = Get-SliceIndex -Slices $slices -SliceId $SliceId
    $slice = $slices[$sliceIndex]

    if ($slice.Status -eq "In progress") {
        return
    }

    $updatedRaw = [regex]::Replace(
        $slice.Raw,
        $script:StatusPattern,
        '- [ ] **Status: In progress**',
        1
    )
    $updatedText = $text.Substring(0, $slice.Index) +
        $updatedRaw +
        $text.Substring($slice.Index + $slice.Length)
    [System.IO.File]::WriteAllText($ResolvedPlanPath, $updatedText, $script:Utf8NoBom)
}

function Expand-PromptTemplate {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Template,
        [Parameter(Mandatory = $true)]
        [hashtable]$Values
    )

    $expanded = $Template
    foreach ($entry in $Values.GetEnumerator()) {
        $expanded = $expanded.Replace("{{$($entry.Key)}}", [string]$entry.Value)
    }

    if ($expanded -match "\{\{[A-Z_]+\}\}") {
        throw "The prompt template contains an unresolved placeholder: $($Matches[0])"
    }

    return $expanded
}

function ConvertTo-NativeArgument {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value
    )

    if ($Value.Length -gt 0 -and $Value -notmatch '[\s"]') {
        return $Value
    }

    $escaped = [regex]::Replace($Value, '(\\*)"', '$1$1\"')
    $escaped = [regex]::Replace($escaped, '(\\+)$', '$1$1')
    return '"' + $escaped + '"'
}

function Resolve-ExecutablePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    if ([System.IO.Path]::IsPathRooted($Command)) {
        if (-not (Test-Path -LiteralPath $Command -PathType Leaf)) {
            throw "Codex executable was not found: $Command"
        }

        return [System.IO.Path]::GetFullPath($Command)
    }

    $resolved = Get-Command $Command -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $resolved) {
        throw "Codex CLI '$Command' was not found on PATH. Install or authenticate the CLI before execution."
    }

    return $resolved.Source
}

function Invoke-ParentDotNetRestore {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot
    )

    $dotnet = Get-Command dotnet -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $dotnet) {
        throw "The .NET CLI was not found on PATH."
    }

    Push-Location $RepositoryRoot
    try {
        & $dotnet.Source restore HomeOps.sln
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet restore HomeOps.sln failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Get-CodexChildPathEntries {
    $entries = @()
    $nodeCommand = Get-Command node -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($nodeCommand) {
        $entries += Split-Path -Parent $nodeCommand.Source
    }

    $userProfile = [Environment]::GetFolderPath(
        [Environment+SpecialFolder]::UserProfile
    )
    if (-not [string]::IsNullOrWhiteSpace($userProfile)) {
        $runtimeDependencies = Join-Path $userProfile (
            ".cache\codex-runtimes\codex-primary-runtime\dependencies"
        )
        foreach ($relativePath in @("node\bin", "bin\fallback")) {
            $candidate = Join-Path $runtimeDependencies $relativePath
            if (Test-Path -LiteralPath $candidate -PathType Container) {
                $entries += [System.IO.Path]::GetFullPath($candidate)
            }
        }
    }

    return @($entries |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        Select-Object -Unique)
}

function Resolve-PnpmExecutable {
    param(
        [string[]]$AdditionalPathEntries = @()
    )

    $pnpm = Get-Command pnpm.cmd, pnpm -CommandType Application `
        -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($pnpm) {
        return $pnpm.Source
    }

    foreach ($directory in $AdditionalPathEntries) {
        foreach ($name in @("pnpm.cmd", "pnpm.exe")) {
            $candidate = Join-Path $directory $name
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                return [System.IO.Path]::GetFullPath($candidate)
            }
        }
    }

    throw "pnpm was not found for parent-owned contract generation."
}

function Invoke-ParentNSwagRepair {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot,
        [string[]]$AdditionalPathEntries = @()
    )

    $pnpm = Resolve-PnpmExecutable `
        -AdditionalPathEntries $AdditionalPathEntries
    $generatedFiles = @(
        "src/HomeOps.Contracts/openapi.json",
        "src/HomeOps.Client/src/api/homeOpsApiClient.ts"
    )
    foreach ($relativePath in $generatedFiles) {
        $generatedPath = Join-Path $RepositoryRoot $relativePath
        if (-not (Test-Path -LiteralPath $generatedPath -PathType Leaf)) {
            throw "Required generated contract file was not found: $relativePath"
        }
    }

    $originalPath = $env:PATH
    if ($AdditionalPathEntries.Count -gt 0) {
        $additionalPath = $AdditionalPathEntries -join (
            [System.IO.Path]::PathSeparator
        )
        $env:PATH = $additionalPath +
            [System.IO.Path]::PathSeparator +
            $originalPath
    }

    Push-Location $RepositoryRoot
    try {
        & $pnpm dlx nswag@14.7.1 run nswag.json
        if ($LASTEXITCODE -ne 0) {
            throw "Parent NSwag run 1 failed with exit code $LASTEXITCODE."
        }

        $firstHashes = @{}
        foreach ($relativePath in $generatedFiles) {
            $firstHashes[$relativePath] = (
                Get-FileHash `
                    -Algorithm SHA256 `
                    -LiteralPath (Join-Path $RepositoryRoot $relativePath)
            ).Hash
        }

        & $pnpm dlx nswag@14.7.1 run nswag.json
        if ($LASTEXITCODE -ne 0) {
            throw "Parent NSwag run 2 failed with exit code $LASTEXITCODE."
        }

        foreach ($relativePath in $generatedFiles) {
            $secondHash = (
                Get-FileHash `
                    -Algorithm SHA256 `
                    -LiteralPath (Join-Path $RepositoryRoot $relativePath)
            ).Hash
            if ($secondHash -ne $firstHashes[$relativePath]) {
                throw "Parent NSwag generation was not idempotent: $relativePath"
            }
        }
    }
    finally {
        Pop-Location
        $env:PATH = $originalPath
    }

    return [pscustomobject]@{
        Action = "parent_nswag_generation"
        Command = "pnpm dlx nswag@14.7.1 run nswag.json"
        Passed = $true
        Summary = (
            "The parent ran pinned NSwag twice; the second run left " +
            "OpenAPI and the generated TypeScript client unchanged."
        )
    }
}

function Test-ParentNSwagRepairRequired {
    param(
        [AllowNull()]
        [string]$FailureReason,
        [AllowNull()]
        [object]$Result
    )

    if ($FailureReason -match "(?i)\b(nswag|pnpm)\b") {
        return $true
    }
    if ($null -eq $Result) {
        return $false
    }

    foreach ($validation in @($Result.validations)) {
        if (
            -not $validation.passed -and
            (
                ([string]$validation.command) -match "(?i)\b(nswag|pnpm)\b" -or
                ([string]$validation.summary) -match "(?i)\b(nswag|pnpm)\b"
            )
        ) {
            return $true
        }
    }

    return $false
}

function Test-ResultSliceMatch {
    param(
        [AllowNull()]
        [object]$ActualSlice,
        [Parameter(Mandatory = $true)]
        [string]$ExpectedSlice
    )

    if ($null -eq $ActualSlice) {
        return $false
    }

    $actual = ([string]$ActualSlice).Trim()
    if ($actual -eq $ExpectedSlice) {
        return $true
    }

    $labelPattern = "^{0}\s+[\u2013\u2014-]\s+\S" -f (
        [regex]::Escape($ExpectedSlice)
    )
    return $actual -match $labelPattern
}

function Invoke-CodexSlice {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot,
        [Parameter(Mandatory = $true)]
        [string]$Prompt,
        [Parameter(Mandatory = $true)]
        [string]$SchemaPath,
        [Parameter(Mandatory = $true)]
        [string]$ResultPath,
        [Parameter(Mandatory = $true)]
        [string]$EventsPath,
        [Parameter(Mandatory = $true)]
        [string]$ProgressPath,
        [Parameter(Mandatory = $true)]
        [string]$SandboxMode,
        [Parameter(Mandatory = $true)]
        [int]$Timeout,
        [string]$RequestedModel,
        [string[]]$AdditionalPathEntries = @()
    )

    $arguments = @(
        "--ask-for-approval",
        "never",
        "exec",
        "--sandbox",
        $SandboxMode,
        "--json",
        "--output-schema",
        $SchemaPath,
        "--output-last-message",
        $ResultPath
    )
    if ($RequestedModel) {
        $arguments += @("--model", $RequestedModel)
    }
    $arguments += "-"

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $Executable
    $startInfo.Arguments = (($arguments | ForEach-Object {
        ConvertTo-NativeArgument -Value $_
    }) -join " ")
    $startInfo.WorkingDirectory = $RepositoryRoot
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    if ($AdditionalPathEntries.Count -gt 0) {
        $existingPath = $startInfo.EnvironmentVariables["PATH"]
        $additionalPath = $AdditionalPathEntries -join [System.IO.Path]::PathSeparator
        $startInfo.EnvironmentVariables["PATH"] = if (
            [string]::IsNullOrWhiteSpace($existingPath)
        ) {
            $additionalPath
        }
        else {
            $additionalPath + [System.IO.Path]::PathSeparator + $existingPath
        }
    }

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    $started = $false

    try {
        if (-not $process.Start()) {
            throw "The Codex process did not start."
        }
        $started = $true

        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $process.StandardInput.Write($Prompt)
        $process.StandardInput.Close()

        $exited = $process.WaitForExit($Timeout * 60 * 1000)
        $timedOut = -not $exited
        if (-not $exited) {
            try {
                $killTreeMethod = $process.GetType().GetMethod(
                    "Kill",
                    [System.Reflection.BindingFlags]::Public -bor [System.Reflection.BindingFlags]::Instance,
                    $null,
                    [Type[]]@([bool]),
                    $null
                )
                if ($killTreeMethod) {
                    $null = $killTreeMethod.Invoke($process, @($true))
                }
                else {
                    $process.Kill()
                }
            }
            finally {
                $process.WaitForExit()
            }
        }

        $process.WaitForExit()
        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $stderr = $stderrTask.GetAwaiter().GetResult()
        [System.IO.File]::WriteAllText($EventsPath, $stdout, $script:Utf8NoBom)
        [System.IO.File]::WriteAllText($ProgressPath, $stderr, $script:Utf8NoBom)
        if ($timedOut) {
            throw "Codex exceeded the $Timeout minute timeout and was stopped. See $ProgressPath"
        }

        return [pscustomobject]@{
            ExitCode = $process.ExitCode
            Stdout = $stdout
            Stderr = $stderr
        }
    }
    catch {
        if ($started) {
            try {
                if (-not $process.HasExited) {
                    $process.Kill()
                    $process.WaitForExit()
                }
            }
            catch {
                # Preserve the original execution failure.
            }
        }

        throw
    }
    finally {
        $process.Dispose()
    }
}

function Test-CodexEventStream {
    param(
        [Parameter(Mandatory = $true)]
        [string]$JsonLines
    )

    $turnCompleted = $false
    $failures = @()
    $lineNumber = 0
    foreach ($line in ($JsonLines -split "\r?\n")) {
        $lineNumber++
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $event = $line | ConvertFrom-Json
        }
        catch {
            $failures += "Line $lineNumber is not valid JSON."
            continue
        }

        if ($event.type -eq "turn.completed") {
            $turnCompleted = $true
        }
        elseif ($event.type -eq "turn.failed" -or $event.type -eq "error") {
            $failures += "Codex emitted event '$($event.type)'."
        }
    }

    if (-not $turnCompleted) {
        $failures += "No turn.completed event was emitted."
    }

    return @($failures)
}

function Get-ChangedFiles {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot
    )

    $tracked = Invoke-Git -Arguments @(
        "-C",
        $RepositoryRoot,
        "diff",
        "--name-only",
        "HEAD"
    )
    $untracked = Invoke-Git -Arguments @(
        "-C",
        $RepositoryRoot,
        "ls-files",
        "--others",
        "--exclude-standard"
    )
    return @($tracked.Output + $untracked.Output |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        ForEach-Object { $_.Trim().Replace("\", "/") } |
        Sort-Object -Unique)
}

function Test-CompletedResult {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Result,
        [Parameter(Mandatory = $true)]
        [string]$ExpectedSlice,
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot,
        [Parameter(Mandatory = $true)]
        [string]$ResolvedPlanPath
    )

    $errors = @()
    if (-not (Test-ResultSliceMatch `
        -ActualSlice $Result.slice `
        -ExpectedSlice $ExpectedSlice)) {
        $errors += "Result slice '$($Result.slice)' does not match '$ExpectedSlice'."
    }
    if ($Result.plan_status -ne "Completed") {
        $errors += "The structured result does not report plan status Completed."
    }
    if (@($Result.validations).Count -eq 0) {
        $errors += "The structured result contains no validation commands."
    }
    elseif (@($Result.validations | Where-Object { -not $_.passed }).Count -gt 0) {
        $errors += "At least one reported validation failed."
    }
    if (-not $Result.documents_updated.plan) {
        $errors += "The remediation plan was not reported as updated."
    }
    if (-not $Result.documents_updated.current_state) {
        $errors += "docs/state/current-state.md was not reported as updated."
    }
    if (-not $Result.documents_updated.phase_roadmap) {
        $errors += "docs/roadmap/phase-2.md was not reported as updated."
    }
    if (-not $Result.scope_review.passed) {
        $errors += "The scope review did not pass."
    }
    if (@($Result.scope_review.unexpected_files).Count -gt 0) {
        $errors += "The scope review contains unexpected files."
    }
    if ($Result.blocker) {
        $errors += "A completed result must not contain a blocker."
    }

    $planText = [System.IO.File]::ReadAllText($ResolvedPlanPath)
    $actualSlice = @(Get-PlanSlices -Text $planText) |
        Where-Object { $_.Id -eq $ExpectedSlice } |
        Select-Object -First 1
    if (-not $actualSlice -or $actualSlice.Status -ne "Completed" -or -not $actualSlice.Done) {
        $errors += "The plan does not mark Slice $ExpectedSlice as [x] Completed."
    }

    $changedFiles = @(Get-ChangedFiles -RepositoryRoot $RepositoryRoot)
    $reportedFiles = @($Result.changed_files |
        ForEach-Object { ([string]$_).Trim().Replace("\", "/") } |
        Where-Object { $_ } |
        Sort-Object -Unique)
    foreach ($file in $changedFiles) {
        if ($reportedFiles -notcontains $file) {
            $errors += "Git contains a changed file omitted from the structured result: $file"
        }
    }
    foreach ($file in $reportedFiles) {
        if ($changedFiles -notcontains $file) {
            $errors += "The structured result reports a file not present in Git changes: $file"
        }
    }

    foreach ($requiredPath in @(
        "docs/state/current-state.md",
        "docs/roadmap/phase-2.md"
    )) {
        if ($changedFiles -notcontains $requiredPath) {
            $errors += "$requiredPath is not present in the Git changeset."
        }
    }

    $relativePlan = Get-RepositoryRelativePath `
        -RepositoryRoot $RepositoryRoot `
        -Path $ResolvedPlanPath
    if ($changedFiles -notcontains $relativePlan) {
        $errors += "The remediation plan is not present in the Git changeset."
    }

    $reportPath = $Result.documents_updated.implementation_report
    if ([string]::IsNullOrWhiteSpace($reportPath)) {
        $errors += "No implementation report path was returned."
    }
    else {
        try {
            $resolvedReport = Resolve-RepositoryPath `
                -RepositoryRoot $RepositoryRoot `
                -Path $reportPath
            if (-not (Test-Path -LiteralPath $resolvedReport -PathType Leaf)) {
                $errors += "The implementation report does not exist: $reportPath"
            }
            elseif ($changedFiles -notcontains $reportPath.Replace("\", "/")) {
                $errors += "The implementation report is not present in the Git changeset."
            }
        }
        catch {
            $errors += $_.Exception.Message
        }
    }

    $forbiddenPatterns = @(
        '(^|/)\.dotnet-home/',
        '(^|/)\.nuget/',
        '(^|/)\.npm-cache/',
        '(^|/)node_modules/',
        '(^|/)test-results/',
        '(^|/)playwright-report/',
        '(^|/)blob-report/',
        '(^|/)\.codex-runs/'
    )
    foreach ($file in $changedFiles) {
        foreach ($pattern in $forbiddenPatterns) {
            if ($file -match $pattern) {
                $errors += "Generated or cache file remains in the changeset: $file"
                break
            }
        }
    }

    return @($errors)
}

function Assert-BlockedResult {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Result,
        [Parameter(Mandatory = $true)]
        [string]$ExpectedSlice,
        [Parameter(Mandatory = $true)]
        [string]$ResolvedPlanPath
    )

    if (-not (Test-ResultSliceMatch `
        -ActualSlice $Result.slice `
        -ExpectedSlice $ExpectedSlice)) {
        throw "Blocked result slice '$($Result.slice)' does not match '$ExpectedSlice'."
    }
    if ($Result.plan_status -ne "Blocked" -or [string]::IsNullOrWhiteSpace($Result.blocker)) {
        throw "A blocked result must report plan status Blocked and a concrete blocker."
    }

    $planText = [System.IO.File]::ReadAllText($ResolvedPlanPath)
    $actualSlice = @(Get-PlanSlices -Text $planText) |
        Where-Object { $_.Id -eq $ExpectedSlice } |
        Select-Object -First 1
    if (-not $actualSlice -or $actualSlice.Status -ne "Blocked") {
        throw "The plan does not mark Slice $ExpectedSlice as Blocked."
    }
}

function Test-RepairResult {
    param(
        [Parameter(Mandatory = $true)]
        [object]$Result,
        [Parameter(Mandatory = $true)]
        [string]$ExpectedSlice,
        [Parameter(Mandatory = $true)]
        [int]$ExpectedFailedAttempt
    )

    $errors = @()
    if (-not (Test-ResultSliceMatch `
        -ActualSlice $Result.slice `
        -ExpectedSlice $ExpectedSlice)) {
        $errors += "Repair result slice '$($Result.slice)' does not match '$ExpectedSlice'."
    }
    if ([int]$Result.failed_attempt -ne $ExpectedFailedAttempt) {
        $errors += (
            "Repair result attempt '$($Result.failed_attempt)' does not match " +
            "'$ExpectedFailedAttempt'."
        )
    }

    switch ([string]$Result.outcome) {
        "fixed" {
            if (@($Result.validations).Count -eq 0) {
                $errors += "A fixed repair contains no focused validation."
            }
            elseif (@(
                $Result.validations |
                    Where-Object { -not $_.passed }
            ).Count -gt 0) {
                $errors += "A fixed repair reports a failed validation."
            }
            if ($Result.blocker) {
                $errors += "A fixed repair must not contain a blocker."
            }
        }
        "blocked" {
            if ([string]::IsNullOrWhiteSpace([string]$Result.blocker)) {
                $errors += "A blocked repair must contain a concrete blocker."
            }
        }
        "unresolved" {
            # A subsequent full slice attempt remains the authority.
        }
        default {
            $errors += "Unsupported repair outcome: $($Result.outcome)"
        }
    }

    return @($errors)
}

function New-SliceCommit {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepositoryRoot,
        [Parameter(Mandatory = $true)]
        [object]$Slice
    )

    $null = Invoke-Git -Arguments @("-C", $RepositoryRoot, "add", "--all")
    $message = "Complete remediation Slice $($Slice.Id) - $($Slice.Title)"
    $null = Invoke-Git -Arguments @("-C", $RepositoryRoot, "commit", "-m", $message)

    $remaining = Invoke-Git -Arguments @(
        "-C",
        $RepositoryRoot,
        "status",
        "--porcelain",
        "--untracked-files=all"
    )
    if ($remaining.Output.Count -gt 0) {
        throw "The worktree is not clean after committing Slice $($Slice.Id)."
    }
}

$repositoryRoot = Get-RepositoryRoot
$resolvedPlanPath = Resolve-RepositoryPath `
    -RepositoryRoot $repositoryRoot `
    -Path $PlanPath
$templatePath = Resolve-RepositoryPath `
    -RepositoryRoot $repositoryRoot `
    -Path "tools/remediation/prompts/implement-slice.md"
$repairTemplatePath = Resolve-RepositoryPath `
    -RepositoryRoot $repositoryRoot `
    -Path "tools/remediation/prompts/repair-slice-failure.md"
$schemaPath = Resolve-RepositoryPath `
    -RepositoryRoot $repositoryRoot `
    -Path "tools/remediation/slice-result.schema.json"
$repairSchemaPath = Resolve-RepositoryPath `
    -RepositoryRoot $repositoryRoot `
    -Path "tools/remediation/repair-result.schema.json"
$resolvedRunDirectory = Resolve-RepositoryPath `
    -RepositoryRoot $repositoryRoot `
    -Path $RunDirectory

foreach ($requiredFile in @(
    $resolvedPlanPath,
    $templatePath,
    $repairTemplatePath,
    $schemaPath,
    $repairSchemaPath
)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required file was not found: $requiredFile"
    }
}

$planText = [System.IO.File]::ReadAllText($resolvedPlanPath)
$slices = @(Get-PlanSlices -Text $planText)
$requestedStartIndex = if ($StartSlice) {
    Get-SliceIndex -Slices $slices -SliceId $StartSlice
}
else {
    0
}
$endIndex = if ($EndSlice) {
    Get-SliceIndex -Slices $slices -SliceId $EndSlice
}
else {
    $slices.Count - 1
}
if ($endIndex -lt $requestedStartIndex) {
    throw "End Slice $EndSlice occurs before Start Slice $StartSlice."
}

$currentIndex = Select-InitialSliceIndex -Slices $slices -RequestedStart $StartSlice
if ($currentIndex -lt 0) {
    Write-Host "No incomplete slice was found at or after the requested start."
    exit 0
}
if ($endIndex -lt $currentIndex) {
    Write-Host "No incomplete slice was found inside the requested range."
    exit 0
}

$selected = $slices[$currentIndex]

$template = [System.IO.File]::ReadAllText($templatePath)
$repairTemplate = [System.IO.File]::ReadAllText($repairTemplatePath)
$relativePlanPath = Get-RepositoryRelativePath `
    -RepositoryRoot $repositoryRoot `
    -Path $resolvedPlanPath
$previewPrompt = Expand-PromptTemplate -Template $template -Values @{
    REPOSITORY_ROOT = $repositoryRoot
    PLAN_PATH = $relativePlanPath
    SLICE_ID = $selected.Id
    SLICE_TITLE = $selected.Title
    SLICE_TEXT = $selected.Raw
    ATTEMPT_NUMBER = 1
    MAX_ATTEMPTS = $MaxAttemptsPerSlice
    RECOVERY_CONTEXT = "This is the first attempt. No prior failure evidence exists."
}

Write-Host "Selected Slice $($selected.Id) - $($selected.Title)"
Write-Host "Current status: $($selected.Status)"
Write-Host "Mode: $(if ($Execute) { 'execute' } else { 'dry run' })"
Write-Host "Maximum slices: $MaxSlices"
Write-Host "Maximum attempts per slice: $MaxAttemptsPerSlice"
if ($EndSlice) {
    Write-Host "End boundary: Slice $EndSlice"
}
if ($ShowPrompt) {
    Write-Host ""
    Write-Host $previewPrompt
}

if (-not $Execute) {
    Write-Host ""
    Write-Host "Dry run only. Add -Execute to invoke Codex."
    exit 0
}

if ($MaxSlices -gt 1 -and -not $CommitAfterSlice) {
    throw "Multi-slice execution requires -CommitAfterSlice so every new Codex run starts from a clean, auditable baseline."
}
if ($Sandbox -eq "read-only") {
    throw "Execution cannot update the plan or implementation files with a read-only sandbox."
}

$initialStatus = Invoke-Git -Arguments @(
    "-C",
    $repositoryRoot,
    "status",
    "--porcelain",
    "--untracked-files=all"
)
if ($initialStatus.Output.Count -gt 0 -and -not $AllowDirtyWorkingTree) {
    throw @"
The worktree is not clean. Commit or otherwise resolve the existing changes before unattended execution.
Use -AllowDirtyWorkingTree only for a deliberate recovery run; multi-slice execution remains unsafe from a dirty baseline.
"@
}
if ($initialStatus.Output.Count -gt 0 -and $MaxSlices -gt 1) {
    throw "Multi-slice execution is not allowed from a dirty working tree, even with -AllowDirtyWorkingTree."
}
if ($initialStatus.Output.Count -gt 0 -and $CommitAfterSlice) {
    throw "A dirty recovery run cannot use -CommitAfterSlice because that could commit pre-existing user changes."
}

$codexExecutable = Resolve-ExecutablePath -Command $CodexCommand
$codexChildPathEntries = @(Get-CodexChildPathEntries)
[System.IO.Directory]::CreateDirectory($resolvedRunDirectory) | Out-Null
$lockPath = Join-Path $resolvedRunDirectory "orchestrator.lock"
$lockStream = $null
$ownsLock = $false

try {
    try {
        $lockStream = [System.IO.File]::Open(
            $lockPath,
            [System.IO.FileMode]::CreateNew,
            [System.IO.FileAccess]::Write,
            [System.IO.FileShare]::None
        )
        $ownsLock = $true
        $lockWriter = New-Object System.IO.StreamWriter($lockStream, $script:Utf8NoBom)
        $lockWriter.WriteLine("PID=$PID")
        $lockWriter.WriteLine("Started=$([DateTimeOffset]::Now.ToString('o'))")
        $lockWriter.Flush()
    }
    catch {
        throw "Another remediation orchestrator may be running. Lock file: $lockPath"
    }

    $completedCount = 0
    while ($completedCount -lt $MaxSlices -and $currentIndex -le $endIndex) {
        $planText = [System.IO.File]::ReadAllText($resolvedPlanPath)
        $slices = @(Get-PlanSlices -Text $planText)
        $slice = $slices[$currentIndex]

        if ($slice.Status -eq "Completed") {
            $currentIndex++
            continue
        }

        $attemptNumber = 0
        $attemptFailures = @()
        $slicePassed = $false

        while (-not $slicePassed -and $attemptNumber -lt $MaxAttemptsPerSlice) {
            $attemptNumber++
            if ($attemptNumber -eq 1) {
                Set-SliceInProgress `
                    -ResolvedPlanPath $resolvedPlanPath `
                    -SliceId $slice.Id
            }
            else {
                Reset-SliceForRetry `
                    -ResolvedPlanPath $resolvedPlanPath `
                    -SliceId $slice.Id
            }

            $planText = [System.IO.File]::ReadAllText($resolvedPlanPath)
            $slices = @(Get-PlanSlices -Text $planText)
            $slice = $slices[$currentIndex]

            $recoveryContext = if ($attemptFailures.Count -eq 0) {
                "This is the first attempt. No prior failure evidence exists."
            }
            else {
                $latestFailure = $attemptFailures[-1]
                @"
This is recovery attempt $attemptNumber of $MaxAttemptsPerSlice for the same slice.
The prior attempt failed. Diagnose and repair its root cause before repeating the incomplete work or validation.

Prior failure: $($latestFailure.Reason)
Failure report: $($latestFailure.FailureReport)
Prompt: $($latestFailure.Prompt)
Structured result: $($latestFailure.Result)
Event log: $($latestFailure.Events)
Progress log: $($latestFailure.Progress)
Repair outcome: $($latestFailure.RepairOutcome)
Repair report: $($latestFailure.RepairReport)

Preserve valid existing changes. Inspect the current worktree and the retained evidence instead of restarting blindly. If the blocker can be fixed inside the authorized repository and environment, fix it and complete the slice. Return blocked again only when the remaining condition genuinely requires user input, new authority, or an external-state change.
If the repair report proves that the parent successfully ran pinned NSwag twice, treat that parent command as valid execution evidence and do not rerun it inside the restricted child sandbox.
"@
            }

            $prompt = Expand-PromptTemplate -Template $template -Values @{
                REPOSITORY_ROOT = $repositoryRoot
                PLAN_PATH = $relativePlanPath
                SLICE_ID = $slice.Id
                SLICE_TITLE = $slice.Title
                SLICE_TEXT = $slice.Raw
                ATTEMPT_NUMBER = $attemptNumber
                MAX_ATTEMPTS = $MaxAttemptsPerSlice
                RECOVERY_CONTEXT = $recoveryContext
            }

            $timestamp = Get-Date -Format "yyyyMMdd-HHmmssfff"
            $safeSlice = $slice.Id.Replace(".", "-")
            $runName = "$timestamp-slice-$safeSlice-attempt-$attemptNumber"
            $promptPath = Join-Path $resolvedRunDirectory "$runName-prompt.md"
            $resultPath = Join-Path $resolvedRunDirectory "$runName-result.json"
            $eventsPath = Join-Path $resolvedRunDirectory "$runName-events.jsonl"
            $progressPath = Join-Path $resolvedRunDirectory "$runName-progress.log"
            $manifestPath = Join-Path $resolvedRunDirectory "$runName-manifest.json"
            $failureReportPath = Join-Path $resolvedRunDirectory "$runName-failure.json"

            [System.IO.File]::WriteAllText(
                $promptPath,
                $prompt,
                $script:Utf8NoBom
            )
            $head = Invoke-Git -Arguments @(
                "-C",
                $repositoryRoot,
                "rev-parse",
                "HEAD"
            )
            [pscustomobject]@{
                slice = $slice.Id
                title = $slice.Title
                attempt = $attemptNumber
                maximum_attempts = $MaxAttemptsPerSlice
                started_at = [DateTimeOffset]::Now.ToString("o")
                head = ($head.Output | Select-Object -First 1)
                plan = $relativePlanPath
                sandbox = $Sandbox
                timeout_minutes = $TimeoutMinutes
                model = if ($Model) { $Model } else { $null }
            } | ConvertTo-Json -Depth 5 |
                ForEach-Object {
                    [System.IO.File]::WriteAllText(
                        $manifestPath,
                        $_,
                        $script:Utf8NoBom
                    )
                }

            Write-Host ""
            Write-Host (
                "Starting Codex for Slice {0}, attempt {1} of {2}." -f
                    $slice.Id,
                    $attemptNumber,
                    $MaxAttemptsPerSlice
            )
            Write-Host "Run log prefix: $runName"

            $attemptFailure = $null
            $result = $null
            $resultOutcome = $null
            try {
                Write-Host (
                    "Running the .NET restore gate outside the child sandbox."
                )
                try {
                    Invoke-ParentDotNetRestore -RepositoryRoot $repositoryRoot
                }
                catch {
                    $restoreFailure = $_.Exception.Message
                    Write-Warning (
                        "The parent .NET restore gate failed. Codex will receive " +
                        "the failure and may diagnose or repair the environment: " +
                        $restoreFailure
                    )
                    $prompt += @"

## Parent preflight failure

The parent orchestrator could not complete `dotnet restore HomeOps.sln` before this attempt:

$restoreFailure

Treat this as part of the attempt. Diagnose and repair it if possible within the authorized repository and environment. Do not claim the restore gate passed unless you subsequently ran it successfully.
"@
                    [System.IO.File]::WriteAllText(
                        $promptPath,
                        $prompt,
                        $script:Utf8NoBom
                    )
                }

                $processResult = Invoke-CodexSlice `
                    -Executable $codexExecutable `
                    -RepositoryRoot $repositoryRoot `
                    -Prompt $prompt `
                    -SchemaPath $schemaPath `
                    -ResultPath $resultPath `
                    -EventsPath $eventsPath `
                    -ProgressPath $progressPath `
                    -SandboxMode $Sandbox `
                    -Timeout $TimeoutMinutes `
                    -RequestedModel $Model `
                    -AdditionalPathEntries $codexChildPathEntries

                if ($processResult.ExitCode -ne 0) {
                    throw "Codex exited with code $($processResult.ExitCode). See $progressPath"
                }

                $eventErrors = @(
                    Test-CodexEventStream -JsonLines $processResult.Stdout
                )
                if ($eventErrors.Count -gt 0) {
                    throw "Codex event validation failed:`n- $($eventErrors -join "`n- ")"
                }
                if (-not (
                    Test-Path -LiteralPath $resultPath -PathType Leaf
                )) {
                    throw "Codex did not write its structured result: $resultPath"
                }

                try {
                    $result = [System.IO.File]::ReadAllText($resultPath) |
                        ConvertFrom-Json
                }
                catch {
                    throw "Codex wrote an invalid structured result: $resultPath"
                }

                $resultOutcome = [string]$result.outcome
                switch ($resultOutcome) {
                    "completed" {
                        $completionErrors = @(
                            Test-CompletedResult `
                                -Result $result `
                                -ExpectedSlice $slice.Id `
                                -RepositoryRoot $repositoryRoot `
                                -ResolvedPlanPath $resolvedPlanPath
                        )
                        if ($completionErrors.Count -gt 0) {
                            throw "Completion gate failed:`n- $($completionErrors -join "`n- ")"
                        }

                        $slicePassed = $true
                    }
                    "blocked" {
                        Assert-BlockedResult `
                            -Result $result `
                            -ExpectedSlice $slice.Id `
                            -ResolvedPlanPath $resolvedPlanPath
                        throw "Codex reported Slice $($slice.Id) as blocked: $($result.blocker)"
                    }
                    "failed" {
                        throw "Codex reported Slice $($slice.Id) as failed: $($result.summary)"
                    }
                    default {
                        throw "Codex returned an unsupported outcome: $resultOutcome"
                    }
                }
            }
            catch {
                $attemptFailure = $_.Exception.Message
            }

            if ($slicePassed) {
                Write-Host (
                    "Slice {0} passed every orchestration gate on attempt {1}." -f
                        $slice.Id,
                        $attemptNumber
                )
                $completedCount++
                if ($CommitAfterSlice) {
                    New-SliceCommit `
                        -RepositoryRoot $repositoryRoot `
                        -Slice $slice
                    Write-Host "Committed Slice $($slice.Id)."
                }
                break
            }

            $failureRecord = [pscustomobject]@{
                Slice = $slice.Id
                Attempt = $attemptNumber
                Reason = $attemptFailure
                FailureReport = $failureReportPath
                Prompt = $promptPath
                Result = $resultPath
                Events = $eventsPath
                Progress = $progressPath
                RepairOutcome = "not_run"
                RepairReport = $null
            }
            $attemptFailures += $failureRecord
            [pscustomobject]@{
                slice = $slice.Id
                title = $slice.Title
                attempt = $attemptNumber
                maximum_attempts = $MaxAttemptsPerSlice
                failed_at = [DateTimeOffset]::Now.ToString("o")
                outcome = if ($resultOutcome) {
                    $resultOutcome
                }
                else {
                    "orchestrator_error"
                }
                reason = $attemptFailure
                evidence = [pscustomobject]@{
                    prompt = $promptPath
                    result = $resultPath
                    events = $eventsPath
                    progress = $progressPath
                    manifest = $manifestPath
                }
            } | ConvertTo-Json -Depth 6 |
                ForEach-Object {
                    [System.IO.File]::WriteAllText(
                        $failureReportPath,
                        $_,
                        $script:Utf8NoBom
                    )
                }

            Write-Warning (
                "Slice {0} attempt {1} of {2} failed: {3}" -f
                    $slice.Id,
                    $attemptNumber,
                    $MaxAttemptsPerSlice,
                    $attemptFailure
            )
            Write-Host "Failure report: $failureReportPath"

            if ($attemptNumber -ge $MaxAttemptsPerSlice) {
                if ($resultOutcome -ne "blocked") {
                    Reset-SliceForRetry `
                        -ResolvedPlanPath $resolvedPlanPath `
                        -SliceId $slice.Id
                }
                throw (
                    (
                        "Slice {0} failed {1} times. The orchestrator stopped. Latest failure: {2}. Failure report: {3}"
                    ) -f
                    $slice.Id,
                    $MaxAttemptsPerSlice,
                    $attemptFailure,
                    $failureReportPath
                )
            }

            Reset-SliceForRetry `
                -ResolvedPlanPath $resolvedPlanPath `
                -SliceId $slice.Id

            $parentRepairReportPath = Join-Path $resolvedRunDirectory (
                "$runName-parent-repair.json"
            )
            $parentRepairEvidence = (
                "No allowlisted parent repair was required for this failure."
            )
            $repairWasFixed = $false

            if (Test-ParentNSwagRepairRequired `
                -FailureReason $attemptFailure `
                -Result $result) {
                Write-Host (
                    (
                        "Starting parent repair for Slice {0} after attempt {1}: pinned NSwag generation."
                    ) -f
                        $slice.Id,
                        $attemptNumber
                )
                try {
                    $parentRepair = Invoke-ParentNSwagRepair `
                        -RepositoryRoot $repositoryRoot `
                        -AdditionalPathEntries $codexChildPathEntries
                    [pscustomobject]@{
                        slice = $slice.Id
                        failed_attempt = $attemptNumber
                        outcome = "fixed"
                        action = $parentRepair.Action
                        command = $parentRepair.Command
                        passed = $parentRepair.Passed
                        summary = $parentRepair.Summary
                    } | ConvertTo-Json -Depth 5 |
                        ForEach-Object {
                            [System.IO.File]::WriteAllText(
                                $parentRepairReportPath,
                                $_,
                                $script:Utf8NoBom
                            )
                        }
                    $parentRepairEvidence = (
                        "Passed parent repair. Report: " +
                        $parentRepairReportPath +
                        ". " +
                        $parentRepair.Summary
                    )
                    $repairWasFixed = $true
                    $failureRecord.RepairOutcome = "fixed"
                    $failureRecord.RepairReport = $parentRepairReportPath
                    Write-Host $parentRepair.Summary
                }
                catch {
                    $parentRepairFailure = $_.Exception.Message
                    [pscustomobject]@{
                        slice = $slice.Id
                        failed_attempt = $attemptNumber
                        outcome = "unresolved"
                        action = "parent_nswag_generation"
                        command = "pnpm dlx nswag@14.7.1 run nswag.json"
                        passed = $false
                        summary = $parentRepairFailure
                    } | ConvertTo-Json -Depth 5 |
                        ForEach-Object {
                            [System.IO.File]::WriteAllText(
                                $parentRepairReportPath,
                                $_,
                                $script:Utf8NoBom
                            )
                        }
                    $parentRepairEvidence = (
                        "Parent repair failed. Report: " +
                        $parentRepairReportPath +
                        ". Failure: " +
                        $parentRepairFailure
                    )
                    Write-Warning $parentRepairEvidence
                }
            }

            if (-not $repairWasFixed) {
                $repairName = "$runName-repair"
                $repairPromptPath = Join-Path $resolvedRunDirectory (
                    "$repairName-prompt.md"
                )
                $repairResultPath = Join-Path $resolvedRunDirectory (
                    "$repairName-result.json"
                )
                $repairEventsPath = Join-Path $resolvedRunDirectory (
                    "$repairName-events.jsonl"
                )
                $repairProgressPath = Join-Path $resolvedRunDirectory (
                    "$repairName-progress.log"
                )
                $repairFailurePath = Join-Path $resolvedRunDirectory (
                    "$repairName-failure.json"
                )
                $repairPrompt = Expand-PromptTemplate `
                    -Template $repairTemplate `
                    -Values @{
                        REPOSITORY_ROOT = $repositoryRoot
                        PLAN_PATH = $relativePlanPath
                        SLICE_ID = $slice.Id
                        SLICE_TITLE = $slice.Title
                        FAILED_ATTEMPT = $attemptNumber
                        MAX_ATTEMPTS = $MaxAttemptsPerSlice
                        FAILURE_REASON = $attemptFailure
                        FAILURE_REPORT = $failureReportPath
                        FAILED_PROMPT = $promptPath
                        FAILED_RESULT = $resultPath
                        FAILED_EVENTS = $eventsPath
                        FAILED_PROGRESS = $progressPath
                        PARENT_REPAIR_EVIDENCE = $parentRepairEvidence
                    }
                [System.IO.File]::WriteAllText(
                    $repairPromptPath,
                    $repairPrompt,
                    $script:Utf8NoBom
                )

                Write-Host (
                    (
                        "Starting dedicated repair for Slice {0} after failed attempt {1}."
                    ) -f
                        $slice.Id,
                        $attemptNumber
                )
                $repairFailure = $null
                $repairResult = $null
                try {
                    $repairProcessResult = Invoke-CodexSlice `
                        -Executable $codexExecutable `
                        -RepositoryRoot $repositoryRoot `
                        -Prompt $repairPrompt `
                        -SchemaPath $repairSchemaPath `
                        -ResultPath $repairResultPath `
                        -EventsPath $repairEventsPath `
                        -ProgressPath $repairProgressPath `
                        -SandboxMode $Sandbox `
                        -Timeout $TimeoutMinutes `
                        -RequestedModel $Model `
                        -AdditionalPathEntries $codexChildPathEntries

                    if ($repairProcessResult.ExitCode -ne 0) {
                        throw (
                            "Repair Codex exited with code " +
                            "$($repairProcessResult.ExitCode). See " +
                            $repairProgressPath
                        )
                    }
                    $repairEventErrors = @(
                        Test-CodexEventStream `
                            -JsonLines $repairProcessResult.Stdout
                    )
                    if ($repairEventErrors.Count -gt 0) {
                        throw (
                            "Repair event validation failed:`n- " +
                            ($repairEventErrors -join "`n- ")
                        )
                    }
                    if (-not (
                        Test-Path `
                            -LiteralPath $repairResultPath `
                            -PathType Leaf
                    )) {
                        throw (
                            "Repair Codex did not write its structured result: " +
                            $repairResultPath
                        )
                    }

                    try {
                        $repairResult = [System.IO.File]::ReadAllText(
                            $repairResultPath
                        ) | ConvertFrom-Json
                    }
                    catch {
                        throw (
                            "Repair Codex wrote an invalid structured result: " +
                            $repairResultPath
                        )
                    }

                    $repairErrors = @(
                        Test-RepairResult `
                            -Result $repairResult `
                            -ExpectedSlice $slice.Id `
                            -ExpectedFailedAttempt $attemptNumber
                    )
                    if ($repairErrors.Count -gt 0) {
                        throw (
                            "Repair result validation failed:`n- " +
                            ($repairErrors -join "`n- ")
                        )
                    }

                    $failureRecord.RepairOutcome = [string]$repairResult.outcome
                    $failureRecord.RepairReport = $repairResultPath
                    $repairWasFixed = $repairResult.outcome -eq "fixed"
                }
                catch {
                    $repairFailure = $_.Exception.Message
                    [pscustomobject]@{
                        slice = $slice.Id
                        failed_attempt = $attemptNumber
                        outcome = "unresolved"
                        failed_at = [DateTimeOffset]::Now.ToString("o")
                        reason = $repairFailure
                        evidence = [pscustomobject]@{
                            prompt = $repairPromptPath
                            result = $repairResultPath
                            events = $repairEventsPath
                            progress = $repairProgressPath
                            parent_repair = $parentRepairReportPath
                        }
                    } | ConvertTo-Json -Depth 6 |
                        ForEach-Object {
                            [System.IO.File]::WriteAllText(
                                $repairFailurePath,
                                $_,
                                $script:Utf8NoBom
                            )
                        }
                    $failureRecord.RepairOutcome = "unresolved"
                    $failureRecord.RepairReport = $repairFailurePath
                    Write-Warning (
                        "Dedicated repair did not resolve the failure: " +
                        $repairFailure
                    )
                }
            }

            Write-Host (
                (
                    "Repair phase finished with outcome '{0}'. Starting a fresh Slice {1} attempt next."
                ) -f
                    $failureRecord.RepairOutcome,
                    $slice.Id
            )
        }

        if ($currentIndex -eq $endIndex) {
            break
        }
        $currentIndex++
    }

    Write-Host ""
    Write-Host "Orchestration finished after $completedCount completed slice(s)."
}
finally {
    if ($lockStream) {
        $lockStream.Dispose()
    }
    if ($ownsLock -and (Test-Path -LiteralPath $lockPath)) {
        Remove-Item -LiteralPath $lockPath -Force
    }
}
