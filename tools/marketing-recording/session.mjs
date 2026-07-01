import { Camera } from './camera.mjs';
import { installRecordingOverlays, showChapter } from './overlays.mjs';
import { TouchDriver } from './touch.mjs';
import { runTransition } from './transitions.mjs';
import { timingProfiles } from './motion.mjs';
import { createNoopEventBus, recordingEventTypes } from './events.mjs';


const fixtureWorkspaceTargets = Object.freeze({
  'visual-marketing-home': Object.freeze({ label: 'Thuis', title: 'Thuis', verification: 'home-dashboard' }),
  'visual-marketing-agenda': Object.freeze({ label: 'Agenda', title: 'Agenda', verificationLabel: 'Agenda widgets' }),
  'visual-marketing-tasks': Object.freeze({ label: 'Taken', title: 'Taken', verificationLabel: 'Takenpagina' }),
  'visual-marketing-shopping': Object.freeze({ label: 'Boodschappen', title: 'Boodschappen', verificationLabel: 'Boodschappen widgets' }),
  'visual-marketing-motivation': Object.freeze({ label: 'Motivatie', title: 'Motivatie', verificationLabel: 'Motivatiedashboard' }),
});

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

  async inspectRenderedSurface(scene = {}) {
    const pageHeading = await this.page.locator('#active-workspace-title').textContent().catch(() => undefined);
    const activeNavigationButton = await this.page.locator('[aria-current=page], .workspace-nav-button.active, .workspace-nav-button[aria-pressed=true]').first().textContent().catch(() => undefined);
    const articleLabel = await this.page.locator('.workspace-panel [aria-label]').first().getAttribute('aria-label').catch(() => undefined);
    return Object.freeze({
      sceneId: scene.id,
      fixture: scene.fixture,
      expectedWorkspace: this.expectedWorkspaceForFixture(scene.fixture),
      expectedUrl: this.appUrl,
      actualUrl: this.page.url(),
      activeWorkspace: articleLabel ?? pageHeading,
      activePageHeading: pageHeading,
      activeNavigationButton,
      timestamp: new Date().toISOString(),
    });
  }

  expectedWorkspaceForFixture(fixture) {
    if (fixture === 'visual-marketing-family') return 'Thomas';
    if (fixture === 'visual-marketing-weekly-reset') return 'Weekritueel';
    return fixtureWorkspaceTargets[fixture]?.title;
  }

  async verifyFixtureSurface(fixture) {
    if (fixture === 'visual-marketing-family') {
      await this.page.getByRole('heading', { name: 'Thomas', exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
      return;
    }
    if (fixture === 'visual-marketing-weekly-reset') {
      await this.page.getByRole('heading', { name: 'Weekritueel', exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
      return;
    }
    const target = fixtureWorkspaceTargets[fixture];
    if (!target) return;
    if (target.verification === 'home-dashboard') {
      await this.page.getByLabel('Gezinsleden', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
      return;
    }
    await this.page.locator('#active-workspace-title').filter({ hasText: target.title }).waitFor({ state: 'attached', timeout: 10000 });
    if (target.verificationLabel) await this.page.getByLabel(target.verificationLabel, { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async navigateToFixtureSurface(fixture) {
    if (fixture === 'visual-marketing-family') {
      const target = this.page.getByRole('heading', { name: 'Thomas', exact: true });
      if (!(await target.count())) {
        await this.page.getByLabel('Dagelijkse gezinsplekken', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
        await this.page.getByRole('button', { name: 'Thuis', exact: true }).click();
        await this.page.getByRole('button', { name: /Thomas gezinslidpagina openen/ }).click();
      }
      await this.page.getByRole('heading', { name: 'Thomas', exact: true }).first().waitFor({ state: 'visible' });
      await this.camera.waitForIdle();
      return;
    }

    if (fixture === 'visual-marketing-weekly-reset') {
      const target = this.page.getByRole('heading', { name: 'Weekritueel', exact: true });
      if (!(await target.count())) {
        await this.page.getByLabel('Dagelijkse gezinsplekken', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
        await this.page.getByRole('button', { name: 'Taken', exact: true }).click();
        await this.page.getByRole('button', { name: 'Gezinsreset openen', exact: true }).click();
      }
      await this.page.getByRole('heading', { name: 'Weekritueel', exact: true }).first().waitFor({ state: 'visible' });
      await this.camera.waitForIdle();
      return;
    }

    const target = fixtureWorkspaceTargets[fixture];
    if (!target) return;
    if (fixture === 'visual-marketing-home') {
      try {
        await this.page.getByLabel('Gezinsleden', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
        await this.camera.waitForIdle();
        return;
      } catch {}
    }
    const current = this.page.locator('#active-workspace-title').filter({ hasText: target.title });
    if (await current.count()) {
      await this.verifyFixtureSurface(fixture);
      await this.camera.waitForIdle();
      return;
    }
    await this.page.getByLabel('Dagelijkse gezinsplekken', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
    const navButton = this.page.getByRole('button', { name: target.label, exact: true });
    if (!(await navButton.count())) throw new Error(`Navigation target ${target.label} was not found for fixture ${fixture}.`);
    await navButton.first().click();
    await this.verifyFixtureSurface(fixture);
    await this.camera.waitForIdle();
  }
  async resetFixture(fixture) {
    const response = await this.page.request.post(`${this.fixtureBaseUrl}/api/visual-review-fixtures/${fixture}/reset`);
    if (!response.ok()) throw new Error(`Fixture reset failed for ${fixture}: ${response.status()}`);
  }
  async runScene(scene, options = {}) {
    const eventBus = options.eventBus ?? this.eventBus;
    eventBus.publish(recordingEventTypes.SceneStarted, { sceneId: scene.id, chapterId: scene.chapterId, fixture: scene.fixture });
    eventBus.publish(recordingEventTypes.TransitionStarted, { sceneId: scene.id, transition: scene.transition });
    await runTransition(this.page, scene.transition, async () => { await this.resetFixture(scene.fixture); await this.page.reload({ waitUntil: 'domcontentloaded' }); await this.navigateToFixtureSurface(scene.fixture); });
    eventBus.publish(recordingEventTypes.TransitionCompleted, { sceneId: scene.id, transition: scene.transition });
    await this.verifyFixtureSurface(scene.fixture);
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
    eventBus.publish(recordingEventTypes.SceneCompleted, { sceneId: scene.id, chapterId: scene.chapterId });
  }
  async run(scenes, options = {}) { for (const scene of scenes) await this.runScene(scene, options); }
  async stop() { await this.context?.close(); if (this.playwright && this.browser) await this.browser.close(); }
}
