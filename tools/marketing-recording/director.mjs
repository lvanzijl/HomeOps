import { defineScene } from './scene.mjs';
import { timingProfiles } from './motion.mjs';
import { RecordingEventBus, recordingEventTypes } from './events.mjs';

export const marketingPacingProfiles = Object.freeze({
  calmMarketing: Object.freeze({
    id: 'calm-marketing',
    label: 'Calm Marketing',
    motion: timingProfiles.warm,
    pauseMultiplier: 1.15,
    movementMultiplier: 0.9,
    transitionMultiplier: 1.15,
    chapterPauseMs: 1900,
    minimumSceneMs: 3800,
    maximumSceneMs: 11000,
  }),
  conferenceDemo: Object.freeze({
    id: 'conference-demo',
    label: 'Conference Demo',
    motion: timingProfiles.calm,
    pauseMultiplier: 1,
    movementMultiplier: 1,
    transitionMultiplier: 1,
    chapterPauseMs: 1600,
    minimumSceneMs: 3200,
    maximumSceneMs: 9000,
  }),
  fastFeaturePreview: Object.freeze({
    id: 'fast-feature-preview',
    label: 'Fast Feature Preview',
    motion: timingProfiles.brisk,
    pauseMultiplier: 0.65,
    movementMultiplier: 1.25,
    transitionMultiplier: 0.75,
    chapterPauseMs: 1100,
    minimumSceneMs: 2200,
    maximumSceneMs: 6500,
  }),
});

const defaultNarrative = Object.freeze(['introduction', 'todays-family', 'family', 'planning', 'helping', 'shopping', 'motivation', 'weekly-reflection', 'closing']);

export class MarketingDirector {
  constructor({ pacingProfile = marketingPacingProfiles.calmMarketing, eventBus = new RecordingEventBus(), narrativeOrder = defaultNarrative } = {}) {
    this.pacingProfile = pacingProfile;
    this.eventBus = eventBus;
    this.narrativeOrder = narrativeOrder;
  }

  validateStoryboard(storyboard) {
    const warnings = [];
    const seenScenes = new Set();
    let previousChapterIndex = -1;
    let previousDuration = undefined;

    if (!storyboard?.id) warnings.push('Storyboard is missing an id.');
    if (!Array.isArray(storyboard?.chapters) || storyboard.chapters.length === 0) warnings.push(`Storyboard ${storyboard?.id ?? '(unknown)'} has no chapters.`);

    for (const chapter of storyboard?.chapters ?? []) {
      if (!chapter?.id) warnings.push('A chapter is missing an id.');
      const chapterIndex = this.narrativeOrder.indexOf(chapter?.narrativeStep);
      if (chapterIndex === -1) warnings.push(`Chapter ${chapter?.id ?? '(unknown)'} uses unknown narrative step ${chapter?.narrativeStep ?? '(missing)'}.`);
      if (chapterIndex !== -1 && chapterIndex < previousChapterIndex) warnings.push(`Chapter ${chapter.id} appears out of narrative order after a later chapter.`);
      if (chapterIndex !== -1) previousChapterIndex = chapterIndex;

      for (const scene of chapter?.scenes ?? []) {
        if (seenScenes.has(scene.id)) warnings.push(`Scene ${scene.id} is duplicated.`);
        seenScenes.add(scene.id);
        if (!scene.fixture) warnings.push(`Scene ${scene.id ?? '(unknown)'} is missing a fixture.`);
        if (!scene.transition?.type) warnings.push(`Scene ${scene.id ?? '(unknown)'} is missing a transition.`);
        if (!scene.purpose) warnings.push(`Scene ${scene.id ?? '(unknown)'} is missing a purpose.`);
        if (!scene.emotionalTone) warnings.push(`Scene ${scene.id ?? '(unknown)'} is missing an emotional tone.`);
        if (!scene.visualFocus) warnings.push(`Scene ${scene.id ?? '(unknown)'} is missing a visual focus.`);
        const min = scene.minimumDurationMs;
        const preferred = scene.preferredDurationMs;
        const max = scene.maximumDurationMs;
        if (![min, preferred, max].every((value) => Number.isFinite(value) && value > 0)) warnings.push(`Scene ${scene.id ?? '(unknown)'} has missing or invalid duration metadata.`);
        else if (min > preferred || preferred > max) warnings.push(`Scene ${scene.id} has impossible durations: minimum <= preferred <= maximum is required.`);
        if (previousDuration && preferred && Math.max(previousDuration, preferred) / Math.min(previousDuration, preferred) > 2.6) warnings.push(`Scene ${scene.id} creates abrupt pacing compared with the previous scene.`);
        previousDuration = preferred;
      }
    }

    return Object.freeze({ valid: warnings.length === 0, warnings: Object.freeze(warnings) });
  }

  createRecordingPlan(storyboard) {
    const validation = this.validateStoryboard(storyboard);
    const scenes = [];
    for (const chapter of storyboard.chapters ?? []) {
      for (const rawScene of chapter.scenes ?? []) {
        const transitionDuration = Math.round((rawScene.transition?.durationMs ?? this.pacingProfile.motion.transitionMs) * this.pacingProfile.transitionMultiplier);
        scenes.push(defineScene({
          ...rawScene,
          chapter: {
            title: rawScene.title,
            subtitle: rawScene.subtitle,
            position: rawScene.chapterPosition ?? 'lower-left',
            durationMs: rawScene.chapterDurationMs ?? this.pacingProfile.chapterPauseMs,
          },
          chapterId: chapter.id,
          narrativeStep: chapter.narrativeStep,
          transition: { type: rawScene.transition?.type ?? 'fade', durationMs: transitionDuration },
          durationHintMs: rawScene.preferredDurationMs,
          pacing: this.pacingProfile,
        }));
      }
    }
    return Object.freeze({ storyboardId: storyboard.id, pacingProfile: this.pacingProfile, validation, scenes: Object.freeze(scenes) });
  }

  async orchestrate(storyboard, session) {
    const plan = this.createRecordingPlan(storyboard);
    if (!plan.validation.valid) throw new Error(`Storyboard ${storyboard.id} failed validation: ${plan.validation.warnings.join(' ')}`);
    this.eventBus.publish(recordingEventTypes.RecordingStarted, { storyboardId: storyboard.id, pacingProfileId: this.pacingProfile.id });
    await session.run(plan.scenes, { director: this, eventBus: this.eventBus, storyboardId: storyboard.id });
    this.eventBus.publish(recordingEventTypes.RecordingFinished, { storyboardId: storyboard.id });
    return plan;
  }
}
