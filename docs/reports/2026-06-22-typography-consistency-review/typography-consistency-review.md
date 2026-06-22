# Typography Consistency Review

## Executive Summary

HomeOps has a mostly coherent typography direction, but it does not yet have one fully explicit typography language. The product uses one underlying font stack and a recognizable hierarchy of page headers, card headers, uppercase labels, body copy, muted meta text, and compact actions. Recent card and color consolidation has made the system feel more unified.

The remaining typography problem is architectural, not aesthetic: several surfaces still encode typography through local class names and local copy conventions instead of a shared taxonomy. The result is one primary language with several competing sublanguages:

- `eyebrow` and `widget-type` both behave like uppercase section labels.
- Page headers use `h2` on some surfaces and `h3` on others.
- Card titles are usually `h3`, but child, reset, summary, widget, and legacy cards vary between `h2`, `h3`, `h4`, `strong`, and custom paragraph title classes.
- Empty states mostly follow a shared title + explanation + action pattern, but action labels vary in form and verbosity.
- Child-facing surfaces intentionally simplify language, but casing, labels, and adult/child boundaries are not fully formalized.

Verdict: HomeOps has a moderate typography system. Typography remains a meaningful design-system concern because the product already has shared visual tokens and card primitives, while type roles are still inferred from component history rather than defined as reusable design-system decisions.

## Typography Inventory

### Observed typography patterns

1. **Application/navigation labels**
   - Workspace navigation buttons use compact, medium-small labels.
   - Active navigation adds weight and accent color.

2. **Page/domain labels**
   - `widget-type` is used as an uppercase domain/page label, for example `Motivation`, `Tasks`, `Task setup`, `Templates`, and `Weekly Household Reset`.
   - `eyebrow` is also used as an uppercase label for page states, section names, card labels, and status labels.

3. **Page titles**
   - Home does not use a conventional page title; it leads with date/time.
   - Motivation and Tasks use compact `h3` page titles.
   - Weekly Reset uses a larger `h2` page title.
   - Child Workspace uses a hero with the child name and child-question language rather than a normal page title.

4. **Page subtitles/descriptions**
   - Motivation: short descriptive sentence, “Progress, appreciation, and celebrations.”
   - Tasks: short operational sentence, “Urgency-first ad-hoc tasks for the household.”
   - Weekly Reset: workflow explanation, “Review the tasks, goals, and lists that need attention.”
   - Home: no normal subtitle; uses contextual microcopy such as quick capture helper text.

5. **Card titles**
   - Shared `CardHeader` defaults to `h3` and supports eyebrow, title, meta, and actions.
   - Summary cards on Home use `CardHeader` and therefore have the strongest consolidated title pattern.
   - Motivation and Child Workspace still use many hand-authored card headers.
   - Some semantic title-like text appears as `strong` or paragraph classes, for example Home motivation goal title.

6. **Card subtitles and supporting copy**
   - Supporting copy appears as plain `p`, `motivation-copy`, `home-context-note`, `child-journey-summary`, `hero-progress-copy`, and other local classes.
   - This creates consistent readability in context but not a reusable type role.

7. **Meta text**
   - `CardHeader` renders meta as `small`.
   - Home summary rows use `small` for times and task owner/due details.
   - Weekly Reset uses compact action/count text in the `actions` slot.
   - Tasks and Lists use status text through `shopping-empty` and row secondary text.

8. **Status text**
   - Loading, errors, and success statuses use local paragraph classes or plain paragraphs.
   - Status wording is generally concise but not unified under a shared status-text role.

9. **Empty-state text**
   - Shared structure usually appears as `empty-state-card`: title-like `strong` or `h3`, one sentence, and one action.
   - Empty-state copy is generally action-oriented but varies by surface.

10. **Buttons and action links**
   - Buttons inherit the global font.
   - Primary actions, secondary actions, more links, and review actions are text-only buttons with local class conventions.
   - Links and buttons are mixed for similar outcomes, especially in empty states.

### Pattern count

The current product has approximately 10 typography roles in practice:

1. Navigation label
2. Page/domain label
3. Page title
4. Page subtitle/description
5. Card eyebrow/section label
6. Card title
7. Card subtitle/body support
8. Meta/status text
9. Empty-state title/body/action
10. Button/link/action text

The roles are understandable, but not all are formally represented by shared components or named design tokens.

## Page Title System

