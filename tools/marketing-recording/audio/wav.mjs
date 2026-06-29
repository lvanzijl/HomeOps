import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const defaultSampleRate = 48000;

export function secondsToSamples(seconds, sampleRate = defaultSampleRate) {
  return Math.max(0, Math.round(seconds * sampleRate));
}

export function createSilentBuffer(durationSeconds, { sampleRate = defaultSampleRate } = {}) {
  return { sampleRate, channels: 1, samples: new Float32Array(secondsToSamples(durationSeconds, sampleRate)) };
}

export async function readWav(filePath) {
  const buffer = await readFile(filePath);
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`Unsupported WAV file: ${filePath}`);
  let offset = 12;
  let fmt; let data;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ') fmt = { audioFormat: buffer.readUInt16LE(start), channels: buffer.readUInt16LE(start + 2), sampleRate: buffer.readUInt32LE(start + 4), bitsPerSample: buffer.readUInt16LE(start + 14) };
    if (id === 'data') data = buffer.subarray(start, start + size);
    offset = start + size + (size % 2);
  }
  if (!fmt || !data || fmt.audioFormat !== 1 || fmt.bitsPerSample !== 16) throw new Error(`Only 16-bit PCM WAV files are supported: ${filePath}`);
  const frames = data.length / 2 / fmt.channels;
  const samples = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < fmt.channels; channel += 1) sum += data.readInt16LE((frame * fmt.channels + channel) * 2) / 32768;
    samples[frame] = sum / fmt.channels;
  }
  return { sampleRate: fmt.sampleRate, channels: 1, samples };
}

export async function writeWav(filePath, audio) {
  const samples = audio.samples;
  const channels = 1;
  const sampleRate = audio.sampleRate ?? defaultSampleRate;
  const dataSize = samples.length * channels * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * channels * 2, 28); buffer.writeUInt16LE(channels * 2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < samples.length; index += 1) buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[index] * 32767))), 44 + index * 2);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}
