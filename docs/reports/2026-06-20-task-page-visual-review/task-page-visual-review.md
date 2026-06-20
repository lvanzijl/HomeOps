# Task Page Visual Review

## Summary
- The Tasks page is functional and understandable, but it currently feels closer to a clean task-management page than to a warm household responsibility surface.
- Urgency-first grouping is the right default direction, but the overall page still reads slightly too technical because of the surrounding workspace chrome, the form-first header area, and the generic card/button treatment.
- The biggest UX gap is ownership meaning: owner names are present, but Family Members are not visually strong enough yet to make task responsibility feel household-native.
- Creation, completion, and reopen all work, but the creation strip feels more like an admin form than a lightweight household capture flow.

## Screenshots Captured
- `/home/runner/work/HomeOps/HomeOps/docs/reports/2026-06-20-task-page-visual-review/tasks-page-visual-review-desktop.png`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/2026-06-20-task-page-visual-review/tasks-page-visual-review-tablet-landscape.png`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/2026-06-20-task-page-visual-review/task-creation-flow.png`

## Tasks Page Review
- The page is clear enough to use immediately, but it does not yet feel distinctly like a household chores board.
- The overall structure is readable and balanced in landscape, though it leans slightly sparse rather than dense.
- The main visual tone is tidy and app-like: rounded cards, pill navigation, and dark CTA buttons read more like a productivity product than a family responsibility surface.
- The outer page header (`Page 4 of 7`, `Tasks`, description) adds app-shell framing before the real task content begins, which weakens the “household board” feeling.

## Urgency Grouping Review
- Overdue, Due Today, Upcoming, No Due Date, and Completed Recently are easy to understand and visually scan.
- Urgency-first grouping works well as the primary organization because it answers what needs attention now before who owns it.
- The groups are visually consistent, but the repeated full-width section treatment makes the page long quickly.
- Empty groups are understandable, but when the page is sparse they risk making the surface feel more like a scaffold than a living household board.

## Ownership Review
- Ownership states are understandable in text form: `Unassigned`, named member, and `Shared household` all read correctly.
- The current owner treatment is too weak visually. Text-only owner lines make responsibility legible but not memorable.
- Family Member names help a little, but without avatar/color presence on task rows they do not yet add much household context.
- Ownership does not currently feel like login/account behavior, which is good, but it also does not yet feel meaningfully tied to the Family Member concept.

## Task Creation Review
- Title + optional owner + optional due date is correctly scoped and simple enough.
- Default Unassigned behavior is clear from the owner dropdown.
- The creation flow does not feel lightweight enough yet because the top area reads like a structured form rather than a quick household capture strip.
- The date control especially pushes the experience toward a technical/productivity feel rather than a family-friendly quick-add.

## Completion / Reopen Review
- Complete and Reopen actions are very visible and easy to understand.
- Touch targets appear large enough in landscape and should be comfortable on a wall-tablet style surface.
- Completed state is understandable because the item moves into `Completed Recently`, but the completed row still looks very similar to active rows.
- Because the visual difference is mostly location plus button label, completion does not yet feel distinct or satisfying.

## Domain Boundary Review
- The page avoids looking like Calendar. It does not imply time-block scheduling or event management.
- The page mostly avoids looking like Lists because ownership and due-state make it feel more responsibility-oriented.
- It does not suggest approval, points, or gamification expectations, which is correct for this slice.
- The main boundary risk is not cross-domain confusion, but generic productivity-app styling.

## Family Member Relationship Review
- Family Members conceptually help task understanding because assignment to named household members is the right model.
- In the current UI, that relationship still feels weak because task rows use names only and do not visibly borrow the stronger Family Member presentation language used elsewhere.
- As a result, Tasks and Family Members feel related in data but not yet strongly connected in the visual experience.

## Risks
- The page may be interpreted as a generic task app rather than a household chores page if the visual language stays this neutral and product-like.
- Ownership may remain low-signal unless Family Member cues become more recognizable on rows.
- The creation area may feel heavier than intended, which could discourage fast household capture.
- Completed items may feel insufficiently distinct from active work, reducing the sense of progress.
- Repeated empty sections may make low-volume household usage feel sparse or unfinished.

## Unexpected Findings
- Application startup succeeded after installing missing client dependencies; no code changes were required to launch the app.
- Navigation to the Tasks page worked during live review.
- Task creation, completion, and reopen all worked during live review.
- The current task page is already disciplined about boundaries: no recurrence, approval, points, or gamification leakage was observed.

## Top 5 Remaining UX Issues
1. The page still feels more like a polished task-management app than a household responsibility board.
2. Ownership is clear in text, but Family Member presence is too weak to make responsibility feel household-native.
3. The task creation strip feels more like a small admin form than a lightweight capture action.
4. Completed tasks are understandable but not visually distinct enough from active tasks.
5. Workspace chrome and repeated section framing add technical/app weight before the actual household content takes over.

## Recommended Next Slice
- Continue with a small Tasks visual-hardening slice only.
- Focus on making the page feel more household-oriented, strengthening ownership cues through Family Member presentation, reducing form/admin feel in creation, and making completed state clearer.
- Preserve urgency-first grouping and keep recurrence, approval, points, Home summaries, and gamification out of scope.

## Next Prompt Context
- Proceed with a Tasks page visual-hardening slice only.
- Keep Tasks as a dedicated household domain separate from Lists, Calendar, and Gamification.
- Preserve urgency-first organization.
- Keep creation lightweight: title, optional owner, optional due date.
- Do not add recurrence, approval, points, Home task summaries, notifications, reminders, authentication, or roles.
- Strengthen household feel and Family Member relationship without making the page look like account management.

## Validation
- Application started successfully: yes
- Screenshots created: yes
- Navigation verified: yes
- Task creation verified: yes
- Task completion verified: yes
- Task reopen verified: yes
