# FamilyBoard Marketing Storyboard V1

## Canonical Status

This is the canonical storyboard for the first FamilyBoard marketing preview video. It is a direction document only: no recording, screenshots, audio, Playwright implementation, production UI work, or generated media are part of this storyboard.

## Story Intent

FamilyBoard is shown as a calm household companion for one ordinary week with the Van Zijl family. The preview should feel like a short family film rather than a product demo: morning clarity leads into shared planning, small acts of help, weekly preparation, and a gentle ending together.

The guiding question for every scene is: **How does FamilyBoard make everyday family life a little easier?**

Expected viewer feeling: calm, warmth, clarity, confidence, family, and routine.

## Canonical Inputs

- Household: Van Zijl family.
- Fixture date: Tuesday, 16 June 2026, with the canonical week ending Sunday, 21 June 2026.
- Marketing fixtures used by this storyboard: `visual-marketing-home`, `visual-marketing-family`, `visual-marketing-agenda`, `visual-marketing-tasks`, `visual-marketing-shopping`, `visual-marketing-motivation`, and `visual-marketing-weekly-reset`.
- Marketing Director compatibility: scenes use fixture names, chapter copy, purpose, emotional tone, visual focus, min/preferred/max durations, branded Chapter Card direction, transitions, and semantic actions.
- Recording Framework compatibility: directions map to existing scene, camera, transition, and touch concepts without adding execution code.
- Audio Framework compatibility: audio cues reference existing event categories only.

## Emotional Curve

The movie should progress through this emotional curve:

Calm

↓

Curiosity

↓

Recognition

↓

Confidence

↓

Warmth

↓

Reflection

↓

Calm

This curve should guide future Marketing Director pacing, transitions, branded Chapter Cards, touch restraint, and audio decisions. The early scenes should feel observant and gently curious; the middle scenes should build recognition and confidence through purposeful actions; Motivation should create warmth by recognizing kindness; Weekly Reset should slow into reflection; the Outro should return to calm without a call to action.

## Continuity Thread

The preview should feel like one ordinary Van Zijl family week, not a chain of independent feature moments. Keep these story links visible throughout the recording:

- Home introduces Thomas's swimming lesson, quiet weather context for the school run, and the practical pressure of the day. Tasks later resolves that pressure by completing `Zwemtas klaarzetten`.
- Family personalization makes Thomas feel like the same child whose school, swimming, cookies, and helpful moments appear later.
- Agenda opens to Planning by default, answers what the family needs to know next, gives Today the dominant briefing role with subtle implemented weather context where it naturally appears, keeps This Week quieter, shows Vooruitkijken for reassurance, and leaves Month visible only as a contextual planning tool instead of spending scene time inside it.
- Shopping supports `Koekjes bakken` from Tasks: `Bloem`, `Roomboter`, `Chocoladestukjes`, and `Vanillesuiker` are already present in the fixture, while one ordinary `Bananen` addition keeps the interaction simple and believable.
- Motivation should feel earned by the earlier helping actions, especially the completed swim-bag task and the general household reset work.
- Weekly Reset reflects the same week: swimming preparation, Filmavond, cookies, groceries, helpful moments, and appreciation all resolve into Sunday evening calm.

## Chapter Card Language

Every scene begins with a branded FamilyBoard Chapter Card instead of a persistent feature overlay. The card should appear gently, show the scene title and optional subtitle, hold for approximately one second, then fade away before the main scene continues. After the fade, the UI owns the full screen with no lingering instructional label, badge, callout, or feature overlay.

Chapter Cards are part of the FamilyBoard brand identity: calm, warm, readable, and subtle. They orient the viewer emotionally, then step aside so the family's week and the interface can carry the story.

## Visual Brand Language

Future FamilyBoard marketing storyboards should follow this visual language:

- Use Chapter Cards instead of instructional overlays or persistent feature labels.
- Keep transitions calm, warm, and unhurried.
- Show touch-first interaction through restrained, purposeful gestures.
- Leave breathing room between actions so the viewer can feel what changed.
- Let the interface be the hero after each Chapter Card fades.
- Keep branding subtle and confident rather than promotional.
- Put the family story before the feature list every time.

## Timing Summary

Preferred total duration: **85 seconds**.

