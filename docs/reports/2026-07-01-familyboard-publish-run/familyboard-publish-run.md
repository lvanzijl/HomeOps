# FamilyBoard Publish Run

## Summary

Publish mode completed successfully. The Marketing Production Engine produced and retained a timestamped FamilyBoard MP4 in `docs/demo/`, generated metadata and timing JSON, and completed cleanup.

## Publish command used

`MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record`

## Published movie path

`/home/runner/work/HomeOps/HomeOps/docs/demo/familyboard-preview-20260701-200350.mp4`

## Metadata path

`/tmp/familyboard-marketing-metadata.json`

## Timing path

`/tmp/familyboard-marketing-timing.json`

## Duration

104.473s

## Resolution

1920x1080

## Video codec

h264

## Audio codec

aac

## Frame rate

30 fps

## Cleanup result

Cleanup completed successfully. Temporary WebM, WAV, mixed audio, and browser profile artifacts were removed; the timestamped MP4 was retained.

## Modified files

- `docs/demo/familyboard-preview-20260701-200350.mp4`
- `docs/reports/2026-07-01-familyboard-publish-run/familyboard-publish-run.md`

## Explicit answers

- Did publish mode complete successfully? Yes.
- Was a timestamped MP4 retained? Yes.
- Were metadata and timing generated? Yes.
- Was cleanup executed? Yes.
- Was production completed entirely by the Marketing Production Engine? Yes.
