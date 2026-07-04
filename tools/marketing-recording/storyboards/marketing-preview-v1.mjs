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
const readableResultHoldMs = 1000;

async function waitForHomeWeatherPill(page) {
  const pill = page.getByRole('button', { name: /Weeradvies, (?!Geen weeradvies)/ });
  await expectSingle(pill, 'Home header weather pill with controlled marketing weather');
  return pill;
}

const homeRecordingActions = Object.freeze({
  async validateWeatherPill({ page }) {
    await waitForHomeWeatherPill(page);
    await holdReadable(page);
  },
  async openWeatherDetail({ page, touch, eventBus, scene }, action) {
    const pill = await waitForHomeWeatherPill(page);
    eventBus?.publish(recordingEventTypes.DialogOpenStarted, { sceneId: scene?.id, actionId: 'open-weather-detail', dialogId: 'home-weather-detail' });
    await tapLocator(touch, pill, 'Home header weather pill', { ...action, directClick: true, holdAfterMs: action.holdAfterMs ?? readableResultHoldMs, clickTimeoutMs: 5000 });
    const dialog = page.getByRole('dialog', { name: 'Weer voor vandaag', exact: true });
    await expectSingle(dialog, 'Home weather detail dialog');
    await expectSingle(dialog.getByText(/vertrekadvies/i).first(), 'Weather detail departure advice copy');
    eventBus?.publish(recordingEventTypes.DialogOpenVisible, { sceneId: scene?.id, actionId: 'open-weather-detail', dialogId: 'home-weather-detail' });
    await holdReadable(page, action.dialogReadableHoldMs ?? readableResultHoldMs);
  },
  async closeWeatherDetail({ page, touch, eventBus, scene }, action) {
    const dialog = page.getByRole('dialog', { name: 'Weer voor vandaag', exact: true });
    await expectSingle(dialog, 'Home weather detail dialog before close');
    eventBus?.publish(recordingEventTypes.DialogSaveOrCancelClicked, { sceneId: scene?.id, actionId: 'close-weather-detail', dialogId: 'home-weather-detail' });
    await tapLocator(touch, dialog.getByRole('button', { name: 'Weerdetails sluiten', exact: true }), 'Home weather detail close button', { ...action, directClick: true, holdAfterMs: action.holdAfterMs ?? 600, clickTimeoutMs: 5000 });
    await dialog.waitFor({ state: 'hidden', timeout: 10000 });
    eventBus?.publish(recordingEventTypes.DialogCloseCompleted, { sceneId: scene?.id, actionId: 'close-weather-detail', dialogId: 'home-weather-detail' });
    await waitForHomeWeatherPill(page);
    await holdReadable(page, action.resultReadableHoldMs ?? 700);
  },
});

function homeAction(id, description, execute, metadata = {}) {
  return action(id, 'touch', description, { resultHoldMs: readableResultHoldMs, ...metadata, execute: (context) => execute(context, metadata) });
}

async function holdReadable(page, ms = readableResultHoldMs) {
  await page.waitForTimeout(ms);
}

function familyDialog(page) {
  return page.getByRole('dialog', { name: /Avatarbewerker voor Thomas/ });
}

