export const exportConfig = Object.freeze({
  temporaryExportDirectory: '/tmp/familyboard-marketing-export',
  outputPath: '/tmp/familyboard-marketing-export/familyboard-preview.mp4',
  container: 'mp4',
  videoCodec: 'libx264',
  videoCodecLabel: 'h264',
  audioCodec: 'aac',
  frameRate: 30,
  resolution: Object.freeze({ width: 1920, height: 1080 }),
  ffmpegPreferenceOrder: Object.freeze(['configured', 'path', 'imageio-ffmpeg']),
  ffmpegExecutable: undefined,
  imageioFfmpegTarget: '/tmp/homeops-imageio-ffmpeg',
  pythonExecutable: 'python3',
});
