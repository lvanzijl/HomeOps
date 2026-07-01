import { MarketingDirector, marketingPacingProfiles } from '../director.mjs';
import { recordingEventTypes } from '../events.mjs';

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


async function expectSingle(locator, description) {
  const count = await locator.count();
  if (count !== 1) throw new Error(`${description} expected exactly 1 match, found ${count}.`);
  await locator.waitFor({ state: 'visible' });
  return locator;
}

async function expectEnabled(locator, description) {
  const target = await expectSingle(locator, description);
  const disabled = await target.evaluate((element) => element.disabled === true || element.getAttribute('aria-disabled') === 'true');
  if (disabled) throw new Error(`${description} is disabled.`);
  return target;
}

async function tapLocator(touch, locator, description, options = {}) {
  const target = options.requireEnabled ? await expectEnabled(locator, description) : await expectSingle(locator, description);
  const box = await target.boundingBox();
  if (!box) throw new Error(`${description} is visible but has no bounding box.`);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (options.directClick) {
    await target.click({ force: true, timeout: options.clickTimeoutMs ?? 5000 });
    await touch.page.waitForTimeout(options.holdAfterMs ?? 320);
    return;
  }
  if (options.locatorClick) {
    const handle = await target.elementHandle();
    if (!handle) throw new Error(`${description} could not be resolved to an element handle.`);
    await touch.moveTo(point, { ...options, steps: options.locatorClickSteps ?? options.steps });
    await handle.click({ force: true, timeout: options.clickTimeoutMs ?? 5000 });
    await touch.page.waitForTimeout(options.holdAfterMs ?? 320);
    return;
  }
  await touch.tap(point, { hesitationMs: options.hesitationMs, afterMs: options.holdAfterMs });
}

function agendaRoot(page) {
  return page.getByRole('article', { name: 'Agenda', exact: true });
}

async function ensureAgendaPage(page) {
  const root = agendaRoot(page);
  if (await root.count() === 1 && await root.isVisible()) return root;
  const primaryNav = page.getByLabel('Dagelijkse gezinsplekken', { exact: true });
  const agendaNav = primaryNav.getByRole('button', { name: 'Agenda', exact: true });
  await expectSingle(agendaNav, 'Primary Agenda navigation button');
  await agendaNav.click();
  await expectSingle(root, 'Agenda page root');
  return root;
}

function agendaViewToggle(page) {
  return agendaRoot(page).getByLabel('Agenda weergave', { exact: true });
}

function agendaDialog(page) {
  return page.getByRole('dialog', { name: 'Gebeurtenis toevoegen', exact: true });
}

function savedFilmavondEvent(page) {
  return agendaRoot(page).locator('.agenda-event strong').filter({ hasText: /^Filmavond$/ });
}

async function waitForFilmavondDetailsOrSaved(page, dialog) {
  await Promise.race([
    dialog.getByText('Nog details?', { exact: true }).waitFor({ state: 'visible' }),
    savedFilmavondEvent(page).waitFor({ state: 'visible' }),
  ]);
}

