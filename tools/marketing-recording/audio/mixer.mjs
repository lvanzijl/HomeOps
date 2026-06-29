import { readWav, createSilentBuffer, secondsToSamples } from './wav.mjs';

export class AudioMixer {
  constructor({ sampleRate = 48000, logger = console } = {}) { this.sampleRate = sampleRate; this.cache = new Map(); this.logger = logger; this.missingSources = new Set(); }
  async load(source) {
    if (!this.cache.has(source)) {
      this.cache.set(source, readWav(source).catch((error) => {
        if (error?.code === 'ENOENT') { this.warnMissingSource(source); return undefined; }
        throw error;
      }));
    }
    return this.cache.get(source);
  }
  warnMissingSource(source) { if (this.missingSources.has(source)) return; this.missingSources.add(source); this.logger?.warn?.(`Marketing audio source is missing at ${source}; skipping clip.`); }
  async mix(timeline, { durationMs } = {}) {
    const loaded = (await Promise.all(timeline.clips.map(async (clip) => [clip, await this.load(clip.source)]))).filter(([, audio]) => audio);
    const computedDurationMs = durationMs ?? loaded.reduce((max, [clip, audio]) => Math.max(max, clip.startMs + (clip.trimEndMs ?? (audio.samples.length / audio.sampleRate) * 1000)), 0);
    const output = createSilentBuffer(computedDurationMs / 1000, { sampleRate: this.sampleRate });
    for (const [clip, audio] of loaded) this.mixClip(output, audio, clip, computedDurationMs);
    return output;
  }
  mixClip(output, audio, clip, totalDurationMs) {
    const start = secondsToSamples(clip.startMs / 1000, output.sampleRate);
    const trimStart = secondsToSamples((clip.trimStartMs ?? 0) / 1000, audio.sampleRate);
    const requestedEndMs = clip.trimEndMs ?? ((audio.samples.length - trimStart) / audio.sampleRate) * 1000;
    const targetLength = secondsToSamples(Math.min(requestedEndMs, totalDurationMs - clip.startMs) / 1000, output.sampleRate);
    const fadeIn = secondsToSamples((clip.fadeInMs ?? 0) / 1000, output.sampleRate);
    const fadeOut = secondsToSamples((clip.fadeOutMs ?? 0) / 1000, output.sampleRate);
    const sourceLength = Math.max(1, audio.samples.length - trimStart);
    for (let index = 0; index < targetLength && start + index < output.samples.length; index += 1) {
      const sourceIndex = trimStart + (clip.loop ? index % sourceLength : index);
      if (sourceIndex >= audio.samples.length) break;
      let gain = clip.volume ?? 1;
      if (fadeIn > 0 && index < fadeIn) gain *= index / fadeIn;
      if (fadeOut > 0 && targetLength - index < fadeOut) gain *= Math.max(0, (targetLength - index) / fadeOut);
      output.samples[start + index] += audio.samples[sourceIndex] * gain;
    }
  }
}
