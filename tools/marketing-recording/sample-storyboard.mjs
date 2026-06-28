import { MarketingDirector, marketingPacingProfiles } from './director.mjs';

export const sampleMarketingStoryboard = Object.freeze({
  id: 'familyboard-calm-household-introduction',
  title: 'FamilyBoard Calm Household Introduction',
  chapters: Object.freeze([
    {
      id: 'intro',
      narrativeStep: 'introduction',
      scenes: Object.freeze([
        {
          id: 'intro-home-calm-morning',
          fixture: 'visual-marketing-home',
          title: 'A calm family morning',
          subtitle: 'FamilyBoard shows what matters today.',
          purpose: 'Introduce FamilyBoard',
          emotionalTone: 'warm',
          visualFocus: 'agenda',
          minimumDurationMs: 3800,
          preferredDurationMs: 5200,
          maximumDurationMs: 7600,
          transition: { type: 'fade' },
          actions: Object.freeze([
            { id: 'notice-today', type: 'gesture', description: 'Tap the Today summary to establish touch-first planning.' },
            { id: 'linger-on-family', type: 'pause', description: 'Pause long enough for the family rhythm to feel calm.' },
          ]),
        },
      ]),
    },
    {
      id: 'planning',
      narrativeStep: 'planning',
      scenes: Object.freeze([
        {
          id: 'planning-tasks-shared-rhythm',
          fixture: 'visual-marketing-tasks',
          title: 'Small jobs, shared rhythm',
          subtitle: 'Everyone can see the next helpful step.',
          purpose: 'Show collaboration',
          emotionalTone: 'calm',
          visualFocus: 'tasks',
          minimumDurationMs: 3400,
          preferredDurationMs: 4600,
          maximumDurationMs: 6800,
          transition: { type: 'dissolve' },
          actions: Object.freeze([
            { id: 'focus-task-card', type: 'gesture', description: 'Long-press one practical task without changing production data.' },
            { id: 'confirm-rhythm', type: 'gesture', description: 'Double-tap near the task action to show clarity.' },
          ]),
        },
      ]),
    },
    {
      id: 'motivation',
      narrativeStep: 'motivation',
      scenes: Object.freeze([
        {
          id: 'motivation-helpful-moments',
          fixture: 'visual-marketing-motivation',
          title: 'Helpful moments add up',
          subtitle: 'Encouragement stays warm instead of transactional.',
          purpose: 'Show planning',
          emotionalTone: 'reflective',
          visualFocus: 'motivation',
          minimumDurationMs: 3600,
          preferredDurationMs: 5000,
          maximumDurationMs: 7600,
          transition: { type: 'crossfade' },
          actions: Object.freeze([
            { id: 'read-progress', type: 'pause', description: 'Let the progress story breathe before closing.' },
          ]),
        },
      ]),
    },
  ]),
});

export function validateSampleMarketingStoryboard() {
  const director = new MarketingDirector({ pacingProfile: marketingPacingProfiles.calmMarketing });
  return director.validateStoryboard(sampleMarketingStoryboard);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const validation = validateSampleMarketingStoryboard();
  console.log(JSON.stringify(validation, null, 2));
  if (!validation.valid) process.exitCode = 1;
}
