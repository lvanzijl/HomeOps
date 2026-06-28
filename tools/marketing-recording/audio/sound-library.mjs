import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const familyBoardSoundIds = Object.freeze(['tap','doubleTap','longPress','success','save','taskComplete','appreciation','celebration','transition','weeklyResetComplete']);

export const defaultSoundProfile = Object.freeze({
  id: 'familyboard-warm-placeholders',
  sounds: Object.freeze(Object.fromEntries(familyBoardSoundIds.map((id) => [id, { filePath: join(here, 'assets', `${id}.wav`), volume: id === 'celebration' ? 0.34 : 0.28 }])))
});

export class SoundLibrary {
  constructor({ profile = defaultSoundProfile, overrides = {} } = {}) { this.profile = profile; this.overrides = overrides; }
  getSound(id) {
    const sound = { ...(this.profile.sounds[id] ?? {}), ...(this.overrides[id] ?? {}) };
    if (!sound.filePath) throw new Error(`Unknown marketing audio sound: ${id}`);
    return Object.freeze({ id, ...sound });
  }
  addToTimeline(timeline, id, options = {}) { const sound = this.getSound(id); return timeline.addClip({ id: options.clipId, source: sound.filePath, startMs: options.startMs ?? 0, delayMs: options.delayMs ?? 0, volume: options.volume ?? sound.volume ?? 1, fadeInMs: options.fadeInMs ?? 0, fadeOutMs: options.fadeOutMs ?? 25, role: 'effect', metadata: { soundId: id, ...(options.metadata ?? {}) } }); }
}
