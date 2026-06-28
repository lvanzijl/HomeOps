import { recordingEventTypes } from '../events.mjs';
import { AudioTimeline } from './timeline.mjs';
import { SoundLibrary } from './sound-library.mjs';
import { MusicTrack } from './music-track.mjs';

export const defaultAudioEventMap = Object.freeze({
  [recordingEventTypes.TouchStarted]: 'tap',
  [recordingEventTypes.GestureStarted]: 'longPress',
  [recordingEventTypes.ActionCompleted]: 'taskComplete',
  [recordingEventTypes.TransitionStarted]: 'transition',
  [recordingEventTypes.ChapterCompleted]: 'appreciation',
  [recordingEventTypes.RecordingFinished]: 'success',
});

export class MarketingAudioDirector {
  constructor({ eventBus, config = {}, clock = () => Date.now(), soundLibrary = new SoundLibrary(config.soundLibrary), timeline = new AudioTimeline(config.timeline) } = {}) {
    this.eventBus = eventBus; this.config = config; this.clock = clock; this.soundLibrary = soundLibrary; this.timeline = timeline; this.startedAt = undefined; this.unsubscribe = undefined;
  }
  start() { if (!this.eventBus?.subscribe) throw new Error('MarketingAudioDirector requires an event bus with subscribe().'); this.unsubscribe = this.eventBus.subscribe((event) => this.handleEvent(event)); return this; }
  stop() { this.unsubscribe?.(); this.unsubscribe = undefined; }
  elapsedMs() { return this.startedAt ? this.clock() - this.startedAt : 0; }
  handleEvent(event) {
    if (event.type === recordingEventTypes.RecordingStarted) { this.startedAt = this.clock(); this.configureMusic(); }
    const soundId = { ...defaultAudioEventMap, ...(this.config.eventSounds ?? {}) }[event.type];
    if (!soundId || this.config.enabled === false) return;
    this.soundLibrary.addToTimeline(this.timeline, soundId, { startMs: this.elapsedMs(), delayMs: this.config.soundDelayMs ?? 0, metadata: { eventType: event.type, sceneId: event.sceneId, chapterId: event.chapterId, actionId: event.actionId } });
  }
  configureMusic() { const music = this.config.music; if (!music?.enabled || !music.track) return; new MusicTrack({ filePath: music.track, volume: music.volume, fadeInMs: music.fadeInMs, fadeOutMs: music.fadeOutMs, trimStartMs: music.trimStartMs, trimEndMs: music.trimEndMs, loop: music.loop }).addToTimeline(this.timeline, { durationMs: music.durationMs }); }
}

export function createMarketingAudioDirector(options) { return new MarketingAudioDirector(options).start(); }
