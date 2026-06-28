export function defineScene(scene) {
  if (!scene?.id) throw new Error('Scene requires an id.');
  if (!scene.fixture) throw new Error(`Scene ${scene.id} requires a fixture.`);
  if (!scene.chapter?.title) throw new Error(`Scene ${scene.id} requires a chapter title.`);
  return Object.freeze({
    actions: [],
    transition: { type: 'fade' },
    durationHintMs: 5000,
    title: scene.chapter.title,
    subtitle: scene.chapter.subtitle,
    purpose: 'Unspecified recording purpose',
    emotionalTone: 'neutral',
    visualFocus: 'screen',
    minimumDurationMs: 1000,
    preferredDurationMs: scene.durationHintMs ?? 5000,
    maximumDurationMs: Math.max(scene.durationHintMs ?? 5000, 1000),
    ...scene,
  });
}
