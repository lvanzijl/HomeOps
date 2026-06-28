import { MarketingDirector, marketingPacingProfiles } from '../director.mjs';

export const approvedMarketingFixtures = Object.freeze([
  'visual-marketing-home',
  'visual-marketing-family',
  'visual-marketing-agenda',
  'visual-marketing-tasks',
  'visual-marketing-shopping',
  'visual-marketing-motivation',
  'visual-marketing-weekly-reset',
]);

export const canonicalEmotionalCurve = Object.freeze(['Calm', 'Curiosity', 'Recognition', 'Confidence', 'Warmth', 'Reflection', 'Calm']);

const chapterCardDefaults = Object.freeze({
  appearsAt: 'scene-start',
  holdApproxMs: 1000,
  exit: 'gentle-fade-away',
  persistentOverlay: false,
});

function chapterCard(title, subtitle, direction) {
  return Object.freeze({ ...chapterCardDefaults, title, subtitle, direction });
}

function action(id, type, description, metadata = {}) {
  return Object.freeze({ id, type, description, ...metadata });
}

function scene({
  id,
  fixture,
  title,
  subtitle,
  purpose,
  narrativeRole,
  emotionalTone,
  visualFocus,
  minimumDurationMs,
  preferredDurationMs,
  maximumDurationMs,
  transition,
  cameraPacing,
  touchGestures,
  interactionSequence,
  audioEvents,
  expectedFinalState,
  directorNotes,
  actions,
}) {
  return Object.freeze({
    id,
    fixture,
    title,
    subtitle,
    purpose,
    narrativeRole,
    emotionalTone,
    visualFocus,
    minimumDurationMs,
    preferredDurationMs,
    maximumDurationMs,
    transition: Object.freeze(transition),
    chapterCard: chapterCard(title, subtitle, `${title} appears with ${subtitle ? `“${subtitle}”` : 'no feature subtitle'}, holds for approximately one second, then gently fades away before the UI owns the full screen.`),
    chapterDurationMs: 1000,
    chapterPosition: 'center',
    cameraPacing,
    touchGestures: Object.freeze(touchGestures),
    interactionSequence: Object.freeze(interactionSequence),
    audioEvents: Object.freeze(audioEvents),
    expectedFinalState,
    directorNotes,
    actions: Object.freeze(actions),
  });
}

