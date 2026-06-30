export const timingProfiles = Object.freeze({
  calm: { pauseMs: 900, animationMs: 420, transitionMs: 700, touchMs: 300, hesitationMs: 130, speedPxPerSecond: 900 },
  warm: { pauseMs: 1200, animationMs: 520, transitionMs: 850, touchMs: 340, hesitationMs: 160, speedPxPerSecond: 760 },
  brisk: { pauseMs: 550, animationMs: 300, transitionMs: 480, touchMs: 250, hesitationMs: 110, speedPxPerSecond: 1080 },
});

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutSine(t) {
  return Math.sin((t * Math.PI) / 2);
}

export function curvedPath(from, to, options = {}) {
  const steps = options.steps ?? 28;
  const curve = options.curve ?? 0.18;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / distance, y: dx / distance };
  const bend = Math.min(distance * curve, options.maxBendPx ?? 120);

  return Array.from({ length: steps + 1 }, (_, index) => {
    const raw = index / steps;
    const eased = easeInOutCubic(raw);
    const arc = Math.sin(Math.PI * raw) * bend;
    return {
      x: from.x + dx * eased + normal.x * arc,
      y: from.y + dy * eased + normal.y * arc,
    };
  });
}

export async function movePointer(page, from, to, options = {}) {
  const profile = options.profile ?? timingProfiles.calm;
  const path = curvedPath(from, to, options);
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const durationMs = options.durationMs ?? Math.max(220, (distance / profile.speedPxPerSecond) * 1000);
  const waitMs = durationMs / Math.max(1, path.length - 1);

  for (const point of path) {
    await page.mouse.move(point.x, point.y);
    if (options.onStep) await options.onStep(point);
    await page.waitForTimeout(waitMs);
  }
}
