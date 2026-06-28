import { Camera } from './camera.mjs';
import { installRecordingOverlays, showChapter } from './overlays.mjs';
import { TouchDriver } from './touch.mjs';
import { runTransition } from './transitions.mjs';
import { timingProfiles } from './motion.mjs';

export const tabletLandscapeViewport = Object.freeze({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

export class RecordingSession {
  constructor({ browser, playwright, appUrl, fixtureBaseUrl, viewport = tabletLandscapeViewport, profile = timingProfiles.warm, recordVideoDir } = {}) {
    this.browser = browser; this.playwright = playwright; this.appUrl = appUrl; this.fixtureBaseUrl = fixtureBaseUrl; this.viewport = viewport; this.profile = profile; this.recordVideoDir = recordVideoDir;
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
  async runScene(scene) {
    await runTransition(this.page, scene.transition, async () => { await this.resetFixture(scene.fixture); await this.page.reload({ waitUntil: 'domcontentloaded' }); });
    await this.camera.waitForIdle();
    await showChapter(this.page, scene.chapter, scene.chapter);
    for (const action of scene.actions) await action({ page: this.page, camera: this.camera, touch: this.touch, scene });
    await this.touch.hide();
    await this.camera.pause(Math.max(300, scene.durationHintMs * 0.12));
  }
  async run(scenes) { for (const scene of scenes) await this.runScene(scene); }
  async stop() { await this.context?.close(); if (this.playwright && this.browser) await this.browser.close(); }
}
