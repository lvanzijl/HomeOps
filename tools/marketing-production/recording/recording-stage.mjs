import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { performance } from 'node:perf_hooks';

function runToolchainCommand(command, args, cwd) {
  return new Promise((resolveCommand, rejectCommand) => {
    execFile(command, args, { cwd, env: process.env }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        rejectCommand(error);
        return;
      }
      resolveCommand({ stdout, stderr });
    });
  });
}

async function ensureTemporaryToolchain(config) {
  const toolchainDirectory = config.toolchain?.directory ?? '/tmp/familyboard-marketing-tools';
  const playwrightPackage = config.toolchain?.playwrightPackage ?? 'playwright';
  await mkdir(toolchainDirectory, { recursive: true });
  const packageJsonPath = resolve(toolchainDirectory, 'package.json');
  if (!existsSync(packageJsonPath)) {
    await writeFile(packageJsonPath, JSON.stringify({ name: 'familyboard-marketing-tools', private: true, type: 'module' }, null, 2));
  }

  const requireFromToolchain = createRequire(packageJsonPath);
  try {
    requireFromToolchain.resolve(playwrightPackage);
  } catch {
    await runToolchainCommand('npm', ['install', '--no-save', playwrightPackage], toolchainDirectory);
    await runToolchainCommand('npx', ['playwright', 'install', 'chromium'], toolchainDirectory);
  }

  return Object.freeze({ toolchainDirectory, playwright: requireFromToolchain(playwrightPackage) });
}

function sceneTimingConfig(config, sceneId) {
  return Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1, ...(config.timing?.scenes?.[sceneId] ?? {}) });
}

function configuredActionHoldMs(config, sceneConfig, action) {
  const globalTiming = config.timing?.global ?? {};
  const interactionTiming = config.timing?.interactionTypes ?? {};
  const actionType = action.type ?? 'function';
  const fallbackHoldMs = actionType === 'touch'
    ? (interactionTiming.tapDelayMs ?? globalTiming.defaultPageHoldMs ?? 350)
    : (globalTiming.defaultPostActionHoldMs ?? globalTiming.defaultPageHoldMs ?? 350);
  const sourceHoldMs = action.resultHoldMs ?? action.holdMs ?? action.transitionMs ?? action.holdAfterMs ?? fallbackHoldMs;
  const touchHesitationMs = actionType === 'touch' ? (globalTiming.defaultTouchHesitationMs ?? 0) : 0;
  const swipeMultiplier = actionType === 'gesture' ? (interactionTiming.swipeMultiplier ?? 1) : 1;
  const longPressMs = actionType === 'long-press' ? (interactionTiming.longPressDelayMs ?? sourceHoldMs) : sourceHoldMs;
  return Math.max(1000, Math.round((longPressMs + touchHesitationMs + (sceneConfig.additionalHoldMs ?? 0)) * (sceneConfig.sceneMultiplier ?? 1) * swipeMultiplier));
}

function createRecordingScenes(recordingPlan, config) {
  return recordingPlan.executableScenes.map((scene) => {
    const sceneConfig = sceneTimingConfig(config, scene.id);
    const transitionMultiplier = (config.timing?.global?.defaultTransitionMultiplier ?? 1) * (sceneConfig.transitionMultiplier ?? 1);
    return Object.freeze({
      ...scene,
      transition: Object.freeze({ ...(scene.transition ?? {}), durationMs: Math.round((scene.transition?.durationMs ?? 0) * transitionMultiplier) }),
      chapter: Object.freeze({ ...(scene.chapter ?? {}), durationMs: sceneConfig.chapterCardDurationMs ?? config.timing?.global?.chapterCardDurationMs ?? scene.chapter?.durationMs ?? 1000 }),
      actions: Object.freeze((scene.actions ?? []).map((action) => {
        const originalExecute = typeof action.execute === 'function' ? action.execute : undefined;
        return Object.freeze({
          ...action,
          async execute(context) {
            if (originalExecute) await originalExecute(context);
            await context.page.waitForTimeout(configuredActionHoldMs(config, sceneConfig, action));
          },
        });
      })),
    });
  });
}

function defaultRawRecordingPath(config) {
  const safeName = config.productionName.replace(/[^a-z0-9._-]+/gi, '-').toLowerCase();
  return join(tmpdir(), `${safeName}.webm`);
}

