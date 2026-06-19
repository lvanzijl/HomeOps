# Home Dashboard Visual Review Round 2

## Summary
Home is materially closer to the intended family glassboard than the previous review, but it still does not fully read as the household's primary command surface. The hardest blockers from round 1 are fixed: the app starts cleanly, active list items render on Home, the old framework/demo wording is gone, and tablet portrait now stacks instead of forcing side-by-side cards. The remaining problem is hierarchy. Agenda is now dominant inside the dashboard, but the app-level header, navigation, and tall hero still consume too much of the first screen. Lists is finally useful, but Family Members still feel more decorative than operational because they do not connect to ownership or today's information.

## Screenshots Captured
- `/home/runner/work/HomeOps/HomeOps/docs/reports/home-dashboard-review-round2-slice-1-desktop.png`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/home-dashboard-review-round2-slice-2-tablet-landscape.png`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/home-dashboard-review-round2-slice-3-tablet-portrait.png`

## Home Review
- Home no longer feels like a framework demo first. The previous framework-oriented wording is gone and the page now presents real household content immediately.
- Home still does not fully feel like the family glassboard because too much vertical space is spent on app chrome and the large hero before the primary content starts.
- The first thing the page communicates is still "HomeOps app with navigation" rather than "today's household board."
- The overall tone is warm enough and no longer clinical, but the hierarchy is still more app-shell than wall-tablet dashboard.

## Agenda Review
- Agenda is now visually dominant enough within the summary area. On desktop and tablet landscape it takes roughly two-thirds of the summary width, which is directionally correct.
- Agenda is not too dominant. It still leaves enough room for Lists to matter.
- The hierarchy is only partially correct because Agenda is not the first strong thing above the fold; the app header, nav, and hero all compete with it.
- The card content is readable and the capped preview feels like a summary, not full management.
- The header action chip (`Open agenda`) still reads more like a label than a strong tap target.

## Lists Review
- Active list items are now actually visible. The Home review is no longer blocked by an empty Lists panel.
- Lists now feels useful because it shows real shopping and packing reminders instead of a dead empty state.
- Lists is large enough on desktop and tablet landscape to be meaningful, but it is still clearly secondary to Agenda.
- Lists is not too large in landscape. In tablet portrait it becomes a full-width card, but that is not the main problem; the problem is that it falls far below the fold after the stacked layout.
- The card still lacks priority cues beyond list name and item text, so it reads as a clean summary rather than a high-urgency memory surface.

## Family Member Review
- Family Members now read more like household members than the earlier decorative chips. Names, initials, and avatar shapes help.
- They still feel more decorative than functional because nothing on the board visibly ties back to them.
- The repeated `On the board` copy does not add operational meaning.
- In tablet portrait the member strip wraps and becomes tall, which increases its visual cost without increasing utility.
- Avatars/chips are visually pleasant, but they are not yet doing enough work for the space they occupy.

## Chrome Review
- Verified removed from Home:
  - `Household Information Hub`
  - `Workspace framework` wording
  - workspace counters such as `Workspace 1 of 6`
  - `Primary household overview workspace.`
- This is a meaningful improvement.
- Remaining chrome problem: the global `Today at Home` header and the full page navigation still occupy a large share of the first screen, so the dashboard still feels framed by the app instead of leading it.

## Tablet Portrait Review
- Readability is improved because the cards stack at 768px and there is no horizontal overflow.
- Touch targets are mixed. Primary buttons and `+x more` buttons are 44px tall and feel acceptable, but the `Open agenda` and `Open lists` chips still look too small and too passive.
- Layout stacking works technically, but the stacked result is too tall for a glance-first portrait experience.
- Overflow behavior is acceptable horizontally, but vertical overflow is heavy: Lists starts well below the first viewport, so portrait loses the always-visible dual-summary feel.
- The wrapped Family Member strip adds extra height pressure before the summaries begin.

## Glassboard Review
- What immediately stands out: date/time, the Family Member strip, and a cleaner but still obvious app shell.
- What still feels wrong: the first screen still spends too much attention on shell and identity context before it gets to the household's actual work.
- What information is still missing: visible ownership/involvement on events or reminders, stronger tomorrow-preparation cues, and a clearer sense of what is most important to act on next.
- Home is now closer to a glassboard replacement, but it still behaves more like a polished summary page inside an app than the primary family board itself.

## Risks
- Portrait tablet users may not see Lists at all without scrolling, which weakens the glassboard promise that Agenda and Lists are both always visible summaries.
- Family Members may continue to consume prime space without adding decision-making value.
- The small action chips may undercut touch confidence on a wall-tablet surface.
- The remaining shell weight may keep Home feeling like a navigation gateway instead of the shared household board.
- Without stronger urgency or ownership cues, the board may remain informative but not actionable enough.

## Unexpected Findings
- No startup/runtime blockers needed fixing for this review run.
- The previous Lists-summary blocker is resolved; active items load correctly on Home.
- The portrait stacking hardening works as intended, but it introduces a new tradeoff: the second summary card is now pushed much farther down the page.

## Recommended Changes
- Reduce the vertical weight of the app-level header/navigation on Home so Agenda and Lists appear sooner.
- Compress the hero/Family Member area, especially on portrait, unless those elements start carrying real ownership or involvement context.
- Keep Agenda as the primary card, but make its primary action feel more tappable than a decorative pill.
- Preserve the improved Lists content, but surface stronger priority/urgency cues so it reads as household memory, not just a neat excerpt.
- Protect the glassboard goal in portrait by pulling at least the start of Lists closer to the first viewport.

## Next Prompt Context
Proceed with a Home dashboard hierarchy tightening slice only.

Constraints:
- Do not redesign the application.
- Do not add Tasks, Gamification, House Status, Media, or other future-slice domains.
- Preserve Home as summary-first.
- Keep the successful Lists data fix and the cleaner Home wording.
- Focus on reducing shell/hero weight, improving portrait first-screen balance, and making Family Members earn their space through stronger context.

## Validation
- Application started successfully: yes
- Screenshots created: yes
- Navigation verified: yes
