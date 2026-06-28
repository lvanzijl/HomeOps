export function defineScene(scene) {
  if (!scene?.id) throw new Error('Scene requires an id.');
  if (!scene.fixture) throw new Error(`Scene ${scene.id} requires a fixture.`);
  if (!scene.chapter?.title) throw new Error(`Scene ${scene.id} requires a chapter title.`);
  return Object.freeze({ actions: [], transition: { type: 'fade' }, durationHintMs: 5000, ...scene });
}