### Home

Home is intentionally dashboard-first and does not present a standard page title. Its leading title is the current date, preceded by `Today`, with time and weather-adjacent support text. This is coherent for a glassboard/dashboard surface, but it means Home is outside the page-title taxonomy.

### Agenda

Agenda is still widget-structured rather than page-title-structured. The visible title is the widget instance title and the domain label is `Agenda Widget`. This reads as implementation language compared with newer product-facing pages.

### Tasks

Tasks uses a compact header:

- Domain label: `Tasks`
- Title: `Household Tasks`
- Description: `Urgency-first ad-hoc tasks for the household.`

This is readable and aligned with the overview-first cleanup, but the title level is `h3`, making it feel card-like rather than page-like.

### Lists

Lists currently inherits more from the widget/card system than from a dedicated page-title system. The Shopping/List surface uses `Lists` as a `widget-type` and the list name as the visible `h3`. This works for the current widget implementation but is weaker as a page taxonomy.

### Motivation

Motivation uses:

- Domain label: `Motivation`
- Title: `Family goals`
- Subtitle: `Progress, appreciation, and celebrations.`

This is compact and understandable. However, the page title is really a section title; the navigation says Motivation, while the page header says Family goals. That is acceptable after overview/detail cleanup, but it should be intentional: Motivation page title could be either the domain name or the current overview object, not both interchangeably.

### Weekly Reset

Weekly Reset has the clearest page-title taxonomy:

- Eyebrow: `This week’s review`
- Title: `Weekly Household Reset`
- Description: `Review the tasks, goals, and lists that need attention.`
- Primary page action: `Skip this week`

This is coherent and mature.

### Child Workspace

Child Workspace intentionally uses a different title model: child identity and direct child questions. It is not simply a page title; it is a child-facing hero. This is appropriate, but the system should define it separately from adult page titles.

### Determination

A page-title taxonomy partially exists:

- Adult workflow pages: eyebrow/domain label + title + one-line description.
- Dashboard Home: date/time hero instead of page title.
- Child Workspace: identity/question hero instead of page title.
- Legacy widget pages: widget label + widget title.

The taxonomy is usable but implicit. Page descriptions are still useful for Tasks, Motivation, and Weekly Reset because they clarify scope, but they should remain short and not become instructional paragraphs. Agenda and Lists would benefit from being brought into the same page-header taxonomy later.

## Card Title System

### SummaryCard

Summary cards are the most coherent part of the typography system. They use the shared card primitive and `CardHeader`, with a compact title, optional meta, and action text. This gives Home cards a consistent title/meta/action rhythm.

### ReviewCard

Review cards share the card primitive but still rely on review-specific heading classes. The title/action pairing is clear, especially in Weekly Reset, but the typography is workflow-specific and not yet expressed as a general “review card header” taxonomy.

### Motivation cards

Motivation cards have a coherent emotional/product tone, but they are less consolidated structurally. They use `widget-type`, `eyebrow`, `h3`, `motivation-copy`, secondary actions, progress numerals, and custom celebration surfaces. The result is readable, but card title roles are locally assembled.

### Child Workspace cards

Child cards intentionally use simple headings and short body copy. This is good for readability and age-appropriate language. However, title casing and label casing vary (`Family Goal`, `Family goal`, `Family Memories`, `This Week`), which makes the system feel less deliberate.

### List cards

List cards are still widget-shaped. Titles and empty labels are functional, but the typography model is not as mature as Home summary cards or Weekly Reset review cards.

### Task cards

Tasks use group titles, row titles, and row actions effectively. However, the page combines task groups, task setup, templates, reset preview, and someday planning, each with slightly different heading patterns. The compaction work improved hierarchy, but type roles remain locally encoded.

### Determination

Card typography is moderately coherent. Summary cards are strong. Review cards are close. Motivation, Child Workspace, Lists, and Tasks are readable but not fully standardized. The next design-system layer should define card title roles explicitly:

- Card label / eyebrow
- Card title
- Card subtitle
- Card meta
- Card status
- Card primary action
- Card secondary action

## Eyebrow Review

### Current label systems

HomeOps currently uses several overlapping label concepts:

- `widget-type`
- `eyebrow`
- Section labels
- Meta labels
- Status labels
- Domain labels

### Purpose overlap

`widget-type` and `eyebrow` are the main competing systems. They share visual behavior: small, uppercase, bold, letter-spaced labels. They differ mostly by historical usage:

