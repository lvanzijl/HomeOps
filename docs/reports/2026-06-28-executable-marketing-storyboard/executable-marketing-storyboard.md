# Executable Marketing Storyboard

## Summary

Converted the canonical FamilyBoard Marketing Storyboard V1 into a source-only executable Marketing Director storyboard module. The Markdown storyboard remains the human-readable canonical design document; the module is a faithful executable representation for validation and recording-plan creation only.

No movie, screenshots, audio, WAV files, browser session, or production UI changes were produced.

## Executable storyboard location

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`

## Scene mapping

| Order | Executable scene id | Canonical scene | Fixture | Preferred duration |
| ---: | --- | --- | --- | ---: |
| 1 | `intro` | Intro | `visual-marketing-home` | 5s |
| 2 | `home` | Home | `visual-marketing-home` | 7s |
| 3 | `family` | Family | `visual-marketing-family` | 10s |
| 4 | `agenda` | Agenda | `visual-marketing-agenda` | 14s |
| 5 | `tasks` | Tasks | `visual-marketing-tasks` | 10s |
| 6 | `shopping` | Shopping | `visual-marketing-shopping` | 7s |
| 7 | `motivation` | Motivation | `visual-marketing-motivation` | 10s |
| 8 | `weekly-reset` | Weekly Reset | `visual-marketing-weekly-reset` | 14s |
| 9 | `outro` | Outro | `visual-marketing-home` | 7s |

Preferred duration total: 84 seconds.

Storyboard maximum duration metadata: 90 seconds.

## Metadata preserved

The executable storyboard preserves the supported Director scene fields:

- `id`
- `fixture`
- `title`
- `subtitle`
- `purpose`
- `emotionalTone`
- `visualFocus`
- `minimumDurationMs`
- `preferredDurationMs`
- `maximumDurationMs`
- `transition`
- `actions`

It also preserves canonical direction as backward-compatible metadata:

- `narrativeRole`
- `chapterCard`
- `cameraPacing`
- `touchGestures`
- `interactionSequence`
- `audioEvents`
- `expectedFinalState`
- `directorNotes`
- storyboard-level `emotionalCurve`
- storyboard-level source and household document references
- fixture date and canonical week metadata

## Validation performed

Source-only validation was performed with:

```bash
node tools/marketing-recording/storyboards/marketing-preview-v1.mjs
```

The validation confirmed:

- The storyboard module imports cleanly.
- The Marketing Director validates it.
- The Marketing Director can create a recording plan.
- There are exactly 9 scenes.
- Every scene has a fixture.
- Every scene has Chapter Card metadata.
- Every scene has duration metadata.
- Every referenced fixture name is one of the approved marketing fixture names.
- Preferred durations sum to 84 seconds.
- Storyboard maximum duration metadata remains 90 seconds.
- Emotional curve metadata exists.

`git diff --check` was also run successfully.

## Modified files

- `tools/marketing-recording/director.mjs`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-06-28-executable-marketing-storyboard/executable-marketing-storyboard.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers

- Does the executable storyboard represent all 9 canonical scenes? Yes.
- Does it preserve the canonical storyboard sequence? Yes.
- Does it preserve Chapter Card direction? Yes.
- Does it preserve the emotional curve? Yes.
- Can the Marketing Director validate it? Yes.
- Can the Marketing Director create a recording plan from it? Yes.
- Was no movie intentionally produced? Yes. No movie was produced intentionally.
