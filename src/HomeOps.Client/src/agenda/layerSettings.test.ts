import { describe, expect, it, vi } from 'vitest';
import { AgendaLayerSettingsDto } from '../api/homeOpsApiClient';
import type { EventSource } from '../events/eventSourceModel';
import {
  createDefaultAgendaLayerSettings,
  createFreshAgendaDeviceIdentity,
  getAgendaDeviceIdentityStorageKey,
  getLegacyAgendaDeviceKeyStorageKey,
  getOrCreateAgendaDeviceIdentity,
  loadAgendaLayerSettings,
  resetAgendaLayerSettings,
  saveAgendaLayerSettings,
  updateAgendaLayerSource,
} from './layerSettings';

const sources: readonly EventSource[] = [
  {
    id: 'manual-events',
    name: 'HomeOps Calendar',
    type: 'manual',
    enabled: true,
    capability: 'writable',
    visibility: { visibleByDefault: true },
    color: { hex: '#4f46e5' },
  },
  {
    id: 'school-holidays',
    name: 'School Holidays',
    type: 'schoolHolidays',
    enabled: false,
    capability: 'readOnly',
    visibility: { visibleByDefault: true },
    color: { hex: '#0891b2' },
  },
] as const;

describe('agenda layer settings persistence', () => {
  it('creates default settings for week and months from event sources', () => {
    const settings = createDefaultAgendaLayerSettings(sources);

    expect(settings.week.enabledSourceIds).toEqual({ 'manual-events': true, 'school-holidays': false });
    expect(settings.months.enabledSourceIds).toEqual({ 'manual-events': true, 'school-holidays': false });
  });

  it('loads settings through the generated API client and defaults unknown new sources', async () => {
    const client = {
      getAgendaLayerSettings: vi.fn().mockResolvedValue(new AgendaLayerSettingsDto({
        week: { 'manual-events': false },
        months: { 'manual-events': true },
      })),
    };

    const identity = { deviceId: 'device-a', schemaVersion: 1 as const, createdUtc: '2026-08-07T10:00:00.000Z' };
    const loaded = await loadAgendaLayerSettings(client, identity, sources);

    expect(client.getAgendaLayerSettings).toHaveBeenCalledWith('device-a', 1);
    expect(loaded.week.enabledSourceIds).toEqual({ 'manual-events': false, 'school-holidays': false });
    expect(loaded.months.enabledSourceIds).toEqual({ 'manual-events': true, 'school-holidays': false });
  });

  it('saves settings through the generated API client', async () => {
    const settings = updateAgendaLayerSource(createDefaultAgendaLayerSettings(sources), 'week', 'manual-events', false);
    const client = {
      saveAgendaLayerSettings: vi.fn().mockResolvedValue(new AgendaLayerSettingsDto({
        week: settings.week.enabledSourceIds,
        months: settings.months.enabledSourceIds,
      })),
    };

    const identity = { deviceId: 'device-a', schemaVersion: 1 as const, createdUtc: '2026-08-07T10:00:00.000Z' };
    const saved = await saveAgendaLayerSettings(client, identity, settings);

    expect(client.saveAgendaLayerSettings).toHaveBeenCalledWith('device-a', 1, expect.objectContaining({ week: settings.week.enabledSourceIds }));
    expect(saved).toEqual(settings);
  });

  it('keeps week and months view settings isolated', () => {
    const settings = updateAgendaLayerSource(createDefaultAgendaLayerSettings(sources), 'week', 'manual-events', false);

    expect(settings.week.enabledSourceIds['manual-events']).toBe(false);
    expect(settings.months.enabledSourceIds['manual-events']).toBe(true);
  });

  it('persists and reuses a versioned JSON identity without storing layer settings locally', () => {
    const storage = createMemoryStorage();

    const identity = getOrCreateAgendaDeviceIdentity(storage);
    const loadedAgain = getOrCreateAgendaDeviceIdentity(storage);

    expect(identity.deviceId).toMatch(/^homeops-/);
    expect(identity.schemaVersion).toBe(1);
    expect(loadedAgain).toEqual(identity);
    expect(JSON.parse(storage.getItem(getAgendaDeviceIdentityStorageKey())!)).toEqual(identity);
  });

  it('migrates the legacy string key in place so server preferences retain the same id', () => {
    const storage = createMemoryStorage();
    storage.setItem(getLegacyAgendaDeviceKeyStorageKey(), 'homeops-existing-device');

    const identity = getOrCreateAgendaDeviceIdentity(storage);

    expect(identity.deviceId).toBe('homeops-existing-device');
    expect(storage.getItem(getLegacyAgendaDeviceKeyStorageKey())).toBeNull();
    expect(JSON.parse(storage.getItem(getAgendaDeviceIdentityStorageKey())!).deviceId).toBe('homeops-existing-device');
  });

  it('resets server state and creates a fresh local identity', async () => {
    const storage = createMemoryStorage();
    const identity = getOrCreateAgendaDeviceIdentity(storage);
    const client = { resetAgendaLayerSettingsDevice: vi.fn().mockResolvedValue(undefined) };

    await resetAgendaLayerSettings(client, identity);
    const fresh = createFreshAgendaDeviceIdentity(storage);

    expect(client.resetAgendaLayerSettingsDevice).toHaveBeenCalledWith(identity.deviceId, 1);
    expect(fresh.deviceId).not.toBe(identity.deviceId);
    expect(getOrCreateAgendaDeviceIdentity(storage)).toEqual(fresh);
  });
});

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}
