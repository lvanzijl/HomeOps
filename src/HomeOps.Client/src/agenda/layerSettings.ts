import { useEffect, useMemo, useState } from 'react';
import type { EventSource } from '../events/eventSourceModel';

export type AgendaLayerView = 'week' | 'months';

export interface AgendaViewLayerSettings {
  enabledSourceIds: Record<string, boolean>;
}

export interface AgendaLayerSettings {
  week: AgendaViewLayerSettings;
  months: AgendaViewLayerSettings;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const storageKey = 'homeops.agenda.layerSettings.v1';

export function createDefaultAgendaLayerSettings(sources: readonly EventSource[]): AgendaLayerSettings {
  const defaults = createDefaultSourceSelection(sources);

  return {
    week: { enabledSourceIds: { ...defaults } },
    months: { enabledSourceIds: { ...defaults } },
  };
}

export function loadAgendaLayerSettings(
  storage: KeyValueStorage | undefined,
  sources: readonly EventSource[],
): AgendaLayerSettings {
  const defaults = createDefaultAgendaLayerSettings(sources);

  if (!storage) {
    return defaults;
  }

  const storedValue = storage.getItem(storageKey);
  if (!storedValue) {
    return defaults;
  }

  try {
    return normalizeAgendaLayerSettings(JSON.parse(storedValue), sources, defaults);
  } catch {
    return defaults;
  }
}

export function saveAgendaLayerSettings(storage: KeyValueStorage | undefined, settings: AgendaLayerSettings): void {
  if (!storage) {
    return;
  }

  storage.setItem(storageKey, JSON.stringify(settings));
}

export function updateAgendaLayerSource(
  settings: AgendaLayerSettings,
  view: AgendaLayerView,
  sourceId: string,
  enabled: boolean,
): AgendaLayerSettings {
  return {
    ...settings,
    [view]: {
      enabledSourceIds: {
        ...settings[view].enabledSourceIds,
        [sourceId]: enabled,
      },
    },
  };
}

export function getAgendaStorageKey(): string {
  return storageKey;
}

export function useAgendaLayerSettings(sources: readonly EventSource[]) {
  const storage = getBrowserStorage();
  const [settings, setSettings] = useState(() => loadAgendaLayerSettings(storage, sources));

  useEffect(() => {
    setSettings((current) => normalizeAgendaLayerSettings(current, sources, createDefaultAgendaLayerSettings(sources)));
  }, [sources]);

  useEffect(() => {
    saveAgendaLayerSettings(storage, settings);
  }, [settings, storage]);

  const actions = useMemo(
    () => ({
      setSourceEnabled(view: AgendaLayerView, sourceId: string, enabled: boolean) {
        setSettings((current) => updateAgendaLayerSource(current, view, sourceId, enabled));
      },
    }),
    [],
  );

  return { settings, ...actions };
}

function createDefaultSourceSelection(sources: readonly EventSource[]): Record<string, boolean> {
  return Object.fromEntries(sources.map((source) => [source.id, source.enabled]));
}

function normalizeAgendaLayerSettings(
  candidate: unknown,
  sources: readonly EventSource[],
  defaults: AgendaLayerSettings,
): AgendaLayerSettings {
  if (!isRecord(candidate)) {
    return defaults;
  }

  return {
    week: normalizeViewSettings(candidate.week, sources, defaults.week),
    months: normalizeViewSettings(candidate.months, sources, defaults.months),
  };
}

function normalizeViewSettings(
  candidate: unknown,
  sources: readonly EventSource[],
  defaults: AgendaViewLayerSettings,
): AgendaViewLayerSettings {
  if (!isRecord(candidate) || !isRecord(candidate.enabledSourceIds)) {
    return defaults;
  }

  const enabledSourceIds = candidate.enabledSourceIds;

  return {
    enabledSourceIds: Object.fromEntries(
      sources.map((source) => {
        const storedValue = enabledSourceIds[source.id];
        return [source.id, typeof storedValue === 'boolean' ? storedValue : source.enabled];
      }),
    ),
  };
}

function getBrowserStorage(): KeyValueStorage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
