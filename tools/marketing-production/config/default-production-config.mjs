import { productionConfig } from './production-config.mjs';
import { timingConfig } from './timing-config.mjs';
import { audioConfig } from './audio-config.mjs';
import { exportConfig } from './export-config.mjs';
import { cleanupConfig } from './cleanup-config.mjs';
import { createProductionRunContext } from './production-mode.mjs';

export function createDefaultProductionConfig({ mode = 'validation', timestamp } = {}) {
  const run = createProductionRunContext({ mode, timestamp });
  const exportSettings = Object.freeze({
    ...exportConfig,
    outputPath: run.publishedOutputPath ?? exportConfig.outputPath,
  });
  const cleanupSettings = Object.freeze({
    ...cleanupConfig,
    removeIntermediateFiles: run.mode === 'validation',
    retentionDecision: run.mode === 'publish' ? 'retain-published-mp4' : 'remove-temporary-mp4',
  });
  return Object.freeze({
    ...productionConfig,
    productionMode: run.mode,
    productionTimestamp: run.timestamp,
    timing: timingConfig,
    audio: audioConfig,
    export: exportSettings,
    video: Object.freeze({
      resolution: exportSettings.resolution,
      frameRate: exportSettings.frameRate,
      codec: exportSettings.videoCodecLabel,
      container: exportSettings.container,
    }),
    cleanup: cleanupSettings,
  });
}

export const defaultProductionConfig = createDefaultProductionConfig();

function validateNumber(errors, value, key) {
  if (!Number.isFinite(value)) errors.push(`${key} is required.`);
}

function validateBoolean(errors, value, key) {
  if (typeof value !== 'boolean') errors.push(`${key} must be boolean.`);
}