async function persistRawRecording(video, rawRecordingPath) {
  if (!video) return undefined;
  const playwrightVideoPath = await video.path();
  if (!playwrightVideoPath || !existsSync(playwrightVideoPath)) return undefined;
  await mkdir(dirname(rawRecordingPath), { recursive: true });
  await copyFile(playwrightVideoPath, rawRecordingPath);
  return rawRecordingPath;
}

function roundMs(value) {
  return Math.round(value);
}

function createTimingRecorder(recordingPlan, configuredScenes) {
  const origin = performance.now();
  const configuredSceneById = new Map(configuredScenes.map((scene) => [scene.id, scene]));
  const plannedDurations = recordingPlan.orderedScenes.map((scene) => configuredSceneById.get(scene.id)?.preferredDurationMs ?? scene.recording?.preferredDurationMs ?? 0);
  const scenePlans = new Map(recordingPlan.orderedScenes.map((scene, index) => [scene.id, Object.freeze({
    index,
    plannedStartMs: plannedDurations.slice(0, index).reduce((total, duration) => total + duration, 0),
    plannedDurationMs: plannedDurations[index],
    transitionPlannedDurationMs: configuredSceneById.get(scene.id)?.transition?.durationMs ?? scene.transition?.durationMs ?? 0,
    chapterCardPlannedDurationMs: configuredSceneById.get(scene.id)?.chapter?.durationMs ?? scene.chapterCard?.holdApproxMs ?? 0,
  })]));
  const scenes = new Map();
  const transitions = new Map();
  const chapterCards = new Map();
  const actions = new Map();
  const sceneEntryMarkers = new Map();
  const dialogMarkers = [];
  let recordingStartMs;
  let recordingFinishMs;

  function now() {
    return roundMs(performance.now() - origin);
  }

  function ensureSceneEntry(sceneId) {
    if (!sceneEntryMarkers.has(sceneId)) sceneEntryMarkers.set(sceneId, { sceneId });
    return sceneEntryMarkers.get(sceneId);
  }

  function ensureScene(sceneId) {
    if (!scenes.has(sceneId)) {
      const plan = scenePlans.get(sceneId) ?? {};
      scenes.set(sceneId, {
        sceneId,
        plannedStartMs: plan.plannedStartMs ?? 0,
        plannedDurationMs: plan.plannedDurationMs ?? 0,
        actualStartMs: undefined,
        actualFinishMs: undefined,
        actualDurationMs: undefined,
        deltaMs: undefined,
      });
    }
    return scenes.get(sceneId);
  }

  const eventBus = Object.freeze({
    events: [],
    subscribe: () => () => undefined,
    publish(type, payload = {}) {
      const atMs = now();
      const event = Object.freeze({ type, atMs, ...payload });
      this.events.push(event);
      const sceneId = payload.sceneId;
      if (type === 'SceneStarted') {
        if (recordingStartMs === undefined) recordingStartMs = atMs;
        const scene = ensureScene(sceneId);
        scene.actualStartMs = atMs;
      }
      if (type === 'SceneCompleted') {
        const scene = ensureScene(sceneId);
        scene.actualFinishMs = atMs;
        scene.actualDurationMs = roundMs(scene.actualFinishMs - scene.actualStartMs);
        scene.deltaMs = roundMs(scene.actualDurationMs - scene.plannedDurationMs);
        recordingFinishMs = atMs;
      }
      if (type === 'TransitionStarted') transitions.set(sceneId, { sceneId, plannedDurationMs: scenePlans.get(sceneId)?.transitionPlannedDurationMs ?? 0, startMs: atMs });
      if (type === 'TransitionCompleted') {
        const transition = transitions.get(sceneId) ?? { sceneId, plannedDurationMs: scenePlans.get(sceneId)?.transitionPlannedDurationMs ?? 0 };
        transition.finishMs = atMs;
        transition.actualDurationMs = roundMs(transition.finishMs - transition.startMs);
        transitions.set(sceneId, transition);
      }
      if (type === 'ChapterStarted') chapterCards.set(sceneId, { sceneId, chapterId: payload.chapterId, plannedDurationMs: scenePlans.get(sceneId)?.chapterCardPlannedDurationMs ?? 0, startMs: atMs });
      if (type === 'ChapterCompleted') {
        const chapterCard = chapterCards.get(sceneId) ?? { sceneId, chapterId: payload.chapterId, plannedDurationMs: scenePlans.get(sceneId)?.chapterCardPlannedDurationMs ?? 0 };
        chapterCard.finishMs = atMs;
        chapterCard.actualDurationMs = roundMs(chapterCard.finishMs - chapterCard.startMs);
        chapterCards.set(sceneId, chapterCard);
      }
      const sceneEntryMarkerMap = Object.freeze({
        SceneEntryTransitionCoverStarted: 'transitionCoverStartMs',
        SceneEntryFixtureResetStarted: 'fixtureResetStartMs',
        SceneEntryFixtureResetCompleted: 'fixtureResetEndMs',
        SceneEntryReloadStarted: 'reloadStartMs',
        SceneEntryReloadCompleted: 'reloadEndMs',
        SceneEntryNavigationStarted: 'targetNavigationStartMs',
        SceneEntryNavigationCompleted: 'targetNavigationEndMs',
        SceneEntryTargetVerified: 'targetSurfaceVerifiedMs',
        SceneEntryVisibleRevealStarted: 'visibleRevealStartMs',
        FirstVisibleInteraction: 'firstVisibleInteractionMs',
      });
      if (sceneEntryMarkerMap[type]) {
        const marker = ensureSceneEntry(sceneId);
        marker[sceneEntryMarkerMap[type]] = atMs;
        if (type === 'FirstVisibleInteraction') marker.firstVisibleActionId = payload.actionId;
      }
      if (type === 'DialogOpenStarted' || type === 'DialogOpenVisible' || type === 'DialogSaveOrCancelClicked' || type === 'DialogCloseCompleted' || type === 'DialogResultVisible') {
        dialogMarkers.push(Object.freeze({ type, atMs, sceneId, actionId: payload.actionId, dialogId: payload.dialogId, phase: payload.phase }));
      }
      if (type === 'ActionStarted') actions.set(`${sceneId}:${payload.actionId}`, { sceneId, actionId: payload.actionId, actionType: payload.actionType, startMs: atMs });
      if (type === 'ActionCompleted') {
        const key = `${sceneId}:${payload.actionId}`;
        const action = actions.get(key) ?? { sceneId, actionId: payload.actionId, actionType: payload.actionType };
        action.finishMs = atMs;
        action.durationMs = roundMs(action.finishMs - action.startMs);
        actions.set(key, action);
      }
      return event;
    },
  });

  function snapshot() {
    const orderedScenes = recordingPlan.orderedScenes.map((scene) => Object.freeze({ ...ensureScene(scene.id) }));
    const totalDurationMs = orderedScenes.reduce((total, scene) => total + (scene.actualDurationMs ?? 0), 0);
    return Object.freeze({
      recordingStartMs: recordingStartMs ?? 0,
      recordingFinishMs: recordingFinishMs ?? recordingStartMs ?? 0,
      totalDurationMs,
      plannedDurationMs: plannedDurations.reduce((total, duration) => total + duration, 0),
      sceneCount: orderedScenes.length,
      scenes: Object.freeze(orderedScenes),
      transitions: Object.freeze(recordingPlan.orderedScenes.map((scene) => Object.freeze({ sceneId: scene.id, ...(transitions.get(scene.id) ?? { plannedDurationMs: scene.transition?.durationMs ?? 0, actualDurationMs: 0 }) }))),
      chapterCards: Object.freeze(recordingPlan.orderedScenes.map((scene) => Object.freeze({ sceneId: scene.id, chapterId: scene.chapterId, ...(chapterCards.get(scene.id) ?? { plannedDurationMs: scene.chapterCard?.holdApproxMs ?? 0, actualDurationMs: 0 }) }))),
      actions: Object.freeze([...actions.values()].map((action) => Object.freeze({ ...action }))),
      sceneEntryMarkers: Object.freeze(recordingPlan.orderedScenes.map((scene) => Object.freeze({ sceneId: scene.id, ...(sceneEntryMarkers.get(scene.id) ?? {}) }))),
      dialogMarkers: Object.freeze(dialogMarkers),
    });
  }

  return Object.freeze({ eventBus, snapshot });
}

