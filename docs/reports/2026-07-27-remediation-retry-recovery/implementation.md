# Remediation orchestrator bounded recovery

## Result

The unattended remediation runner now gives each slice up to three attempts by default through `MaxAttemptsPerSlice`. A failed, blocked, malformed, timed-out, or completion-gate-rejected attempt cannot advance or commit the slice.

Every failed attempt writes an ignored `*-failure.json` report beside its prompt, structured result, JSONL events, progress log, and manifest. A fresh Codex process receives the latest failure reason and evidence paths on the next attempt. Its prompt requires root-cause diagnosis, preservation of valid work, repair of recoverable implementation or environment failures, and rerunning the same slice.

Blocked and invalid-completion plan statuses are normalized to `In progress` before recovery. A genuine blocker can be reported again, but it stops the run only after the configured attempt limit. Parent `dotnet restore` failures are appended to the child prompt instead of preventing the recovery process from starting. Per-slice commits remain owned by the parent and occur only after all completion gates pass.

## Validation

- PowerShell parser: passed with no syntax errors.
- Dry run for Slice 3.2: selected the correct slice and printed the three-attempt limit.
- Isolated forced-failure simulation: passed. It launched exactly three attempts, wrote three failure reports, supplied prior evidence to exactly two recovery prompts, appended the simulated parent preflight failure to all three prompts, returned a non-zero exit, and emitted the terminal three-failure stop.

The simulation used only ignored `.codex-runs` fixtures, which were removed afterward. No remediation product slice was executed or committed by the test.