const familyRecordingActions = Object.freeze({
  async openThomas({ page }) {
    await page.getByRole('heading', { name: 'Thomas', exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
    await holdReadable(page);
  },
  async openAvatarEditor({ page, touch }) {
    const button = page.getByRole('button', { name: 'Avatar bewerken', exact: true }).first();
    await tapLocator(touch, button, 'Thomas Avatar Editor button', { directClick: true, holdAfterMs: readableResultHoldMs, clickTimeoutMs: 5000 });
    const dialog = familyDialog(page);
    await expectSingle(dialog, 'Thomas Avatar Editor dialog');
    await expectSingle(dialog.getByLabel('Live avatarvoorbeeld voor Thomas', { exact: true }), 'Thomas Avatar Editor live preview');
    await holdReadable(page);
  },
  async changeAvatarProperty({ page, touch }) {
    const dialog = familyDialog(page);
    await expectSingle(dialog, 'Thomas Avatar Editor dialog before change');
    const option = dialog.getByRole('button', { name: /Haarband|Strik|Kroontje/ }).first();
    await tapLocator(touch, option, 'Thomas Avatar Editor accessory option', { directClick: true, holdAfterMs: readableResultHoldMs, clickTimeoutMs: 5000 });
    await expectSingle(dialog.getByText('Niet-opgeslagen wijzigingen', { exact: true }), 'Thomas Avatar Editor unsaved status');
    await holdReadable(page);
  },
  async saveAvatar({ page, touch }) {
    const dialog = familyDialog(page);
    await expectSingle(dialog, 'Thomas Avatar Editor dialog before save');
    await tapLocator(touch, dialog.getByRole('button', { name: 'Opslaan', exact: true }), 'Thomas Avatar Editor Save button', { directClick: true, requireEnabled: true, holdAfterMs: readableResultHoldMs, clickTimeoutMs: 5000 });
    await dialog.waitFor({ state: 'hidden', timeout: 10000 });
    await page.getByRole('heading', { name: 'Thomas', exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
    await holdReadable(page);
  },
  async returnFamilyOverview({ page }) {
    await page.getByRole('heading', { name: 'Thomas', exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
    await holdReadable(page);
  },
});

function familyAction(id, description, execute, metadata = {}) {
  return action(id, 'touch', description, { resultHoldMs: readableResultHoldMs, ...metadata, execute: (context) => execute(context, metadata) });
}

function tasksRoot(page) {
  return page.getByRole('article', { name: 'Takenpagina', exact: true });
}

function taskDialog(page) {
  return page.getByRole('dialog', { name: 'Gezinstaak toevoegen', exact: true });
}

async function expectRedesignedTasksPage(page) {
  const root = await expectSingle(tasksRoot(page), 'Tasks page root');
  await expectSingle(root.getByLabel('Vandaag samenvatting', { exact: true }), 'Tasks Today summary');
  await expectSingle(root.getByLabel('Taken dashboard', { exact: true }), 'Tasks desktop dashboard grid');
  const todayColumn = await expectSingle(root.locator('.task-time-group-today'), 'Tasks Today focus column');
  await expectSingle(todayColumn.getByRole('heading', { name: 'Vandaag', exact: true }), 'Tasks Today focus heading');
  await expectSingle(root.getByLabel('Planning', { exact: true }), 'Tasks planning summary column');
  await expectSingle(root.getByLabel('Taakplanning acties', { exact: true }), 'Tasks progressive-disclosure support actions');
  return root;
}

const taskRecordingActions = Object.freeze({
  async openAddDialog({ page, touch, eventBus, scene }, action) {
    await expectRedesignedTasksPage(page);
    const addButton = page.getByRole('button', { name: 'Gezinstaak toevoegen', exact: true }).first();
    eventBus?.publish(recordingEventTypes.DialogOpenStarted, { sceneId: scene?.id, actionId: 'open-add-task-dialog', dialogId: 'tasks-add-task' });
    await tapLocator(touch, addButton, 'Tasks Add Task button', { ...action, directClick: true, holdAfterMs: readableResultHoldMs, clickTimeoutMs: 5000 });
    const dialog = taskDialog(page);
    await expectSingle(dialog, 'Tasks add-task dialog');
    eventBus?.publish(recordingEventTypes.DialogOpenVisible, { sceneId: scene?.id, actionId: 'open-add-task-dialog', dialogId: 'tasks-add-task' });
    await holdReadable(page, action.dialogReadableHoldMs ?? readableResultHoldMs);
  },
  async enterKoekjes({ page }, action) {
    const dialog = taskDialog(page);
    await expectSingle(dialog, 'Tasks add-task dialog before entry');
    await expectSingle(dialog.getByText('Wat moet er gebeuren?', { exact: true }), 'Tasks progressive title question');
    const titleInput = dialog.locator('#task-title');
    await expectSingle(titleInput, 'Tasks title input');
    await titleInput.click();
    await page.keyboard.type('Koekjes bakken', { delay: action.typingDelayMs ?? 45 });
    await holdReadable(page, action.summaryHoldMs ?? readableResultHoldMs);
  },
  async saveKoekjes({ page, touch, eventBus, scene }) {
    const dialog = taskDialog(page);
    eventBus?.publish(recordingEventTypes.DialogSaveOrCancelClicked, { sceneId: scene?.id, actionId: 'save-koekjes-bakken', dialogId: 'tasks-add-task' });
    if (await dialog.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden', timeout: 10000 });
    }
    eventBus?.publish(recordingEventTypes.DialogCloseCompleted, { sceneId: scene?.id, actionId: 'save-koekjes-bakken', dialogId: 'tasks-add-task' });
    await expectRedesignedTasksPage(page);
    eventBus?.publish(recordingEventTypes.DialogResultVisible, { sceneId: scene?.id, actionId: 'save-koekjes-bakken', dialogId: 'tasks-add-task' });
    await holdReadable(page);
  },
  async completeZwemtas({ page, touch }) {
    const root = await expectRedesignedTasksPage(page);
    const todayColumn = root.locator('.task-time-group-today');
    const zwemtasCard = todayColumn.locator('.task-item').filter({ hasText: 'Zwemtas klaarzetten' }).first();
    await expectSingle(zwemtasCard, 'Zwemtas klaarzetten visible Today task card before completion');
    await zwemtasCard.click({ force: true, timeout: 5000 });
    await page.waitForTimeout(250);
    const actions = page.getByLabel('Acties voor Zwemtas klaarzetten', { exact: true });
    await expectSingle(actions, 'Zwemtas klaarzetten actions');
    await holdReadable(page);
    await tapLocator(touch, actions.getByRole('button', { name: 'Klaar', exact: true }), 'Zwemtas klaarzetten complete button', { directClick: true, holdAfterMs: readableResultHoldMs, clickTimeoutMs: 5000 });
    await page.waitForFunction(() => [...document.querySelectorAll('.task-time-group-today .task-item')].every((element) => !element.textContent?.includes('Zwemtas klaarzetten')), null, { timeout: 10000 });
    await expectSingle(root.locator('.task-secondary-rail').getByRole('button', { name: /Afgerond/ }), 'Tasks completed contextual surface button');
    await tapLocator(touch, root.locator('.task-secondary-rail').getByRole('button', { name: /Afgerond/ }), 'Tasks completed contextual surface button', { directClick: true, holdAfterMs: readableResultHoldMs, clickTimeoutMs: 5000 });
    const completedDialog = page.getByRole('dialog', { name: 'Afgerond', exact: true });
    await expectSingle(completedDialog, 'Tasks completed contextual surface');
    await expectSingle(completedDialog.locator('.task-item').filter({ hasText: 'Zwemtas klaarzetten' }).filter({ hasText: 'Afgerond' }).first(), 'Completed Zwemtas klaarzetten task in completed surface');
    await holdReadable(page);
  },
});

function taskAction(id, description, execute, metadata = {}) {
  return action(id, 'touch', description, { resultHoldMs: readableResultHoldMs, ...metadata, execute: (context) => execute(context, metadata) });
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

function agendaDialog(page) {
  return page.getByRole('dialog', { name: 'Gebeurtenis toevoegen', exact: true });
}

function savedFilmavondEvent(page) {
  return agendaRoot(page).locator('.agenda-event strong, .agenda-planning-event strong').filter({ hasText: /^Filmavond$/ });
}

async function measureAgendaStep(eventBus, scene, actionId, step, run) {
  const startedAt = Date.now();
  eventBus?.publish(recordingEventTypes.DialogOpenVisible, { sceneId: scene?.id, actionId, dialogId: 'agenda-add-event', phase: `${step}:started` });
  try {
    const result = await run();
    eventBus?.publish(recordingEventTypes.DialogOpenVisible, { sceneId: scene?.id, actionId, dialogId: 'agenda-add-event', phase: `${step}:completed:${Date.now() - startedAt}ms` });
    return result;
  } catch (error) {
    eventBus?.publish(recordingEventTypes.DialogOpenVisible, { sceneId: scene?.id, actionId, dialogId: 'agenda-add-event', phase: `${step}:failed:${Date.now() - startedAt}ms:${error.message}` });
    throw error;
  }
}

async function continueAgendaDialog(dialog, description, options = {}) {
  const button = await expectEnabled(dialog.getByRole('button', { name: 'Verder', exact: true }), description);
  await button.click({ timeout: options.clickTimeoutMs ?? 5000 });
}

async function waitForFilmavondDetailsOrSaved(page, dialog) {
  const detailsSaveButton = dialog.getByRole('button', { name: 'Gebeurtenis maken', exact: true });
  const outcome = await Promise.race([
    detailsSaveButton.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'details').catch(() => undefined),
    savedFilmavondEvent(page).waitFor({ state: 'visible', timeout: 10000 }).then(() => 'saved').catch(() => undefined),
    dialog.waitFor({ state: 'hidden', timeout: 10000 }).then(() => 'closed').catch(() => undefined),
  ]);
  if (outcome === 'details') {
    await expectEnabled(detailsSaveButton, 'Agenda create-event Save button after details step');
    return outcome;
  }
  if (outcome === 'saved') return outcome;
  if (outcome === 'closed') {
    await savedFilmavondEvent(page).waitFor({ state: 'visible', timeout: 10000 });
    return 'saved';
  }
  const pageText = await page.locator('body').textContent().catch(() => '(page text unavailable)');
  throw new Error(`Agenda event dialog did not reach details, save, or visible Filmavond. Page text: ${pageText}`);
}

const agendaRecordingActions = Object.freeze({
  async validateDefaultPlanning({ page }) {
    const root = await ensureAgendaPage(page);
    await expectSingle(root.getByLabel('Planningoverzicht', { exact: true }), 'Agenda default Planning workspace');
    const weekButtonCount = await root.getByRole('button', { name: 'Week', exact: true }).count();
    if (weekButtonCount !== 0) throw new Error(`Agenda Week primary mode should not be visible, found ${weekButtonCount}.`);
    const listButtonCount = await root.getByRole('button', { name: 'Lijst', exact: true }).count();
    if (listButtonCount !== 0) throw new Error(`Agenda List primary mode should not be visible, found ${listButtonCount}.`);
    await expectSingle(root.getByRole('button', { name: 'Afspraak plannen', exact: true }), 'Agenda planning tool Add appointment action');
    await expectSingle(root.getByRole('button', { name: 'Datum kiezen', exact: true }), 'Agenda planning tool Date choice action');
    await expectSingle(root.getByRole('button', { name: 'Maand bekijken', exact: true }), 'Agenda contextual Month action');
    const todayBriefing = await expectSingle(root.getByLabel('Vandaag briefing', { exact: true }), 'Agenda dominant Today briefing');
    await expectSingle(todayBriefing.getByRole('img', { name: /Vandaag, \d+°, / }), 'Agenda Today briefing subtle weather context');
    await expectSingle(root.getByLabel('Deze week', { exact: true }), 'Agenda quieter This Week briefing');
    await expectSingle(root.getByLabel('Vooruitkijken', { exact: true }), 'Agenda future reassurance briefing');
    await holdReadable(page);
  },
  async addFilmavond({ page, touch, eventBus, scene }, action) {
    await ensureAgendaPage(page);
    const addEventButton = agendaRoot(page).getByRole('button', { name: 'Afspraak plannen', exact: true });
    eventBus?.publish(recordingEventTypes.DialogOpenStarted, { sceneId: scene?.id, actionId: 'add-filmavond', dialogId: 'agenda-add-event' });
    await tapLocator(touch, addEventButton, 'Agenda Planning tools Add appointment button', action);
    const dialog = agendaDialog(page);
    await expectSingle(dialog, 'Agenda add-event dialog');
    eventBus?.publish(recordingEventTypes.DialogOpenVisible, { sceneId: scene?.id, actionId: 'add-filmavond', dialogId: 'agenda-add-event' });
    await expectSingle(dialog.getByLabel('Calendar event conversation', { exact: true }), 'Agenda event conversation form');
    const titleInput = dialog.locator('#calendar-event-title');
    await expectSingle(titleInput, 'Agenda event title input');
    await measureAgendaStep(eventBus, scene, 'add-filmavond', 'title-entered', async () => {
      await titleInput.click();
      await titleInput.fill('');
      await page.keyboard.type('Filmavond', { delay: action.typingDelayMs ?? 12 });
    });
    await measureAgendaStep(eventBus, scene, 'add-filmavond', 'question-1-title-completed', async () => {
      await continueAgendaDialog(dialog, 'Agenda event title Continue button', action);
      await expectSingle(dialog.getByText('Wanneer moet het gezin dit onthouden?', { exact: true }), 'Agenda event date question');
    });
    await measureAgendaStep(eventBus, scene, 'add-filmavond', 'question-2-date-completed', async () => {
      await continueAgendaDialog(dialog, 'Agenda event date Continue button', action);
      await expectSingle(dialog.getByText('Duurt het de hele dag?', { exact: true }), 'Agenda event time-kind question');
    });
    await measureAgendaStep(eventBus, scene, 'add-filmavond', 'question-3-time-completed', async () => {
      await continueAgendaDialog(dialog, 'Agenda event time Continue button', action);
      await waitForFilmavondDetailsOrSaved(page, dialog);
    });
    eventBus?.publish(recordingEventTypes.DialogSaveOrCancelClicked, { sceneId: scene?.id, actionId: 'add-filmavond', dialogId: 'agenda-add-event', phase: 'final-details-or-result-ready' });
    await page.waitForTimeout(action.dialogReadableHoldMs ?? 450);
  },
  async saveFilmavond({ page, touch, eventBus, scene }, action) {
    await ensureAgendaPage(page);
    if ((await savedFilmavondEvent(page).count()) === 1) {
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
    await tapLocator(touch, agendaRoot(page).getByRole('button', { name: 'Terug naar planning', exact: true }), 'Agenda return-to-planning action', action);
    await expectSingle(agendaRoot(page).getByLabel('Planningoverzicht', { exact: true }), 'Agenda planning workspace');
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
  preferredTotalDurationMs: 85000,
  maximumTotalDurationMs: 90000,
  chapterCardDirection: chapterCardDefaults,
  chapters: Object.freeze([
    { id: 'intro', narrativeStep: 'introduction', scenes: Object.freeze([scene({ id: 'intro', fixture: 'visual-marketing-home', title: 'Home', subtitle: 'A calmer start to the day', purpose: 'Open the preview as a family story, not as a technical product tour.', narrativeRole: "Establish a quiet Tuesday morning before the board becomes the family's shared memory.", emotionalTone: 'Calm', visualFocus: 'The redesigned full desktop Home dashboard with the larger family anchor and dominant Agenda/Boodschappen cards already prepared.', minimumDurationMs: 4000, preferredDurationMs: 5000, maximumDurationMs: 6000, transition: { type: 'fade', from: 'warm-neutral-black' }, cameraPacing: 'Start still. Hold for a full breath before any motion. Use only a very slow settle toward the center of the screen.', touchGestures: ['None'], interactionSequence: ['No interaction; the value is immediate readability.'], audioEvents: ['RecordingStarted', 'ChapterStarted', 'TransitionCompleted'], expectedFinalState: 'Home dashboard visible, steady, and readable.', directorNotes: 'Let this scene breathe. Do not introduce touch yet; the opening should feel observed rather than operated.', timing: { initialHoldMs: 1400, postSceneHoldMs: 900 }, actions: [homeAction('validate-home-weather-pill', 'Validate that the Home header weather pill is visible as part of the opening dashboard.', homeRecordingActions.validateWeatherPill, { holdAfterMs: 1000 })] })]) },
    { id: 'home', narrativeStep: 'todays-family', scenes: Object.freeze([scene({ id: 'home', fixture: 'visual-marketing-home', title: 'Today', subtitle: 'Everything that matters is already here', purpose: 'Show that FamilyBoard answers the morning question: what matters today?', narrativeRole: 'Move from atmosphere into practical morning clarity for school, daycare, swimming, dinner, and tasks.', emotionalTone: 'Calm shifting into curiosity', visualFocus: "The Home header weather pill, dominant Home Agenda and Boodschappen cards, the larger family member area, and Thomas's swimming lesson.", minimumDurationMs: 6000, preferredDurationMs: 8000, maximumDurationMs: 9000, transition: { type: 'dissolve' }, cameraPacing: "Pause on the full dashboard with the weather pill visible, briefly open the weather detail dialog, close it, then drift toward today's Agenda and Boodschappen cards long enough for the swim lesson to register.", touchGestures: ['Tap the Home weather pill briefly', 'Close the weather detail dialog'], interactionSequence: ['Show the weather pill in the header', 'Tap it once to briefly show the weather detail dialog', 'Close the dialog', 'Return to the Home dashboard without opening quick capture.'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted'], expectedFinalState: 'Home remains on the same calm dashboard state, with the swimming lesson remembered as a practical need for later.', directorNotes: 'Avoid feature dumping. The tap should feel like Dad checking the board while coffee is brewing.', timing: { initialHoldMs: 1300, postActionHoldMs: 850, postSceneHoldMs: 700 }, actions: [homeAction('validate-home-weather-pill', 'Validate the Home header weather pill before interaction.', homeRecordingActions.validateWeatherPill, { holdAfterMs: 700 }), homeAction('open-weather-detail', 'Open the weather detail dialog briefly from the Home weather pill.', homeRecordingActions.openWeatherDetail, { hesitationMs: 140, holdAfterMs: 900, dialogReadableHoldMs: 900 }), homeAction('close-weather-detail', 'Close the weather detail dialog and return to the Home dashboard.', homeRecordingActions.closeWeatherDetail, { hesitationMs: 140, holdAfterMs: 650, resultReadableHoldMs: 700 })] })]) },
    { id: 'family', narrativeStep: 'family', scenes: Object.freeze([scene({ id: 'family', fixture: 'visual-marketing-family', title: 'Family', subtitle: 'This is our family', purpose: 'Communicate “This is our family” through a brief, personal Avatar demonstration.', narrativeRole: 'Humanize the household before moving deeper into planning.', emotionalTone: 'Recognition, personal, familial', visualFocus: 'Thomas, the updated avatar after save, then the saved family overview.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Move slowly from family overview to Thomas; pause after opening Thomas; pause briefly in Avatar Editor; save; hold; return.', touchGestures: ['Tap Thomas', 'Tap Avatar Editor', 'Change one simple visual property', 'Tap save', 'Tap return'], interactionSequence: ['Open Thomas', 'Open Avatar Editor', 'Change one simple visual property', 'Save', 'Pause on updated avatar', 'Return to Family overview'], audioEvents: ['TransitionStarted', 'TransitionCompleted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Family overview is visible again, with Thomas subtly personalized and recognizable.', directorNotes: 'This is not an editing demo. Keep it brief and affectionate.', timing: { initialHoldMs: 1200, postActionHoldMs: 750, postSaveHoldMs: 1000 }, actions: [familyAction('open-thomas', 'Show Thomas page briefly before editing.', familyRecordingActions.openThomas, { hesitationMs: 170, holdAfterMs: 1000 }), familyAction('open-avatar-editor', 'Open the Avatar Editor and hold it clearly visible.', familyRecordingActions.openAvatarEditor, { hesitationMs: 170, holdAfterMs: 1000 }), familyAction('change-simple-avatar-property', 'Change one simple visual property such as color or small accessory.', familyRecordingActions.changeAvatarProperty, { hesitationMs: 170, holdAfterMs: 1000 }), familyAction('save-avatar', 'Save the updated avatar.', familyRecordingActions.saveAvatar, { hesitationMs: 180, holdAfterMs: 1000 }), action('pause-updated-avatar', 'pause', 'Pause about one second on the updated avatar before returning.', { holdMs: 1000, resultHoldMs: 1000 }), familyAction('return-family-overview', 'Return calmly after the avatar edit.', familyRecordingActions.returnFamilyOverview, { hesitationMs: 180, holdAfterMs: 1000 })] })]) },
    { id: 'agenda', narrativeStep: 'planning', scenes: Object.freeze([scene({ id: 'agenda', fixture: 'visual-marketing-agenda', title: 'Agenda', subtitle: 'What the family needs to know next', purpose: 'Show the Planning briefing first, then add one realistic plan from the quiet Planning tools without turning Month into a feature tour.', narrativeRole: "Today's briefing grows into a wider family rhythm with Filmavond.", emotionalTone: 'Confidence without rigidity', visualFocus: 'Dominant Today briefing with subtle weather context, quieter Deze week grouping, Vooruitkijken reassurance, quiet Planning tools, and saved Filmavond returning into the briefing.', minimumDurationMs: 10000, preferredDurationMs: 14000, maximumDurationMs: 14000, transition: { type: 'dissolve' }, cameraPacing: 'Hold on the Planning briefing first. Let Today dominate, glance through Deze week and Vooruitkijken, then use Afspraak plannen from Planning tools. Do not open Month during the recording.', touchGestures: ['Tap Afspraak plannen', 'Enter Filmavond', 'Save'], interactionSequence: ['Show default Planning briefing with Today, Deze week, Vooruitkijken, and Planning tools', 'Use Afspraak plannen for Filmavond', 'Save', 'Hold briefly so Filmavond is visible in the Planning briefing'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Agenda Planning briefing is visible with Filmavond added as a believable event.', directorNotes: 'The Planning briefing should answer what the family needs to know next. Month remains available on screen as a contextual tool, but this scene should not spend recording time inside Month.', timing: { initialHoldMs: 1600, briefingHoldMs: 1200, postSaveHoldMs: 1400, postSceneHoldMs: 800 }, actions: [agendaAction('validate-default-planning', 'Validate and pause on the default Planning briefing: Today, Deze week, Vooruitkijken, and Planning tools.', agendaRecordingActions.validateDefaultPlanning, { resultHoldMs: 1400 }), agendaAction('add-filmavond', 'Use Afspraak plannen to add one event named Filmavond.', agendaRecordingActions.addFilmavond, { hesitationMs: 100, holdAfterMs: 220, durationMs: 240, directClick: true, clickTimeoutMs: 5000, typingDelayMs: 0 }), agendaAction('save-filmavond', 'Save Filmavond.', agendaRecordingActions.saveFilmavond, { hesitationMs: 100, holdAfterMs: 350, durationMs: 240, locatorClickSteps: 1 }), action('hold-filmavond-visible', 'Hold on the Planning briefing so Filmavond is visible without entering Month.', { holdMs: 1400 })] })]) },
    { id: 'tasks', narrativeStep: 'helping', scenes: Object.freeze([scene({ id: 'tasks', fixture: 'visual-marketing-tasks', title: 'Tasks', subtitle: 'Small jobs, shared rhythm', purpose: 'Show practical tasks added and completed without drama.', narrativeRole: 'Planning turns into helping each other.', emotionalTone: 'Confidence shifting into helpful relief', visualFocus: 'The implemented desktop Tasks dashboard: Today summary, Vandaag focus section, compact Planning summary, secondary task-planning actions, progressive add-task dialog, progressive Koekjes bakken entry, and completion of Zwemtas klaarzetten.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Hold on the cleaner Today-first dashboard first; move through the progressive add-task questions without rushing; return to the wide Today focus; center Zwemtas klaarzetten; pause longer after completion.', touchGestures: ['Tap add task', 'Enter Koekjes bakken', 'Tap through owner/date/extras progressively', 'Save', 'Tap completion affordance'], interactionSequence: ['Show Today summary, Vandaag focus, compact Planning summary, and secondary task-planning actions', 'Add Koekjes bakken through the progressive dialog', 'Wait for the implemented task dashboard layout to settle', 'Complete Zwemtas klaarzetten', 'Wait for completion animation'], audioEvents: ['TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save', 'task completed'], expectedFinalState: 'The redesigned Tasks dashboard remains visible, the progressive Koekjes bakken entry has been shown, and Zwemtas klaarzetten has completed with visual state settled.', directorNotes: 'The Tasks scene should feel like the same marketing beat, but the cleaner Today-first layout must be obvious without narration. The completion animation must finish before transition; this resolves the swimming-lesson thread.', timing: { initialHoldMs: 1200, postAddHoldMs: 850, completionAnimationHoldMs: 1200 }, actions: [taskAction('open-add-task-dialog', 'Open the Add Task dialog and hold it readable.', taskRecordingActions.openAddDialog, { hesitationMs: 170, holdAfterMs: 1000, dialogReadableHoldMs: 1000 }), taskAction('enter-koekjes-bakken', 'Type Koekjes bakken at readable speed, move through the progressive questions, and review the compact summary.', taskRecordingActions.enterKoekjes, { hesitationMs: 170, holdAfterMs: 1000, typingDelayMs: 45, questionHoldMs: 700, summaryHoldMs: 1000 }), taskAction('save-koekjes-bakken', 'Save Koekjes bakken and hold the created task visible.', taskRecordingActions.saveKoekjes, { hesitationMs: 170, holdAfterMs: 1000 }), taskAction('complete-zwemtas', 'Complete Zwemtas klaarzetten.', taskRecordingActions.completeZwemtas, { hesitationMs: 190, holdAfterMs: 1000 }), action('wait-completion-animation', 'pause', 'Wait for the completion animation to finish.', { holdMs: 1200, resultHoldMs: 1200 })] })]) },
    { id: 'shopping', narrativeStep: 'shopping', scenes: Object.freeze([scene({ id: 'shopping', fixture: 'visual-marketing-shopping', title: 'Shopping', subtitle: 'Errands that make sense', purpose: 'Show one tiny grocery addition while existing list supports Koekjes bakken.', narrativeRole: 'Helpful planning continues into practical errands.', emotionalTone: 'Grounded, useful, unhurried', visualFocus: 'Grouped lists with Bloem, Roomboter, Chocoladestukjes, Vanillesuiker already present, plus Bananen.', minimumDurationMs: 6000, preferredDurationMs: 7000, maximumDurationMs: 8000, transition: { type: 'dissolve' }, cameraPacing: 'Start still on grouped list; add Bananen quickly; hold after it appears.', touchGestures: ['Tap add item', 'Enter Bananen', 'Save'], interactionSequence: ['Show grouped errands', 'Ensure baking ingredients are visible or clearly implied', 'Add Bananen', 'Hold briefly on grouped list'], audioEvents: ['TransitionStarted', 'TransitionCompleted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'save'], expectedFinalState: 'Shopping remains organized by destinations, cookie ingredients remain visible, and Bananen has been added.', directorNotes: 'Keep the addition extremely short; ingredients are fixture data and are not added during recording.', timing: { initialHoldMs: 1200, postAddHoldMs: 900, postSceneHoldMs: 700 }, actions: [action('show-grouped-errands', 'pause', 'Show grouped errands with baking ingredients already present.', { holdMs: 1000, fixtureItems: ['Bloem', 'Roomboter', 'Chocoladestukjes', 'Vanillesuiker'] }), action('add-bananen', 'touch', 'Add only Bananen.', { hesitationMs: 120, holdAfterMs: 1000, addedItem: 'Bananen' }), action('hold-grouped-list', 'pause', 'Hold briefly after Bananen appears on the grouped list.', { holdMs: 1000 })] })]) },
    { id: 'motivation', narrativeStep: 'motivation', scenes: Object.freeze([scene({ id: 'motivation', fixture: 'visual-marketing-motivation', title: 'Motivation', subtitle: 'Helpful moments add up', purpose: 'Demonstrate adding one appreciation so kindness becomes visible.', narrativeRole: 'The family recognizes small help adding up toward Sunday pancake breakfast.', emotionalTone: 'Warmth, encouragement, tenderness', visualFocus: 'Family goal progress, appreciation entry, and newly visible appreciation.', minimumDurationMs: 8000, preferredDurationMs: 10000, maximumDurationMs: 11000, transition: { type: 'crossfade' }, cameraPacing: 'Pause on progress first; move gently to appreciation; keep entry steady; wait after save until readable.', touchGestures: ['Tap add appreciation', 'Enter Bedankt voor het helpen met opruimen.', 'Save'], interactionSequence: ['Show family goal progress', 'Add appreciation: Bedankt voor het helpen met opruimen.', 'Save', 'Pause until the appreciation is readable'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'ActionCompleted', 'appreciation shown', 'save'], expectedFinalState: 'The new appreciation is visible and emotionally clear.', directorNotes: 'Do not make motivation feel gamified. The emotional point is recognizing kindness.', timing: { initialHoldMs: 1300, progressHoldMs: 900, appreciationReadHoldMs: 1700 }, actions: [action('show-family-goal-progress', 'pause', 'Show family goal progress.', { holdMs: 1000 }), action('add-appreciation', 'touch', 'Add appreciation: Bedankt voor het helpen met opruimen.', { hesitationMs: 180, holdAfterMs: 1000 }), action('save-appreciation', 'touch', 'Save the appreciation.', { hesitationMs: 180, holdAfterMs: 1000 }), action('pause-appreciation-readable', 'pause', 'Pause until the appreciation is comfortably readable.', { holdMs: 1700 })] })]) },
    { id: 'weekly-reset', narrativeStep: 'weekly-reflection', scenes: Object.freeze([scene({ id: 'weekly-reset', fixture: 'visual-marketing-weekly-reset', title: 'Weekly Reset', subtitle: 'Ready for next week', purpose: 'Show the emotional high point: the family gently closes the week and prepares for the next one.', narrativeRole: 'Morning planning has matured into Sunday reflection, carry-forward decisions, and shared confidence.', emotionalTone: 'Reflection, togetherness, satisfaction', visualFocus: 'Completed week, carried-forward tasks, family goal celebration, or reset summary connecting prior scenes.', minimumDurationMs: 12000, preferredDurationMs: 14000, maximumDurationMs: 15000, transition: { type: 'dissolve', pacing: 'slow-warm', durationMs: 1600 }, cameraPacing: 'Move slower than every earlier scene, with extra breathing room and the longest pauses on completion state.', touchGestures: ['One calm, slow tap to complete or acknowledge the reset moment if available; otherwise no touch.'], interactionSequence: ['Show the same week closing', 'Acknowledge or complete the reset moment if available', 'Hold on completion or ready-for-next-week state'], audioEvents: ['ChapterStarted', 'TouchStarted', 'TouchCompleted', 'weekly reset complete', 'ChapterCompleted'], expectedFinalState: 'Weekly Reset communicates the family gently finishing the same week together and feeling ready.', directorNotes: 'Weekly Reset is the emotional climax. Use the slowest movement, slowest touch, longest pause, and longest transition.', timing: { initialHoldMs: 1700, postActionHoldMs: 1300, completionHoldMs: 2200, postSceneHoldMs: 1200 }, scenePacing: { pauseMultiplier: 1.45, movementMultiplier: 0.72, transitionMultiplier: 1.55 }, actions: [action('show-week-closing', 'pause', 'Show the same week closing with traces of swimming preparation, Filmavond, Koekjes bakken, shopping, appreciation, and helpful moments.', { holdMs: 1800 }), action('acknowledge-reset', 'touch', 'Acknowledge or complete the reset moment if available.', { optional: true, hesitationMs: 260, holdAfterMs: 1400, gesturePacing: 'slowest' }), action('hold-ready-state', 'pause', 'Hold on completion or ready-for-next-week state.', { holdMs: 2200 })] })]) },
    { id: 'outro', narrativeStep: 'closing', scenes: Object.freeze([scene({ id: 'outro', fixture: 'visual-marketing-home', title: 'FamilyBoard', subtitle: 'Everyday family life, a little easier', purpose: 'Close with the same calm clarity as the opening, enriched by the story of the week.', narrativeRole: 'Return home after planning, helping, errands, appreciation, and reset: the family is ready together.', emotionalTone: 'Calm, warm, complete', visualFocus: 'Home dashboard, then a simple brand card.', minimumDurationMs: 5000, preferredDurationMs: 7000, maximumDurationMs: 7000, transition: { type: 'fade', sequence: ['home', 'brand-card', 'black'] }, cameraPacing: 'Return Home and hold briefly; fade to centered brand card; hold about two seconds; fade to black.', touchGestures: ['None'], interactionSequence: ['Return Home', 'Hold the dashboard briefly', 'Fade to brand card: FamilyBoard / Everyday family life, a little easier.', 'Hold approximately two seconds', 'Fade to black'], audioEvents: ['ChapterStarted', 'ChapterCompleted', 'RecordingFinished'], expectedFinalState: 'Brand card holds briefly, then fades to black.', directorNotes: 'End together. Do not add calls to action, feature claims, buttons, URLs, or a final interaction.', timing: { homeHoldMs: 1300, brandCardHoldMs: 2000, finalFadeMs: 900 }, actions: [action('return-home', 'pause', 'Return Home.', { holdMs: 1000 }), action('hold-dashboard', 'pause', 'Hold the updated Home dashboard briefly before the brand card.', { holdMs: 1000 }), action('fade-brand-card', 'pause', 'Fade to brand card: FamilyBoard / Everyday family life, a little easier.', { transitionMs: 500 }), action('hold-brand-card', 'pause', 'Hold approximately two seconds.', { holdMs: 1300 }), action('fade-to-black', 'pause', 'Fade to black.', { transitionMs: 500 })] })]) },
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
