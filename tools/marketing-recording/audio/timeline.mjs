export class AudioTimeline {
  constructor({ sampleRate = 48000 } = {}) { this.sampleRate = sampleRate; this.clips = []; this.automation = []; }
  addClip({ id, source, startMs = 0, delayMs = 0, volume = 1, fadeInMs = 0, fadeOutMs = 0, trimStartMs = 0, trimEndMs, loop = false, role = 'effect', metadata = {} }) {
    const clip = Object.freeze({ id: id ?? `${role}-${this.clips.length + 1}`, source, startMs: startMs + delayMs, volume, fadeInMs, fadeOutMs, trimStartMs, trimEndMs, loop, role, metadata });
    this.clips.push(clip); return clip;
  }
  automateVolume({ targetId, atMs, volume, durationMs = 0 }) { const event = Object.freeze({ targetId, atMs, volume, durationMs }); this.automation.push(event); return event; }
  get durationMs() { return this.clips.reduce((max, clip) => Math.max(max, clip.startMs + (clip.trimEndMs ?? 0)), 0); }
  toJSON() { return { sampleRate: this.sampleRate, clips: this.clips, automation: this.automation }; }
}