Minimum total duration: **68 seconds**.

Maximum total duration: **90 seconds**.

| Scene | Fixture | Preferred duration | Narrative beat |
| --- | --- | ---: | --- |
| Intro | `visual-marketing-home` | 5s | A quiet morning begins. |
| Home | `visual-marketing-home` | 8s | Today becomes readable, with weather context as a supporting cue. |
| Family | `visual-marketing-family` | 10s | “This is our family.” |
| Agenda | `visual-marketing-agenda` | 14s | Planning briefing by default, one realistic plan, and Month only as a visible contextual tool. |
| Tasks | `visual-marketing-tasks` | 10s | Add one task and complete one helpful job. |
| Shopping | `visual-marketing-shopping` | 7s | Baking errands connect to cookies; add bananas. |
| Motivation | `visual-marketing-motivation` | 10s | Appreciation recognizes kindness. |
| Weekly Reset | `visual-marketing-weekly-reset` | 14s | Sunday reflection becomes the emotional high point. |
| Outro | `visual-marketing-home` | 7s | The family ends together, ready. |

## Storyboard

### 1. Intro

- **Purpose:** Open the preview as a family story, not as a technical product tour.
- **Narrative role:** Establish a quiet Tuesday morning before the board becomes the family's shared memory.
- **Emotional tone:** Calm.
- **Chapter title:** Home
- **Optional subtitle:** A calmer start to the day
- **Chapter Card:** `Home` appears with `A calmer start to the day`, holds for approximately one second, then gently fades out before the Home dashboard owns the screen.
- **Fixture:** `visual-marketing-home`
- **Duration:** 5 seconds
- **Minimum duration:** 4 seconds
- **Maximum duration:** 6 seconds
- **Visual focus:** The redesigned viewport-first Home dashboard as today's household answer: family presence, today's rhythm, immediate tasks, shopping signal, and motivation cues all visible without page scrolling.
- **Transition:** Fade in from warm neutral black.
- **Camera pacing:** Start still. Hold for a full breath before any motion. Use only a very slow settle toward the center of the screen so the viewer reads the board as part of the room.
- **Touch gestures:** None.
- **Interaction sequence:** No interaction; the value is immediate readability.
- **Audio events:** `RecordingStarted`, `ChapterStarted`, soft `TransitionCompleted`.
- **Expected final state:** Home dashboard visible, steady, and readable.
- **Director notes:** Let this scene breathe. Do not introduce touch yet; the opening should feel observed rather than operated.

### 2. Home

- **Purpose:** Show that FamilyBoard answers the morning question: what matters today?
- **Narrative role:** Move from atmosphere into practical morning clarity for school, daycare, swimming, dinner, and tasks.
- **Emotional tone:** Calm shifting into curiosity.
- **Chapter title:** Today
- **Optional subtitle:** Everything that matters is already here
- **Chapter Card:** `Today` appears with `Everything that matters is already here`, holds for approximately one second, then gently fades out before the dashboard continues without an overlay.
- **Fixture:** `visual-marketing-home`
- **Duration:** 8 seconds
- **Minimum duration:** 6 seconds
- **Maximum duration:** 9 seconds
- **Visual focus:** The Home dashboard's dominant daily household regions: the header weather pill as quiet morning context, family members, today's Agenda signal, task/shopping/motivation summaries, and the swimming lesson that will be supported later by the swim-bag task.
- **Transition:** Gentle dissolve from the intro hold.
- **Camera pacing:** Pause on the full dashboard with the weather pill visible, briefly open the weather detail dialog from the pill, close it, then drift from the family presence toward today's planning and practical summary regions long enough for the swim lesson and school rhythm to register as the first continuity thread.
- **Touch gestures:** Tap the Home weather pill once, then close the weather detail dialog.
- **Interaction sequence:** Show the weather pill in the Home header; briefly open the detail dialog; close it; return to the Home dashboard. Do not open quick capture; the scene is still about seeing, not entering.
- **Audio events:** `ChapterStarted`, `TouchStarted`, `TouchCompleted`.
- **Expected final state:** Home remains on the same calm dashboard state after the weather detail dialog closes, with the swimming lesson remembered as a practical need for later.
- **Director notes:** Avoid feature dumping. Weather is a supporting morning cue, not the subject; the tap should feel like Dad checking whether the school run needs a jacket while coffee is brewing.