- `widget-type` often labels a domain, widget, or management section.
- `eyebrow` often labels a card, section, state, or child-facing cue.

In practice, both answer “what kind of thing is this?” This means multiple naming systems describe the same typography concept.

### Consolidation need

Consolidation is needed. The product does not need to remove all semantic distinctions, but it should separate naming by role rather than implementation history:

- **Domain label**: page or product area, e.g. Tasks, Motivation, Lists.
- **Section label**: area within a page, e.g. Personal goals, Today, This week.
- **Status label**: state text, e.g. Ready to celebrate, Optional reset.
- **Meta label**: counts, dates, owner/due details.

`eyebrow` can remain the visual style, but the design-system vocabulary should not leave `widget-type` and `eyebrow` as competing concepts.

## Action Text Review

### Buttons

Action text is generally understandable. Common patterns include:

- Open destination: `Open agenda`, `Open tasks`, `Open Lists`, `Open full reset`
- View destination: `View Tasks`, `View Motivation`
- Add/create: `Add task`, `Add personal goal`, `Create family goal`
- Review actions: `Keep active`, `Someday`, `Archive`, `Skip this week`
- Edit/manage: `Edit family goal`, `Manage personal goals`, `Show preview`

### Links

Links are used for empty-state anchoring in some widget surfaces, for example “Start with one household event.” Buttons are used for similar actions elsewhere. The mixed element choice is acceptable when one is an anchor and one is a command, but the visible language should be standardized.

### Secondary actions

Secondary actions are mostly concise and understandable. The main inconsistency is destination wording: `Open`, `View`, `Manage`, and `Start with` are used for related navigation/setup intentions.

### Dutch consistency

The visible UI language in reviewed files is English. Dutch is not consistently applied because it is not currently the active UI language. There is no obvious mixed Dutch/English typography issue in the reviewed surfaces. If Dutch localization is a product goal, action text needs a separate localization pass rather than typography-only cleanup.

### Verbosity

Actions are mostly short enough. Some empty-state action labels are sentence-like (`Start with one household task.`), while others are command labels (`Open Tasks`, `Create family goal`). Review actions are appropriately short.

### Determination

Action language consistency is moderate. The product needs a verb taxonomy more than a visual change:

- Use `Open` for navigation to an existing destination.
- Use `Add` for adding an item to an existing collection.
- Use `Create` for first-time setup or durable objects.
- Use `Manage` only when opening a detail/admin surface.
- Avoid sentence-style button labels unless the button is intentionally coaching first-run behavior.

## Empty State Review

### Home

Home empty states are the most consistent: `Create/Add your first…`, one explanatory sentence, and an `Open…` action. They are action-first and appropriately brief.

### Tasks

Tasks uses the shared empty-state shape, but the button label is more instructional: `Start with one household task.` This is helpful for first-run context but differs from Home’s `Open Tasks` style.

### Lists

Lists empty states use both page-level and section-level empty labels: `Start by adding one item.`, `No active items.`, `No completed items.`, and `No recently deleted items.` The primary empty state is action-first; section empty labels are terse and status-like.

### Motivation

Motivation empty states are concise and action-first: no family goal yet, create one shared goal, create family goal. This is one of the better empty-state language models.

### Weekly Reset

Weekly Reset empty states are review-state oriented: `Nothing needs review right now.` This is correct because the workflow is maintenance, not creation.

### Child Workspace

Child Workspace empty states are intentionally adult-mediated: `No jobs right now. A grown-up can add one.` and `No personal goal right now. A grown-up can add one.` This is appropriate child-facing language because it avoids blaming the child and tells them who controls setup.

### Determination

A shared empty-state pattern mostly exists:

- State title or concise status
- One explanatory sentence
- Optional primary action

The weak point is inconsistency between command actions, instructional sentence actions, and terse section empties. Empty-state standardization would be useful, but not as urgent as typography role consolidation.

## Child vs Adult Typography

### Child-facing language

Child Workspace uses direct, simple, encouraging language:

- `What should I do today?`
- `Finding your helpful jobs…`
- `No jobs right now. A grown-up can add one.`
- `Only 1 more… You helped.`
- `We did it together!`
- `Stars to collect`

This is distinct from adult pages, which use operational terms like `review candidates`, `archive`, `templates`, `household responsibilities`, and `ad-hoc tasks`.

