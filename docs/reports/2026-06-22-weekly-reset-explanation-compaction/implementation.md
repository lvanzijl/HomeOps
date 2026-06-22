# Weekly Reset Explanation Compaction Implementation

## Summary
- Compacted the Weekly Reset hero so it orients parents to this week’s review without tutorial-style explanation.
- Reworked task, goal, shopping, and recap cards to lead with state, counts, and actions instead of explanatory paragraphs.
- Preserved the review order: review candidates, family goal, children’s goals, shopping review, and weekly recap.
- Reduced visual weight for low-value archive and skip controls while preserving the existing actions and behavior.

## Cross-Page UX Rule Check
Yes. Weekly Reset now prioritizes review over explanation: the first scan shows what needs attention, how many items need checking, and the available review actions. Explanation remains supportive and brief.

## Validation Notes
- Existing Weekly Reset behavior, review candidates, goal review, shopping review, task actions, and recap rendering were preserved.
- Automated validation was run during delivery; see final response for command results.
- Playwright screenshot capture was not performed because Playwright availability was not established in this slice.
