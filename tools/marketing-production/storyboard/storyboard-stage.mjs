function resolveFromEngineRoot(relativePath) {
  return new URL(relativePath, new URL('../', import.meta.url));
}

function summarizeScene(scene, index) {
  return Object.freeze({
    order: index + 1,
    id: scene.id,
    fixture: scene.fixture,
    chapterId: scene.chapterId,
    narrativeStep: scene.narrativeStep,
    title: scene.title,
    subtitle: scene.subtitle,
    purpose: scene.purpose,
    emotionalTone: scene.emotionalTone,
    visualFocus: scene.visualFocus,
    transition: Object.freeze({ ...(scene.transition ?? {}) }),
    chapterCard: scene.chapterCard ? Object.freeze({ ...scene.chapterCard }) : undefined,
    timing: scene.timing ? Object.freeze({ ...scene.timing }) : undefined,
    recording: Object.freeze({
      actionCount: Array.isArray(scene.actions) ? scene.actions.length : 0,
      minimumDurationMs: scene.minimumDurationMs,
      preferredDurationMs: scene.preferredDurationMs,
      maximumDurationMs: scene.maximumDurationMs,
      durationHintMs: scene.durationHintMs,
      pacingProfileId: scene.pacing?.id,
    }),
  });
}

function createStructuredRecordingPlan({ storyboard, directorPlan }) {
  const orderedScenes = Object.freeze(directorPlan.scenes.map(summarizeScene));
  const preferredDurationMs = orderedScenes.reduce((total, scene) => total + (scene.recording.preferredDurationMs ?? 0), 0);
  const maximumDurationMs = storyboard.maximumTotalDurationMs;
  const recordingPlan = {
    storyboardId: storyboard.id,
    storyboardTitle: storyboard.title,
    sceneCount: orderedScenes.length,
    preferredDurationMs,
    preferredDurationSeconds: preferredDurationMs / 1000,
    maximumDurationMs,
    maximumDurationSeconds: maximumDurationMs / 1000,
    emotionalCurve: Object.freeze([...(storyboard.emotionalCurve ?? [])]),
    orderedScenes,
    recordingMetadata: Object.freeze({
      pacingProfileId: directorPlan.pacingProfile?.id,
      pacingProfileLabel: directorPlan.pacingProfile?.label,
      sourceDocument: storyboard.sourceDocument,
      householdDocument: storyboard.householdDocument,
      fixtureDate: storyboard.fixtureDate,
      canonicalWeek: storyboard.canonicalWeek ? Object.freeze({ ...storyboard.canonicalWeek }) : undefined,
    }),
  };
  Object.defineProperty(recordingPlan, 'executableScenes', { value: directorPlan.scenes, enumerable: false });
  return Object.freeze(recordingPlan);
}

export async function runStoryboardStage(config) {
  const status = {
    phase: 'storyboard',
    loaded: false,
    validationPassed: false,
    marketingDirectorLoaded: false,
    recordingPlanGenerated: false,
    sceneCount: 0,
    preferredDurationMs: 0,
    maximumDurationMs: 0,
    chapterCardMetadataExists: false,
    emotionalCurveMetadataExists: false,
    failure: undefined,
  };

  try {
    const storyboardModule = await import(resolveFromEngineRoot(config.storyboard.modulePath).href);
    const storyboard = storyboardModule[config.storyboard.exportName];
    if (!storyboard) throw new Error(`Storyboard export ${config.storyboard.exportName} was not found.`);
    status.loaded = true;

    const directorModule = await import(resolveFromEngineRoot('../marketing-recording/director.mjs').href);
    const { MarketingDirector, marketingPacingProfiles } = directorModule;
    if (typeof MarketingDirector !== 'function') throw new Error('MarketingDirector export was not found.');
    status.marketingDirectorLoaded = true;

    const director = new MarketingDirector({ pacingProfile: marketingPacingProfiles.calmMarketing });
    const directorValidation = director.validateStoryboard(storyboard);
    const configuredValidation = typeof storyboardModule[config.storyboard.validateExportName] === 'function'
      ? storyboardModule[config.storyboard.validateExportName]()
      : Object.freeze({ valid: true, warnings: Object.freeze([]) });
    const validationWarnings = Object.freeze([...directorValidation.warnings, ...(configuredValidation.warnings ?? [])]);
    status.validationPassed = directorValidation.valid && configuredValidation.valid;
    if (!status.validationPassed) throw new Error(`Storyboard validation failed: ${validationWarnings.join(' ')}`);

    const directorPlan = director.createRecordingPlan(storyboard);
    const recordingPlan = createStructuredRecordingPlan({ storyboard, directorPlan });
    status.recordingPlanGenerated = true;
    status.sceneCount = recordingPlan.sceneCount;
    status.preferredDurationMs = recordingPlan.preferredDurationMs;
    status.maximumDurationMs = recordingPlan.maximumDurationMs;
    status.chapterCardMetadataExists = recordingPlan.orderedScenes.every((scene) => Boolean(scene.chapterCard));
    status.emotionalCurveMetadataExists = recordingPlan.emotionalCurve.length > 0;

    const validationErrors = [];
    if (recordingPlan.sceneCount !== 9) validationErrors.push(`Expected 9 scenes, found ${recordingPlan.sceneCount}.`);
    if (recordingPlan.preferredDurationMs !== 84000) validationErrors.push(`Expected preferred duration 84000ms, found ${recordingPlan.preferredDurationMs}ms.`);
    if (recordingPlan.maximumDurationMs !== 90000) validationErrors.push(`Expected maximum duration 90000ms, found ${recordingPlan.maximumDurationMs}ms.`);
    if (!status.chapterCardMetadataExists) validationErrors.push('Chapter card metadata is missing from one or more scenes.');
    if (!status.emotionalCurveMetadataExists) validationErrors.push('Emotional curve metadata is missing.');
    if (validationErrors.length > 0) throw new Error(`Recording plan validation failed: ${validationErrors.join(' ')}`);

    return Object.freeze({ status: Object.freeze(status), recordingPlan });
  } catch (error) {
    status.failure = Object.freeze({ message: error.message });
    return Object.freeze({ status: Object.freeze(status), recordingPlan: undefined });
  }
}
