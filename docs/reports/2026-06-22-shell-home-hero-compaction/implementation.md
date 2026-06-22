# Workspace Shell and Home Hero Compaction Implementation

## Summary
- Compacted the global workspace shell so navigation uses smaller grid pills, less outer padding, and less vertical gap.
- Replaced tall workspace framing with a compact title row and abbreviated page position while preserving orientation text.
- Compacted the Home hero by reducing date/time scale, family chip size, quick-capture button prominence, and hero padding.
- Applied the same header compaction pattern to Tasks, Motivation, and Weekly Reset so meaningful content starts higher.
- Preserved all existing destinations, routes, dashboard content, and page behavior.

## Cross-Page Rule Check
**Does the shell now prioritize content over chrome?** Yes. The navigation remains available, but its visual weight is reduced and it no longer dominates the first viewport. The Home hero still provides date/time, family context, and quick capture, but with lower height so Agenda, Tasks, Motivation, and Lists summaries reach the fold sooner.

## Validation Notes
- Automated validation was run after implementation.
- Playwright screenshots were not captured because no Playwright project/browser setup was invoked in this slice.
