import { useEffect, useMemo, useState } from 'react';
import { AgendaLayerSettingsDto, HomeOpsApiClient, SaveAgendaLayerSettingsRequest } from '../api/homeOpsApiClient';
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

const deviceKeyStorageKey = 'homeops.deviceKey.v1';

export function createDefaultAgendaLayerSettings(sources: readonly EventSource[]): AgendaLayerSettings {
  const defaults = createDefaultSourceSelection(sources);

  return {
    week: { enabledSourceIds: { ...defaults } },
    months: { enabledSourceIds: { ...defaults } },
  };
}

export async function loadAgendaLayerSettings(
  client: Pick<HomeOpsApiClient, 'getAgendaLayerSettings'>,
  deviceKey: string,
  sources: readonly EventSource[],
): Promise<AgendaLayerSettings> {
  const dto = await client.getAgendaLayerSettings(deviceKey);
  return normalizeAgendaLayerSettings(dto, sources, createDefaultAgendaLayerSettings(sources));
}

export async function saveAgendaLayerSettings(
  client: Pick<HomeOpsApiClient, 'saveAgendaLayerSettings'>,
  deviceKey: string,
  settings: AgendaLayerSettings,
): Promise<AgendaLayerSettings> {
  const dto = await client.saveAgendaLayerSettings(
    deviceKey,
    new SaveAgendaLayerSettingsRequest({
      week: settings.week.enabledSourceIds,
      months: settings.months.enabledSourceIds,
    }),
  );

  return normalizeAgendaLayerSettings(dto, [], settings);
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

export function getAgendaDeviceKeyStorageKey(): string {
  return deviceKeyStorageKey;
}

export function getOrCreateAgendaDeviceKey(storage: KeyValueStorage | undefined): string {
  if (!storage) {
    return 'homeops-device-memory';
  }

  const stored = storage.getItem(deviceKeyStorageKey);
  if (stored) {
    return stored;
  }

  const generated = generateDeviceKey();
  storage.setItem(deviceKeyStorageKey, generated);
  return generated;
}

export function useAgendaLayerSettings(sources: readonly EventSource[]) {
  const storage = getBrowserStorage();
  const client = useMemo(() => new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? ''), []);
  const [deviceKey] = useState(() => getOrCreateAgendaDeviceKey(storage));
  const [settings, setSettings] = useState(() => createDefaultAgendaLayerSettings(sources));
  const [hasLoaded, setHasLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setSettings((current) => normalizeAgendaLayerSettings(current, sources, createDefaultAgendaLayerSettings(sources)));

    loadAgendaLayerSettings(client, deviceKey, sources)
      .then((loaded) => {
        if (!isMounted) return;
        setSettings(loaded);
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Agenda layer settings could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setHasLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [client, deviceKey, sources]);

  const actions = useMemo(
    () => ({
      setSourceEnabled(view: AgendaLayerView, sourceId: string, enabled: boolean) {
        setSettings((current) => {
          const next = updateAgendaLayerSource(current, view, sourceId, enabled);
          if (hasLoaded) {
            void saveAgendaLayerSettings(client, deviceKey, next).catch((error: unknown) => {
              setErrorMessage(error instanceof Error ? error.message : 'Agenda layer settings could not be saved.');
            });
          }
          return next;
        });
      },
    }),
    [client, deviceKey, hasLoaded],
  );

  return { settings, deviceKey, errorMessage, ...actions };
}

function createDefaultSourceSelection(sources: readonly EventSource[]): Record<string, boolean> {
  return Object.fromEntries(sources.map((source) => [source.id, source.canDisplayEvents ?? source.enabled]));
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
  if (!isRecord(candidate)) {
    return defaults;
  }

  const enabledSourceIds = isRecord(candidate.enabledSourceIds) ? candidate.enabledSourceIds : candidate;

  return {
    enabledSourceIds: Object.fromEntries(
      sources.length === 0
        ? Object.entries(enabledSourceIds).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
        : sources.map((source) => {
            const storedValue = enabledSourceIds[source.id];
            return [source.id, typeof storedValue === 'boolean' ? storedValue : (source.canDisplayEvents ?? source.enabled)];
          }),
    ),
  };
}

function getBrowserStorage(): KeyValueStorage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function generateDeviceKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `homeops-${crypto.randomUUID()}`;
  }

  return `homeops-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
