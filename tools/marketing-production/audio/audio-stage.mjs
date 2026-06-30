import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function createEventBus() {
  const subscribers = new Set();
  return Object.freeze({
    subscribe(handler) { subscribers.add(handler); return () => subscribers.delete(handler); },
    publish(type, payload = {}) { for (const handler of subscribers) handler({ type, ...payload }); },
  });
}

function createPlaceholderAudio(index, { sampleRate }) {
  const durationSeconds = 0.18 + (index % 4) * 0.035;
  const samples = new Float32Array(Math.round(durationSeconds * sampleRate));
  const frequency = 260 + index * 48;
  for (let i = 0; i < samples.length; i += 1) {
    const position = i / samples.length;
    const envelope = Math.sin(Math.PI * position) ** 1.6;
    const t = i / sampleRate;
    samples[i] = Math.sin(2 * Math.PI * frequency * t) * 0.22 * envelope;
  }
  return Object.freeze({ sampleRate, channels: 1, samples });
}

async function generatePlaceholderAssets({ assetDirectory, soundIds, writeWav, sampleRate }) {
  await mkdir(assetDirectory, { recursive: true });
  const generated = [];
  for (const [index, soundId] of soundIds.entries()) {
    const filePath = join(assetDirectory, `${soundId}.wav`);
    await writeWav(filePath, createPlaceholderAudio(index, { sampleRate }));
    generated.push(Object.freeze({ soundId, filePath }));
  }
  return Object.freeze(generated);
}

function buildSoundOverrides(generatedAssets, { volume }) {
  return Object.freeze(Object.fromEntries(generatedAssets.map((asset) => [asset.soundId, { filePath: asset.filePath, volume }])));
}

function publishRecordingPlanAudioEvents({ eventBus, recordingPlan, recordingEventTypes, setClock }) {
  let currentMs = 0;
  setClock(currentMs);
  eventBus.publish(recordingEventTypes.RecordingStarted, { storyboardId: recordingPlan.storyboardId });
  for (const scene of recordingPlan.orderedScenes) {
    setClock(currentMs);
    eventBus.publish(recordingEventTypes.TransitionStarted, { sceneId: scene.id, chapterId: scene.chapterId });
    setClock(currentMs + 250);
    eventBus.publish(recordingEventTypes.ChapterCompleted, { sceneId: scene.id, chapterId: scene.chapterId });
    const actionCount = scene.recording?.actionCount ?? 0;
    for (let index = 0; index < actionCount; index += 1) {
      const actionOffset = 500 + index * 280;
      setClock(currentMs + actionOffset);
      eventBus.publish(recordingEventTypes.ActionCompleted, { sceneId: scene.id, chapterId: scene.chapterId, actionId: `${scene.id}-action-${index + 1}` });
    }
    currentMs += scene.recording?.preferredDurationMs ?? 0;
  }
  setClock(currentMs);
  eventBus.publish(recordingEventTypes.RecordingFinished, { storyboardId: recordingPlan.storyboardId });
}

export async function runAudioStage(config, { recordingPlan, runtimeStatus, recordingStatus } = {}) {
  const status = {
    phase: 'audio',
    audioStarted: false,
    placeholderAssetsGenerated: false,
    generatedAssetCount: 0,
    soundtrackMixed: false,
    mixedAudioPath: undefined,
    audioFrameworkLoaded: false,
    workspacePath: config.audio?.workspacePath,
    failure: undefined,
  };

  try {
    if (config.audio?.enabled === false) throw new Error('Audio is disabled in production configuration.');
    if (!runtimeStatus?.started) throw new Error('Runtime stage must pass before audio can start.');
    if (!recordingStatus?.recordingCompleted) throw new Error('Recording stage must pass before audio can start.');
    if (!recordingPlan?.orderedScenes?.length) throw new Error('RecordingPlan is required before audio can start.');

    status.audioStarted = true;
    const audioModule = await import(new URL('../marketing-recording/audio/index.mjs', new URL('../', import.meta.url)).href);
    const eventsModule = await import(new URL('../marketing-recording/events.mjs', new URL('../', import.meta.url)).href);
    const wavModule = await import(new URL('../marketing-recording/audio/wav.mjs', new URL('../', import.meta.url)).href);
    status.audioFrameworkLoaded = true;

    const workspacePath = config.audio?.workspacePath ?? '/tmp/familyboard-marketing-audio';
    const assetDirectory = config.audio?.placeholderAssetDirectory ?? join(workspacePath, 'assets');
    const mixedAudioPath = config.audio?.mixedAudioPath ?? join(workspacePath, 'mix.wav');
    await mkdir(workspacePath, { recursive: true });

    const generatedAssets = await generatePlaceholderAssets({
      assetDirectory,
      soundIds: audioModule.familyBoardSoundIds,
      writeWav: wavModule.writeWav,
      sampleRate: config.audio?.sampleRate ?? wavModule.defaultSampleRate,
    });
    status.placeholderAssetsGenerated = true;
    status.generatedAssetCount = generatedAssets.length;

    let currentClockMs = 0;
    const setClock = (value) => { currentClockMs = value; };
    const eventBus = createEventBus();
    const audioConfig = audioModule.resolveMarketingAudioConfig({
      soundOverrides: buildSoundOverrides(generatedAssets, { volume: config.audio?.soundEffectVolume ?? 0.28 }),
      music: Object.freeze({ enabled: config.audio?.musicEnabled === true, volume: config.audio?.musicVolume ?? 0.18 }),
    });
    const director = audioModule.createMarketingAudioDirector({ eventBus, config: audioConfig, clock: () => currentClockMs });
    publishRecordingPlanAudioEvents({ eventBus, recordingPlan, recordingEventTypes: eventsModule.recordingEventTypes, setClock });
    director.stop();

    const mixed = await new audioModule.AudioMixer({ sampleRate: config.audio?.sampleRate ?? 48000, logger: undefined }).mix(director.timeline, { durationMs: recordingPlan.preferredDurationMs });
    const exportResult = await audioModule.exportMixedWav(mixedAudioPath, mixed);
    status.soundtrackMixed = existsSync(exportResult.filePath);
    status.mixedAudioPath = exportResult.filePath;
    status.workspacePath = workspacePath;
  } catch (error) {
    status.failure = Object.freeze({
      stage: 'audio',
      failingOperation: status.audioFrameworkLoaded ? 'audio-mix' : 'audio-framework-load',
      error: error.message,
      stack: error.stack,
    });
  }

  return Object.freeze({ status: Object.freeze(status) });
}