const agendaRecordingActions = Object.freeze({
  async showMonth({ page, touch }, action) {
    await ensureAgendaPage(page);
    await tapLocator(touch, agendaViewToggle(page).getByRole('button', { name: 'Maand', exact: true }), 'Agenda Month view toggle', action);
    await expectSingle(agendaRoot(page).getByLabel('Maandplanning', { exact: true }), 'Agenda Month workspace');
  },
  async showWeek({ page, touch }, action) {
    await ensureAgendaPage(page);
    await tapLocator(touch, agendaViewToggle(page).getByRole('button', { name: 'Week', exact: true }), 'Agenda Week view toggle', action);
    await expectSingle(agendaRoot(page).getByLabel('Weekplanning', { exact: true }), 'Agenda Week workspace');
  },
  async showList({ page, touch }, action) {
    await ensureAgendaPage(page);
    await tapLocator(touch, agendaViewToggle(page).getByRole('button', { name: 'Lijst', exact: true }), 'Agenda List view toggle', action);
    await expectSingle(agendaRoot(page).getByLabel('Lijstplanning', { exact: true }), 'Agenda List workspace');
  },
  async addFilmavond({ page, touch, eventBus, scene }, action) {
    await ensureAgendaPage(page);
    await tapLocator(touch, agendaViewToggle(page).getByRole('button', { name: 'Maand', exact: true }), 'Agenda Month view toggle before adding Filmavond', action);
    const selectedDayPanel = agendaRoot(page).getByLabel('Gekozen dag', { exact: true });
    eventBus?.publish(recordingEventTypes.DialogOpenStarted, { sceneId: scene?.id, actionId: 'add-filmavond', dialogId: 'agenda-add-event' });
    await tapLocator(touch, selectedDayPanel.getByRole('button', { name: 'Gebeurtenis toevoegen', exact: true }), 'Agenda selected-day Add event button', action);
    const dialog = agendaDialog(page);
    await expectSingle(dialog, 'Agenda add-event dialog');
    eventBus?.publish(recordingEventTypes.DialogOpenVisible, { sceneId: scene?.id, actionId: 'add-filmavond', dialogId: 'agenda-add-event' });
    await expectSingle(dialog.getByLabel('Calendar event conversation', { exact: true }), 'Agenda event conversation form');
    const titleInput = dialog.locator('#calendar-event-title');
    await expectSingle(titleInput, 'Agenda event title input');
    await titleInput.click();
    await titleInput.fill('');
    await page.keyboard.type('Filmavond', { delay: action.typingDelayMs ?? 12 });
    await tapLocator(touch, dialog.getByRole('button', { name: 'Verder', exact: true }), 'Agenda event title Continue button', { ...action, locatorClick: true, requireEnabled: true });
    await expectSingle(dialog.getByText('Wanneer moet het gezin dit onthouden?', { exact: true }), 'Agenda event date question');
    await tapLocator(touch, dialog.getByRole('button', { name: 'Verder', exact: true }), 'Agenda event date Continue button', { ...action, locatorClick: true });
    await expectSingle(dialog.getByText('Duurt het de hele dag?', { exact: true }), 'Agenda event time-kind question');
    await tapLocator(touch, dialog.getByRole('button', { name: 'Verder', exact: true }), 'Agenda event time Continue button', { ...action, locatorClick: true });
    eventBus?.publish(recordingEventTypes.DialogSaveOrCancelClicked, { sceneId: scene?.id, actionId: 'add-filmavond', dialogId: 'agenda-add-event', phase: 'final-continue-or-save-step' });
    await waitForFilmavondDetailsOrSaved(page, dialog);
    if (await dialog.isVisible().catch(() => false)) await expectSingle(dialog.getByRole('button', { name: 'Gebeurtenis maken', exact: true }), 'Agenda create-event Save button after details step');
    else {
      eventBus?.publish(recordingEventTypes.DialogCloseCompleted, { sceneId: scene?.id, actionId: 'add-filmavond', dialogId: 'agenda-add-event', phase: 'closed-after-final-step' });
      if (await savedFilmavondEvent(page).count() === 1) eventBus?.publish(recordingEventTypes.DialogResultVisible, { sceneId: scene?.id, actionId: 'add-filmavond', dialogId: 'agenda-add-event', phase: 'saved-event-visible' });
    }
    await page.waitForTimeout(action.dialogReadableHoldMs ?? 450);
  },
  async saveFilmavond({ page, touch, eventBus, scene }, action) {
    await ensureAgendaPage(page);
    if (await savedFilmavondEvent(page).count() === 1) {
      return;
    }

    const dialog = agendaDialog(page);
    await expectSingle(dialog, 'Agenda add-event dialog before save');
    const saveButton = dialog.getByRole('button', { name: 'Gebeurtenis maken', exact: true });
    await expectEnabled(saveButton, 'Agenda create-event Save button');

    const box = await saveButton.boundingBox();
    if (!box) throw new Error('Agenda create-event Save button is visible but has no bounding box.');
    await touch.moveTo({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, action);
    eventBus?.publish(recordingEventTypes.DialogSaveOrCancelClicked, { sceneId: scene?.id, actionId: 'save-filmavond', dialogId: 'agenda-add-event' });
    const [saveResponse] = await Promise.all([
      page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/events', { timeout: 15000 }),
      saveButton.click({ force: true, timeout: 5000 }),
    ]);
    if (!saveResponse.ok()) {
      const body = await saveResponse.text().catch(() => '');
      throw new Error(`Agenda create-event Save request failed with ${saveResponse.status()}: ${body}`);
    }

    await Promise.all([
      dialog.waitFor({ state: 'hidden', timeout: 10000 }),
      savedFilmavondEvent(page).waitFor({ state: 'visible', timeout: 10000 }),
    ]);
    eventBus?.publish(recordingEventTypes.DialogCloseCompleted, { sceneId: scene?.id, actionId: 'save-filmavond', dialogId: 'agenda-add-event' });
    await expectSingle(savedFilmavondEvent(page), 'Saved Filmavond event text scoped to Agenda event card');
    eventBus?.publish(recordingEventTypes.DialogResultVisible, { sceneId: scene?.id, actionId: 'save-filmavond', dialogId: 'agenda-add-event' });
    await page.waitForTimeout(action.resultReadableHoldMs ?? 650);
  },
  async returnOverview({ page, touch }, action) {
    await ensureAgendaPage(page);
    await tapLocator(touch, agendaViewToggle(page).getByRole('button', { name: 'Maand', exact: true }), 'Agenda return-to-overview Month toggle', action);
    await expectSingle(agendaRoot(page).getByLabel('Maandplanning', { exact: true }), 'Agenda overview Month workspace');
  },
});


function agendaAction(id, description, execute, metadata = {}) {
  return action(id, 'touch', description, { ...metadata, execute: (context) => execute(context, metadata) });
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
  timing = {},
  scenePacing,
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
    timing: Object.freeze(timing),
    scenePacing: scenePacing ? Object.freeze(scenePacing) : undefined,
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
    { id: 'intro', narrativeStep: 'introduction', scenes: Object.freeze([scene({ id: 'intro', fixture: 'visual-marketing-home', title: 'Home', subtitle: 'A calmer start to the day', purpose: 'Open the preview as a family story, not as a technical product tour.', narrativeRole: "Establish a quiet Tuesday morning before the board becomes the family's shared memory.", emotionalTone: 'Calm', visualFocus: 'The redesigned full desktop Home dashboard with the larger family anchor and dominant Agenda/Boodschappen cards already prepared.', minimumDurationMs: 4000, preferredDurationMs: 5000, maximumDurationMs: 6000, transition: { type: 'fade', from: 'warm-neutral-black' }, cameraPacing: 'Start still. Hold for a full breath before any motion. Use only a very slow settle toward the center of the screen.', touchGestures: ['None'], interactionSequence: ['No interaction; the value is immediate readability.'], audioEvents: ['RecordingStarted', 'ChapterStarted', 'TransitionCompleted'], expectedFinalState: 'Home dashboard visible, steady, and readable.', directorNotes: 'Let this scene breathe. Do not introduce touch yet; the opening should feel observed rather than operated.', timing: { initialHoldMs: 1400, postSceneHoldMs: 900 }, actions: [action('hold-home-dashboard', 'pause', 'Hold the Home dashboard with no touch interaction.', { holdMs: 300 })] })]) },
    { id: 'home', narrativeStep: 'todays-family', scenes: Object.freeze([scene({ id: 'home', fixture: 'visual-marketing-home', title: 'Today', subtitle: 'Everything that matters is already here', purpose: 'Show that FamilyBoard answers the morning question: what matters today?', narrativeRole: 'Move from atmosphere into practical morning clarity for school, daycare, swimming, dinner, and tasks.', emotionalTone: 'Calm shifting into curiosity', visualFocus: "The dominant Home Agenda and Boodschappen cards, the larger family member area, and Thomas's swimming lesson.", minimumDurationMs: 6000, preferredDurationMs: 7000, maximumDurationMs: 8000, transition: { type: 'dissolve' }, cameraPacing: "Pause on the full dashboard, drift from the larger family area toward today's Agenda and Boodschappen cards, then wait long enough for the swim lesson to register.", touchGestures: ['One tap on the Today area or first practical card only.'], interactionSequence: ['Tap once, then stop. Do not open quick capture.'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted'], expectedFinalState: 'Home remains on the same calm dashboard state, with the swimming lesson remembered as a practical need for later.', directorNotes: 'Avoid feature dumping. The tap should feel like Dad checking the board while coffee is brewing.', timing: { initialHoldMs: 1300, postActionHoldMs: 850, postSceneHoldMs: 700 }, actions: [action('tap-today-area', 'touch', "Tap once on today's agenda area to show tablet-first use without opening a workflow.", { hesitationMs: 180, holdAfterMs: 900 })] })]) },
    { id: 'family', narrativeStep: 'family', scenes: Object.freeze([scene({ id: 'family', fixture: 'visual-marketing-family', title: 'Family', subtitle: 'This is our family', purpose: 'Communicate “This is our family” through a brief, personal Avatar demonstration.', narrativeRole: 'Humanize the household before moving deeper into planning.', emotionalTone: 'Recognition, personal, familial', visualFocus: 'Thomas, the updated avatar after save, then the saved family overview.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Move slowly from family overview to Thomas; pause after opening Thomas; pause briefly in Avatar Editor; save; hold; return.', touchGestures: ['Tap Thomas', 'Tap Avatar Editor', 'Change one simple visual property', 'Tap save', 'Tap return'], interactionSequence: ['Open Thomas', 'Open Avatar Editor', 'Change one simple visual property', 'Save', 'Pause on updated avatar', 'Return to Family overview'], audioEvents: ['TransitionStarted', 'TransitionCompleted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Family overview is visible again, with Thomas subtly personalized and recognizable.', directorNotes: 'This is not an editing demo. Keep it brief and affectionate.', timing: { initialHoldMs: 1200, postActionHoldMs: 750, postSaveHoldMs: 1000 }, actions: [action('open-thomas', 'touch', 'Open Thomas from the Family overview.', { hesitationMs: 170, holdAfterMs: 700 }), action('open-avatar-editor', 'touch', 'Open the Avatar Editor.', { hesitationMs: 170, holdAfterMs: 700 }), action('change-simple-avatar-property', 'touch', 'Change one simple visual property such as color or small accessory.', { hesitationMs: 170, holdAfterMs: 650 }), action('save-avatar', 'touch', 'Save the updated avatar.', { hesitationMs: 180, holdAfterMs: 1000 }), action('pause-updated-avatar', 'pause', 'Pause about one second on the updated avatar before returning.', { holdMs: 1000 }), action('return-family-overview', 'touch', 'Return to the Family overview.', { hesitationMs: 180, holdAfterMs: 750 })] })]) },
    { id: 'agenda', narrativeStep: 'planning', scenes: Object.freeze([scene({ id: 'agenda', fixture: 'visual-marketing-agenda', title: 'Agenda', subtitle: 'One rhythm for the whole family', purpose: 'Show month, week, day/list rhythm, then add one realistic plan.', narrativeRole: "Today's planning grows into a wider family rhythm with Filmavond.", emotionalTone: 'Confidence without rigidity', visualFocus: 'Month view, week view, list view, saved Filmavond event, and returned overview.', minimumDurationMs: 11000, preferredDurationMs: 14000, maximumDurationMs: 15000, transition: { type: 'dissolve' }, cameraPacing: 'Show Month and pause. Move to Week and pause. Move to List and pause. Keep event creation steady and readable.', touchGestures: ['Tap Month', 'Tap Week', 'Tap List', 'Tap add event', 'Enter Filmavond', 'Save', 'Return to overview'], interactionSequence: ['Show Month', 'Pause', 'Show Week', 'Pause', 'Show List', 'Pause', 'Add Filmavond', 'Save', 'Hold briefly so Filmavond is visible', 'Return to overview'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Agenda overview is visible with Filmavond added as a believable event.', directorNotes: 'Pause between views and after the save. The point is confidence across time scales.', timing: { initialHoldMs: 1300, viewHoldMs: 900, postSaveHoldMs: 1200, postSceneHoldMs: 700 }, actions: [agendaAction('show-month', 'Show Month view.', agendaRecordingActions.showMonth, { hesitationMs: 80, holdAfterMs: 250, durationMs: 220, directClick: true, clickTimeoutMs: 5000 }), action('pause-month', 'pause', 'Pause on Month view.', { holdMs: 300 }), agendaAction('show-week', 'Show Week view.', agendaRecordingActions.showWeek, { hesitationMs: 80, holdAfterMs: 250, durationMs: 220, directClick: true, clickTimeoutMs: 5000 }), action('pause-week', 'pause', 'Pause on Week view.', { holdMs: 300 }), agendaAction('show-list', 'Show List view.', agendaRecordingActions.showList, { hesitationMs: 80, holdAfterMs: 250, durationMs: 220, directClick: true, clickTimeoutMs: 5000 }), action('pause-list', 'pause', 'Pause on List view.', { holdMs: 300 }), agendaAction('add-filmavond', 'Add one event named Filmavond.', agendaRecordingActions.addFilmavond, { hesitationMs: 80, holdAfterMs: 180, durationMs: 220, directClick: true, clickTimeoutMs: 5000, typingDelayMs: 0 }), agendaAction('save-filmavond', 'Save Filmavond.', agendaRecordingActions.saveFilmavond, { hesitationMs: 80, holdAfterMs: 300, durationMs: 220, locatorClickSteps: 1 }), action('hold-filmavond-visible', 'pause', 'Hold briefly so Filmavond is visible.', { holdMs: 500 }), agendaAction('return-agenda-overview', 'Return to the agenda overview.', agendaRecordingActions.returnOverview, { hesitationMs: 80, holdAfterMs: 250, durationMs: 220, directClick: true, clickTimeoutMs: 5000 })] })]) },
    { id: 'tasks', narrativeStep: 'helping', scenes: Object.freeze([scene({ id: 'tasks', fixture: 'visual-marketing-tasks', title: 'Tasks', subtitle: 'Small jobs, shared rhythm', purpose: 'Show practical tasks added and completed without drama.', narrativeRole: 'Planning turns into helping each other.', emotionalTone: 'Confidence shifting into helpful relief', visualFocus: 'Task list, new Koekjes bakken task, and completion of Zwemtas klaarzetten.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Hold on task list first; keep add-task steady; center Zwemtas klaarzetten; pause longer after completion.', touchGestures: ['Tap add task', 'Enter Koekjes bakken', 'Save', 'Tap completion affordance'], interactionSequence: ['Add Koekjes bakken', 'Wait for it to appear', 'Complete Zwemtas klaarzetten', 'Wait for completion animation'], audioEvents: ['TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save', 'task completed'], expectedFinalState: 'Koekjes bakken is visible and Zwemtas klaarzetten has completed with visual state settled.', directorNotes: 'The completion animation must finish before transition. This resolves the swimming-lesson thread.', timing: { initialHoldMs: 1200, postAddHoldMs: 850, completionAnimationHoldMs: 1200 }, actions: [action('add-koekjes-bakken', 'touch', 'Add Koekjes bakken.', { hesitationMs: 170, holdAfterMs: 800 }), action('wait-koekjes-visible', 'pause', 'Wait for Koekjes bakken to appear.', { holdMs: 850 }), action('complete-zwemtas', 'touch', 'Complete Zwemtas klaarzetten.', { hesitationMs: 190, holdAfterMs: 900 }), action('wait-completion-animation', 'pause', 'Wait for the completion animation to finish.', { holdMs: 1200 })] })]) },
    { id: 'shopping', narrativeStep: 'shopping', scenes: Object.freeze([scene({ id: 'shopping', fixture: 'visual-marketing-shopping', title: 'Shopping', subtitle: 'Errands that make sense', purpose: 'Show one tiny grocery addition while existing list supports Koekjes bakken.', narrativeRole: 'Helpful planning continues into practical errands.', emotionalTone: 'Grounded, useful, unhurried', visualFocus: 'Grouped lists with Bloem, Roomboter, Chocoladestukjes, Vanillesuiker already present, plus Bananen.', minimumDurationMs: 6000, preferredDurationMs: 7000, maximumDurationMs: 8000, transition: { type: 'dissolve' }, cameraPacing: 'Start still on grouped list; add Bananen quickly; hold after it appears.', touchGestures: ['Tap add item', 'Enter Bananen', 'Save'], interactionSequence: ['Show grouped errands', 'Ensure baking ingredients are visible or clearly implied', 'Add Bananen', 'Hold briefly on grouped list'], audioEvents: ['TransitionStarted', 'TransitionCompleted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Shopping remains organized by destinations, cookie ingredients remain visible, and Bananen has been added.', directorNotes: 'Keep the addition extremely short; ingredients are fixture data and are not added during recording.', timing: { initialHoldMs: 1200, postAddHoldMs: 900, postSceneHoldMs: 700 }, actions: [action('show-grouped-errands', 'pause', 'Show grouped errands with baking ingredients already present.', { holdMs: 800, fixtureItems: ['Bloem', 'Roomboter', 'Chocoladestukjes', 'Vanillesuiker'] }), action('add-bananen', 'touch', 'Add only Bananen.', { hesitationMs: 120, holdAfterMs: 550, addedItem: 'Bananen' }), action('hold-grouped-list', 'pause', 'Hold briefly after Bananen appears on the grouped list.', { holdMs: 750 })] })]) },
    { id: 'motivation', narrativeStep: 'motivation', scenes: Object.freeze([scene({ id: 'motivation', fixture: 'visual-marketing-motivation', title: 'Motivation', subtitle: 'Helpful moments add up', purpose: 'Demonstrate adding one appreciation so kindness becomes visible.', narrativeRole: 'The family recognizes small help adding up toward Sunday pancake breakfast.', emotionalTone: 'Warmth, encouragement, tenderness', visualFocus: 'Family goal progress, appreciation entry, and newly visible appreciation.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Pause on progress first; move gently to appreciation; keep entry steady; wait after save until readable.', touchGestures: ['Tap add appreciation', 'Enter Bedankt voor het helpen met opruimen.', 'Save'], interactionSequence: ['Show family goal progress', 'Add appreciation: Bedankt voor het helpen met opruimen.', 'Save', 'Pause until the appreciation is readable'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'appreciation shown', 'save'], expectedFinalState: 'The new appreciation is visible and emotionally clear.', directorNotes: 'Do not make motivation feel gamified. The emotional point is recognizing kindness.', timing: { initialHoldMs: 1300, progressHoldMs: 900, appreciationReadHoldMs: 1700 }, actions: [action('show-family-goal-progress', 'pause', 'Show family goal progress.', { holdMs: 1000 }), action('add-appreciation', 'touch', 'Add appreciation: Bedankt voor het helpen met opruimen.', { hesitationMs: 180, holdAfterMs: 900 }), action('save-appreciation', 'touch', 'Save the appreciation.', { hesitationMs: 180, holdAfterMs: 900 }), action('pause-appreciation-readable', 'pause', 'Pause until the appreciation is comfortably readable.', { holdMs: 1700 })] })]) },
    { id: 'weekly-reset', narrativeStep: 'weekly-reflection', scenes: Object.freeze([scene({ id: 'weekly-reset', fixture: 'visual-marketing-weekly-reset', title: 'Weekly Reset', subtitle: 'Ready for next week', purpose: 'Show the emotional high point: the family gently closes the week and prepares for the next one.', narrativeRole: 'Morning planning has matured into Sunday reflection, carry-forward decisions, and shared confidence.', emotionalTone: 'Reflection, togetherness, satisfaction', visualFocus: 'Completed week, carried-forward tasks, family goal celebration, or reset summary connecting prior scenes.', minimumDurationMs: 12000, preferredDurationMs: 14000, maximumDurationMs: 15000, transition: { type: 'dissolve', pacing: 'slow-warm', durationMs: 1600 }, cameraPacing: 'Move slower than every earlier scene, with extra breathing room and the longest pauses on completion state.', touchGestures: ['One calm, slow tap to complete or acknowledge the reset moment if available; otherwise no touch.'], interactionSequence: ['Show the same week closing', 'Acknowledge or complete the reset moment if available', 'Hold on completion or ready-for-next-week state'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'weekly reset complete', 'ChapterCompleted'], expectedFinalState: 'Weekly Reset communicates the family gently finishing the same week together and feeling ready.', directorNotes: 'Weekly Reset is the emotional climax. Use the slowest movement, slowest touch, longest pause, and longest transition.', timing: { initialHoldMs: 1700, postActionHoldMs: 1300, completionHoldMs: 2200, postSceneHoldMs: 1200 }, scenePacing: { pauseMultiplier: 1.45, movementMultiplier: 0.72, transitionMultiplier: 1.55 }, actions: [action('show-week-closing', 'pause', 'Show the same week closing with traces of swimming preparation, Filmavond, Koekjes bakken, shopping, appreciation, and helpful moments.', { holdMs: 1800 }), action('acknowledge-reset', 'touch', 'Acknowledge or complete the reset moment if available.', { optional: true, hesitationMs: 260, holdAfterMs: 1400, gesturePacing: 'slowest' }), action('hold-ready-state', 'pause', 'Hold on completion or ready-for-next-week state.', { holdMs: 2200 })] })]) },
    { id: 'outro', narrativeStep: 'closing', scenes: Object.freeze([scene({ id: 'outro', fixture: 'visual-marketing-home', title: 'FamilyBoard', subtitle: 'Everyday family life, a little easier', purpose: 'Close with the same calm clarity as the opening, enriched by the story of the week.', narrativeRole: 'Return home after planning, helping, errands, appreciation, and reset: the family is ready together.', emotionalTone: 'Calm, warm, complete', visualFocus: 'Home dashboard, then a simple brand card.', minimumDurationMs: 5000, preferredDurationMs: 7000, maximumDurationMs: 7000, transition: { type: 'fade', sequence: ['home', 'brand-card', 'black'] }, cameraPacing: 'Return Home and hold briefly; fade to centered brand card; hold about two seconds; fade to black.', touchGestures: ['None'], interactionSequence: ['Return Home', 'Hold the dashboard briefly', 'Fade to brand card: FamilyBoard / Everyday family life, a little easier.', 'Hold approximately two seconds', 'Fade to black'], audioEvents: ['ChapterStarted', 'ChapterCompleted', 'RecordingFinished'], expectedFinalState: 'Brand card holds briefly, then fades to black.', directorNotes: 'End together. Do not add calls to action, feature claims, buttons, URLs, or a final interaction.', timing: { homeHoldMs: 1300, brandCardHoldMs: 2000, finalFadeMs: 900 }, actions: [action('return-home', 'pause', 'Return Home.', { holdMs: 400 }), action('hold-dashboard', 'pause', 'Hold the updated Home dashboard briefly before the brand card.', { holdMs: 700 }), action('fade-brand-card', 'pause', 'Fade to brand card: FamilyBoard / Everyday family life, a little easier.', { transitionMs: 500 }), action('hold-brand-card', 'pause', 'Hold approximately two seconds.', { holdMs: 1300 }), action('fade-to-black', 'pause', 'Fade to black.', { transitionMs: 500 })] })]) },
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
