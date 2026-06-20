# HomeOps Proven Functionality User Guide

This guide describes only functionality proven by repository evidence. It does not include planned features.

## Starting HomeOps for the First Time

When HomeOps detects that household setup is required, it opens a first-run wizard before the normal workspace.

1. Select **Start setup**.
2. Add at least one adult by name.
3. Add children if applicable. Children require a date of birth.
4. Review the adults and children.
5. Select **Finish and open Home**.

Result: the household roster is created and HomeOps opens the Home workspace. You can later edit members from Home.

## Navigation

The main workspace navigation exposes these areas:

- Home
- Agenda
- Lists
- Tasks
- Motivation
- House Status
- Media
- Gamification
- Settings

House Status, Media, and Gamification are placeholders only. Settings currently exposes calendar export/restore, not general household settings.

## Family Members

### What it does
Family members represent adults and children in the household. They can have names, initials, colors, type, date of birth for children, and avatars.

### How to find it
Open **Home**. Use the family area to add a member or select an existing family member.

### How to configure it
- Use **Add Family Member** to enter name, adult/child type, date of birth for children, and display color.
- Select a member from Home to edit details and avatar.
- Use the remove action on the member page to remove a member.

### Result
Members appear in Home, member pages, task owner selection, personal goals, and helpful moments.

## Avatars

### What it does
Avatars provide a visual identity for each household member.

### How to find it
Open **Home**, select a family member, and use the avatar editor on the member page.

### How to configure it
Edit avatar presentation, age group, skin tone, hair color, hair style, glasses, and shirt color where available.

### Result
The avatar appears in family and motivation views.

## Tasks

### What it does
Tasks track ad-hoc household responsibilities. A task can have a title, due date, and owner type: unassigned, shared household, or a specific family member.

### How to find it
Select **Tasks** in the workspace navigation. Home also contains task summary navigation.

### How to configure it
1. Enter a title.
2. Choose owner type.
3. If owner type is family member, choose a person.
4. Optionally set a due date.
5. Select **Add task**.

### How to use it
Use **Complete** to mark a task done. Use **Reopen** to undo completion.

### Result
Tasks are grouped by urgency. Completed shared-household tasks can advance the active family goal. Completed family-member tasks can advance that member’s active personal goals.

### Proven limitations
No task edit, delete, recurrence, templates, reminders, or notifications are proven.

## Motivation: Family Goals

### What it does
A family goal gives the whole household one shared target. Shared household task completion can increase progress.

### How to find it
Select **Motivation**. Home may also display a motivation tile.

### How to configure it
Use **Create family goal**. Enter a goal title, target count, unit label, and optional celebration information.

### How to use it
Complete shared-household tasks to move progress. Edit the family goal from the Motivation page. If celebration information exists and the target is reached, mark the celebration as completed.

### Result
The Motivation page and Home tile show progress toward the active family goal.

## Motivation: Personal Goals

### What it does
Personal goals track simple encouragement targets for one family member.

### How to find it
Select **Motivation**, then use the **Personal goals this week** section.

### How to configure it
Use **Add personal goal**. Choose a family member, title, target count, and unit label.

### How to use it
Complete tasks assigned to that family member to advance that member’s personal goals. Edit or retire/archive goals from the goal form.

### Result
The page shows per-member progress with visual markers.

## Helpful Moments

### What it does
Helpful Moments record recognition notes for kindness, initiative, teamwork, responsibility, or routines.

### How to find it
Select **Motivation**, then use **Recent Helpful Moments**.

### How to configure it
Choose a family member, recognition tag/title/description as exposed by the form, and save the moment.

### Result
Recent recognition notes appear in a feed.

## Shopping Lists

### What it does
Shopping lists support multiple durable lists and items. Items can be added, toggled, and removed.

### How to find it
Select **Lists**. Home also contains a shopping/lists summary.

### How to configure it
If no list exists, use **Create Shopping list**. Add items in the list widget.

### How to use it
Add items, toggle items as checked/unchecked, and remove individual items.

### Result
The current list and items remain available through the backend.

### Proven limitations
No list rename or list deletion flow is proven.

## Agenda / Calendar

### What it does
Agenda shows household events. Manual events can be created, edited, and deleted through calendar event APIs and UI components.

### How to find it
Select **Agenda**. Home also contains an agenda summary.

### How to configure it
Use the Agenda event form to enter event title, date/time information, all-day setting, and optional description where exposed.

### How to use it
View upcoming events in the Agenda. Edit/delete events where the manual event UI exposes those actions.

### Result
Events are persisted and projected into agenda occurrences.

### Proven limitations
Calendar reminders, notifications, and user-configurable Google Calendar integration are not proven. User-facing recurrence editing is not proven.

## Calendar Export / Restore

### What it does
Exports calendar data to a JSON document and restores calendar data from a JSON document.

### How to find it
Select **Settings**, then use **Calendar Export / Restore**.

### How to use it
Export to obtain a calendar document. Restore by providing a compatible calendar export document.

### Result
Calendar data can be backed up and restored. Restore has server-side validation.

## What HomeOps Does Not Yet Prove

The repository does not prove usable rewards, reward redemption, notifications, reminders, authentication, household settings UI, Google Calendar account setup, task recurrence, task templates, list rename/delete, or complete dashboard customization UI.
