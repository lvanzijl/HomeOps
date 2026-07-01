export const recordingEventTypes = Object.freeze({
  RecordingStarted: 'RecordingStarted',
  RecordingFinished: 'RecordingFinished',
  SceneStarted: 'SceneStarted',
  SceneCompleted: 'SceneCompleted',
  ChapterStarted: 'ChapterStarted',
  ChapterCompleted: 'ChapterCompleted',
  TransitionStarted: 'TransitionStarted',
  TransitionCompleted: 'TransitionCompleted',
  TouchStarted: 'TouchStarted',
  TouchCompleted: 'TouchCompleted',
  GestureStarted: 'GestureStarted',
  GestureCompleted: 'GestureCompleted',
  ActionStarted: 'ActionStarted',
  ActionCompleted: 'ActionCompleted',
  SceneEntryTransitionCoverStarted: 'SceneEntryTransitionCoverStarted',
  SceneEntryFixtureResetStarted: 'SceneEntryFixtureResetStarted',
  SceneEntryFixtureResetCompleted: 'SceneEntryFixtureResetCompleted',
  SceneEntryReloadStarted: 'SceneEntryReloadStarted',
  SceneEntryReloadCompleted: 'SceneEntryReloadCompleted',
  SceneEntryNavigationStarted: 'SceneEntryNavigationStarted',
  SceneEntryNavigationCompleted: 'SceneEntryNavigationCompleted',
  SceneEntryTargetVerified: 'SceneEntryTargetVerified',
  SceneEntryVisibleRevealStarted: 'SceneEntryVisibleRevealStarted',
  FirstVisibleInteraction: 'FirstVisibleInteraction',
  DialogOpenStarted: 'DialogOpenStarted',
  DialogOpenVisible: 'DialogOpenVisible',
  DialogSaveOrCancelClicked: 'DialogSaveOrCancelClicked',
  DialogCloseCompleted: 'DialogCloseCompleted',
  DialogResultVisible: 'DialogResultVisible',
});

export class RecordingEventBus {
  constructor({ clock = () => new Date().toISOString(), listeners = [] } = {}) {
    this.clock = clock;
    this.listeners = new Set(listeners);
    this.events = [];
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(type, payload = {}) {
    const event = Object.freeze({ type, at: this.clock(), ...payload });
    this.events.push(event);
    for (const listener of this.listeners) listener(event);
    return event;
  }
}

export function createNoopEventBus() {
  return { publish: () => undefined, subscribe: () => () => undefined, events: [] };
}
