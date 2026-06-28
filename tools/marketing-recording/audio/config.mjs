export const defaultMarketingAudioConfig = Object.freeze({
  enabled: true,
  soundProfile: 'familyboard-warm-placeholders',
  soundDelayMs: 0,
  music: Object.freeze({ enabled: false, track: undefined, volume: 0.18, fadeInMs: 1200, fadeOutMs: 1800, trimStartMs: 0, trimEndMs: undefined, loop: true }),
  eventSounds: Object.freeze({}),
  soundOverrides: Object.freeze({}),
});

export function resolveMarketingAudioConfig(config = {}) {
  return { ...defaultMarketingAudioConfig, ...config, music: { ...defaultMarketingAudioConfig.music, ...(config.music ?? {}) }, eventSounds: { ...defaultMarketingAudioConfig.eventSounds, ...(config.eventSounds ?? {}) }, soundLibrary: { overrides: config.soundOverrides ?? {} } };
}
