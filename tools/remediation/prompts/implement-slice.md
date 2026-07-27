You are executing exactly one implementation slice from the HomeOps product-integrity remediation plan.

Repository root: {{REPOSITORY_ROOT}}
Plan path: {{PLAN_PATH}}
Slice: {{SLICE_ID}} — {{SLICE_TITLE}}
Orchestration attempt: {{ATTEMPT_NUMBER}} of {{MAX_ATTEMPTS}}

{{RECOVERY_CONTEXT}}

Read and follow every applicable AGENTS.md instruction before doing any work. Treat the slice text below as the complete feature boundary for this run. Do not implement a later slice, perform opportunistic refactoring, or alter unrelated user changes.

Required workflow:

1. Re-read the referenced audit finding and inspect the files named by the slice.
2. Confirm the plan currently marks this slice In progress.
3. If the Viewport-First Workflow applies, obey its analysis and approval requirements before implementation. If implementation cannot legally proceed in this run, document the blocker and return a blocked outcome.
4. Implement only this slice, including focused regression coverage where practical.
5. Run the slice-specific validation and every applicable common release gate. Do not report a command as passed unless it actually ran and passed.
6. Inspect the complete Git changeset for unrelated edits, repository-local caches, generated artifacts, binaries, screenshots, and scope expansion.
7. Update:
   - the slice status and implementation state in the remediation plan;
   - docs/state/current-state.md;
   - docs/roadmap/phase-2.md;
   - a focused implementation report under docs/reports/.
8. Mark the slice Completed only if implementation, validation, documentation, and scope review all pass.
9. If blocked, mark it Blocked and document the concrete blocker and required decision. If work simply fails or remains incomplete, leave it In progress.
10. Do not create a commit, push, open a pull request, or start another slice. The parent PowerShell orchestrator owns sequencing and optional commits.

On a recovery attempt, preserve valid work from earlier attempts. Start by reading the supplied failure report and retained logs, inspect the current worktree, identify the root cause, and repair it before repeating the incomplete validation. Do not merely repeat the same command without addressing the reported cause.

Repository toolchain commands:

- The orchestrator adds the bundled Node and pnpm directories to `PATH`.
- The parent orchestrator attempts `dotnet restore HomeOps.sln` outside the child sandbox immediately before this run. If that preflight fails, the failure is appended to this prompt for diagnosis. When no failure is appended, do not repeat restore unless this slice changes a project or package dependency file; use `--no-restore` for the normal build.
- Generate contracts with `pnpm dlx nswag@14.7.1 run nswag.json`; do not substitute `npx` or unpinned `pnpm exec`.
- Run NSwag a second time and verify that `src/HomeOps.Contracts/openapi.json` and `src/HomeOps.Client/src/api/homeOpsApiClient.ts` do not change.

Your final response must conform exactly to the supplied JSON schema.
Set `slice` to exactly `{{SLICE_ID}}`; return the ID only, without the title.

Outcome rules:

- `completed`: all acceptance criteria and required validation passed; all required documents were updated; the plan says Completed; scope review passed.
- `blocked`: further work requires a user decision, new authority, an external-state change, or a revised viewport analysis; the plan says Blocked and the blocker is documented.
- `failed`: the run could not complete for another reason; the plan remains In progress.

For `documents_updated.implementation_report`, return a repository-relative Markdown file path, or null when no report could be created. List every validation command that actually ran. Set a failed validation's `passed` value to false. List repository-relative paths in `changed_files`.

## Slice contract

{{SLICE_TEXT}}
