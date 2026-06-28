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
- Marketing Director compatibility: scenes use fixture names, chapter copy, purpose, emotional tone, visual focus, min/preferred/max durations, transitions, and semantic actions.
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

This curve should guide future Marketing Director pacing, transitions, chapter overlays, touch restraint, and audio decisions. The early scenes should feel observant and gently curious; the middle scenes should build recognition and confidence through purposeful actions; Motivation should create warmth by recognizing kindness; Weekly Reset should slow into reflection; the Outro should return to calm without a call to action.

## Continuity Thread

The preview should feel like one ordinary Van Zijl family week, not a chain of independent feature moments. Keep these story links visible throughout the recording:

- Home introduces Thomas's swimming lesson and the practical pressure of the day. Tasks later resolves that pressure by completing `Zwemtas klaarzetten`.
- Family personalization makes Thomas feel like the same child whose school, swimming, cookies, and helpful moments appear later.
- Agenda expands the family's view from today to the week and adds `Filmavond`; after saving, the event should remain visible long enough to feel like part of the same week.
- Shopping supports the upcoming family rhythm with one ordinary `Bananen` addition while grouped errands remain the visual anchor.
- Motivation should feel earned by the earlier helping actions, especially the completed swim-bag task and the general household reset work.
- Weekly Reset reflects the same week: swimming preparation, Filmavond, cookies, groceries, helpful moments, and appreciation all resolve into Sunday evening calm.

## Timing Summary

Preferred total duration: **84 seconds**.

Minimum total duration: **68 seconds**.

Maximum total duration: **90 seconds**.

| Scene | Fixture | Preferred duration | Narrative beat |
| --- | --- | ---: | --- |
| Intro | `visual-marketing-home` | 5s | A quiet morning begins. |
| Home | `visual-marketing-home` | 7s | Today becomes readable. |
| Family | `visual-marketing-family` | 10s | “This is our family.” |
| Agenda | `visual-marketing-agenda` | 14s | Month, week, list, and one realistic plan. |
| Tasks | `visual-marketing-tasks` | 10s | Add one task and complete one helpful job. |
| Shopping | `visual-marketing-shopping` | 7s | Add bananas while grouped errands stay clear. |
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
- **Fixture:** `visual-marketing-home`
- **Duration:** 5 seconds
- **Minimum duration:** 4 seconds
- **Maximum duration:** 6 seconds
- **Visual focus:** The whole FamilyBoard surface with the day already prepared.
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
- **Fixture:** `visual-marketing-home`
- **Duration:** 7 seconds
- **Minimum duration:** 6 seconds
- **Maximum duration:** 8 seconds
- **Visual focus:** Today's agenda and today's tasks on the home dashboard, especially the swimming lesson that will be supported later by the swim-bag task.
- **Transition:** Gentle dissolve from the intro hold.
- **Camera pacing:** Pause on the full dashboard, drift slightly toward today's agenda, then wait long enough for the swim lesson and school rhythm to register as the first continuity thread.
- **Touch gestures:** One tap on the Today area or first practical card, only to show the board is touch-first.
- **Interaction sequence:** Tap once, then stop. Do not open quick capture; the scene is about seeing, not entering.
- **Audio events:** `ChapterStarted`, `TouchStarted`, `TouchCompleted`.
- **Expected final state:** Home remains on the same calm dashboard state, with the swimming lesson remembered as a practical need for later.
- **Director notes:** Avoid feature dumping. The tap should feel like Dad checking the board while coffee is brewing.

### 3. Family