### 3. Family

- **Purpose:** Communicate “This is our family” through a brief, personal Avatar demonstration.
- **Narrative role:** Humanize the household before moving deeper into planning, making the board feel owned by Dad, Mom, Thomas, and Robin.
- **Emotional tone:** Recognition, personal, familial.
- **Chapter title:** Family
- **Optional subtitle:** This is our family
- **Chapter Card:** `Family` appears with `This is our family`, holds for approximately one second, then gently fades out before the Family overview fills the screen.
- **Fixture:** `visual-marketing-family`
- **Duration:** 10 seconds
- **Minimum duration:** 8 seconds
- **Maximum duration:** 11 seconds
- **Visual focus:** Thomas's redesigned Mijn Pagina opens as a personal daily overview: compact identity/avatar orientation, today's personal focus, appreciation/progress signals, and contextual avatar editing before the brief save and return.
- **Transition:** Soft crossfade.
- **Camera pacing:** Move slowly from the family overview to Thomas. Pause on the personal daily overview so identity, today, and progress read together, pause briefly in the bounded Avatar Editor, save, then hold for a beat on the updated avatar before returning to the family overview.
- **Touch gestures:** Tap Thomas, tap Avatar Editor, make one simple visual-property change, tap save, tap return.
- **Interaction sequence:** Open Thomas; open Avatar Editor; change one simple visual property such as a color, accessory, or equally small appearance option; save; pause briefly so the updated avatar can be noticed; return to the Family overview.
- **Audio events:** `TransitionStarted`, `TransitionCompleted`, `TouchStarted`, `TouchCompleted`, `ActionCompleted`, optional `save`.
- **Expected final state:** Family overview is visible again, with Thomas feeling subtly personalized and still recognizable as the same child in the week ahead.
- **Director notes:** This is not an editing demo. Keep it brief and affectionate: save, breathe on the updated avatar, then return. The viewer should feel “that looks like Thomas,” not “look at all these controls.”

### 4. Agenda

- **Purpose:** Show Agenda as the family's default Planning briefing, then add one realistic plan without turning the scene into a generic calendar tour.
- **Narrative role:** Today's briefing grows from the Home scene into the family's next shared rhythm, and the new Filmavond event makes planning feel lived-in.
- **Emotional tone:** Confidence without rigidity.
- **Chapter title:** Agenda
- **Optional subtitle:** What the family needs to know next
- **Chapter Card:** `Agenda` appears with `What the family needs to know next`, holds for approximately one second, then gently fades out before the Planning briefing owns the screen.
- **Fixture:** `visual-marketing-agenda`
- **Duration:** 14 seconds
- **Minimum duration:** 10 seconds
- **Maximum duration:** 14 seconds
- **Visual focus:** The implemented Agenda Planning Briefing surface: the dominant `Vandaag briefing`, quieter day-grouped `Deze week`, compact `Vooruitkijken`, quiet `Planning tools` containing `Afspraak plannen`, `Datum kiezen`, `Maand bekijken`, and source filters, plus the saved `Filmavond` event returning into the briefing.
- **Transition:** Dissolve after the Chapter Card fades; no persistent overlay remains.
- **Camera pacing:** Hold on Planning first so it reads as the default household briefing. Let Today dominate the first read, drift only enough for This Week and Vooruitkijken to reassure, then use `Afspraak plannen` from Planning tools. Do not open Month in the recording; Month should remain visible as contextual support, not become the scene.
- **Touch gestures:** Tap `Afspraak plannen`, enter `Filmavond`, and save.
- **Interaction sequence:** Enter Agenda on the default Planning overview; pause on Today / This Week / Vooruitkijken / Planning tools; add one event named `Filmavond` from `Afspraak plannen`; save it; stay on the updated Planning briefing long enough for Filmavond to feel part of the family week. Do not show Week, List, a mode tour, or a Month detour.
- **Audio events:** `ChapterStarted`, `TouchStarted`, `TouchCompleted`, `ActionCompleted`, optional `save`.
- **Expected final state:** The Planning briefing is visible with the family rhythm preserved and Filmavond added as a believable event that remains part of the week.
- **Director notes:** The point is briefing clarity: what matters today, what is reassuring this week, and what the family is prepared for. Month is a contextual helper when planning requires it, but this marketing scene should not spend time inside Month; Week is not shown.

