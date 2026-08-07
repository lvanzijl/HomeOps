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
  removeItem(key: string): void;
}

export interface AgendaDeviceIdentity {
  deviceId: string;
  schemaVersion: 1;
  createdUtc: string;
}

const deviceIdentityStorageKey = 'homeops.deviceIdentity.v1';
const legacyDeviceKeyStorageKey = 'homeops.deviceKey.v1';
const currentDeviceSchemaVersion = 1 as const;

export function createDefaultAgendaLayerSettings(sources: readonly EventSource[]): AgendaLayerSettings {
  const defaults = createDefaultSourceSelection(sources);

  return {
    week: { enabledSourceIds: { ...defaults } },
    months: { enabledSourceIds: { ...defaults } },
  };
}

export async function loadAgendaLayerSettings(
  client: Pick<HomeOpsApiClient, 'getAgendaLayerSettings'>,
  identity: AgendaDeviceIdentity,
  sources: readonly EventSource[],
): Promise<AgendaLayerSettings> {
  const dto = await client.getAgendaLayerSettings(identity.deviceId, identity.schemaVersion);
  return normalizeAgendaLayerSettings(dto, sources, createDefaultAgendaLayerSettings(sources));
}

export async function saveAgendaLayerSettings(
  client: Pick<HomeOpsApiClient, 'saveAgendaLayerSettings'>,
  identity: AgendaDeviceIdentity,
  settings: AgendaLayerSettings,
): Promise<AgendaLayerSettings> {
  const dto = await client.saveAgendaLayerSettings(
    identity.deviceId,
    identity.schemaVersion,
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

export async function resetAgendaLayerSettings(
  client: Pick<HomeOpsApiClient, 'resetAgendaLayerSettingsDevice'>,
  identity: AgendaDeviceIdentity,
): Promise<void> {
  await client.resetAgendaLayerSettingsDevice(identity.deviceId, identity.schemaVersion);
}

export function getAgendaDeviceIdentityStorageKey(): string {
  return deviceIdentityStorageKey;
}

export function getLegacyAgendaDeviceKeyStorageKey(): string {
  return legacyDeviceKeyStorageKey;
}

export function getOrCreateAgendaDeviceIdentity(storage: KeyValueStorage | undefined): AgendaDeviceIdentity {
  if (!storage) {
    return createIdentity('homeops-device-memory');
  }

  const storedIdentity = parseIdentity(storage.getItem(deviceIdentityStorageKey));
  if (storedIdentity) {
    return storedIdentity;
  }

  const legacyDeviceId = normalizeDeviceId(storage.getItem(legacyDeviceKeyStorageKey));
  const identity = createIdentity(legacyDeviceId ?? generateDeviceKey());
  storage.setItem(deviceIdentityStorageKey, JSON.stringify(identity));
  storage.removeItem(legacyDeviceKeyStorageKey);
  return identity;
}

export function createFreshAgendaDeviceIdentity(storage: KeyValueStorage | undefined): AgendaDeviceIdentity {
  const identity = createIdentity(generateDeviceKey());
  storage?.setItem(deviceIdentityStorageKey, JSON.stringify(identity));
  storage?.removeItem(legacyDeviceKeyStorageKey);
  return identity;
}

export function useAgendaLayerSettings(sources: readonly EventSource[]) {
  const storage = getBrowserStorage();
  const client = useMemo(() => new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? ''), []);
  const [deviceIdentity, setDeviceIdentity] = useState(() => getOrCreateAgendaDeviceIdentity(storage));
  const [settings, setSettings] = useState(() => createDefaultAgendaLayerSettings(sources));
  const [hasLoaded, setHasLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setHasLoaded(false);
    setSettings((current) => normalizeAgendaLayerSettings(current, sources, createDefaultAgendaLayerSettings(sources)));

    loadAgendaLayerSettings(client, deviceIdentity, sources)
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
  }, [client, deviceIdentity, sources]);

  const actions = useMemo(
    () => ({
      setSourceEnabled(view: AgendaLayerView, sourceId: string, enabled: boolean) {
        setSettings((current) => {
          const next = updateAgendaLayerSource(current, view, sourceId, enabled);
          if (hasLoaded) {
            void saveAgendaLayerSettings(client, deviceIdentity, next).catch((error: unknown) => {
              setErrorMessage(error instanceof Error ? error.message : 'Agenda layer settings could not be saved.');
            });
          }
          return next;
        });
      },
      async resetDeviceSettings() {
        setIsResetting(true);
        try {
          await resetAgendaLayerSettings(client, deviceIdentity);
          const freshIdentity = createFreshAgendaDeviceIdentity(storage);
          setSettings(createDefaultAgendaLayerSettings(sources));
          setDeviceIdentity(freshIdentity);
          setErrorMessage(null);
        } catch (error: unknown) {
          setErrorMessage(error instanceof Error ? error.message : 'Apparaatinstellingen konden niet worden hersteld.');
          throw error;
        } finally {
          setIsResetting(false);
        }
      },
    }),
    [client, deviceIdentity, hasLoaded, sources, storage],
  );

  return { settings, deviceIdentity, errorMessage, isResetting, ...actions };
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

function createIdentity(deviceId: string): AgendaDeviceIdentity {
  return {
    deviceId,
    schemaVersion: currentDeviceSchemaVersion,
    createdUtc: new Date().toISOString(),
  };
}

function parseIdentity(value: string | null): AgendaDeviceIdentity | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<AgendaDeviceIdentity>;
    const deviceId = normalizeDeviceId(parsed.deviceId);
    if (!deviceId || parsed.schemaVersion !== currentDeviceSchemaVersion || typeof parsed.createdUtc !== 'string' || Number.isNaN(Date.parse(parsed.createdUtc))) {
      return null;
    }
    return { deviceId, schemaVersion: currentDeviceSchemaVersion, createdUtc: parsed.createdUtc };
  } catch {
    return null;
  }
}

function normalizeDeviceId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 160 && /^[A-Za-z0-9_.:-]+$/.test(normalized)
    ? normalized
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