- **Purpose:** Communicate “This is our family” through a brief, personal Avatar demonstration.
- **Narrative role:** Humanize the household before moving deeper into planning, making the board feel owned by Dad, Mom, Thomas, and Robin.
- **Emotional tone:** Recognition, personal, familial.
- **Chapter title:** Family
- **Optional subtitle:** This is our family
- **Fixture:** `visual-marketing-family`
- **Duration:** 10 seconds
- **Minimum duration:** 8 seconds
- **Maximum duration:** 11 seconds
- **Visual focus:** Thomas as a recognizable child in the family, the updated avatar after save, then the saved family overview.
- **Transition:** Soft crossfade.
- **Camera pacing:** Move slowly from the family overview to Thomas. Pause after opening Thomas, pause briefly in the Avatar Editor, save, then hold for a beat on the updated avatar before returning to the family overview.
- **Touch gestures:** Tap Thomas, tap Avatar Editor, make one simple visual-property change, tap save, tap return.
- **Interaction sequence:** Open Thomas; open Avatar Editor; change one simple visual property such as a color, accessory, or equally small appearance option; save; pause briefly so the updated avatar can be noticed; return to the Family overview.
- **Audio events:** `TransitionStarted`, `TransitionCompleted`, `TouchStarted`, `TouchCompleted`, `ActionCompleted`, optional `save`.
- **Expected final state:** Family overview is visible again, with Thomas feeling subtly personalized and still recognizable as the same child in the week ahead.
- **Director notes:** This is not an editing demo. Keep it brief and affectionate: save, breathe on the updated avatar, then return. The viewer should feel “that looks like Thomas,” not “look at all these controls.”

### 4. Agenda

- **Purpose:** Show how the family understands the month, week, and day in one shared place, then adds one realistic plan.
- **Narrative role:** Today's planning grows from the Home scene into a wider family rhythm, and the new Filmavond event makes planning feel lived-in.
- **Emotional tone:** Confidence without rigidity.
- **Chapter title:** Agenda
- **Optional subtitle:** One rhythm for the whole family
- **Fixture:** `visual-marketing-agenda`
- **Duration:** 14 seconds
- **Minimum duration:** 11 seconds
- **Maximum duration:** 15 seconds
- **Visual focus:** Month view, week view, list view, the saved `Filmavond` event remaining visible, and the returned agenda overview.
- **Transition:** Dissolve with chapter overlay in a quiet corner.
- **Camera pacing:** Show Month and pause. Move to Week and pause. Move to List and pause. During event creation, keep the camera steady and readable. After saving Filmavond, remain on the updated agenda long enough for the event to be noticed, then return to the overview and hold.
- **Touch gestures:** Tap Month, tap Week, tap List, tap add event, enter `Filmavond`, save, and return to overview.
- **Interaction sequence:** Show Month; pause. Show Week; pause. Show List; pause. Add one event named `Filmavond`. Save it. Stay briefly on the updated agenda so Filmavond feels part of the family week. Return to the agenda overview without demonstrating editing or advanced calendar features.
- **Audio events:** `ChapterStarted`, `TouchStarted`, `TouchCompleted`, `ActionCompleted`, optional `save`.
- **Expected final state:** Agenda overview is visible with the family rhythm preserved and Filmavond added as a believable event that remains part of the week.
- **Director notes:** Pause between views and after the save. The point is confidence across time scales, not proving every calendar control exists.

### 5. Tasks

- **Purpose:** Show that practical tasks can be added and completed without drama.
- **Narrative role:** Planning turns into helping each other: one new household task appears, and one useful task gets completed.
- **Emotional tone:** Confidence shifting into helpful relief.
- **Chapter title:** Tasks
- **Optional subtitle:** Small jobs, shared rhythm
- **Fixture:** `visual-marketing-tasks`
- **Duration:** 10 seconds
- **Minimum duration:** 8 seconds
- **Maximum duration:** 11 seconds
- **Visual focus:** The task list, the new `Koekjes bakken` task, and completion of `Zwemtas klaarzetten` to support the swimming lesson introduced on Home.
- **Transition:** Crossfade from Agenda.
- **Camera pacing:** Hold on the task list first. Keep the add-task moment steady and short. Move only enough to center `Zwemtas klaarzetten`, then pause longer after completion so the animation can finish.
- **Touch gestures:** Tap add task, enter `Koekjes bakken`, save, tap one completion affordance.
- **Interaction sequence:** Add `Koekjes bakken`; let it appear in the list; complete `Zwemtas klaarzetten`; wait for the completion animation to finish before continuing.
- **Audio events:** `TouchStarted`, `TouchCompleted`, `ActionCompleted`, optional `save`, `task completed`.
- **Expected final state:** `Koekjes bakken` is visible as an added task and `Zwemtas klaarzetten` has completed with the visual state settled.
- **Director notes:** The completion animation must finish before the transition. This resolves the swimming-lesson thread from Home and should feel like relief, not a speed run.