### 5. Tasks

- **Purpose:** Show that practical tasks can be added and completed without drama.
- **Narrative role:** Planning turns into helping each other: one new household task appears, and one useful task gets completed.
- **Emotional tone:** Confidence shifting into helpful relief.
- **Chapter title:** Tasks
- **Optional subtitle:** Small jobs, shared rhythm
- **Chapter Card:** `Tasks` appears with `Small jobs, shared rhythm`, holds for approximately one second, then gently fades out before today's work becomes the full focus.
- **Fixture:** `visual-marketing-tasks`
- **Duration:** 10 seconds
- **Minimum duration:** 8 seconds
- **Maximum duration:** 11 seconds
- **Visual focus:** The Tasks viewport-first dashboard: the compact command/status band, today's work as the dominant region, the new `Koekjes bakken` task, and completion of `Zwemtas klaarzetten` to support the swimming lesson introduced on Home.
- **Transition:** Crossfade from Agenda.
- **Camera pacing:** Hold on today's work first. Keep the add-task moment steady and short. Move only enough to center `Zwemtas klaarzetten` inside the bounded task region, then pause longer after completion so the visual state can settle.
- **Touch gestures:** Tap add task, enter `Koekjes bakken`, save, tap one completion affordance.
- **Interaction sequence:** Add `Koekjes bakken`; let it appear in the list; complete `Zwemtas klaarzetten`; wait for the completion animation to finish before continuing.
- **Audio events:** `TouchStarted`, `TouchCompleted`, `ActionCompleted`, optional `save`, `task completed`.
- **Expected final state:** `Koekjes bakken` is visible as an added task and `Zwemtas klaarzetten` has completed with the visual state settled.
- **Director notes:** The completion animation must finish before the transition. This resolves the swimming-lesson thread from Home and should feel like relief, not a speed run.

### 6. Shopping

- **Purpose:** Show one tiny grocery addition while the existing shopping list clearly supports `Koekjes bakken` from the same week.
- **Narrative role:** Helpful planning continues into practical errands: baking ingredients for `Koekjes bakken` are already waiting, and one remembered `Bananen` addition keeps the scene ordinary.
- **Emotional tone:** Grounded, useful, unhurried.
- **Chapter title:** Shopping
- **Optional subtitle:** Errands that make sense
- **Chapter Card:** `Shopping` appears with `Errands that make sense`, holds for approximately one second, then gently fades out before grouped errands own the screen.
- **Fixture:** `visual-marketing-shopping`
- **Duration:** 7 seconds
- **Minimum duration:** 6 seconds
- **Maximum duration:** 8 seconds
- **Visual focus:** The execution-first Shopping dashboard: compact quick-add command row, active store-grouped shopping region with `Bloem`, `Roomboter`, `Chocoladestukjes`, and `Vanillesuiker` already present for `Koekjes bakken`, plus the quick addition of `Bananen`.
- **Transition:** Warm dissolve.
- **Camera pacing:** Start still on the active shopping region so the baking ingredients read as preparation for `Koekjes bakken`. Add `Bananen` from the compact command row and return attention to the grouped structure. Hold briefly after `Bananen` appears so it reads as one remembered item inside the same errands, not a separate feature beat.
- **Touch gestures:** Tap add item, enter `Bananen`, save. No extra scrolling unless needed for readability.
- **Interaction sequence:** Show the active shopping dashboard with the existing baking ingredients already present; add only `Bananen`; hold on the grouped list with the new item visible or clearly implied. Do not open completed, deleted, other-list, lifecycle, or management surfaces.
- **Audio events:** `TransitionStarted`, `TransitionCompleted`, `TouchStarted`, `TouchCompleted`, `ActionCompleted`, optional `save`.
- **Expected final state:** Shopping remains organized by real destinations, the cookie ingredients remain visible as support for `Koekjes bakken`, and `Bananen` has been added as a small piece of the same family week.
- **Director notes:** Keep the addition extremely short. This should feel like remembering bananas while already preparing for cookies, not operating a list manager.

### 7. Motivation

