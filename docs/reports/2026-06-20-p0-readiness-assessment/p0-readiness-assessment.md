# P0 Readiness Assessment

Date: 2026-06-20

## Summary

Verdict: **P0 MOSTLY READY**

HomeOps now covers the core onboarding shape identified by the user research: first-run household setup exists, adults and children can be created, Home opens after setup, and the main household domains expose first-action empty states. A non-technical parent can likely understand the intended path for household setup, tasks, shopping/list items, and calendar events without external documentation.

The product is not fully P0 ready because the assessment found one critical gap and several major UX risks:

1. **First family goal creation is not available from the Motivation empty state.** The copy says “Create your first family goal,” but there is no create action or editing form, so the first-value requirement for a family goal cannot be completed.
2. **Onboarding is not fail-safe.** If onboarding-status loading fails, the shell bypasses onboarding and opens the app instead of guiding setup, which can leave a fresh family with an empty Home and no explanation.
3. **Agenda empty-state validation is masked by bundled demo read-only events.** A fresh installation can still show demo/birthday-style content, so “no Events” does not reliably produce the intended empty state.
4. **Shopping/List creation wording is confusing.** The list widget can say “Create your first list” even when the user’s real goal is “add a shopping item,” and Home says “Open Lists” rather than placing the parent directly at the item field.
5. **The wizard cannot edit or remove a mistaken member before finishing.** Parents can go back, but if they mistype a name or birth date in first run, the review step only reviews; correction is deferred until after setup.

Validation boundary: the Vite frontend was started successfully and the code/test paths were reviewed. Full API-backed browser validation was limited because Docker is unavailable in this environment, so PostgreSQL-backed fresh-install startup could not be exercised end-to-end.

## First Run Experience

### Findings

- Onboarding is implemented as a dedicated five-step flow: Welcome, Adults, Children, Review, Finish.
- The step list is visible and matches the requested sequence.
- Welcome copy is short and understandable for a non-technical parent: it explains that HomeOps organizes the household and that members can be changed later.
- The adult step requires at least one adult before continuing, which is reasonable for household setup.
- The child step is skippable, which avoids forcing irrelevant setup.
- Review separates Adults and Children clearly.
- Finish tells the user Home will open and that members can be edited later.

### UX strengths

- The flow is short enough for P0.
- The required decisions are minimal: adult names, optional children, child birth dates.
- The wizard does not introduce accounts, roles, permissions, rewards, integrations, or technical setup language.

### UX friction and gaps

- The wizard does not offer inline edit/remove controls on the Review step. A typo in a child name or birth date requires finishing setup and finding the Family Member management path later.
- Child date-of-birth is required but the wizard does not explain why HomeOps needs it.
- Adult date of birth is not asked in first run, while the later Add Family Member dialog shows a date-of-birth field for adults. This mismatch is acceptable but mildly inconsistent.
- If onboarding status fails to load, the shell sets `requiresOnboarding` to false. For P0 self-service, that is risky because a fresh household could bypass onboarding during an API/network issue.

## Family Member Creation

### Add adult

Assessment: **Mostly ready**

- A parent can add an adult by entering a name and submitting the adult form.
- Adult creation uses sensible avatar defaults and does not ask unnecessary account/security questions.
- The wizard requires at least one adult before continuing.

### Add child

Assessment: **Mostly ready**

- A parent can add a child with name and date of birth.
- Date of birth uses the browser date input, which is familiar but not always friendly for older dates on all devices.
- Children are separated from adults in the wizard and review step.

### Date of birth handling

Assessment: **Mostly ready**

- Children require a date of birth in first run.
- Adults do not need a date of birth in the wizard.
- The product should explain the purpose of child birth dates, such as age-appropriate presentation or birthdays, because a parent may wonder whether this is private or necessary.

### Avatar handling

Assessment: **Ready for P0**

- First run does not ask the parent to configure avatars, which keeps setup short.
- Default avatars are created automatically.
- Avatar editing is available later through Family Member management.

### Parent usability conclusion

A normal parent can complete household-member creation, but correcting mistakes should be possible before Finish to avoid a frustrating first impression.

## Post-Wizard Experience

### Findings

- After finishing onboarding, the app opens Home.
- Home includes family members, quick shopping capture, quick event capture, and summary cards for Agenda, Lists, Motivation, and Tasks.
- Home gives useful next-step cards when domains have no content.

### UX strengths

- Home now feels like the right landing surface for a household dashboard.
- Shopping and event quick capture provide immediate practical value.
- The domain cards explain what to do next rather than presenting blank panels.

### UX friction and gaps

- Motivation may look actionable but is not actionable when no family goal exists.
- If backend/API calls fail on initial load, Home can show multiple error states and no onboarding recovery path.
- Home’s Agenda can be populated by demo read-only events, which may make a fresh installation feel less empty but also less personal.

## Empty State UX

### Home

Assessment: **Mostly ready**

- Home includes first-action guidance for Agenda, Lists, Motivation, and Tasks.
- The guidance is plain-language and parent-friendly.
- The cards route to the relevant domain.

Gap: Motivation routes to a page that still cannot create the first family goal.

### Tasks

Assessment: **Ready**

- Empty copy explains that tasks organize household responsibilities.
- The action points to the task title field.
- Creating a first task appears discoverable without documentation.

### Lists

Assessment: **Mostly ready**

- The empty state explains why lists matter.
- If a Shopping list exists, the action points to the item field.
- If no list exists, a “Create Shopping list” button exists.

