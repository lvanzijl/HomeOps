# FamilyBoard Visual Punch List

## Summary

- Selected screenshot directory: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots`
- Number of screenshots analyzed: 10
- Mapping succeeded: Yes
- Overall product visual quality score: **7.2 / 10**
- Ready for Friends & Family visual review: **No — ready after small visual fixes**

The product reads as warm, cohesive, and broadly beta-shaped. The core navigation, rounded cards, family-first labels, and domain colors create a recognizable FamilyBoard identity. The biggest visual risks are not structural; they are polish issues: remaining English/admin copy, overly heavy task buttons, repeated explanatory text, dense operational cards, and a few awkward clipping/alignment problems.

## Screenshot Mapping

| Page | File | Filename confidence | Content confidence | Archetype confidence | Overall mapping confidence | Verification notes |
|---|---|---:|---:|---:|---:|---|
| Home | `01-home.png` | 100% | 95% | 95% | 97% | Filename indicates home; visible dashboard with family members, Agenda, Tasks, Shopping lists, and Motivation; archetype is dashboard. |
| Agenda Month | `02-agenda-month.png` | 100% | 98% | 98% | 99% | Filename indicates agenda month; visible month grid, selected-day panel, source filters, and month/list/week switcher; archetype is planning workspace. |
| Agenda Week | `03-agenda-week.png` | 100% | 98% | 98% | 99% | Filename indicates agenda week; visible seven-day columns, week navigation, today marker, and event cards; archetype is weekly planning workspace. |
| Agenda List | `04-agenda-list.png` | 100% | 96% | 96% | 97% | Filename indicates agenda list; visible chronological overview with upcoming event cards; archetype is reference workspace. |
| Tasks | `05-tasks.png` | 100% | 98% | 98% | 99% | Filename indicates tasks; visible today-first task group, repeated task cards, and completion actions; archetype is operational workspace. |
| Representative Task Dialog | `06-tasks-add-dialog.png` | 100% | 98% | 96% | 98% | Filename indicates task add dialog; visible modal with task creation prompt over blurred Tasks workspace; archetype is dialog. |
| Shopping | `07-shopping.png` | 100% | 98% | 98% | 99% | Filename indicates shopping; visible Quick Add, store cards, recent items, and supporting lists; archetype is input-first shopping workspace. |
| Motivation | `08-motivation.png` | 100% | 98% | 98% | 99% | Filename indicates motivation; visible family goal, appreciation, celebrations, and statistics; archetype is emotional dashboard. |
| Weekly Reset | `10-weekly-reset.png` | 100% | 98% | 98% | 99% | Filename indicates weekly reset; visible week ritual content, summary stats, and carry-forward choices; archetype is ritual page. |
| Settings | `09-settings.png` | 100% | 98% | 98% | 99% | Filename indicates settings; visible settings, calendar backup/restore, and placeholder content; archetype is administrative support page. |

## Page-by-Page Findings

### Home

**First impression:** Calm and familiar, with a useful overview layout. It still feels slightly more like a system dashboard than a finished family surface because several labels and metadata remain technical or English.

**What works**

- The four major cards are easy to scan and create a clear dashboard rhythm.
- Domain colors are present but mostly subtle, especially in card borders and navigation chips.
- The family member chips make the page feel personal.
- Shopping preview is short and scannable.

**What still feels wrong**

- Weather placeholder is still visible as `Weather ready when connected`; it is not gone.
- Several card headings and item titles remain English, which breaks the Dutch beta feel.
- The plus and arrow icon buttons are discoverable but visually repetitive across cards.
- Task metadata includes implementation-like due dates.

**Severity-ranked findings**

1. **Must fix before Friends & Family:** Remove or localize the weather placeholder. It is prominent in the top hero and reads as unfinished.
2. **Must fix before Friends & Family:** Finish Dutch localization on Home preview content, especially `Shopping lists`, `Tasks`, `Summer camp registration confirmation day`, and similar English strings.
3. **Should fix after Friends & Family feedback:** Reduce repeated icon-button prominence; use one clear action pattern per card.
4. **Post-MVP / Design System:** Define a preview-card metadata style so due dates, counts, and source labels feel warmer and less database-like.

### Agenda Month

**First impression:** Functional and understandable, but the screen is visually busy for a monthly planning surface. Empty days are quiet in color, but not quiet in text because almost every empty cell says `Rustige dag`.

**What works**

- Month grid and selected-day panel are clearly mapped.
- Selected day is indicated strongly without being harsh.
- Filters are less technical than raw system toggles and are grouped under `Bronnen`.
- The side panel gives the selected date a clear destination.

**What still feels wrong**

- Empty days repeat `Rustige dag` too many times, making the calendar read text-heavy.
- The `Gebeurtenis toevoegen` button is clipped/truncated in the selected-day panel.
- Source labels include English names such as `Visual Review Calendar`, `School Holidays`, `TV Series`, and `Birthdays`.
- Header hierarchy competes: `Familieplanning`, `Agenda`, `Maandoverzicht`, and `juni 2026` all demand attention.

**Severity-ranked findings**

1. **Must fix before Friends & Family:** Fix the clipped `Gebeurtenis toevoegen` button; clipping is an obvious beta blocker.
2. **Must fix before Friends & Family:** Localize or soften source labels so filters do not expose English/technical calendar names.
3. **Should fix after Friends & Family feedback:** Remove repeated `Rustige dag` from most empty dates, or show it only on the selected day/hover/focus.
4. **Post-MVP / Design System:** Establish calmer hierarchy rules for page eyebrow, page title, view title, and date title.

### Agenda Week

**First impression:** The weekly structure is immediately clear, but columns are cramped. Quiet-day cards carry too much explanatory text, and the today badge appears clipped at the right edge.

**What works**

- Seven-day layout is recognizable.
- Event cards and quiet-day placeholders are visually distinct.
- Week navigation is understandable.
- Today is subtly highlighted with a tinted column.

**What still feels wrong**

- Quiet days repeat a long sentence, creating visual noise.
- Event cards become narrow and text wraps heavily.
- `Vandaag` badge on Saturday appears clipped/overlapping.
- Edit/remove buttons inside the Monday event make the column feel more like an admin tool than a family planning view.

**Severity-ranked findings**

1. **Must fix before Friends & Family:** Fix the clipped/overlapping `Vandaag` badge and any week-column overflow.
2. **Should fix after Friends & Family feedback:** Shorten quiet-day text substantially; a calm icon or one-line state would feel more touch-friendly.
3. **Should fix after Friends & Family feedback:** Reduce inline edit/remove controls in the week view or hide them behind a secondary affordance.
4. **Post-MVP / Design System:** Create responsive week-card density rules for long Dutch and English event titles.

### Agenda List

**First impression:** This is the strongest Agenda view. It starts quickly, reads chronologically, and feels like a useful reference surface.

**What works**

- Header is simpler than Month/Week once the timeline starts.
- Event cards are scannable with clear category identity.
- The chronological grouping is understandable.
- No major empty-state clutter is visible.

**What still feels wrong**

- `4 komende momenten` is still an event-count badge; it is not necessary and adds dashboard noise.
- Metadata such as `School Holidays`, `TV Series`, `Birthdays`, and `Alleen lezen` feels implementation-heavy.
- The icon row with `+1` duplicates category information already visible in cards.

**Severity-ranked findings**

1. **Must fix before Friends & Family:** Localize or hide English source names and `Alleen lezen` metadata where it is not useful to families.
2. **Should fix after Friends & Family feedback:** Remove the `4 komende momenten` badge; the list itself proves there are upcoming moments.
3. **Should fix after Friends & Family feedback:** Simplify the top icon row to avoid duplicating card-level category markers.
4. **Post-MVP / Design System:** Define which event metadata belongs in family-facing views versus admin/detail views.

### Tasks

**First impression:** The page communicates urgency and action, but it is visually too heavy. The dark teal action buttons dominate every row, and repeated labels make the page feel dense.

**What works**

- Today-first grouping is obvious.
- Summary strip helps orientation.
- `Afgerond` is not visible in the captured viewport, so it does not compete above the fold.
- Cards are large and touch-friendly.

**What still feels wrong**

- Primary buttons are too dark and repeated, so the dominant object becomes the action cluster rather than the task list.
- Repeated `VANDAAG EERST`, `Hele gezin`, `Te laat`, and `Openstaand` labels inflate every card.
- Task card height is high for simple chores.
- Some button text appears low-contrast or visually muted on dark fills.

**Severity-ranked findings**

1. **Must fix before Friends & Family:** Reduce the visual weight of repeated `Klaar` and `Morgen` buttons; they currently overpower the page.
2. **Should fix after Friends & Family feedback:** Collapse repeated metadata into a quieter compact row or show only exceptions.
3. **Should fix after Friends & Family feedback:** Reduce card height for simple tasks while preserving touch targets.
4. **Post-MVP / Design System:** Create an operational-list pattern that balances fast action with calm visual hierarchy.

### Representative Task Dialog

**First impression:** The dialog feels much closer to FamilyBoard than a browser/OS dialog. It is spacious, soft, and visually connected to Tasks through the blurred background.

**What works**

- Soft overlay and blur make the dialog feel connected to the originating workspace.
- Copy is concise and focused on one task.
- Field and button are large enough for touch.
- The dialog avoids a harsh system-modal look.

**What still feels wrong**

- The dark `Verder` button repeats the same heaviness seen on Tasks.
- The dialog could use a clearer close/cancel affordance for families who open it accidentally.
- The input and button alignment is functional but slightly mechanical.

**Severity-ranked findings**

1. **Should fix after Friends & Family feedback:** Add a calm cancel/close affordance or make dismissal more discoverable.
2. **Should fix after Friends & Family feedback:** Soften the primary button to match FamilyBoard's warmer visual language.
3. **Post-MVP / Design System:** Standardize dialog anatomy for header, copy, form field, footer action, and workspace blur.

### Shopping

**First impression:** Warm and recognizable, but not quite input-first. The hero and store cards compete with Quick Add, and the page carries more explanatory/supporting content than needed.

**What works**

- Shopping domain color is strong and consistent.
- Store cards are easy to understand.
- Recent items are secondary and scannable.
- `Andere lijsten` is visually lower priority than the main store cards.

**What still feels wrong**

- Quick Add is not the dominant focal point; the large hero title and illustration pull attention first.
- Store information is duplicated in item text, for example `Apples (Supermarket)` inside the `Supermarket` card.
- `Ondersteunende lijsten` explanatory text is long for a secondary area.
- The saturated orange `Toevoegen` button is visually loud.

**Severity-ranked findings**

1. **Must fix before Friends & Family:** Remove duplicate store names inside store cards; it looks unpolished and slows scanning.
2. **Should fix after Friends & Family feedback:** Make Quick Add the dominant object by reducing hero weight or integrating the input into the hero.
3. **Should fix after Friends & Family feedback:** Soften the `Toevoegen` button so it remains discoverable without overpowering the page.
4. **Post-MVP / Design System:** Define secondary-section treatment for Recently Added, Other Lists, and Completed Items.

### Motivation

**First impression:** Emotionally warm but visibly unfinished because English copy remains in high-value moments. The page has good energy, yet the content density and mixed languages reduce trust.

**What works**

- Goal/progress hierarchy is strong.
- Celebrations and appreciation give the page emotional purpose.
- Statistics are compact and not the only focal point.
- The page feels family-first rather than purely gamified.

**What still feels wrong**

- Remaining English is prominent: `Fill the kindness path`, `helpful actions`, `Kind reset moment`, `Helped without being asked`, and `Kindness`.
- Celebration/history rows have cramped text spacing, such as `Pancake breakfastNet gevierd` without enough separation.
- Statistics are acceptable but slightly dry compared with the warmth of goals and appreciation.
- Multiple buttons compete: add appreciation, view all, adjust family goal, view history, manage goals, add goal.

**Severity-ranked findings**

1. **Must fix before Friends & Family:** Finish Dutch localization on all Motivation content; English appears in the emotional core of the product.
2. **Must fix before Friends & Family:** Fix cramped celebration/history text spacing where labels run into item names.
3. **Should fix after Friends & Family feedback:** Reduce competing action buttons so the page has one emotional primary action.
4. **Post-MVP / Design System:** Develop a warmer statistic-card style with more human labels and less report-like presentation.

### Weekly Reset

**First impression:** Strong ritual concept and a clear hero question. It is understandable, but the page becomes explanatory and equal-weight below the hero, which weakens the sense of closure.

**What works**

- Hero hierarchy is strong and memorable.
- The page explains the weekly ritual well enough for occasional users.
- Summary stats create orientation.
- Carry-forward card begins to show an actionable closure moment.

**What still feels wrong**

- Explanatory text and bullets are useful but too visually central.
- The completion/closure moment is not prominent enough; the visible actions are per-task rather than a page-level ending.
- Bottom cards feel too equal in weight even though `Meenemen` is currently the only active choice area.
- Buttons in the task card use black outlines, which feel less FamilyBoard-like than other surfaces.

**Severity-ranked findings**

1. **Should fix after Friends & Family feedback:** Add or emphasize a clear page-level closure moment after choices are made.
2. **Should fix after Friends & Family feedback:** Reduce the visual prominence of explanatory bullets once the user is in the decision area.
3. **Should fix after Friends & Family feedback:** Make active cards visually stronger than empty/continuing cards.
4. **Post-MVP / Design System:** Create a ritual-page pattern for hero, explanation, decision cards, and closure.

### Settings

**First impression:** This page is not beta-ready visually. It is clearly administrative, but it exposes English backup/restore copy and a placeholder panel, making the product feel unfinished.

**What works**

- Administrative nature is visually separated from the warmer product areas.
- Backup and restore actions are understandable.
- Layout does not break mechanically.

**What still feels wrong**

- English backup/restore copy is visible throughout the page.
- `Settings Placeholder`, `COMING LATER`, and `Settings widgets will appear here in future slices` are visible placeholder copy.
- Native file input styling breaks the FamilyBoard visual system.
- Restore warning panel is visually loud and technical.

**Severity-ranked findings**

1. **Must fix before Friends & Family:** Remove visible placeholder content from Settings.
2. **Must fix before Friends & Family:** Localize backup/restore copy into Dutch or hide Settings from Friends & Family review if not in scope.
3. **Should fix after Friends & Family feedback:** Replace native file input styling with a FamilyBoard-styled upload affordance.
4. **Post-MVP / Design System:** Define an administrative support-page style that remains calm but can carry warnings safely.

## Cross-Product Findings

1. **Remaining English copy is the largest visual trust issue.** It appears on Home, Agenda metadata, Motivation, and Settings. Because Dutch consistency is a stated product principle, mixed language is the most visible beta risk.
2. **Button heaviness is inconsistent.** Tasks and dialog primaries are very dark, Shopping uses a saturated orange button, while Agenda uses vivid purple. Actions are discoverable but often louder than their content.
3. **Explanatory text is still overused.** Agenda quiet states, Shopping support sections, Weekly Reset bullets, and Settings restore text explain more than a family likely needs during repeated use.
4. **Repeated labels increase density.** Tasks repeats status/owner/due labels on every card; Month repeats `Rustige dag`; Shopping repeats store names inside store cards.
5. **Some clipping and spacing bugs are visually obvious.** The Agenda Month add-event button, Agenda Week today badge, and Motivation celebration rows need small layout fixes before review.
6. **The asset/icon layer is uneven.** Some icons feel charming, while others read as placeholder or decorative without adding meaning.
7. **Operational pages need stronger speed.** Tasks and Shopping should prioritize quick recognition and action over explanatory framing.
8. **Administrative surfaces lag behind product polish.** Settings is useful, but it does not yet match the Dutch, warm, family-first identity.

## Prioritized Punch List

| Priority | Page or system area | Issue | Expected impact | Estimated complexity | Suggested timing |
|---|---|---|---|---|---|
| Must fix before Friends & Family | Settings | Remove visible placeholder panel and future-slice copy. | Eliminates strongest unfinished-product signal. | Small | Before review build |
| Must fix before Friends & Family | Settings | Localize backup/restore copy or hide Settings from review scope. | Restores Dutch consistency and reduces admin friction. | Small-Medium | Before review build |
| Must fix before Friends & Family | Motivation | Replace remaining English emotional copy with Dutch. | Protects trust in one of the most family-facing pages. | Small-Medium | Before review build |
| Must fix before Friends & Family | Home | Remove or localize `Weather ready when connected`. | Removes prominent placeholder at the top of the experience. | Small | Before review build |
| Must fix before Friends & Family | Agenda Month | Fix clipped `Gebeurtenis toevoegen` button. | Removes obvious layout defect. | Small | Before review build |
| Must fix before Friends & Family | Agenda Week | Fix clipped/overlapping `Vandaag` badge and column overflow. | Improves polish of a core planning view. | Small-Medium | Before review build |
| Must fix before Friends & Family | Shopping | Remove duplicated store names inside store cards. | Makes shopping list faster and more polished. | Small | Before review build |
| Must fix before Friends & Family | Motivation | Fix cramped celebration/history row spacing. | Prevents emotional content from feeling broken. | Small | Before review build |
| Must fix before Friends & Family | Tasks | Reduce dark repeated action-button weight. | Restores task list as the focal object instead of button clusters. | Medium | Before review build |
| Should fix after Friends & Family feedback | Agenda Month | Quiet most empty day cells instead of repeating `Rustige dag`. | Makes month view calmer and more visual. | Medium | After first feedback |
| Should fix after Friends & Family feedback | Agenda List | Remove event-count badge and simplify duplicated category markers. | Improves reference-view clarity. | Small | After first feedback |
| Should fix after Friends & Family feedback | Agenda views | Hide or soften technical metadata such as source names and read-only status. | Makes Agenda feel family-facing instead of imported-calendar-facing. | Medium | After first feedback |
| Should fix after Friends & Family feedback | Tasks | Compact repeated metadata and reduce card height. | Increases operational speed. | Medium | After first feedback |
| Should fix after Friends & Family feedback | Task Dialog | Add calm cancel/close affordance and soften primary button. | Improves confidence for accidental opens. | Small | After first feedback |
| Should fix after Friends & Family feedback | Shopping | Make Quick Add the dominant object and reduce hero/button competition. | Improves input-first behavior. | Medium | After first feedback |
| Should fix after Friends & Family feedback | Weekly Reset | Add/emphasize page-level completion moment. | Makes the ritual feel satisfying and complete. | Medium | After first feedback |
| Post-MVP / Design System | System | Define operational-list pattern for tasks/shopping. | Consistent speed and touch ergonomics across workspaces. | Medium-Large | Design-system pass |
| Post-MVP / Design System | System | Define dialog anatomy and overlay rules. | Keeps future dialogs from drifting into OS-modal feel. | Medium | Design-system pass |
| Post-MVP / Design System | System | Define metadata visibility rules for family-facing versus admin views. | Prevents implementation details from leaking into product surfaces. | Medium | Design-system pass |
| Post-MVP / Design System | System | Improve icon/asset quality and usage rules. | Strengthens FamilyBoard identity. | Medium | Design-system pass |
| Post-MVP / Design System | Settings/admin | Create administrative support-page pattern. | Keeps necessary admin functions calm and consistent. | Medium | Design-system pass |

## Recommendation

**Ready after small visual fixes.**

FamilyBoard is close enough for Friends & Family review in structure, warmth, and navigation. However, the current screenshot set still exposes several visible beta blockers: Settings placeholder content, mixed English/Dutch copy in prominent places, clipped Agenda controls, duplicate shopping labels, and overly heavy task actions. These are small-to-medium polish fixes rather than another full product redesign. After those issues are addressed, the product should be ready for meaningful Friends & Family visual feedback.

## Validation

- Preflight result: `.github/copilot-instructions.md` and root `AGENTS.md` were read; `DOTNET_CLI_HOME=/tmp/dotnet`, tool path export, and `dotnet --version` completed with `10.0.301`.
- Screenshot directory selected: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots`.
- Screenshot discovery result: 10 files found: `01-home.png`, `02-agenda-month.png`, `03-agenda-week.png`, `04-agenda-list.png`, `05-tasks.png`, `06-tasks-add-dialog.png`, `07-shopping.png`, `08-motivation.png`, `09-settings.png`, `10-weekly-reset.png`.
- Required screenshot set result: Complete.
- Mapping result: Succeeded; all screenshots were matched by filename, visible content, and page archetype.
- `git diff --check` result: Passed.
- Binary artifact confirmation: No PNG/JPG/JPEG/GIF/WEBP/PDF files were added or modified.

## Modified Files

- `docs/reports/2026-06-28-familyboard-visual-punch-list/familyboard-visual-punch-list.md`
