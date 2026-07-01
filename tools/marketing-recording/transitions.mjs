import { ensureRecordingOverlayRoot } from './overlays.mjs';

const transitionStyles = Object.freeze({
  fade: { background: '#f8f1e8', opacity: 1 },
  crossfade: { background: 'rgba(248,241,232,.92)', opacity: 1 },
  dissolve: { background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,.95), rgba(248,241,232,.96) 54%, rgba(236,224,210,.98))', opacity: 1 },
});

export async function runTransition(page, transition = { type: 'fade' }, fn = async () => {}, options = {}) {
  await ensureRecordingOverlayRoot(page);
  const durationMs = transition.durationMs ?? 650;
  const style = transitionStyles[transition.type] ?? transitionStyles.fade;
  await page.evaluate(({ durationMs, style }) => {
    const root = document.getElementById('familyboard-recording-overlays');
    const el = document.createElement('div');
    el.className = 'fb-transition';
    el.style.setProperty('--transition-duration', `${durationMs}ms`);
    el.style.background = style.background;
    root.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = style.opacity;
      el.classList.add('is-visible');
    });
  }, { durationMs, style });
  await page.waitForTimeout(durationMs);
  await options.onCovered?.();
  await fn();
  await ensureRecordingOverlayRoot(page);
  await options.beforeReveal?.();
  await page.evaluate(() => document.querySelector('.fb-transition')?.classList.remove('is-visible'));
  await page.waitForTimeout(durationMs);
  await page.evaluate(() => document.querySelector('.fb-transition')?.remove());
  await ensureRecordingOverlayRoot(page);
}