### Appropriateness

The child language is generally simpler and emotionally warmer. It correctly avoids administrative vocabulary for the child’s main journey and uses grown-up mediation where setup is needed.

### Overlap and friction

There is some unnecessary overlap in shared concepts:

- `Family Goal` and `Family goal` appear with different casing.
- `This Week` and `This week’s review` both use uppercase label styling but refer to different contexts.
- Child surfaces sometimes show product/system concepts, especially when parent mode or administration content appears nearby.

### Determination

Child typography follows intentional rules in content, but not yet in formal type taxonomy. The child/adult distinction should be preserved as a variant of the typography system rather than treated as a separate competing system.

## Typography Fragmentation

### Critical inconsistencies

None. There is no typography inconsistency severe enough to block product comprehension. The current app is readable, navigable, and broadly cohesive.

### Major inconsistencies

1. **Multiple label systems**
   - `eyebrow` and `widget-type` compete as uppercase label systems.
   - Domain, section, status, and meta labels are not separately named.

2. **Page-title taxonomy is implicit**
   - Home, Motivation, Tasks, Lists, Agenda, Weekly Reset, and Child Workspace use different title models.
   - Some differences are intentional, but the system does not document which surfaces should differ and why.

3. **Card title roles are not fully consolidated**
   - `CardHeader` is strong, but many important cards still hand-roll title, subtitle, meta, and status combinations.

4. **Action verb inconsistency**
   - `Open`, `View`, `Manage`, `Create`, `Add`, and `Start with` are all understandable, but not governed by a shared action-language rule.

### Minor inconsistencies

1. **Title casing drift**
   - Examples include `Family Goal` vs `Family goal`, `Family Memories` vs sentence-case section titles, and mixed title-case/sentence-case labels.

2. **Meta/status rendering drift**
   - Counts, loading messages, row details, and status statements use a mix of `small`, plain `p`, `shopping-empty`, and custom classes.

3. **Empty-state action shape drift**
   - Some empty states use command labels; others use coaching sentences or links.

4. **Legacy widget terminology**
   - `Agenda Widget` exposes implementation vocabulary compared with newer user-facing page labels.

## Typography Maturity

### Title system: Moderate

The product has recognizable title hierarchy, but page title rules are implicit and inconsistent across dashboard, widget, workflow, and child surfaces.

### Card system: Moderate

Home summary cards are strong and the shared card primitive is a good foundation. Other cards are readable but still locally assembled.

### Action language: Moderate

Actions are generally concise and understandable, but the verb taxonomy is not explicit.

### Empty states: Moderate to strong

The common empty-state structure is visible and useful. Variation exists, but it mostly reflects context rather than fragmentation.

### Child language: Strong content, moderate system

Child-facing copy is warmer, simpler, and meaningfully distinct. The system needs casing and role rules so child language feels intentionally variant rather than independently styled.

## Recommended Next Step

Recommendation: **A. Typography Consolidation**

Typography consolidation is the right next step. Design System Complete Enough would be premature because typography roles still depend on local classes and historical component patterns. Child Language Cleanup and Empty State Standardization are valuable, but both are narrower than the underlying issue.

A focused Typography Consolidation slice should define and apply a small shared taxonomy without changing product behavior:

1. Page label, page title, page subtitle.
2. Card label, card title, card subtitle, card meta, card status.
3. Action verbs by intent: Open, View, Add, Create, Manage, Review.
4. Empty-state title/body/action pattern.
5. Child-facing variants for title, label, and body copy.

The goal should not be visual redesign. The goal should be to make typography roles explicit so future pages do not invent new local systems.

## Next Prompt Context

Use this report to drive a future implementation prompt for Typography Consolidation. The implementation should be behavior-preserving and should not introduce new product features, routes, migrations, screenshots, or visual artifacts.

Suggested future prompt scope:

- Add or refine shared typography/header primitives for page headers and card headers.
- Consolidate `widget-type` and `eyebrow` into a clear label taxonomy while preserving visual appearance.
- Normalize page headers for Motivation, Tasks, Lists, Agenda, and Weekly Reset where appropriate.
- Preserve Home’s dashboard hero and Child Workspace’s child-facing hero as intentional variants.
- Normalize action verbs and empty-state action labels only where this does not alter workflows.
- Keep child-facing copy simple and adult setup language out of child-primary cards.
