import { Camera } from './camera.mjs';
import { installRecordingOverlays, showChapter } from './overlays.mjs';
import { TouchDriver } from './touch.mjs';
import { runTransition } from './transitions.mjs';
import { timingProfiles } from './motion.mjs';
import { createNoopEventBus, recordingEventTypes } from './events.mjs';

export const tabletLandscapeViewport = Object.freeze({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

export class RecordingSession {
  constructor({ browser, playwright, appUrl, fixtureBaseUrl, viewport = tabletLandscapeViewport, profile = timingProfiles.warm, recordVideoDir } = {}) {
    this.browser = browser; this.playwright = playwright; this.appUrl = appUrl; this.fixtureBaseUrl = fixtureBaseUrl; this.viewport = viewport; this.profile = profile; this.recordVideoDir = recordVideoDir; this.eventBus = createNoopEventBus();
  }
  async start() {
    if (!this.browser && this.playwright) this.browser = await this.playwright.chromium.launch({ headless: true });
    this.context = await this.browser.newContext({ viewport: this.viewport, recordVideo: this.recordVideoDir ? { dir: this.recordVideoDir, size: { width: 1920, height: 1080 } } : undefined });
    this.page = await this.context.newPage();
    this.camera = new Camera(this.page, this.profile);
    this.touch = new TouchDriver(this.page, { profile: this.profile });
    await this.page.goto(this.appUrl, { waitUntil: 'domcontentloaded' });
    await installRecordingOverlays(this.page);
    await this.camera.waitForIdle();
    return this;
  }
  async resetFixture(fixture) {
    const response = await this.page.request.post(`${this.fixtureBaseUrl}/api/visual-review-fixtures/${fixture}/reset`);
    if (!response.ok()) throw new Error(`Fixture reset failed for ${fixture}: ${response.status()}`);
  }
  async runScene(scene, options = {}) {
    const eventBus = options.eventBus ?? this.eventBus;
    eventBus.publish(recordingEventTypes.SceneStarted, { sceneId: scene.id, chapterId: scene.chapterId, fixture: scene.fixture });
    eventBus.publish(recordingEventTypes.TransitionStarted, { sceneId: scene.id, transition: scene.transition });
    await runTransition(this.page, scene.transition, async () => { await this.resetFixture(scene.fixture); await this.page.reload({ waitUntil: 'domcontentloaded' }); });
    eventBus.publish(recordingEventTypes.TransitionCompleted, { sceneId: scene.id, transition: scene.transition });
    await this.camera.waitForIdle();
    eventBus.publish(recordingEventTypes.ChapterStarted, { sceneId: scene.id, chapterId: scene.chapterId, chapter: scene.chapter });
    await showChapter(this.page, scene.chapter, scene.chapter);
    eventBus.publish(recordingEventTypes.ChapterCompleted, { sceneId: scene.id, chapterId: scene.chapterId });
    for (const action of scene.actions) {
      const actionId = action.id ?? action.name ?? 'anonymous-action';
      const actionType = action.type ?? 'function';
      eventBus.publish(recordingEventTypes.ActionStarted, { sceneId: scene.id, actionId, actionType });
      if (actionType === 'touch') eventBus.publish(recordingEventTypes.TouchStarted, { sceneId: scene.id, actionId });
      if (actionType === 'gesture') eventBus.publish(recordingEventTypes.GestureStarted, { sceneId: scene.id, actionId });
      if (typeof action === 'function') await action({ page: this.page, camera: this.camera, touch: this.touch, scene, eventBus });
      else if (typeof action.execute === 'function') await action.execute({ page: this.page, camera: this.camera, touch: this.touch, scene, eventBus });
      if (actionType === 'gesture') eventBus.publish(recordingEventTypes.GestureCompleted, { sceneId: scene.id, actionId });
      if (actionType === 'touch') eventBus.publish(recordingEventTypes.TouchCompleted, { sceneId: scene.id, actionId });
      eventBus.publish(recordingEventTypes.ActionCompleted, { sceneId: scene.id, actionId, actionType });
    }
    await this.touch.hide();
    await this.camera.pause(Math.max(300, scene.durationHintMs * 0.12));
    eventBus.publish(recordingEventTypes.SceneCompleted, { sceneId: scene.id, chapterId: scene.chapterId });
  }
  async run(scenes, options = {}) { for (const scene of scenes) await this.runScene(scene, options); }
  async stop() { await this.context?.close(); if (this.playwright && this.browser) await this.browser.close(); }
}
