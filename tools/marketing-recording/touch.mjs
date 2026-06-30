import { hideTouchPoint, moveTouchPoint, ripple, showTouchPoint } from './overlays.mjs';
import { movePointer, timingProfiles } from './motion.mjs';

export class TouchDriver {
  constructor(page, options = {}) { this.page = page; this.profile = options.profile ?? timingProfiles.calm; this.lastPoint = options.startPoint ?? { x: 160, y: 860 }; }
  async moveTo(point, options = {}) { await showTouchPoint(this.page, this.lastPoint); await movePointer(this.page, this.lastPoint, point, { ...options, profile: this.profile, onStep: (step) => moveTouchPoint(this.page, step) }); await moveTouchPoint(this.page, point); this.lastPoint = point; }
  async tap(point, options = {}) { await this.page.waitForTimeout(options.hesitationMs ?? this.profile.hesitationMs ?? 140); await this.moveTo(point, options); await this.page.waitForTimeout(options.settleMs ?? 90); await ripple(this.page, point, options.ripple); await this.page.mouse.click(point.x, point.y, { delay: options.downMs ?? this.profile.touchMs }); await this.page.waitForTimeout(options.afterMs ?? 320); }
  async doubleTap(point, options = {}) { await this.tap(point, options); await this.page.waitForTimeout(options.gapMs ?? 170); await this.tap(point, options); }
  async longPress(point, options = {}) { await this.page.waitForTimeout(options.hesitationMs ?? this.profile.hesitationMs ?? 140); await this.moveTo(point, options); await this.page.mouse.down(); await ripple(this.page, point, { durationMs: 620, size: 58, ...options.ripple }); await this.page.waitForTimeout(options.holdMs ?? 760); await this.page.mouse.up(); }
  async drag(from, to, options = {}) { await this.page.waitForTimeout(options.hesitationMs ?? this.profile.hesitationMs ?? 140); await this.moveTo(from, options); await this.page.mouse.down(); await movePointer(this.page, from, to, { ...options, profile: this.profile, onStep: (step) => moveTouchPoint(this.page, step) }); await moveTouchPoint(this.page, to); await this.page.mouse.up(); this.lastPoint = to; await this.page.waitForTimeout(options.afterMs ?? 300); }
  async swipe(from, to, options = {}) { await this.drag(from, to, { durationMs: options.durationMs ?? 540, curve: options.curve ?? .1, ...options }); }
  async scroll(point, deltaY, options = {}) { await this.page.waitForTimeout(options.hesitationMs ?? this.profile.hesitationMs ?? 140); await this.moveTo(point, options); await this.page.mouse.wheel(0, deltaY); await this.page.waitForTimeout(options.afterMs ?? 460); }
  async hide() { await hideTouchPoint(this.page); }
}
