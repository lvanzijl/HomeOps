import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

function summarizeTiming(timing) {
  if (!timing) return undefined;
  return Object.freeze({
    timingPath: undefined,
    overallDurationMs: timing.totalDurationMs,
    sceneCount: timing.sceneCount,
    plannedDurationMs: timing.plannedDurationMs,
    actualDurationMs: timing.totalDurationMs,
  });
}

export async function runMetadataStage(config, { storyboardStatus, recordingPlan, runtimeStatus, recordingStatus, audioStatus, exportStatus } = {}) {
  const metadataPath = config.metadata?.path ?? '/tmp/familyboard-marketing-metadata.json';
  const timingPath = config.metadata?.timingPath ?? '/tmp/familyboard-marketing-timing.json';
  const status = {
    phase: 'metadata',
    metadataGenerated: false,
    metadataPath,
    metadataLoaded: false,
    timingGenerated: false,
    timingPath,
    timingLoaded: false,
    failure: undefined,
  };

  try {
    if (!exportStatus?.exportCompleted || !exportStatus.outputExists) throw new Error('Export stage must pass before metadata can be generated.');
    if (!recordingStatus?.timingCaptured || !recordingStatus.timing) throw new Error('Recording timing must be captured before metadata can be generated.');

    const timing = Object.freeze({
      productionName: config.productionName,
      storyboardId: recordingPlan?.storyboardId,
      recordingStartMs: recordingStatus.timing.recordingStartMs,
      recordingFinishMs: recordingStatus.timing.recordingFinishMs,
      totalDurationMs: recordingStatus.timing.totalDurationMs,
      plannedDurationMs: recordingStatus.timing.plannedDurationMs,
      sceneCount: recordingStatus.timing.sceneCount,
      scenes: recordingStatus.timing.scenes,
      transitions: recordingStatus.timing.transitions,
      chapterCards: recordingStatus.timing.chapterCards,
      actions: recordingStatus.timing.actions,
    });
    await mkdir(dirname(timingPath), { recursive: true });
    await writeFile(timingPath, `${JSON.stringify(timing, null, 2)}\n`);
    status.timingGenerated = true;
    JSON.parse(await readFile(timingPath, 'utf8'));
    status.timingLoaded = true;

    const timingSummary = summarizeTiming(timing);
    const metadata = Object.freeze({
      productionName: config.productionName,
      storyboard: Object.freeze({
        id: recordingPlan?.storyboardId,
        title: recordingPlan?.storyboardTitle,
        sceneCount: recordingPlan?.sceneCount,
        validationPassed: storyboardStatus?.validationPassed === true,
      }),
      runtime: Object.freeze({
        appUrl: config.runtime?.appUrl,
        apiUrl: config.runtime?.apiUrl,
        environment: config.runtime?.environment,
        started: runtimeStatus?.started === true,
      }),
      outputPath: exportStatus.outputPath,
      duration: Object.freeze({
        preferredDurationMs: recordingPlan?.preferredDurationMs,
        preferredDurationSeconds: recordingPlan?.preferredDurationSeconds,
      }),
      timing: Object.freeze({ ...timingSummary, timingPath }),
      resolution: Object.freeze({ ...(config.export?.resolution ?? config.video?.resolution) }),
      videoCodec: config.export?.videoCodecLabel ?? config.video?.codec,
      audioCodec: config.export?.audioCodec ?? 'aac',
      frameRate: config.export?.frameRate ?? config.video?.frameRate,
      recordingDateTime: new Date().toISOString(),
      ffmpegSource: exportStatus.ffmpegSource,
      productionSuccess: Boolean(runtimeStatus?.started && recordingStatus?.recordingCompleted && audioStatus?.soundtrackMixed && exportStatus?.exportCompleted),
    });

    await mkdir(dirname(metadataPath), { recursive: true });
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
    status.metadataGenerated = true;
    JSON.parse(await readFile(metadataPath, 'utf8'));
    status.metadataLoaded = true;
  } catch (error) {
    status.failure = Object.freeze({
      stage: 'metadata',
      error: error.message,
      stack: error.stack,
    });
  }

  return Object.freeze({ status: Object.freeze(status) });
}
