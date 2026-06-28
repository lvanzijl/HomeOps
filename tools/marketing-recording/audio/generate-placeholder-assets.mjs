import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeWav, defaultSampleRate } from './wav.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const assetDir = join(here, 'assets');
const specs = {
  tap: [[620, .06, .28]], doubleTap: [[620,.055,.24],[740,.055,.22,.09]], longPress: [[360,.24,.18],[480,.16,.13,.12]], success: [[523,.18,.18],[659,.20,.16,.13],[784,.24,.14,.26]], save: [[440,.14,.16],[660,.18,.13,.12]], taskComplete: [[392,.12,.16],[587,.16,.16,.10],[784,.20,.13,.22]], appreciation: [[330,.20,.13],[494,.24,.13,.14],[659,.28,.11,.32]], celebration: [[523,.14,.17],[659,.16,.16,.10],[784,.18,.15,.21],[1046,.24,.11,.36]], transition: [[220,.42,.10],[330,.38,.08,.12]], weeklyResetComplete: [[392,.18,.14],[523,.18,.14,.15],[659,.20,.13,.31],[880,.28,.10,.50]],
};
function make(spec) {
  const duration = Math.max(...spec.map(([,, , delay=0]) => delay)) + Math.max(...spec.map(([,dur]) => dur)) + .08;
  const samples = new Float32Array(Math.round(duration * defaultSampleRate));
  for (const [freq, dur, amp, delay=0] of spec) {
    const start = Math.round(delay * defaultSampleRate); const len = Math.round(dur * defaultSampleRate);
    for (let i=0;i<len && start+i<samples.length;i++) {
      const t = i / defaultSampleRate; const env = Math.sin(Math.PI * i / len) ** 1.7;
      samples[start+i] += Math.sin(2*Math.PI*freq*t) * amp * env + Math.sin(2*Math.PI*freq*2*t) * amp * .12 * env;
    }
  }
  return { sampleRate: defaultSampleRate, channels: 1, samples };
}
await mkdir(assetDir, { recursive: true });
for (const [id, spec] of Object.entries(specs)) await writeWav(join(assetDir, `${id}.wav`), make(spec));
console.log(`Generated ${Object.keys(specs).length} placeholder WAV assets in ${assetDir}`);
