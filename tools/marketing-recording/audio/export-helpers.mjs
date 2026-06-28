import { writeWav } from './wav.mjs';

export function normalizeAudio(audio, { peak = 0.9 } = {}) {
  let max = 0;
  for (const sample of audio.samples) max = Math.max(max, Math.abs(sample));
  if (max === 0 || max <= peak) return audio;
  const normalized = new Float32Array(audio.samples.length);
  const gain = peak / max;
  for (let index = 0; index < audio.samples.length; index += 1) normalized[index] = audio.samples[index] * gain;
  return { ...audio, samples: normalized };
}

export async function exportMixedWav(filePath, audio, options = {}) {
  const output = options.normalize === false ? audio : normalizeAudio(audio, options.normalization);
  await writeWav(filePath, output);
  return { filePath, sampleRate: output.sampleRate, durationSeconds: output.samples.length / output.sampleRate };
}