- **Purpose:** Demonstrate adding one appreciation so kindness from the week's helping moments becomes visible.
- **Narrative role:** The family recognizes that small help, like preparing the swim bag and keeping the house moving, is adding up toward Sunday's pancake breakfast.
- **Emotional tone:** Warmth, encouragement, tenderness.
- **Chapter title:** Motivation
- **Optional subtitle:** Helpful moments add up
- **Chapter Card:** `Motivation` appears with `Helpful moments add up`, holds for approximately one second, then gently fades out before the appreciation moment begins.
- **Fixture:** `visual-marketing-motivation`
- **Duration:** 10 seconds
- **Minimum duration:** 8 seconds
- **Maximum duration:** 11 seconds
- **Visual focus:** The three-region Motivation dashboard: Shared Family Purpose as the dominant anchor, Encouragement & Appreciation for the entry, and Celebration Story as supporting payoff.
- **Transition:** Soft crossfade.
- **Camera pacing:** Pause on Shared Family Purpose first. Move gently to Encouragement & Appreciation. Keep the entry steady. After saving, wait long enough for the appreciation preview to appear and become readable without opening history or statistics details.
- **Touch gestures:** Tap add appreciation, enter `Bedankt voor het helpen met opruimen.`, save.
- **Interaction sequence:** Read the shared family purpose; add the appreciation `Bedankt voor het helpen met opruimen.` in the appreciation region; pause on the displayed appreciation so it feels like a natural consequence of the earlier helping moments. Do not open personal-goal management, history, or statistics dialogs.
- **Audio events:** `ChapterStarted`, `TouchStarted`, `TouchCompleted`, `ActionCompleted`, `appreciation shown`, optional `save`.
- **Expected final state:** The new appreciation is visible and emotionally clear.
- **Director notes:** Do not make motivation feel gamified. The emotional point is recognizing kindness that the viewer has already seen the family practice.

### 8. Weekly Reset

- **Purpose:** Show the emotional high point: the family gently closes the week and prepares for the next one.
- **Narrative role:** Morning planning has matured into Sunday reflection, carry-forward decisions, and shared confidence.
- **Emotional tone:** Reflection, togetherness, satisfaction.
- **Chapter title:** Weekly Reset
- **Optional subtitle:** Ready for next week
- **Chapter Card:** `Weekly Reset` appears with `Ready for next week`, holds for approximately one second, then gently fades out before the Sunday reset fills the screen.
- **Fixture:** `visual-marketing-weekly-reset`
- **Duration:** 14 seconds
- **Minimum duration:** 12 seconds
- **Maximum duration:** 15 seconds
- **Visual focus:** Completed week, carried-forward tasks, family goal celebration, or reset summary that visibly connects swimming preparation, Filmavond, Koekjes bakken, groceries, appreciation, and helpful moments from earlier scenes.
- **Transition:** Longest transition in the movie: a slow warm dissolve into the Sunday evening ritual.
- **Camera pacing:** Move slower than every earlier scene. Enter gently, hold on the reset summary, move with extra breathing room to the completed or carried-forward outcome, and use the longest pauses on the completion state.
- **Touch gestures:** One calm, slow tap to complete or acknowledge the reset moment if available; otherwise no touch.
- **Interaction sequence:** Show the same week closing with visible traces of swimming preparation, Filmavond, Koekjes bakken, shopping, appreciation, and helpful moments; acknowledge the reset or completion state; allow the completion state to breathe before leaving.
- **Audio events:** `ChapterStarted`, optional `TouchStarted`, optional `TouchCompleted`, `weekly reset complete`, `ChapterCompleted`.
- **Expected final state:** Weekly Reset communicates the family gently finishing the same week together and feeling ready, not a checklist burden.
- **Director notes:** Weekly Reset is the emotional climax. Use the slowest movement, slowest touch, longest pause, and longest transition here so it feels like a Sunday evening family ritual.

### 9. Outro

