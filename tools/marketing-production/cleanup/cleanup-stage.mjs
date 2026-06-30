import { rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

async function removeArtifact(path, removedArtifacts) {
  if (!path || !existsSync(path)) return;
  await rm(path, { recursive: true, force: true });
  removedArtifacts.push(path);
}

function remaining(paths) {
  return [...new Set(paths)].filter((path) => path && existsSync(path));
}

async function discoverTemporaryBrowserProfiles() {
  const entries = await readdir(tmpdir(), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('playwright_chromiumdev_profile-'))
    .map((entry) => join(tmpdir(), entry.name));
}

export async function runCleanupStage(config, { recordingStatus, audioStatus, exportStatus } = {}) {
  const status = {
    phase: 'cleanup',
    cleanupStarted: false,
    cleanupCompleted: false,
    removedArtifacts: [],
    remainingArtifacts: [],
    failure: undefined,
  };

  const audioWorkspacePath = audioStatus?.mixedAudioPath
    ? dirname(audioStatus.mixedAudioPath)
    : (config.audio?.workspacePath ?? dirname(config.audio?.mixedAudioPath ?? '/tmp/familyboard-marketing-audio/mix.wav'));
  const artifacts = [];
  if (config.cleanup?.removeTemporaryRecordings === true) artifacts.push(recordingStatus?.rawRecordingPath, config.output?.rawRecordingDirectory);
  if (config.cleanup?.removeTemporaryWavs === true) artifacts.push(config.audio?.placeholderAssetDirectory, audioStatus?.mixedAudioPath, audioWorkspacePath);
  if (config.cleanup?.removeIntermediateFiles === true) artifacts.push(exportStatus?.outputPath);
  if (config.cleanup?.removeTemporaryToolchain === true) artifacts.push(config.toolchain?.directory);

  try {
    status.cleanupStarted = true;
    if (config.cleanup?.removeTemporaryBrowserProfiles === true) artifacts.push(...await discoverTemporaryBrowserProfiles());
    for (const artifact of [...new Set(artifacts)]) await removeArtifact(artifact, status.removedArtifacts);
    status.remainingArtifacts = remaining(artifacts);
    status.cleanupCompleted = status.remainingArtifacts.length === 0;
  } catch (error) {
    status.remainingArtifacts = remaining(artifacts);
    status.failure = Object.freeze({
      stage: 'cleanup',
      error: error.message,
      stack: error.stack,
    });
  }

  return Object.freeze({ status: Object.freeze({ ...status, removedArtifacts: Object.freeze(status.removedArtifacts), remainingArtifacts: Object.freeze(status.remainingArtifacts) }) });
}
