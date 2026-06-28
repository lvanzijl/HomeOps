# Environment Validation — FamilyBoard Visual Regression Review

**Comparison cannot be performed because the current application state is not equivalent to the baseline screenshot state.**

## Preflight

- Required instructions read: `.github/copilot-instructions.md`.
- Referenced instruction files: none referenced by `.github/copilot-instructions.md`.
- Repository instructions read: `AGENTS.md`.
- Required command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

## Baseline Discovery

- Selected baseline directory: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/`
- Screenshot count: 10
- Required screenshot set: present.

### Baseline Screenshot Files

1. `01-home.png`
2. `02-agenda-month.png`
3. `03-agenda-week.png`
4. `04-agenda-list.png`
5. `05-tasks.png`
6. `06-tasks-add-dialog.png`
7. `07-shopping.png`
8. `08-motivation.png`
9. `09-settings.png`
10. `10-weekly-reset.png`

## Baseline Mapping

| Filename | Visible page | Page archetype | Verification |
|---|---|---|---|
| `01-home.png` | Home / Thuis dashboard | Populated dashboard summary with Agenda, Tasks, Shopping lists, and Motivation cards | Verified |
| `02-agenda-month.png` | Agenda | Populated month calendar view | Verified |
| `03-agenda-week.png` | Agenda | Populated week calendar view | Verified |
| `04-agenda-list.png` | Agenda | Populated chronological list view | Verified |
| `05-tasks.png` | Taken | Populated task-board page with Today group | Verified |
| `06-tasks-add-dialog.png` | Taken | Representative add-task dialog | Verified |
| `07-shopping.png` | Boodschappen | Active shopping list grouped by store | Verified |
| `08-motivation.png` | Motivatie | Family goal, appreciation, celebrations, and statistics dashboard | Verified |
| `09-settings.png` | Instellingen | Settings page | Verified |
| `10-weekly-reset.png` | Weekritueel | Weekly reset ritual with summary and planning cards | Verified |

## Runtime Checks

The current application was launched with the ASP.NET Core API command and the Vite client command. The client rendered, but the API exited because PostgreSQL was not reachable on `localhost:5432`. Runtime state was inspected from the rendered application text before generating any screenshots.

| Page | Required state | Result | Visible reason |
|---|---|---:|---|
| Home | Populated dashboard | FAIL | Home showed empty/error cards: Agenda `0 zichtbaar`, Tasks `0 binnenkort`, Shopping `0 actief`, Motivation `Niet beschikbaar`; multiple overview cards reported they could not be loaded. |
| Home | Populated Agenda card | FAIL | Agenda card showed `Agenda-overzicht kon niet worden geladen.` |
| Home | Populated Tasks card | FAIL | Tasks card showed `Takenoverzicht kon niet worden geladen.` |
| Home | Populated Shopping card | FAIL | Shopping card showed `Boodschappenoverzicht kon niet worden geladen.` |
| Home | Populated Motivation card | FAIL | Motivation card showed `Maak je eerste gezinsdoel` / `Niet beschikbaar`, not the populated goal state. |
| Agenda | Populated Month | FAIL | Month view rendered calendar structure, but displayed `An unexpected server error occurred.` and omitted the baseline's Visual Review Calendar source and event details for the selected day. |
| Agenda | Populated Week | FAIL | Week view displayed `An unexpected server error occurred.` and did not match the populated baseline week state. |
| Agenda | Populated List | FAIL | List view displayed `An unexpected server error occurred.` and did not match the baseline source/event labels. |
| Tasks | Populated task cards | FAIL | Tasks page showed `Taken konden niet worden geladen.` instead of populated task cards. |
| Tasks | Representative Today group | FAIL | Tasks page showed the empty/error onboarding state rather than the representative `Vandaag` task group. |
| Shopping | Active shopping items | FAIL | Shopping page showed `Lijsten konden niet worden geladen.` instead of active shopping items. |
| Shopping | Store grouping | FAIL | Store grouping was not present in the runtime state because lists failed to load. |
| Motivation | Family goal | FAIL | Motivation page showed `MOTIVATIE IS NIET BESCHIKBAAR` and `Nog geen familiedoel.` |
| Motivation | Appreciation | FAIL | Runtime showed `0 waarderingen` and `Waarderingen zijn nu niet beschikbaar.` |
| Motivation | Celebrations | FAIL | Runtime prompted to choose a celebration instead of showing populated celebration rows. |
| Motivation | Statistics | FAIL | Runtime statistics showed zeros (`0 Helpacties`, `0 Gezinsleden`, `0 Persoonlijke doelen`, `0% Voortgang`) instead of populated baseline values. |
| Weekly Reset | Populated ritual | FAIL | Weekly Reset could not be reached from the visible runtime navigation because the application was already in a non-equivalent failed data state. |
| Weekly Reset | Populated summary cards | FAIL | Not validated as equivalent; prerequisite application data state failed. |
| Weekly Reset | Populated planning cards | FAIL | Not validated as equivalent; prerequisite application data state failed. |

## Failed Pages

- Home
- Agenda Month
- Agenda Week
- Agenda List
- Tasks
- Shopping
- Motivation
- Weekly Reset

## Visible Reason

The current application displays empty, onboarding, or error states instead of the populated visual state captured by the baseline screenshots. The required baseline state includes populated dashboard cards, calendar events, task cards, shopping items grouped by store, motivation goal data, appreciation entries, celebrations, statistics, and weekly reset planning cards. The runtime state does not reproduce those visual conditions.

## Technical Reason

The ASP.NET Core API process failed during startup because it could not connect to PostgreSQL at `127.0.0.1:5432`. The exception was `Npgsql.NpgsqlException: Failed to connect to 127.0.0.1:5432`, caused by `System.Net.Sockets.SocketException (111): Connection refused`. As a result, the Vite client rendered fallback/error states for API-backed pages.

## Recommended Action

Restore an equivalent populated runtime state before attempting visual comparison. Acceptable options include starting PostgreSQL with the expected seeded data, providing an equivalent fixture/mocked API, or otherwise configuring the application so the visible state matches the baseline screenshots. After every required page passes application state validation, rerun the visual regression review and generate screenshots only after equivalence is confirmed.