export async function runRecordingStage(config, { recordingPlan, runtimeStatus, repoRoot = process.cwd() } = {}) {
  const status = {
    phase: 'recording',
    recordingStarted: false,
    recordingCompleted: false,
    rawRecordingPath: undefined,
    sceneCount: recordingPlan?.sceneCount ?? 0,
    completedSceneCount: 0,
    browserStarted: false,
    browserContextCreated: false,
    recordingSessionCreated: false,
    browserClosed: false,
    toolchainDirectory: undefined,
    toolchainReady: false,
    timingCaptured: false,
    timing: undefined,
    visualNavigation: [],
    visualNavigationScreenshotDirectory: undefined,
    failure: undefined,
  };

  let session;
  let video;
  let failingScene;
  let timingRecorder;
  const rawRecordingPath = config.output?.rawRecordingPath ?? defaultRawRecordingPath(config);
  const recordVideoDir = config.output?.rawRecordingDirectory ?? join(tmpdir(), 'homeops-marketing-recording');
  const visualNavigationScreenshotDirectory = join(tmpdir(), 'familyboard-recording-visual-navigation');

  try {
    if (!runtimeStatus?.started) throw new Error('Runtime stage must pass before recording can start.');
    if (!recordingPlan?.executableScenes?.length) throw new Error('RecordingPlan does not contain executable scenes.');

    const toolchain = await ensureTemporaryToolchain(config);
    status.toolchainDirectory = toolchain.toolchainDirectory;
    status.toolchainReady = true;
    const playwright = toolchain.playwright;
    const { RecordingSession } = await import(new URL('../marketing-recording/session.mjs', new URL('../', import.meta.url)).href);
    session = new RecordingSession({
      playwright,
      appUrl: config.runtime.appUrl,
      fixtureBaseUrl: config.runtime.fixtureBaseUrl,
      recordVideoDir,
    });
    status.recordingSessionCreated = true;

    await session.start();
    status.browserStarted = Boolean(session.browser);
    status.browserContextCreated = Boolean(session.context);
    video = session.page?.video();
    status.recordingStarted = true;

    const recordingScenes = createRecordingScenes(recordingPlan, config);
    timingRecorder = createTimingRecorder(recordingPlan, recordingScenes);
    const captureVisualNavigationScreenshots = config.recording?.captureVisualNavigationScreenshots === true;
    if (captureVisualNavigationScreenshots) {
      await mkdir(visualNavigationScreenshotDirectory, { recursive: true });
      status.visualNavigationScreenshotDirectory = visualNavigationScreenshotDirectory;
    }
    for (const scene of recordingScenes) {
      failingScene = scene.id;
      const sceneStart = new Date().toISOString();
      await session.runScene(scene, { storyboardId: recordingPlan.storyboardId, eventBus: timingRecorder.eventBus });
      const rendered = await session.inspectRenderedSurface(scene);
      let screenshotPath;
      if (captureVisualNavigationScreenshots) {
        screenshotPath = join(visualNavigationScreenshotDirectory, `${String(status.completedSceneCount + 1).padStart(2, '0')}-${scene.id}.png`);
        await session.page.screenshot({ path: screenshotPath, fullPage: false });
      }
      status.visualNavigation.push(Object.freeze({
        ...rendered,
        sceneStart,
        sceneCompletion: new Date().toISOString(),
        ...(screenshotPath ? { screenshotPath } : {}),
      }));
      status.completedSceneCount += 1;
    }

    status.recordingCompleted = status.completedSceneCount === recordingScenes.length;
    status.timing = timingRecorder.snapshot();
    status.timingCaptured = true;
    failingScene = undefined;
  } catch (error) {
    if (timingRecorder) status.timing = timingRecorder.snapshot();
    status.timingCaptured = Boolean(status.timing);
    status.failure = Object.freeze({
      stage: 'recording',
      failingScene,
      error: error.message,
      stack: error.stack,
    });
  } finally {
    try {
      await session?.stop();
      status.browserClosed = true;
    } catch (error) {
      status.browserClosed = false;
      status.failure = Object.freeze({
        stage: 'recording',
        failingScene,
        error: status.failure?.error ?? error.message,
        stack: status.failure?.stack ?? error.stack,
        shutdownError: error.message,
      });
    }
  }

  if (status.recordingStarted && video) {
    try {
      status.rawRecordingPath = await persistRawRecording(video, rawRecordingPath);
    } catch (error) {
      status.failure = Object.freeze({
        stage: 'recording',
        failingScene,
        error: status.failure?.error ?? error.message,
        stack: status.failure?.stack ?? error.stack,
        artifactError: error.message,
      });
    }
  }

  if (status.recordingCompleted && !status.rawRecordingPath) {
    status.failure = Object.freeze({ stage: 'recording', failingScene: undefined, error: 'Raw recording artifact was not produced.' });
  }

  return Object.freeze({ status: Object.freeze(status) });
}