### 6. Shopping

- **Purpose:** Show one tiny grocery addition that supports the family's upcoming week while keeping the emphasis on grouped shopping.
- **Narrative role:** Helpful planning continues into practical errands for meals, children, and the family rhythm already seen in Agenda.
- **Emotional tone:** Grounded, useful, unhurried.
- **Chapter title:** Shopping
- **Optional subtitle:** Errands that make sense
- **Fixture:** `visual-marketing-shopping`
- **Duration:** 7 seconds
- **Minimum duration:** 6 seconds
- **Maximum duration:** 8 seconds
- **Visual focus:** Store-grouped shopping lists and the quick addition of `Bananen`.
- **Transition:** Warm dissolve.
- **Camera pacing:** Start still on the grouped list. Add the item quickly and return attention to the grouped structure. Hold briefly after `Bananen` appears so it reads as preparation, not a separate feature beat.
- **Touch gestures:** Tap add item, enter `Bananen`, save. No extra scrolling unless needed for readability.
- **Interaction sequence:** Show grouped errands; add `Bananen`; hold on the grouped list with the new item visible or clearly implied.
- **Audio events:** `TransitionStarted`, `TransitionCompleted`, `TouchStarted`, `TouchCompleted`, `ActionCompleted`, optional `save`.
- **Expected final state:** Shopping remains organized by real destinations, with `Bananen` added as a small piece of the same family week.
- **Director notes:** Keep the addition extremely short. This should feel like remembering bananas, not operating a list manager.

### 7. Motivation

- **Purpose:** Demonstrate adding one appreciation so kindness from the week's helping moments becomes visible.
- **Narrative role:** The family recognizes that small help, like preparing the swim bag and keeping the house moving, is adding up toward Sunday's pancake breakfast.
- **Emotional tone:** Warmth, encouragement, tenderness.
- **Chapter title:** Motivation
- **Optional subtitle:** Helpful moments add up
- **Fixture:** `visual-marketing-motivation`
- **Duration:** 10 seconds
- **Minimum duration:** 8 seconds
- **Maximum duration:** 11 seconds
- **Visual focus:** Family goal progress, the appreciation entry, and the newly visible appreciation.
- **Transition:** Soft crossfade.
- **Camera pacing:** Pause on progress first. Move gently to the appreciation area. Keep the entry steady. After saving, wait long enough for the appreciation to appear and become readable.
- **Touch gestures:** Tap add appreciation, enter `Bedankt voor het helpen met opruimen.`, save.
- **Interaction sequence:** Read family progress; add the appreciation `Bedankt voor het helpen met opruimen.`; pause on the displayed appreciation so it feels like a natural consequence of the earlier helping moments.
- **Audio events:** `ChapterStarted`, `TouchStarted`, `TouchCompleted`, `ActionCompleted`, `appreciation shown`, optional `save`.
- **Expected final state:** The new appreciation is visible and emotionally clear.
- **Director notes:** Do not make motivation feel gamified. The emotional point is recognizing kindness that the viewer has already seen the family practice.

### 8. Weekly Reset

- **Purpose:** Show the emotional high point: the family gently closes the week and prepares for the next one.
- **Narrative role:** Morning planning has matured into Sunday reflection, carry-forward decisions, and shared confidence.
- **Emotional tone:** Reflection, togetherness, satisfaction.
- **Chapter title:** Weekly Reset
- **Optional subtitle:** Ready for next week
- **Fixture:** `visual-marketing-weekly-reset`
- **Duration:** 14 seconds
- **Minimum duration:** 12 seconds
- **Maximum duration:** 15 seconds
- **Visual focus:** Completed week, carried-forward tasks, family goal celebration, or reset summary that feels connected to swimming, Filmavond, cookies, groceries, and appreciation from earlier scenes.
- **Transition:** Longest transition in the movie: a slow warm dissolve into the Sunday evening ritual.
- **Camera pacing:** Move slower than every earlier scene. Enter gently, hold on the reset summary, move with extra breathing room to the completed or carried-forward outcome, and use the longest pauses on the completion state.
- **Touch gestures:** One calm, slow tap to complete or acknowledge the reset moment if available; otherwise no touch.
- **Interaction sequence:** Show the same week closing; acknowledge the reset or completion state; allow the completion state to breathe before leaving.
- **Audio events:** `ChapterStarted`, optional `TouchStarted`, optional `TouchCompleted`, `weekly reset complete`, `ChapterCompleted`.
- **Expected final state:** Weekly Reset communicates the family gently finishing the same week together and feeling ready, not a checklist burden.
- **Director notes:** Weekly Reset is the emotional climax. Use the slowest movement, slowest touch, longest pause, and longest transition here so it feels like a Sunday evening family ritual.

