import { defineScene } from './scene.mjs';

export const sampleRecordingScenes = [
  defineScene({
    id: 'recording-framework-smoke-home',
    fixture: 'visual-marketing-home',
    chapter: { title: 'A calm family morning', subtitle: 'Touch-first dashboard review', position: 'lower-left', durationMs: 1400 },
    transition: { type: 'fade', durationMs: 520 },
    durationHintMs: 4200,
    actions: [
      async ({ touch, camera }) => { await touch.tap({ x: 1530, y: 256 }); await camera.pause(500); },
      async ({ touch, camera }) => { await touch.swipe({ x: 1490, y: 812 }, { x: 1490, y: 520 }); await camera.waitForAnimation(); },
    ],
  }),
  defineScene({
    id: 'recording-framework-smoke-tasks',
    fixture: 'visual-marketing-tasks',
    chapter: { title: 'Small jobs, shared rhythm', position: 'lower-right', durationMs: 1300 },
    transition: { type: 'dissolve', durationMs: 620 },
    durationHintMs: 3800,
    actions: [
      async ({ touch, camera }) => { await touch.longPress({ x: 640, y: 520 }); await camera.pause(400); },
      async ({ touch }) => { await touch.doubleTap({ x: 1160, y: 475 }); },
    ],
  }),
];
