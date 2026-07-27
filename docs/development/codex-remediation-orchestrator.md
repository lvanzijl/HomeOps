# Codex remediation-plan orchestrator

`tools/remediation/Invoke-RemediationPlan.ps1` runs one remediation-plan slice per non-interactive Codex CLI process. It waits for that process, validates its machine-readable result, and advances only after the slice is documented and marked completed.

The orchestrator is intentionally conservative:

- dry-run is the default;
- execution requires an explicit `-Execute`;
- the Git worktree must be clean by default;
- every slice receives a fresh `codex exec` process;
- exit code zero is insufficient on its own;
- the JSONL stream must contain `turn.completed` and no failure event;
- the final result must satisfy `slice-result.schema.json`;
- completed slices must update the plan, current state, Phase 2 roadmap, and a focused implementation report;
- reported validation and scope review must pass;
- a blocked or failed slice stops the sequence;
- run prompts, event streams, progress, results, and manifests are stored under ignored `.codex-runs/`;
- the script never pushes or opens a pull request.

## Prerequisites

1. Install the Codex CLI and authenticate it.
2. Run the command from the HomeOps repository.
3. Commit or otherwise resolve existing changes before execution.
4. Make sure the commands needed by the selected slice can run without interactive approval. The orchestrator uses `workspace-write` and approval policy `never`; an operation requiring broader permission fails the slice instead of pausing unattended.
5. Provision dependencies and any safe test infrastructure needed by the slice.

Use API-key authentication only when the execution environment requires it. Scope `CODEX_API_KEY` to the single process and do not expose it to untrusted repository commands.

## Dry-run example

This parses the plan, skips the already completed Slice 2.2, selects Slice 2.3, and prints what would run. It does not edit files or invoke Codex:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\remediation\Invoke-RemediationPlan.ps1 `
  -StartSlice 2.2 `
  -EndSlice 2.6 `
  -MaxSlices 1
```

Add `-ShowPrompt` to inspect the complete generated prompt.

## Execute one slice

After establishing a clean Git baseline:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\remediation\Invoke-RemediationPlan.ps1 `
  -StartSlice 2.3 `
  -EndSlice 2.3 `
  -MaxSlices 1 `
  -Execute
```

The script leaves the completed slice changes uncommitted for manual review.

## Execute the remaining Phase 2 sequence

Multi-slice execution requires `-CommitAfterSlice`. Each successful slice is staged and committed before the next Codex process starts:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\remediation\Invoke-RemediationPlan.ps1 `
  -StartSlice 2.3 `
  -EndSlice 2.6 `
  -MaxSlices 4 `
  -Execute `
  -CommitAfterSlice
```

The checked-in example wrapper performs the same dry run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\remediation\run-phase-2.example.ps1
```

Add `-Execute` to the wrapper to run and commit the four-slice sequence:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\remediation\run-phase-2.example.ps1 -Execute
```

Review the plan and Git history before using the execution form. The example does not push its commits.

## Selection and stopping behavior

- Without `-StartSlice`, the first `In progress` slice is selected; otherwise the first `Not started` slice is selected.
- When `-StartSlice` already names a completed slice, selection advances to the first incomplete slice after it.
- `-EndSlice` is inclusive.
- `-MaxSlices` limits successful executions even when the end boundary is later.
- A plan status of `Blocked` is never skipped.
- On CLI failure, timeout, malformed JSON, failed validation, missing documentation, or scope-review failure, the script exits and leaves the slice `In progress`.
- A legitimate blocked result must mark the plan `Blocked` and include a concrete blocker.

## Recovery

Inspect the matching files in `.codex-runs/`:

- `*-prompt.md`: exact prompt sent through stdin;
- `*-events.jsonl`: machine-readable Codex event stream;
- `*-progress.log`: CLI progress and diagnostic output;
- `*-result.json`: schema-constrained final response;
- `*-manifest.json`: slice, starting commit, sandbox, timeout, and model.

Resolve the cause, return the worktree to a deliberate baseline, and rerun from the same slice. `-AllowDirtyWorkingTree` exists only for a deliberate single-slice recovery. It is never accepted for a multi-slice run and cannot be combined with `-CommitAfterSlice`, so pre-existing user changes cannot be swept into an automatic commit.

The lock file `.codex-runs/orchestrator.lock` prevents concurrent orchestrators. It is removed on normal exit and handled failure. If the host terminates abruptly, verify that no orchestrator remains before deleting the stale lock manually.
