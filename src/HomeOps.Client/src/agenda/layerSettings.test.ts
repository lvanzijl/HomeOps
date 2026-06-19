import { describe, expect, it, vi } from 'vitest';
import { AgendaLayerSettingsDto } from '../api/homeOpsApiClient';
import type { EventSource } from '../events/eventSourceModel';
import {
  createDefaultAgendaLayerSettings,
  getAgendaDeviceKeyStorageKey,
  getOrCreateAgendaDeviceKey,
  loadAgendaLayerSettings,
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

    const loaded = await loadAgendaLayerSettings(client, 'device-a', sources);

    expect(client.getAgendaLayerSettings).toHaveBeenCalledWith('device-a');
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

    const saved = await saveAgendaLayerSettings(client, 'device-a', settings);

    expect(client.saveAgendaLayerSettings).toHaveBeenCalledWith('device-a', expect.objectContaining({ week: settings.week.enabledSourceIds }));
    expect(saved).toEqual(settings);
  });

  it('keeps week and months view settings isolated', () => {
    const settings = updateAgendaLayerSource(createDefaultAgendaLayerSettings(sources), 'week', 'manual-events', false);

    expect(settings.week.enabledSourceIds['manual-events']).toBe(false);
    expect(settings.months.enabledSourceIds['manual-events']).toBe(true);
  });

  it('persists a generated device key locally without storing layer settings locally', () => {
    const storage = createMemoryStorage();

    const deviceKey = getOrCreateAgendaDeviceKey(storage);
    const loadedAgain = getOrCreateAgendaDeviceKey(storage);

    expect(deviceKey).toMatch(/^homeops-/);
    expect(loadedAgain).toBe(deviceKey);
    expect(storage.getItem(getAgendaDeviceKeyStorageKey())).toBe(deviceKey);
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
  };
}
