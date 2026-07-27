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

## Repair-before-retry follow-up

The initial bounded loop passed failure context directly to another full slice attempt. It did not guarantee a distinct repair action first. Slice 3.1 exposed why that was insufficient: the child sandbox could not access the user pnpm profile for NSwag, and a later successful slice result was then rejected because Git's harmless LF/CRLF stderr warning was treated as a terminating error.

The corrected lifecycle is:

1. Run a full slice attempt.
2. On failure, write the slice failure report.
3. Reset the slice to `In progress`.
4. Run and report a distinct repair phase.
5. Launch a fresh full slice attempt only after repair finishes.
6. Stop after the third failed full slice attempt; repair runs do not consume attempts.

The repair phase has two bounded paths:

- A recognized NSwag/pnpm profile failure invokes an allowlisted parent action. It runs exactly `pnpm dlx nswag@14.7.1 run nswag.json` twice and compares SHA-256 hashes after both runs. The next child receives the parent report as actual validation evidence and does not retry the inaccessible command.
- Other failures launch a fresh Codex process with a dedicated repair prompt and schema. It may diagnose and repair the reported root cause, but it may not complete the slice, advance the plan, or commit.

Git execution now captures stdout and stderr separately through `ProcessStartInfo`. Exit code remains authoritative; warnings are available as diagnostics but can never enter the changed-file list.

Follow-up validation passed:

- PowerShell parser and Slice 3.1 dry-run selection.
- Forced-failure sequencing: three full slice attempts, exactly two repair processes between them, three slice failure reports, two repair failure reports, and terminal stop.
- Real allowlisted parent NSwag repair: both pinned runs passed and OpenAPI/client hashes remained unchanged.
- Git warning separation: exit code zero, changed paths contained no warning text, and three line-ending warnings remained available only in `ErrorOutput`.
