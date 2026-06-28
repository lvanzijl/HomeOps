export class MusicTrack {
  constructor({ id, filePath, volume = 0.18, fadeInMs = 1200, fadeOutMs = 1800, trimStartMs = 0, trimEndMs, loop = true } = {}) { Object.assign(this, { id, filePath, volume, fadeInMs, fadeOutMs, trimStartMs, trimEndMs, loop }); }
  addToTimeline(timeline, { startMs = 0, durationMs } = {}) { return timeline.addClip({ id: this.id ?? 'background-music', source: this.filePath, startMs, volume: this.volume, fadeInMs: this.fadeInMs, fadeOutMs: this.fadeOutMs, trimStartMs: this.trimStartMs, trimEndMs: durationMs, loop: this.loop, role: 'music' }); }
}
