#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createDefaultProductionConfig, defaultProductionConfig, validateProductionConfig } from './config/default-production-config.mjs';
import { resolveProductionMode } from './config/production-mode.mjs';
import { createProductionPipeline, validateProductionPipeline } from './pipeline.mjs';
import { startRuntimeStage } from './runtime/runtime-stage.mjs';
import { runStoryboardStage } from './storyboard/storyboard-stage.mjs';
import { runRecordingStage } from './recording/recording-stage.mjs';
import { runAudioStage } from './audio/audio-stage.mjs';
import { runExportStage } from './export/export-stage.mjs';
import { runMetadataStage } from './metadata/metadata-stage.mjs';
import { runCleanupStage } from './cleanup/cleanup-stage.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

async function fileExists(relativePath) {
  const absolutePath = resolve(repoRoot, relativePath);
  await access(absolutePath);
  return absolutePath;
}

async function discoverExistingSystems() {
  const [recordingFramework, marketingDirector, audioFramework] = await Promise.all([
    fileExists('tools/marketing-recording/session.mjs'),
    fileExists('tools/marketing-recording/director.mjs'),
    fileExists('tools/marketing-recording/audio/index.mjs'),
  ]);
  return Object.freeze({ recordingFramework, marketingDirector, audioFramework });
}

export async function validateProductionEngine(config = defaultProductionConfig) {
  const configValidation = validateProductionConfig(config);
  const pipeline = createProductionPipeline();
  const pipelineValidation = validateProductionPipeline(pipeline);
  const systems = await discoverExistingSystems();
  const valid = configValidation.valid && pipelineValidation.valid;
  return Object.freeze({ productionName: config.productionName, valid, configValidation, pipelineValidation, systems, pipeline });
}

export async function runProductionEngine(config = defaultProductionConfig) {
  const validation = await validateProductionEngine(config);
  if (!validation.valid) {
    const result = Object.freeze({ ...validation, runtime: undefined, producedMovie: false, message: 'Marketing Production Engine validation failed before runtime startup. No browser, recording, audio generation, muxing, or media output was started.' });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return result;
  }

  const runtimeStage = await startRuntimeStage(config, { repoRoot });
  const storyboardStage = runtimeStage.status.started ? await runStoryboardStage(config) : Object.freeze({ status: Object.freeze({ phase: 'storyboard', loaded: false, validationPassed: false, marketingDirectorLoaded: false, recordingPlanGenerated: false, failure: Object.freeze({ message: 'Runtime stage failed before storyboard execution.' }) }), recordingPlan: undefined });
  const recordingStage = storyboardStage.status.recordingPlanGenerated ? await runRecordingStage(config, { recordingPlan: storyboardStage.recordingPlan, runtimeStatus: runtimeStage.status, repoRoot }) : Object.freeze({ status: Object.freeze({ phase: 'recording', recordingStarted: false, recordingCompleted: false, rawRecordingPath: undefined, sceneCount: storyboardStage.recordingPlan?.sceneCount ?? 0, completedSceneCount: 0, browserStarted: false, browserClosed: false, failure: Object.freeze({ message: 'Storyboard stage failed before recording execution.' }) }) });
  const audioStage = recordingStage.status.recordingCompleted ? await runAudioStage(config, { recordingPlan: storyboardStage.recordingPlan, runtimeStatus: runtimeStage.status, recordingStatus: recordingStage.status }) : Object.freeze({ status: Object.freeze({ phase: 'audio', audioStarted: false, placeholderAssetsGenerated: false, generatedAssetCount: 0, soundtrackMixed: false, mixedAudioPath: undefined, audioFrameworkLoaded: false, failure: Object.freeze({ message: 'Recording stage failed before audio execution.' }) }) });
  const exportStage = audioStage.status.soundtrackMixed ? await runExportStage(config, { runtimeStatus: runtimeStage.status, recordingStatus: recordingStage.status, audioStatus: audioStage.status, repoRoot }) : Object.freeze({ status: Object.freeze({ phase: 'export', exportStarted: false, exportCompleted: false, ffmpegResolved: false, rawVideoPath: recordingStage.status.rawRecordingPath, mixedAudioPath: audioStage.status.mixedAudioPath, outputPath: undefined, outputExists: false, failure: Object.freeze({ message: 'Audio stage failed before export execution.' }) }) });
  const metadataStage = exportStage.status.exportCompleted ? await runMetadataStage(config, { storyboardStatus: storyboardStage.status, recordingPlan: storyboardStage.recordingPlan, runtimeStatus: runtimeStage.status, recordingStatus: recordingStage.status, audioStatus: audioStage.status, exportStatus: exportStage.status }) : Object.freeze({ status: Object.freeze({ phase: 'metadata', metadataGenerated: false, metadataPath: config.metadata?.path, metadataLoaded: false, timingGenerated: false, timingPath: config.metadata?.timingPath, timingLoaded: false, failure: Object.freeze({ message: 'Export stage failed before metadata generation.' }) }) });
  const cleanupStage = metadataStage.status.metadataGenerated ? await runCleanupStage(config, { recordingStatus: recordingStage.status, audioStatus: audioStage.status, exportStatus: exportStage.status }) : Object.freeze({ status: Object.freeze({ phase: 'cleanup', cleanupStarted: false, cleanupCompleted: false, removedArtifacts: Object.freeze([]), remainingArtifacts: Object.freeze([]), failure: Object.freeze({ message: 'Metadata stage failed before cleanup.' }) }) });
  const runtimeShutdown = typeof runtimeStage.shutdown === 'function' ? await runtimeStage.shutdown() : runtimeStage.shutdown;
  const productionSucceeded = validation.valid && runtimeStage.status.started === true && storyboardStage.status.recordingPlanGenerated === true && recordingStage.status.recordingCompleted === true && Boolean(recordingStage.status.rawRecordingPath) && audioStage.status.soundtrackMixed === true && Boolean(audioStage.status.mixedAudioPath) && exportStage.status.exportCompleted === true && exportStage.status.outputExists === true && metadataStage.status.metadataLoaded === true && metadataStage.status.timingLoaded === true && cleanupStage.status.cleanupCompleted === true;
  const result = Object.freeze({
    ...validation,
    productionMode: config.productionMode,
    productionTimestamp: config.productionTimestamp,
    valid: productionSucceeded,
    runtime: Object.freeze({ ...runtimeStage.status, shutdown: runtimeShutdown }),
    storyboard: storyboardStage.status,
    recordingPlan: storyboardStage.recordingPlan,
    recording: recordingStage.status,
    audio: audioStage.status,
    export: exportStage.status,
    metadata: metadataStage.status,
    cleanup: cleanupStage.status,
    producedMovie: productionSucceeded && config.productionMode === 'publish',
    message: productionSucceeded
      ? (config.productionMode === 'publish'
        ? 'Marketing Production Engine ran in publish mode, retained the timestamped repository MP4, generated metadata with execution timing, and cleaned temporary production artifacts. No subjective review was performed.'
        : 'Marketing Production Engine ran in validation mode, generated metadata with execution timing, and cleaned temporary production artifacts including the temporary MP4. No final repository movie or subjective review was produced.')
      : `Marketing Production Engine ${config.productionMode ?? 'validation'} mode did not complete successfully. No subjective review was performed.`,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = resolveProductionMode();
  await runProductionEngine(createDefaultProductionConfig({ mode }));
}