Gap: “Create your first list” may be more abstract than the parent goal. “Start your shopping list” would better match the P0 scenario.

### Agenda

Assessment: **Mostly ready**

- The empty state explains that events help remember important dates and activities.
- The action points to the calendar event title field.
- The event form is visible on the page.

Gap: Empty state may not appear in a true fresh-install test if demo read-only events are present and visible.

### Motivation

Assessment: **Not ready**

- The empty state wording is understandable.
- It does not lead somewhere useful because there is no create/edit goal action.
- It cannot create the intended family goal.

## First Value Test

### First task

Result: **Pass by UI/code assessment**

A parent can open Tasks, enter a title, optionally set owner/due date, and press Add task. The empty state points to the same form.

### First shopping item

Result: **Pass by UI/code assessment, with wording caveat**

A parent can add a shopping item from Home quick capture or the Lists page when a Shopping list exists. If no Shopping list exists, the Lists page exposes a create-list action first.

### First event

Result: **Pass by UI/code assessment**

A parent can create a simple event from Home quick capture or use the Agenda event form. The Agenda form is more detailed, but still understandable enough for a first event.

### First family goal

Result: **Fail**

A parent cannot create a first family goal without documentation or developer assistance because the Motivation empty state contains no create action and no goal form. This is the primary P0 blocker.

## Self-Service Assessment

Rating: **Mostly ready**

A non-technical family can probably become operational for household members, shopping items, tasks, and simple events without developer assistance. They cannot become fully operational against the stated P0 goal because family goal creation is missing. The app also needs a safer onboarding failure path and less demo-data leakage in fresh-install empty-state validation.

## Critical Blockers

1. **First family goal cannot be created.** The P0 first-value test explicitly requires creating a first family goal, but Motivation only displays an empty state when no goal exists.

## Major UX Issues

1. **Onboarding bypasses on status-load failure.** The app treats onboarding-status failure as “no onboarding required,” which is unsafe for a fresh household.
2. **Review step cannot correct mistakes.** The wizard review page does not provide edit/remove actions before Finish.
3. **Agenda empty states may be hidden by demo read-only events.** This weakens the fresh-install “No Events” scenario and can confuse parents about what data is theirs.
4. **Motivation empty state overpromises.** “Create your first family goal” describes an unavailable action.
5. **Lists empty-state wording is too generic.** P0 parents are likely trying to add groceries, not reason about list creation as a domain concept.

## Minor UX Issues

1. Child date-of-birth requirement lacks a short explanation.
2. Adult date-of-birth handling differs between first run and later add-member management.
3. Home quick event capture creates all-day events only; that is acceptable for P0 but may surprise parents entering timed activities.
4. Some domain labels still feel product/internal, such as “Motivation,” “Agenda Widget,” and “Shopping List Widget.”
5. Empty-state actions often navigate or anchor rather than directly opening a guided create flow.

## Recommended Next Slice

**P0 Goal Creation and Onboarding Hardening**

Scope the next slice narrowly:

1. Add minimal family-goal creation/editing from Motivation empty state.
2. Make onboarding-status failures fail closed into a clear setup/loading retry state instead of bypassing onboarding.
3. Add edit/remove controls to first-run Review.
4. Remove or suppress demo read-only Agenda events for true fresh installations, or clearly label them as examples.
5. Tighten P0 empty-state wording around concrete first actions: first shopping item, first task, first event, first family goal.

Do not add rewards, shops, points, authentication, permissions, Google Calendar, notifications, recurrence editing, or P1 integrations in this slice.

## P0 Verdict

**P0 MOSTLY READY**

HomeOps is close to the original onboarding and household-creation goals, but it does not yet satisfy every stated P0 readiness requirement because first family goal creation is unavailable.

## Next Prompt Context

Use this context for the next implementation prompt:

- Implement only the missing P0 self-service gaps from the P0 readiness assessment.
- Primary blocker: Motivation empty state says “Create your first family goal,” but no user-facing goal creation exists.
- Keep the goal slice minimal: one active family goal title, target count/unit, optional reward label if already supported by the model, save through the existing backend pattern, then refresh Motivation/Home.
- Harden first-run onboarding so status-load failures do not silently bypass setup.
- Add Review-step correction for family members if it can be done without expanding scope; otherwise handle it as the next separate slice.
- Do not add rewards economy, gamification, authentication, permissions, Google integrations, notifications, recurrence editing, or unrelated improvements.

## Validation

- Application started successfully: **Partial pass** — Vite frontend started and returned HTTP 200 at `http://127.0.0.1:5173/`; full PostgreSQL-backed API startup could not be validated because `docker` is not installed in this environment.
- Onboarding tested: **Code/UI assessment performed** — first-run flow, status gating, member creation, review, and completion paths were reviewed.
- Empty states tested: **Code/UI assessment performed** — Home, Tasks, Lists, Agenda, and Motivation empty-state implementations were reviewed.
- First task created: **Not end-to-end in browser** — UI/code path supports creation; full DB-backed creation was not executed due missing Docker/PostgreSQL.
- First shopping item created: **Not end-to-end in browser** — UI/code path supports creation; full DB-backed creation was not executed due missing Docker/PostgreSQL.
- First event created: **Not end-to-end in browser** — UI/code path supports Home quick capture and Agenda creation; full DB-backed creation was not executed due missing Docker/PostgreSQL.
- First family goal created: **Failed** — no user-facing creation path exists.