export const marketingPreviewV1Storyboard = Object.freeze({
  id: 'familyboard-marketing-preview-v1',
  title: 'FamilyBoard Marketing Preview V1',
  sourceDocument: 'docs/design/marketing-storyboard-v1.md',
  householdDocument: 'docs/design/marketing-household.md',
  fixtureDate: '2026-06-16',
  canonicalWeek: Object.freeze({ start: '2026-06-15', end: '2026-06-21' }),
  emotionalCurve: canonicalEmotionalCurve,
  preferredTotalDurationMs: 84000,
  maximumTotalDurationMs: 90000,
  chapterCardDirection: chapterCardDefaults,
  chapters: Object.freeze([
    { id: 'intro', narrativeStep: 'introduction', scenes: Object.freeze([scene({ id: 'intro', fixture: 'visual-marketing-home', title: 'Home', subtitle: 'A calmer start to the day', purpose: 'Open the preview as a family story, not as a technical product tour.', narrativeRole: "Establish a quiet Tuesday morning before the board becomes the family's shared memory.", emotionalTone: 'Calm', visualFocus: 'The whole FamilyBoard surface with the day already prepared.', minimumDurationMs: 4000, preferredDurationMs: 5000, maximumDurationMs: 6000, transition: { type: 'fade', from: 'warm-neutral-black' }, cameraPacing: 'Start still. Hold for a full breath before any motion. Use only a very slow settle toward the center of the screen.', touchGestures: ['None'], interactionSequence: ['No interaction; the value is immediate readability.'], audioEvents: ['RecordingStarted', 'ChapterStarted', 'TransitionCompleted'], expectedFinalState: 'Home dashboard visible, steady, and readable.', directorNotes: 'Let this scene breathe. Do not introduce touch yet; the opening should feel observed rather than operated.', actions: [action('hold-home-dashboard', 'pause', 'Hold the Home dashboard with no touch interaction.')] })]) },
    { id: 'home', narrativeStep: 'todays-family', scenes: Object.freeze([scene({ id: 'home', fixture: 'visual-marketing-home', title: 'Today', subtitle: 'Everything that matters is already here', purpose: 'Show that FamilyBoard answers the morning question: what matters today?', narrativeRole: 'Move from atmosphere into practical morning clarity for school, daycare, swimming, dinner, and tasks.', emotionalTone: 'Calm shifting into curiosity', visualFocus: "Today's agenda and tasks, especially Thomas's swimming lesson.", minimumDurationMs: 6000, preferredDurationMs: 7000, maximumDurationMs: 8000, transition: { type: 'dissolve' }, cameraPacing: "Pause on the full dashboard, drift slightly toward today's agenda, then wait long enough for the swim lesson to register.", touchGestures: ['One tap on the Today area or first practical card only.'], interactionSequence: ['Tap once, then stop. Do not open quick capture.'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted'], expectedFinalState: 'Home remains on the same calm dashboard state, with the swimming lesson remembered as a practical need for later.', directorNotes: 'Avoid feature dumping. The tap should feel like Dad checking the board while coffee is brewing.', actions: [action('tap-today-area', 'touch', "Tap once on today's agenda area to show tablet-first use without opening a workflow.")] })]) },
    { id: 'family', narrativeStep: 'family', scenes: Object.freeze([scene({ id: 'family', fixture: 'visual-marketing-family', title: 'Family', subtitle: 'This is our family', purpose: 'Communicate “This is our family” through a brief, personal Avatar demonstration.', narrativeRole: 'Humanize the household before moving deeper into planning.', emotionalTone: 'Recognition, personal, familial', visualFocus: 'Thomas, the updated avatar after save, then the saved family overview.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Move slowly from family overview to Thomas; pause after opening Thomas; pause briefly in Avatar Editor; save; hold; return.', touchGestures: ['Tap Thomas', 'Tap Avatar Editor', 'Change one simple visual property', 'Tap save', 'Tap return'], interactionSequence: ['Open Thomas', 'Open Avatar Editor', 'Change one simple visual property', 'Save', 'Pause on updated avatar', 'Return to Family overview'], audioEvents: ['TransitionStarted', 'TransitionCompleted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Family overview is visible again, with Thomas subtly personalized and recognizable.', directorNotes: 'This is not an editing demo. Keep it brief and affectionate.', actions: [action('open-thomas', 'touch', 'Open Thomas from the Family overview.'), action('open-avatar-editor', 'touch', 'Open the Avatar Editor.'), action('change-simple-avatar-property', 'touch', 'Change one simple visual property such as color or small accessory.'), action('save-avatar', 'touch', 'Save the updated avatar.'), action('pause-updated-avatar', 'pause', 'Pause on the updated avatar.'), action('return-family-overview', 'touch', 'Return to the Family overview.')] })]) },
    { id: 'agenda', narrativeStep: 'planning', scenes: Object.freeze([scene({ id: 'agenda', fixture: 'visual-marketing-agenda', title: 'Agenda', subtitle: 'One rhythm for the whole family', purpose: 'Show month, week, day/list rhythm, then add one realistic plan.', narrativeRole: "Today's planning grows into a wider family rhythm with Filmavond.", emotionalTone: 'Confidence without rigidity', visualFocus: 'Month view, week view, list view, saved Filmavond event, and returned overview.', minimumDurationMs: 11000, preferredDurationMs: 14000, maximumDurationMs: 15000, transition: { type: 'dissolve' }, cameraPacing: 'Show Month and pause. Move to Week and pause. Move to List and pause. Keep event creation steady and readable.', touchGestures: ['Tap Month', 'Tap Week', 'Tap List', 'Tap add event', 'Enter Filmavond', 'Save', 'Return to overview'], interactionSequence: ['Show Month', 'Pause', 'Show Week', 'Pause', 'Show List', 'Pause', 'Add Filmavond', 'Save', 'Hold briefly so Filmavond is visible', 'Return to overview'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Agenda overview is visible with Filmavond added as a believable event.', directorNotes: 'Pause between views and after the save. The point is confidence across time scales.', actions: [action('show-month', 'touch', 'Show Month view.'), action('pause-month', 'pause', 'Pause on Month view.'), action('show-week', 'touch', 'Show Week view.'), action('pause-week', 'pause', 'Pause on Week view.'), action('show-list', 'touch', 'Show List view.'), action('pause-list', 'pause', 'Pause on List view.'), action('add-filmavond', 'touch', 'Add one event named Filmavond.'), action('save-filmavond', 'touch', 'Save Filmavond.'), action('hold-filmavond-visible', 'pause', 'Hold briefly so Filmavond is visible.'), action('return-agenda-overview', 'touch', 'Return to the agenda overview.')] })]) },
    { id: 'tasks', narrativeStep: 'helping', scenes: Object.freeze([scene({ id: 'tasks', fixture: 'visual-marketing-tasks', title: 'Tasks', subtitle: 'Small jobs, shared rhythm', purpose: 'Show practical tasks added and completed without drama.', narrativeRole: 'Planning turns into helping each other.', emotionalTone: 'Confidence shifting into helpful relief', visualFocus: 'Task list, new Koekjes bakken task, and completion of Zwemtas klaarzetten.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Hold on task list first; keep add-task steady; center Zwemtas klaarzetten; pause longer after completion.', touchGestures: ['Tap add task', 'Enter Koekjes bakken', 'Save', 'Tap completion affordance'], interactionSequence: ['Add Koekjes bakken', 'Wait for it to appear', 'Complete Zwemtas klaarzetten', 'Wait for completion animation'], audioEvents: ['TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save', 'task completed'], expectedFinalState: 'Koekjes bakken is visible and Zwemtas klaarzetten has completed with visual state settled.', directorNotes: 'The completion animation must finish before transition. This resolves the swimming-lesson thread.', actions: [action('add-koekjes-bakken', 'touch', 'Add Koekjes bakken.'), action('wait-koekjes-visible', 'pause', 'Wait for Koekjes bakken to appear.'), action('complete-zwemtas', 'touch', 'Complete Zwemtas klaarzetten.'), action('wait-completion-animation', 'pause', 'Wait for the completion animation to finish.')] })]) },
    { id: 'shopping', narrativeStep: 'shopping', scenes: Object.freeze([scene({ id: 'shopping', fixture: 'visual-marketing-shopping', title: 'Shopping', subtitle: 'Errands that make sense', purpose: 'Show one tiny grocery addition while existing list supports Koekjes bakken.', narrativeRole: 'Helpful planning continues into practical errands.', emotionalTone: 'Grounded, useful, unhurried', visualFocus: 'Grouped lists with Bloem, Roomboter, Chocoladestukjes, Vanillesuiker already present, plus Bananen.', minimumDurationMs: 6000, preferredDurationMs: 7000, maximumDurationMs: 8000, transition: { type: 'dissolve' }, cameraPacing: 'Start still on grouped list; add Bananen quickly; hold after it appears.', touchGestures: ['Tap add item', 'Enter Bananen', 'Save'], interactionSequence: ['Show grouped errands', 'Ensure baking ingredients are visible or clearly implied', 'Add Bananen', 'Hold briefly on grouped list'], audioEvents: ['TransitionStarted', 'TransitionCompleted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Shopping remains organized by destinations, cookie ingredients remain visible, and Bananen has been added.', directorNotes: 'Keep the addition extremely short; ingredients are fixture data and are not added during recording.', actions: [action('show-grouped-errands', 'pause', 'Show grouped errands with baking ingredients already present.', { fixtureItems: ['Bloem', 'Roomboter', 'Chocoladestukjes', 'Vanillesuiker'] }), action('add-bananen', 'touch', 'Add Bananen.'), action('hold-grouped-list', 'pause', 'Hold briefly on the grouped list.')] })]) },
    { id: 'motivation', narrativeStep: 'motivation', scenes: Object.freeze([scene({ id: 'motivation', fixture: 'visual-marketing-motivation', title: 'Motivation', subtitle: 'Helpful moments add up', purpose: 'Demonstrate adding one appreciation so kindness becomes visible.', narrativeRole: 'The family recognizes small help adding up toward Sunday pancake breakfast.', emotionalTone: 'Warmth, encouragement, tenderness', visualFocus: 'Family goal progress, appreciation entry, and newly visible appreciation.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Pause on progress first; move gently to appreciation; keep entry steady; wait after save until readable.', touchGestures: ['Tap add appreciation', 'Enter Bedankt voor het helpen met opruimen.', 'Save'], interactionSequence: ['Show family goal progress', 'Add appreciation: Bedankt voor het helpen met opruimen.', 'Save', 'Pause until the appreciation is readable'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'appreciation shown', 'save'], expectedFinalState: 'The new appreciation is visible and emotionally clear.', directorNotes: 'Do not make motivation feel gamified. The emotional point is recognizing kindness.', actions: [action('show-family-goal-progress', 'pause', 'Show family goal progress.'), action('add-appreciation', 'touch', 'Add appreciation: Bedankt voor het helpen met opruimen.'), action('save-appreciation', 'touch', 'Save the appreciation.'), action('pause-appreciation-readable', 'pause', 'Pause until the appreciation is readable.')] })]) },
    { id: 'weekly-reset', narrativeStep: 'weekly-reflection', scenes: Object.freeze([scene({ id: 'weekly-reset', fixture: 'visual-marketing-weekly-reset', title: 'Weekly Reset', subtitle: 'Ready for next week', purpose: 'Show the emotional high point: the family gently closes the week and prepares for the next one.', narrativeRole: 'Morning planning has matured into Sunday reflection, carry-forward decisions, and shared confidence.', emotionalTone: 'Reflection, togetherness, satisfaction', visualFocus: 'Completed week, carried-forward tasks, family goal celebration, or reset summary connecting prior scenes.', minimumDurationMs: 12000, preferredDurationMs: 14000, maximumDurationMs: 15000, transition: { type: 'dissolve', pacing: 'slow-warm' }, cameraPacing: 'Move slower than every earlier scene, with extra breathing room and the longest pauses on completion state.', touchGestures: ['One calm, slow tap to complete or acknowledge the reset moment if available; otherwise no touch.'], interactionSequence: ['Show the same week closing', 'Acknowledge or complete the reset moment if available', 'Hold on completion or ready-for-next-week state'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'weekly reset complete', 'ChapterCompleted'], expectedFinalState: 'Weekly Reset communicates the family gently finishing the same week together and feeling ready.', directorNotes: 'Weekly Reset is the emotional climax. Use the slowest movement, slowest touch, longest pause, and longest transition.', actions: [action('show-week-closing', 'pause', 'Show the same week closing with traces of swimming preparation, Filmavond, Koekjes bakken, shopping, appreciation, and helpful moments.'), action('acknowledge-reset', 'touch', 'Acknowledge or complete the reset moment if available.', { optional: true }), action('hold-ready-state', 'pause', 'Hold on completion or ready-for-next-week state.')] })]) },
    { id: 'outro', narrativeStep: 'closing', scenes: Object.freeze([scene({ id: 'outro', fixture: 'visual-marketing-home', title: 'FamilyBoard', subtitle: 'Everyday family life, a little easier', purpose: 'Close with the same calm clarity as the opening, enriched by the story of the week.', narrativeRole: 'Return home after planning, helping, errands, appreciation, and reset: the family is ready together.', emotionalTone: 'Calm, warm, complete', visualFocus: 'Home dashboard, then a simple brand card.', minimumDurationMs: 5000, preferredDurationMs: 7000, maximumDurationMs: 7000, transition: { type: 'fade', sequence: ['home', 'brand-card', 'black'] }, cameraPacing: 'Return Home and hold briefly; fade to centered brand card; hold about two seconds; fade to black.', touchGestures: ['None'], interactionSequence: ['Return Home', 'Hold the dashboard briefly', 'Fade to brand card: FamilyBoard / Everyday family life, a little easier.', 'Hold approximately two seconds', 'Fade to black'], audioEvents: ['ChapterStarted', 'ChapterCompleted', 'RecordingFinished'], expectedFinalState: 'Brand card holds briefly, then fades to black.', directorNotes: 'End together. Do not add calls to action, feature claims, buttons, URLs, or a final interaction.', actions: [action('return-home', 'pause', 'Return Home.'), action('hold-dashboard', 'pause', 'Hold the dashboard briefly.'), action('fade-brand-card', 'pause', 'Fade to brand card: FamilyBoard / Everyday family life, a little easier.'), action('hold-brand-card', 'pause', 'Hold approximately two seconds.'), action('fade-to-black', 'pause', 'Fade to black.')] })]) },
  ]),
});

export function validateMarketingPreviewV1Storyboard() {
  const director = new MarketingDirector({ pacingProfile: marketingPacingProfiles.calmMarketing });
  const directorValidation = director.validateStoryboard(marketingPreviewV1Storyboard);
  const plan = director.createRecordingPlan(marketingPreviewV1Storyboard);
  const scenes = plan.scenes;
  const warnings = [...directorValidation.warnings];
  const preferredTotal = scenes.reduce((total, item) => total + item.preferredDurationMs, 0);
  if (scenes.length !== 9) warnings.push(`Expected 9 scenes, found ${scenes.length}.`);
  for (const item of scenes) {
    if (!item.fixture) warnings.push(`Scene ${item.id} is missing a fixture.`);
    if (!item.chapterCard) warnings.push(`Scene ${item.id} is missing chapter metadata.`);
    if (!approvedMarketingFixtures.includes(item.fixture)) warnings.push(`Scene ${item.id} references unapproved fixture ${item.fixture}.`);
    if (![item.minimumDurationMs, item.preferredDurationMs, item.maximumDurationMs].every((value) => Number.isFinite(value) && value > 0)) warnings.push(`Scene ${item.id} has invalid duration metadata.`);
  }
  if (preferredTotal !== marketingPreviewV1Storyboard.preferredTotalDurationMs) warnings.push(`Preferred duration total is ${preferredTotal}ms, expected ${marketingPreviewV1Storyboard.preferredTotalDurationMs}ms.`);
  if (marketingPreviewV1Storyboard.maximumTotalDurationMs !== 90000) warnings.push(`Storyboard maximum duration is ${marketingPreviewV1Storyboard.maximumTotalDurationMs}ms, expected 90000ms.`);
  if (!Array.isArray(marketingPreviewV1Storyboard.emotionalCurve) || marketingPreviewV1Storyboard.emotionalCurve.length === 0) warnings.push('Storyboard is missing emotional curve metadata.');
  return Object.freeze({ valid: warnings.length === 0, warnings: Object.freeze(warnings), sceneCount: scenes.length, preferredTotalDurationMs: preferredTotal, maximumStoryboardDurationMs: marketingPreviewV1Storyboard.maximumTotalDurationMs, canCreateRecordingPlan: scenes.length === 9 });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const validation = validateMarketingPreviewV1Storyboard();
  console.log(JSON.stringify(validation, null, 2));
  if (!validation.valid) process.exitCode = 1;
}
