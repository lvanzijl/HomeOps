import { MarketingDirector, marketingPacingProfiles } from '../director.mjs';

export const approvedTasksMarketingFixtures = Object.freeze([
  'visual-marketing-home',
  'visual-marketing-tasks',
]);

export const tasksMarketingEmotionalCurve = Object.freeze([
  'Calm',
  'Curiosity',
  'Recognition',
  'Confidence',
  'Relief',
  'Confidence',
  'Warmth',
  'Calm',
]);

function action(id, type, description, execute, metadata = {}) {
  return Object.freeze({ id, type, description, execute, ...metadata });
}

async function expectSingle(locator, label) {
  const count = await locator.count();
  if (count !== 1) throw new Error(`${label} expected exactly 1 match, found ${count}.`);
  await locator.waitFor({ state: 'visible' });
  return locator.first();
}

async function centerOf(locator, label) {
  const target = await expectSingle(locator, label);
  const box = await target.boundingBox();
  if (!box) throw new Error(`${label} is visible but has no bounding box.`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function tapLocator(touch, locator, label, options = {}) {
  const point = await centerOf(locator, label);
  await touch.tap(point, {
    hesitationMs: options.hesitationMs ?? 120,
    afterMs: options.afterMs ?? 220,
    downMs: options.downMs ?? 80,
    ripple: options.ripple,
  });
}

function tasksPage(page) {
  return page.getByRole('article', { name: 'Takenpagina', exact: true });
}

function taskCard(page, title) {
  return page.locator('.task-item').filter({ hasText: title }).first();
}

function taskAction(page, title, label) {
  return taskCard(page, title).getByRole('button', { name: label, exact: true }).first();
}

function taskHeading(page, title) {
  return page.getByRole('heading', { name: title, exact: true }).first();
}

async function hold(page, ms) {
  await page.waitForTimeout(ms);
}

async function clearSelection(page, touch) {
  await touch.tap({ x: 1864, y: 1000 }, { hesitationMs: 120, afterMs: 220, downMs: 70 });
  await page.waitForTimeout(150);
}

async function selectTask(page, touch, title, holdAfterMs = 850) {
  await tapLocator(touch, taskCard(page, title), `Task card ${title}`);
  await taskAction(page, title, 'Klaar').waitFor({ state: 'visible', timeout: 10000 }).catch(() => undefined);
  await page.waitForTimeout(160);
}

async function clickTaskButton(page, touch, title, label, holdAfterMs = 900) {
  await tapLocator(touch, taskAction(page, title, label), `${title} ${label} button`, { holdAfterMs });
  await page.waitForTimeout(220);
}

async function openCompletedHistory(page, touch) {
  const summary = page.locator('details.task-completed-history > summary').first();
  await tapLocator(touch, summary, 'Completed task history summary', { holdAfterMs: 900 });
  await page.locator('details.task-completed-history[open]').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => undefined);
  await page.waitForTimeout(220);
}

function pointForHeading(page, title) {
  return centerOf(taskHeading(page, title), `Task heading ${title}`);
}

function scene(id, fixture, title, subtitle, purpose, emotionalTone, visualFocus, minimumDurationMs, preferredDurationMs, maximumDurationMs, transition, actions) {
  return Object.freeze({
    id,
    fixture,
    title,
    subtitle,
    purpose,
    emotionalTone,
    visualFocus,
    minimumDurationMs,
    preferredDurationMs,
    maximumDurationMs,
    transition: Object.freeze(transition),
    actions: Object.freeze(actions),
  });
}

export const tasksMarketingVideoStoryboard = Object.freeze({
  id: 'tasks-marketing-video-v1',
  title: 'Tasks Marketing Video',
  emotionalCurve: tasksMarketingEmotionalCurve,
  chapters: Object.freeze([
    {
      id: 'home',
      narrativeStep: 'introduction',
      scenes: Object.freeze([
        scene(
          'home',
          'visual-marketing-home',
          'Home',
          'Today is already visible',
          'Show that the Home page already carries today\'s tasks before moving into the redesigned Tasks experience.',
          'Calm',
          'Home dashboard, today tasks, and the Tasks entry point',
          5000,
          6500,
          8000,
          { type: 'fade' },
          [
            action('hold-home', 'pause', 'Hold on the Home dashboard long enough for today\'s tasks to register.', async ({ page }) => {
              await hold(page, 120);
            }, { holdMs: 1600 }),
            action('go-to-tasks', 'touch', 'Navigate to the Tasks page.', async ({ page, touch }) => {
              await tapLocator(touch, page.getByRole('button', { name: 'Taken', exact: true }), 'Home Tasks navigation button', { hesitationMs: 180, afterMs: 220 });
              await tasksPage(page).waitFor({ state: 'visible', timeout: 10000 });
              await hold(page, 120);
            }, { holdAfterMs: 1000 }),
          ],
        ),
      ]),
    },
    {
      id: 'first-impression',
      narrativeStep: 'todays-family',
      scenes: Object.freeze([
        scene(
          'first-impression',
          'visual-marketing-tasks',
          'First Impression',
          'Wide today, quieter planning',
          'Open the redesigned Tasks page and let the new hierarchy settle on screen.',
          'Curious',
          'Wide Today column, narrower Tomorrow and This Week columns, and compact later/completed areas',
          5000,
          6500,
          8000,
          { type: 'crossfade' },
          [
            action('hold-first-impression', 'pause', 'Hold on the redesigned Tasks page so the layout and spacing can be absorbed.', async ({ page }) => {
              await hold(page, 120);
            }, { holdMs: 3200 }),
          ],
        ),
      ]),
    },
    {
      id: 'scan-speed',
      narrativeStep: 'family',
      scenes: Object.freeze([
        scene(
          'scan-speed',
          'visual-marketing-tasks',
          'Scan Speed',
          'Move gently across the page',
          'Show that the page is easy to scan without any clicks or changes.',
          'Recognition',
          'Task columns, card rhythm, and the reduced amount of visual noise',
          5000,
          6500,
          8000,
          { type: 'dissolve' },
          [
            action('glide-across-columns', 'gesture', 'Move the pointer across Today, Tomorrow, This Week, Later, and Completed.', async ({ page, touch }) => {
              for (const title of ['Vandaag', 'Morgen', 'Deze week', 'Later', 'Afgerond']) {
                const point = await pointForHeading(page, title);
                await touch.moveTo(point, { steps: 28 });
                await hold(page, 650);
              }
              await hold(page, 120);
            }, { holdMs: 700 }),
          ],
        ),
      ]),
    },
    {
      id: 'progressive-disclosure',
      narrativeStep: 'planning',
      scenes: Object.freeze([
        scene(
          'progressive-disclosure',
          'visual-marketing-tasks',
          'Progressive Disclosure',
          'Actions appear only when needed',
          'Click a task, show its actions, click away, and repeat with another task.',
          'Confidence',
          'Selected task state and the actions that appear only on demand',
          7000,
          9000,
          11000,
          { type: 'dissolve' },
          [
            action('select-zwemtas', 'touch', 'Select Zwemtas klaarzetten and reveal its actions.', async ({ page, touch }) => {
              await selectTask(page, touch, 'Zwemtas klaarzetten', 900);
            }, { holdAfterMs: 900 }),
            action('clear-zwemtas-selection', 'touch', 'Click outside to hide the actions again.', async ({ page, touch }) => {
              await clearSelection(page, touch);
            }, { holdAfterMs: 700 }),
            action('select-pasta', 'touch', 'Select Pasta saus uit vriezer halen and reveal its actions.', async ({ page, touch }) => {
              await selectTask(page, touch, 'Pasta saus uit vriezer halen', 900);
            }, { holdAfterMs: 900 }),
            action('clear-pasta-selection', 'touch', 'Click outside to hide the actions again.', async ({ page, touch }) => {
              await clearSelection(page, touch);
            }, { holdAfterMs: 700 }),
          ],
        ),
      ]),
    },
    {
      id: 'complete-task',
      narrativeStep: 'helping',
      scenes: Object.freeze([
        scene(
          'complete-task',
          'visual-marketing-tasks',
          'Complete Task',
          'One task visibly moves into done',
          'Select a task, press Complete, and reveal the result after the animation finishes.',
          'Relief',
          'Completion state, the calm move into Afgerond, and the completed history reveal',
          7000,
          9000,
          11000,
          { type: 'crossfade' },
          [
            action('select-complete-task', 'touch', 'Select Zwemtas klaarzetten before completing it.', async ({ page, touch }) => {
              await selectTask(page, touch, 'Zwemtas klaarzetten', 700);
            }, { holdAfterMs: 700 }),
            action('press-complete', 'touch', 'Press Complete.', async ({ page, touch }) => {
              await clickTaskButton(page, touch, 'Zwemtas klaarzetten', 'Klaar', 1100);
            }, { holdAfterMs: 1100 }),
            action('open-completed-history', 'touch', 'Open the completed task history so the move is easy to read.', async ({ page, touch }) => {
              await openCompletedHistory(page, touch);
            }, { holdAfterMs: 900 }),
          ],
        ),
      ]),
    },
    {
      id: 'move-to-tomorrow',
      narrativeStep: 'shopping',
      scenes: Object.freeze([
        scene(
          'move-to-tomorrow',
          'visual-marketing-tasks',
          'Move to Tomorrow',
          'Planning stays simple',
          'Select another task and move it to Tomorrow without friction.',
          'Confidence',
          'Tomorrow action, task movement, and the calmer planning column',
          6000,
          8000,
          10000,
          { type: 'dissolve' },
          [
            action('select-pasta-again', 'touch', 'Select Pasta saus uit vriezer halen.', async ({ page, touch }) => {
              await selectTask(page, touch, 'Pasta saus uit vriezer halen', 700);
            }, { holdAfterMs: 700 }),
            action('move-pasta-to-tomorrow', 'touch', 'Choose Tomorrow and wait for the task to move.', async ({ page, touch }) => {
              await clickTaskButton(page, touch, 'Pasta saus uit vriezer halen', 'Morgen', 1200);
            }, { holdAfterMs: 1200 }),
          ],
        ),
      ]),
    },
    {
      id: 'planning',
      narrativeStep: 'motivation',
      scenes: Object.freeze([
        scene(
          'planning',
          'visual-marketing-tasks',
          'Planning',
          'Tomorrow and This Week stay easy',
          'Briefly show that Tomorrow and This Week remain simple to plan.',
          'Warmth',
          'Tomorrow and This Week cards with a quick selected-card interaction',
          6000,
          8000,
          10000,
          { type: 'crossfade' },
          [
            action('select-tomorrow-task', 'touch', 'Select a Tomorrow task.', async ({ page, touch }) => {
              await selectTask(page, touch, 'Daycare forms checken', 850);
            }, { holdAfterMs: 850 }),
            action('clear-tomorrow-task', 'touch', 'Click outside to clear the selection.', async ({ page, touch }) => {
              await clearSelection(page, touch);
            }, { holdAfterMs: 700 }),
            action('select-this-week-task', 'touch', 'Select a This Week task.', async ({ page, touch }) => {
              await selectTask(page, touch, 'Father\'s Day pancake ingredients checken', 850);
            }, { holdAfterMs: 850 }),
            action('clear-this-week-task', 'touch', 'Click outside to clear the selection.', async ({ page, touch }) => {
              await clearSelection(page, touch);
            }, { holdAfterMs: 700 }),
          ],
        ),
      ]),
    },
    {
      id: 'hero-shot',
      narrativeStep: 'closing',
      scenes: Object.freeze([
        scene(
          'hero-shot',
          'visual-marketing-tasks',
          'Overall Dashboard',
          'Calm, modern, easy to understand',
          'End on a quiet idle Tasks dashboard that feels family-friendly and easy to scan.',
          'Calm',
          'The full redesigned Tasks dashboard at rest',
          5000,
          7000,
          9000,
          { type: 'fade' },
          [
            action('hold-hero-shot', 'pause', 'Hold the idle dashboard for the final hero shot.', async ({ page }) => {
              await hold(page, 120);
            }, { holdMs: 3800 }),
          ],
        ),
      ]),
    },
  ]),
});

export function validateTasksMarketingVideoStoryboard() {
  const director = new MarketingDirector({ pacingProfile: marketingPacingProfiles.calmMarketing });
  const directorValidation = director.validateStoryboard(tasksMarketingVideoStoryboard);
  const plan = director.createRecordingPlan(tasksMarketingVideoStoryboard);
  const scenes = plan.scenes;
  const warnings = [...directorValidation.warnings];

  if (scenes.length !== 8) warnings.push(`Expected 8 scenes, found ${scenes.length}.`);
  for (const scene of scenes) {
    if (!approvedTasksMarketingFixtures.includes(scene.fixture)) {
      warnings.push(`Scene ${scene.id} uses unsupported fixture ${scene.fixture}.`);
    }
  }

  return Object.freeze({ valid: warnings.length === 0, warnings: Object.freeze(warnings), sceneCount: scenes.length });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const validation = validateTasksMarketingVideoStoryboard();
  console.log(JSON.stringify(validation, null, 2));
  if (!validation.valid) process.exitCode = 1;
}