- **Purpose:** Close with the same calm clarity as the opening, now enriched by the story of the week and a subtle brand moment.
- **Narrative role:** Return home after planning, helping, errands, appreciation, and reset: the family is ready together.
- **Emotional tone:** Calm, warm, complete.
- **Chapter title:** FamilyBoard
- **Optional subtitle:** Everyday family life, a little easier
- **Chapter Card:** `FamilyBoard` appears without a feature subtitle, holds for approximately one second, then gently fades out before the Home return and final brand card.
- **Fixture:** `visual-marketing-home`
- **Duration:** 7 seconds
- **Minimum duration:** 5 seconds
- **Maximum duration:** 7 seconds
- **Visual focus:** Home dashboard, then a simple brand card.
- **Transition:** Fade back to Home, then fade to branding, then fade to black.
- **Camera pacing:** Return Home and hold the dashboard briefly so the opening and ending visually mirror one another. Then fade to a centered FamilyBoard brand card. Hold the brand card for approximately two seconds before fading to black.
- **Touch gestures:** None.
- **Interaction sequence:** No interaction; the Home dashboard resolves the family week, then the brand card provides quiet recognition with no call to action, website, buttons, or feature list.
- **Audio events:** `ChapterStarted`, `ChapterCompleted`, `RecordingFinished`.
- **Expected final state:** Brand card holds briefly, then fades to black.
- **Director notes:** End together. Do not add calls to action, feature claims, buttons, URLs, or a final interaction.

## Sequence Justification

Settings remains outside the core sequence because it would interrupt the emotional narrative even though the current Settings page now accurately answers household health with a calm maintenance dashboard. The remaining sequence keeps the family story continuous: Home establishes the day and the swimming need, Family personalizes Thomas, Agenda opens with Planning, uses Month contextually for Filmavond, Tasks resolves the swim-bag pressure and adds cookies, Shopping supports Koekjes bakken with existing baking ingredients and adds bananas, Motivation recognizes the family helping, Weekly Reset reflects the week, and Outro returns to calm.

The Family scene remains before Agenda so the viewer meets the household before seeing the full planning surface. Weekly Reset remains near the end as the emotional climax, and the final Home/brand outro resolves the story without turning into a call to action.

## Storyboard Validation

- **Coherent narrative:** Yes. The story moves through one ordinary week: morning calm, Thomas's family identity, today's planning, Filmavond, swim-bag help, Koekjes bakken, groceries, appreciation, Sunday reflection, and ending together.
- **No feature dumping:** Yes. Expanded interactions are limited to one meaningful family identity action, Planning by default, one contextual Month lookup, and one event, one task addition, one task completion, one shopping addition, and one appreciation.
- **No persistent feature overlays:** Yes. Every scene uses a brief Chapter Card that fades away before the UI owns the screen.
- **Chapter Cards consistently described:** Yes. Each scene includes the Chapter Card title/subtitle experience and approximate one-second hold.
- **Every interaction has purpose:** Yes. Touch is limited to identity, planning, helping, remembering, appreciating, and closing the same week.
- **Stronger continuity between scenes:** Yes. Swimming, Thomas, Filmavond, cookies, baking ingredients, bananas, helpful actions, appreciation, and Weekly Reset now carry across scenes rather than appearing as disconnected interactions.
- **Shopping supports Koekjes bakken:** Yes. `Bloem`, `Roomboter`, `Chocoladestukjes`, and `Vanillesuiker` are already present, while only `Bananen` is added.
- **Appreciation follows helping:** Yes. `Bedankt voor het helpen met opruimen.` is framed as recognition of earlier helping moments.
- **Home and Outro visually mirror one another:** Yes. Home opens the story with calm readability, and Outro returns to Home before the final FamilyBoard brand card and fade to black.
- **Home and Weekly Reset feel connected:** Yes. Home introduces the day's practical needs, and Weekly Reset reflects the same family's completed week with the slowest movement, slowest touch, longest transition, longest holds, and most reflective tone.
- **Settings excluded from the story sequence:** Yes. There is no Settings scene in the storyboard sequence or timing table; if referenced in production notes, it should be treated as the current calm `Is alles in orde?` household-health dashboard rather than the obsolete calendar-administration stack.
- **Emotional curve documented:** Yes. The curve is defined as Calm → Curiosity → Recognition → Confidence → Warmth → Reflection → Calm.
- **Appropriate fixture use:** Yes. Every scene maps to an existing marketing fixture, and no production or framework changes are required.
- **Pacing remains calm:** Yes. The storyboard keeps readable pauses after every continuity beat and remains at minimum 68 seconds, preferred 84 seconds, maximum 90 seconds.
