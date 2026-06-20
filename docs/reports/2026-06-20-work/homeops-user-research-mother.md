# HomeOps User Research — Mother Persona

## Persona

I am an intelligent non-technical mother. I want the household to run more smoothly, but I do not want to administer a system. If a feature feels complicated or requires technical interpretation, I will stop using it.

## How I understood HomeOps from the guide

HomeOps is a shared home dashboard. I would start at Home, where I can see today's information, family members, quick entry for shopping and events, and summaries for Agenda, Lists, Tasks, and Motivation. If I need more detail, I open the relevant page.

## Initial setup from an empty installation

### Profiles / household members

I expected a simple setup flow: add Father, add Mother, add Child, choose who is an adult or child, and continue. I cannot find evidence of that. The family area seems to show existing members and lets me open a member page, but it does not prove I can add or remove people.

**Result:** I would be blocked or confused during first setup if no correct family members already existed.

### Avatars

Avatar editing is understandable once I find it: Home family chip → member page → Edit avatar. The choices are concrete enough, though color hex values are not friendly for non-technical users.

**Result:** I could configure avatars, but I would prefer plain color names and a guided setup step.

### Goals

I expected to set a goal like “Complete homework routine 4 times” or “Family movie night after 10 shared tasks.” The Motivation page shows goals and progress, but I cannot prove I can create or change them.

**Result:** I cannot configure goals. I would not rely on Motivation because it may not match our family.

### Tasks

The task page is practical. I can add a title, choose an owner, optionally set a due date, then complete or reopen the task. The urgency groups make sense for daily life.

**Result:** I could use this for simple chores, but I would avoid over-managing it because recurring routines and reminders are missing.

### Shopping lists

Shopping capture is the easiest feature. I can add “milk” from Home and manage active/completed items in Lists. This matches a real daily behavior.

**Result:** I would use Shopping if it reliably appears on Home and does not require list management.

### Calendars

Quick event capture from Home is simple for “today/tomorrow/pick date.” The Agenda page has more fields and editing. I would use it for occasional local notes, but I would hesitate to maintain a second calendar because there is no proven real Google Calendar connection, reminders, or notifications.

**Result:** Useful for HomeOps-only events, but not enough to replace my existing calendar.

### Rewards and motivation

The idea of encouragement is good. I like avoiding competition and punishment. But because I cannot set rewards or choose goals, it feels incomplete.

**Result:** I would show it to the child once or twice, then likely stop if it does not reflect our real routines.

## Several weeks of hypothetical use

### Week 1

I would try to get the basics working: family avatars, grocery items, school tasks, and a few events. If the starting family members were wrong or absent, I would ask the father to fix it. That is already a risk: HomeOps should not require a technical person for household setup.

### Week 2

Shopping would become my main feature because it is fast. Tasks would be useful for one-off chores like “bring library book” or “return sports clothes.” I would not want to manually recreate daily routines.

Calendar quick capture would be fine for local reminders, but without notifications I might forget to check it. I would keep using my phone calendar as the real calendar.

### Week 3

I would simplify my usage: Home page, Shopping quick capture, maybe Tasks. I would ignore House Status, Media, and Gamification placeholders because they do not do anything. I would ignore Settings unless the father handled backup.

Motivation would be frustrating if the child expected rewards and I could not configure them.

## Evaluation by topic

### Discoverability

Good: Home summaries make it clear where to go next. Navigation labels are plain. Shopping and Event quick capture are visible from Home.

Weak: There is no first-run explanation, no household setup path, no “next step,” and placeholder pages look like product areas but are not usable.

### Onboarding

Onboarding is not adequate for non-technical users. I need a guided flow for household members, avatars, first shopping item, first task, first event, and first goal. The repository evidence does not show this.

### Information architecture

Home as overview and dedicated pages for Agenda, Lists, Tasks, and Motivation is understandable. I like that Home does not try to do everything.

The difference between Motivation and Gamification may be confusing because Motivation is real and Gamification is a placeholder.

### Feature completeness

Strong enough: add shopping items, add tasks, assign tasks, complete/reopen tasks, create/edit calendar events, edit avatars.

Not strong enough: setup, goals, rewards, reminders, recurring chores, notifications, list creation, full profile management, and integrations.

### Household setup workflow

This is the main failure. From an empty installation, I cannot prove I can configure the family, goals, or lists fully myself.

### Conceptual UX

The product idea fits household life. The best concept is Home as a calm overview, with quick capture for things parents think of during the day.

### Long-term usefulness

I might continue using Shopping and some Tasks. I would likely abandon Motivation and Calendar unless they became easier and better connected to real routines.

## Adoption assessment

**Might continue using.** I would use the simplest daily features only. I would not administer setup-heavy or incomplete areas.
