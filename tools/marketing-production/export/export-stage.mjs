import { access, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFile } from 'node:child_process';

function runCommand(command, args, options = {}) {
  return new Promise((resolveCommand, rejectCommand) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        rejectCommand(error);
        return;
      }
      resolveCommand({ stdout, stderr });
    });
  });
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveFromPath(command) {
  try {
    const result = await runCommand('which', [command]);
    return result.stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function resolveImageioFfmpeg(config) {
  const target = config.export?.imageioFfmpegTarget ?? '/tmp/homeops-imageio-ffmpeg';
  await mkdir(target, { recursive: true });
  const python = config.export?.pythonExecutable ?? 'python3';
  const script = 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())';
  const env = { ...process.env, PYTHONPATH: target };
  try {
    const result = await runCommand(python, ['-c', script], { env });
    return result.stdout.trim();
  } catch {
    await runCommand(python, ['-m', 'pip', 'install', '--target', target, 'imageio-ffmpeg'], { env: process.env });
    const result = await runCommand(python, ['-c', script], { env });
    return result.stdout.trim();
  }
}

async function resolveFfmpeg(config) {
  const preferenceOrder = config.export?.ffmpegPreferenceOrder ?? ['configured', 'path', 'imageio-ffmpeg'];
  for (const preference of preferenceOrder) {
    if (preference === 'configured' && config.export?.ffmpegExecutable && await fileExists(config.export.ffmpegExecutable)) return Object.freeze({ executable: config.export.ffmpegExecutable, source: 'configured' });
    if (preference === 'path') {
      const pathExecutable = await resolveFromPath('ffmpeg');
      if (pathExecutable) return Object.freeze({ executable: pathExecutable, source: 'path' });
    }
    if (preference === 'imageio-ffmpeg') {
      const imageioExecutable = await resolveImageioFfmpeg(config);
      if (imageioExecutable) return Object.freeze({ executable: imageioExecutable, source: 'imageio-ffmpeg' });
    }
  }
  return Object.freeze({ executable: undefined, source: undefined });
}

export async function runExportStage(config, { runtimeStatus, recordingStatus, audioStatus, repoRoot = process.cwd() } = {}) {
  const outputPath = resolve(repoRoot, config.export?.outputPath ?? 'docs/demo/familyboard-preview.mp4');
  const status = {
    phase: 'export',
    exportStarted: false,
    exportCompleted: false,
    ffmpegResolved: false,
    ffmpegExecutable: undefined,
    ffmpegSource: undefined,
    rawVideoPath: recordingStatus?.rawRecordingPath,
    mixedAudioPath: audioStatus?.mixedAudioPath,
    outputPath,
    outputExists: false,
    failure: undefined,
  };

  try {
    if (!runtimeStatus?.started) throw new Error('Runtime stage must pass before export can start.');
    if (!recordingStatus?.recordingCompleted || !recordingStatus.rawRecordingPath) throw new Error('Recording stage must produce raw video before export can start.');
    if (!audioStatus?.soundtrackMixed || !audioStatus.mixedAudioPath) throw new Error('Audio stage must produce mixed audio before export can start.');
    if (!await fileExists(recordingStatus.rawRecordingPath)) throw new Error(`Raw recording not found at ${recordingStatus.rawRecordingPath}.`);
    if (!await fileExists(audioStatus.mixedAudioPath)) throw new Error(`Mixed soundtrack not found at ${audioStatus.mixedAudioPath}.`);

    status.exportStarted = true;
    const ffmpeg = await resolveFfmpeg(config);
    status.ffmpegResolved = Boolean(ffmpeg.executable);
    status.ffmpegExecutable = ffmpeg.executable;
    status.ffmpegSource = ffmpeg.source;
    if (!status.ffmpegResolved) throw new Error('FFmpeg could not be resolved.');

    await mkdir(dirname(outputPath), { recursive: true });
    await runCommand(ffmpeg.executable, [
      '-y',
      '-i', recordingStatus.rawRecordingPath,
      '-i', audioStatus.mixedAudioPath,
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-c:v', config.export?.videoCodec ?? 'libx264',
      '-pix_fmt', 'yuv420p',
      '-r', `${config.export?.frameRate ?? config.video?.frameRate ?? 30}`,
      '-s', `${config.export?.resolution?.width ?? config.video?.resolution?.width ?? 1920}x${config.export?.resolution?.height ?? config.video?.resolution?.height ?? 1080}`,
      '-c:a', config.export?.audioCodec ?? 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      outputPath,
    ]);
    status.outputExists = existsSync(outputPath);
    status.exportCompleted = status.outputExists;
  } catch (error) {
    status.failure = Object.freeze({
      stage: 'export',
      failingOperation: status.ffmpegResolved ? 'ffmpeg-export' : 'ffmpeg-resolve',
      error: error.message,
      stack: error.stack,
      stderr: error.stderr,
    });
  }

  return Object.freeze({ status: Object.freeze(status) });
}
