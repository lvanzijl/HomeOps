export const timingConfig = Object.freeze({
  global: Object.freeze({
    chapterCardDurationMs: 1000,
    defaultPageHoldMs: 350,
    defaultPostActionHoldMs: 350,
    defaultTransitionMultiplier: 1,
    defaultTouchHesitationMs: 0,
  }),
  scenes: Object.freeze({
    intro: Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
    home: Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
    family: Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
    agenda: Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
    tasks: Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
    shopping: Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
    motivation: Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
    'weekly-reset': Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
    outro: Object.freeze({ sceneMultiplier: 1, additionalHoldMs: 0, transitionMultiplier: 1 }),
  }),
  interactionTypes: Object.freeze({
    tapDelayMs: 350,
    swipeMultiplier: 1,
    longPressDelayMs: 700,
  }),
});
