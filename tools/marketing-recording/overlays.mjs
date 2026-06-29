const OVERLAY_ID = 'familyboard-recording-overlays';
const OVERLAY_STYLE_ID = `${OVERLAY_ID}-styles`;

function recordingOverlayStyles(id) {
  return `
    #${id} { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    .fb-touch-point { position: absolute; width: var(--touch-size); height: var(--touch-size); border-radius: 999px; background: rgba(255,255,255,.62); box-shadow: 0 0 26px rgba(255,255,255,.38); opacity: 0; transform: translate(-50%, -50%) scale(.82); transition: opacity 180ms ease, transform 260ms cubic-bezier(.22,.61,.36,1), left 80ms linear, top 80ms linear; }
    .fb-touch-point.is-visible { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    .fb-ripple { position: absolute; width: var(--ripple-size); height: var(--ripple-size); border: 2px solid rgba(255,255,255,.44); border-radius: 999px; opacity: .56; transform: translate(-50%, -50%) scale(.55); animation: fb-ripple var(--ripple-duration) ease-out forwards; }
    @keyframes fb-ripple { to { opacity: 0; transform: translate(-50%, -50%) scale(1.55); } }
    .fb-chapter { position: absolute; max-width: 560px; padding: 22px 26px; border-radius: 28px; background: rgba(31,41,55,.58); color: white; backdrop-filter: blur(18px); box-shadow: 0 22px 70px rgba(15,23,42,.18); opacity: 0; transform: translateY(14px); transition: opacity 420ms ease, transform 520ms cubic-bezier(.22,.61,.36,1); }
    .fb-chapter.is-visible { opacity: 1; transform: translateY(0); }
    .fb-chapter-title { font-size: 28px; line-height: 1.1; font-weight: 760; letter-spacing: -.02em; }
    .fb-chapter-subtitle { margin-top: 8px; font-size: 16px; line-height: 1.45; color: rgba(255,255,255,.82); }
    .fb-transition { position: absolute; inset: 0; background: #f8f1e8; opacity: 0; transition: opacity var(--transition-duration) ease; }
    .fb-transition.is-visible { opacity: 1; }
  `;
}

export async function ensureRecordingOverlayRoot(page, options = {}) {
  const touchSize = options.touchSize ?? 34;
  await page.evaluate(({ id, styleId, styles, touchSize }) => {
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = styles;
      document.head.appendChild(style);
    }

    let root = document.getElementById(id);
    if (!root) {
      root = document.createElement('div');
      root.id = id;
      document.body.appendChild(root);
    }
    root.style.setProperty('--touch-size', `${touchSize}px`);
  }, { id: OVERLAY_ID, styleId: OVERLAY_STYLE_ID, styles: recordingOverlayStyles(OVERLAY_ID), touchSize });
}

export async function installRecordingOverlays(page, options = {}) {
  await ensureRecordingOverlayRoot(page, options);
}

export async function showTouchPoint(page, point) {
  await ensureRecordingOverlayRoot(page);
  await page.evaluate(({ id, point }) => {
    const root = document.getElementById(id);
    let el = root.querySelector('.fb-touch-point');
    if (!el) {
      el = document.createElement('div');
      el.className = 'fb-touch-point';
      root.appendChild(el);
    }
    el.style.left = `${point.x}px`;
    el.style.top = `${point.y}px`;
    requestAnimationFrame(() => el.classList.add('is-visible'));
  }, { id: OVERLAY_ID, point });
}

export async function moveTouchPoint(page, point) {
  await ensureRecordingOverlayRoot(page);
  await page.evaluate(({ id, point }) => {
    const el = document.getElementById(id)?.querySelector('.fb-touch-point');
    if (el) { el.style.left = `${point.x}px`; el.style.top = `${point.y}px`; }
  }, { id: OVERLAY_ID, point });
}

export async function hideTouchPoint(page) {
  await ensureRecordingOverlayRoot(page);
  await page.evaluate((id) => document.getElementById(id)?.querySelector('.fb-touch-point')?.classList.remove('is-visible'), OVERLAY_ID);
}

export async function ripple(page, point, options = {}) {
  await ensureRecordingOverlayRoot(page);
  await page.evaluate(({ id, point, options }) => {
    const root = document.getElementById(id);
    const el = document.createElement('div');
    el.className = 'fb-ripple';
    el.style.left = `${point.x}px`;
    el.style.top = `${point.y}px`;
    el.style.setProperty('--ripple-size', `${options.size ?? 46}px`);
    el.style.setProperty('--ripple-duration', `${options.durationMs ?? 420}ms`);
    root.appendChild(el);
    window.setTimeout(() => el.remove(), options.durationMs ?? 420);
  }, { id: OVERLAY_ID, point, options });
}

export async function showChapter(page, chapter, options = {}) {
  await ensureRecordingOverlayRoot(page);
  const position = options.position ?? 'lower-left';
  const durationMs = options.durationMs ?? 1800;
  await page.evaluate(({ id, chapter, position }) => {
    const root = document.getElementById(id);
    const el = document.createElement('div');
    el.className = 'fb-chapter';
    const positions = {
      'lower-left': 'left: 72px; bottom: 72px;',
      'lower-right': 'right: 72px; bottom: 72px;',
      'upper-left': 'left: 72px; top: 72px;',
      'upper-right': 'right: 72px; top: 72px;'
    };
    el.style.cssText += positions[position] ?? positions['lower-left'];
    el.innerHTML = `<div class="fb-chapter-title"></div>${chapter.subtitle ? '<div class="fb-chapter-subtitle"></div>' : ''}`;
    el.querySelector('.fb-chapter-title').textContent = chapter.title;
    if (chapter.subtitle) el.querySelector('.fb-chapter-subtitle').textContent = chapter.subtitle;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
  }, { id: OVERLAY_ID, chapter, position });
  await page.waitForTimeout(durationMs);
  await page.evaluate((id) => {
    const el = document.getElementById(id)?.querySelector('.fb-chapter');
    el?.classList.remove('is-visible');
    window.setTimeout(() => el?.remove(), 560);
  }, OVERLAY_ID);
}