### 9. Outro

- **Purpose:** Close with the same calm clarity as the opening, now enriched by the story of the week and a subtle brand moment.
- **Narrative role:** Return home after planning, helping, errands, appreciation, and reset: the family is ready together.
- **Emotional tone:** Calm, warm, complete.
- **Chapter title:** FamilyBoard
- **Optional subtitle:** Everyday family life, a little easier
- **Fixture:** `visual-marketing-home`
- **Duration:** 7 seconds
- **Minimum duration:** 5 seconds
- **Maximum duration:** 7 seconds
- **Visual focus:** Home dashboard, then a simple brand card.
- **Transition:** Fade back to Home, then fade to branding, then fade to black.
- **Camera pacing:** Return Home and hold the dashboard briefly so the opening and ending connect. Then fade to a centered brand card reading `FamilyBoard` and `Everyday family life,\na little easier.` Hold the brand card for approximately two seconds before fading to black.
- **Touch gestures:** None.
- **Interaction sequence:** No interaction; the Home dashboard resolves the family week, then the brand card provides quiet recognition.
- **Audio events:** `ChapterStarted`, `ChapterCompleted`, `RecordingFinished`.
- **Expected final state:** Brand card holds briefly, then fades to black.
- **Director notes:** End together. Do not add calls to action, feature claims, buttons, URLs, or a final interaction.

## Sequence Justification

Settings has been removed because it interrupted the emotional narrative and did not contribute to the central question of making everyday family life easier. The remaining sequence keeps the family story continuous: Home establishes the day and the swimming need, Family personalizes Thomas, Agenda broadens the same week with Filmavond, Tasks resolves the swim-bag pressure and adds cookies, Shopping supports the upcoming week with bananas, Motivation recognizes the family helping, Weekly Reset reflects the week, and Outro returns to calm.

The Family scene remains before Agenda so the viewer meets the household before seeing the full planning surface. Weekly Reset remains near the end as the emotional climax, and the final Home/brand outro resolves the story without turning into a call to action.

## Storyboard Validation

- **Coherent narrative:** Yes. The story moves through one ordinary week: morning calm, Thomas's family identity, today's planning, Filmavond, swim-bag help, groceries, appreciation, Sunday reflection, and ending together.
- **No feature dumping:** Yes. Expanded interactions are limited to one meaningful family identity action, three readable agenda views plus one event, one task addition, one task completion, one shopping addition, and one appreciation.
- **Every interaction has purpose:** Yes. Touch is limited to identity, planning, helping, remembering, appreciating, and closing the same week.
- **Stronger continuity between scenes:** Yes. Swimming, Thomas, Filmavond, cookies, bananas, helpful actions, appreciation, and Weekly Reset now carry across scenes rather than appearing as disconnected interactions.
- **Home and Weekly Reset feel connected:** Yes. Home introduces the day's practical needs, and Weekly Reset reflects the same family's completed week with the slowest movement, slowest touch, longest transition, longest holds, and most reflective tone.
- **Settings removed:** Yes. There is no Settings scene in the storyboard sequence or timing table.
- **Emotional curve documented:** Yes. The curve is defined as Calm → Curiosity → Recognition → Confidence → Warmth → Reflection → Calm.
- **Appropriate fixture use:** Yes. Every scene maps to an existing marketing fixture, and no production or framework changes are required.
- **Pacing remains calm:** Yes. The storyboard keeps readable pauses after every continuity beat and remains at minimum 68 seconds, preferred 84 seconds, maximum 90 seconds.
