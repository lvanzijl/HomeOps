import { timingProfiles } from './motion.mjs';

export class Camera {
  constructor(page, profile = timingProfiles.calm) {
    this.page = page;
    this.profile = profile;
  }
  async pause(ms = this.profile.pauseMs) { await this.page.waitForTimeout(ms); }
  async waitForAnimation(ms = this.profile.animationMs) { await this.page.waitForTimeout(ms); }
  async waitForTransition(ms = this.profile.transitionMs) { await this.page.waitForTimeout(ms); }
  async waitForIdle() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
    await this.page.evaluate(() => document.fonts?.ready).catch(() => undefined);
    await this.pause(220);
  }
}