export function validateProductionConfig(config = defaultProductionConfig) {
  const errors = [];
  if (!config.productionName) errors.push('productionName is required.');
  if (!['validation', 'publish'].includes(config.productionMode ?? 'validation')) errors.push('productionMode must be validation or publish.');
  if (!config.productionTimestamp) errors.push('productionTimestamp is required.');
  if (!config.storyboard?.modulePath) errors.push('storyboard.modulePath is required.');
  if (!config.storyboard?.exportName) errors.push('storyboard.exportName is required.');
  if (!config.runtime?.apiProject) errors.push('runtime.apiProject is required.');
  if (!config.runtime?.environment) errors.push('runtime.environment is required.');
  if (!config.runtime?.apiUrl) errors.push('runtime.apiUrl is required.');
  if (!config.runtime?.apiHealthPath) errors.push('runtime.apiHealthPath is required.');
  if (!config.runtime?.appUrl) errors.push('runtime.appUrl is required.');
  if (!config.runtime?.fixtureBaseUrl) errors.push('runtime.fixtureBaseUrl is required.');
  if (!config.runtime?.frontendDirectory) errors.push('runtime.frontendDirectory is required.');
  if (!config.runtime?.frontendHost) errors.push('runtime.frontendHost is required.');
  validateNumber(errors, config.runtime?.frontendPort, 'runtime.frontendPort');
  validateNumber(errors, config.runtime?.startupTimeoutMs, 'runtime.startupTimeoutMs');
  validateNumber(errors, config.runtime?.shutdownTimeoutMs, 'runtime.shutdownTimeoutMs');
  if (!config.output?.path) errors.push('output.path is required.');
  if (!config.output?.reportPath) errors.push('output.reportPath is required.');
  if (!config.output?.rawRecordingPath) errors.push('output.rawRecordingPath is required.');
  if (!config.output?.rawRecordingDirectory) errors.push('output.rawRecordingDirectory is required.');
  if (!config.output?.outputFileName) errors.push('output.outputFileName is required.');
  if (!config.toolchain?.directory) errors.push('toolchain.directory is required.');
  if (!config.toolchain?.playwrightPackage) errors.push('toolchain.playwrightPackage is required.');

  validateNumber(errors, config.timing?.global?.chapterCardDurationMs, 'timing.global.chapterCardDurationMs');
  validateNumber(errors, config.timing?.global?.defaultPageHoldMs, 'timing.global.defaultPageHoldMs');
  validateNumber(errors, config.timing?.global?.defaultPostActionHoldMs, 'timing.global.defaultPostActionHoldMs');
  validateNumber(errors, config.timing?.global?.defaultTransitionMultiplier, 'timing.global.defaultTransitionMultiplier');
  validateNumber(errors, config.timing?.global?.defaultTouchHesitationMs, 'timing.global.defaultTouchHesitationMs');
  validateNumber(errors, config.timing?.interactionTypes?.tapDelayMs, 'timing.interactionTypes.tapDelayMs');
  validateNumber(errors, config.timing?.interactionTypes?.swipeMultiplier, 'timing.interactionTypes.swipeMultiplier');
  validateNumber(errors, config.timing?.interactionTypes?.longPressDelayMs, 'timing.interactionTypes.longPressDelayMs');

  validateBoolean(errors, config.audio?.enabled, 'audio.enabled');
  if (!config.audio?.workspacePath) errors.push('audio.workspacePath is required.');
  if (!config.audio?.placeholderAssetDirectory) errors.push('audio.placeholderAssetDirectory is required.');
  if (!config.audio?.mixedAudioPath) errors.push('audio.mixedAudioPath is required.');
  validateNumber(errors, config.audio?.sampleRate, 'audio.sampleRate');
  validateBoolean(errors, config.audio?.musicEnabled, 'audio.musicEnabled');
  validateNumber(errors, config.audio?.musicVolume, 'audio.musicVolume');
  validateNumber(errors, config.audio?.soundEffectVolume, 'audio.soundEffectVolume');

  if (!config.export?.temporaryExportDirectory) errors.push('export.temporaryExportDirectory is required.');
  if (!config.export?.outputPath) errors.push('export.outputPath is required.');
  if (!config.export?.container) errors.push('export.container is required.');
  if (!config.export?.videoCodec) errors.push('export.videoCodec is required.');
  if (!config.export?.videoCodecLabel) errors.push('export.videoCodecLabel is required.');
  if (!config.export?.audioCodec) errors.push('export.audioCodec is required.');
  validateNumber(errors, config.export?.frameRate, 'export.frameRate');
  if (!Number.isFinite(config.export?.resolution?.width) || !Number.isFinite(config.export?.resolution?.height)) errors.push('export.resolution width and height are required.');
  if (!Array.isArray(config.export?.ffmpegPreferenceOrder) || config.export.ffmpegPreferenceOrder.length === 0) errors.push('export.ffmpegPreferenceOrder is required.');
  if (!config.export?.imageioFfmpegTarget) errors.push('export.imageioFfmpegTarget is required.');
  if (!config.export?.pythonExecutable) errors.push('export.pythonExecutable is required.');

  if (!Number.isFinite(config.video?.resolution?.width) || !Number.isFinite(config.video?.resolution?.height)) errors.push('video.resolution width and height are required.');
  validateNumber(errors, config.video?.frameRate, 'video.frameRate');
  if (!config.video?.codec) errors.push('video.codec is required.');
  if (!config.metadata?.path) errors.push('metadata.path is required.');
  if (!config.metadata?.timingPath) errors.push('metadata.timingPath is required.');
  if (!config.cleanup?.policy) errors.push('cleanup.policy is required.');
  validateBoolean(errors, config.cleanup?.removeIntermediateFiles, 'cleanup.removeIntermediateFiles');
  validateBoolean(errors, config.cleanup?.removeTemporaryRecordings, 'cleanup.removeTemporaryRecordings');
  validateBoolean(errors, config.cleanup?.removeTemporaryWavs, 'cleanup.removeTemporaryWavs');
  validateBoolean(errors, config.cleanup?.removeTemporaryBrowserProfiles, 'cleanup.removeTemporaryBrowserProfiles');
  validateBoolean(errors, config.cleanup?.removeTemporaryToolchain, 'cleanup.removeTemporaryToolchain');
  validateBoolean(errors, config.cleanup?.retainMetadata, 'cleanup.retainMetadata');
  validateBoolean(errors, config.cleanup?.retainTimingJson, 'cleanup.retainTimingJson');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
