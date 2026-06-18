import { describe, expect, it } from 'vitest';
import type { EventSource } from '../events/eventSourceModel';
import { createDefaultAgendaLayerSettings, getAgendaStorageKey, loadAgendaLayerSettings, saveAgendaLayerSettings, updateAgendaLayerSource } from './layerSettings';

const sources: readonly EventSource[] = [
  {
    id: 'manual-events',
    name: 'HomeOps Manual Events',
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

  it('saves and loads settings through storage', () => {
    const storage = createMemoryStorage();
    const settings = updateAgendaLayerSource(createDefaultAgendaLayerSettings(sources), 'week', 'manual-events', false);

    saveAgendaLayerSettings(storage, settings);

    expect(loadAgendaLayerSettings(storage, sources)).toEqual(settings);
  });

  it('keeps week and months view settings isolated', () => {
    const settings = updateAgendaLayerSource(createDefaultAgendaLayerSettings(sources), 'week', 'manual-events', false);

    expect(settings.week.enabledSourceIds['manual-events']).toBe(false);
    expect(settings.months.enabledSourceIds['manual-events']).toBe(true);
  });

  it('recovers defaults from corrupt storage', () => {
    const storage = createMemoryStorage();
    storage.setItem(getAgendaStorageKey(), '{not-json');

    expect(loadAgendaLayerSettings(storage, sources)).toEqual(createDefaultAgendaLayerSettings(sources));
  });

  it('keeps existing settings and defaults new sources when sources are added', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      getAgendaStorageKey(),
      JSON.stringify({
        week: { enabledSourceIds: { 'manual-events': false } },
        months: { enabledSourceIds: { 'manual-events': true } },
      }),
    );

    const expandedSources: readonly EventSource[] = [
      ...sources,
      {
        id: 'tv-series',
        name: 'TV Series',
        type: 'tvSeries',
        enabled: true,
        capability: 'readOnly',
        visibility: { visibleByDefault: true },
        color: { hex: '#db2777' },
      },
    ];

    const loaded = loadAgendaLayerSettings(storage, expandedSources);

    expect(loaded.week.enabledSourceIds).toEqual({ 'manual-events': false, 'school-holidays': false, 'tv-series': true });
    expect(loaded.months.enabledSourceIds).toEqual({ 'manual-events': true, 'school-holidays': false, 'tv-series': true });
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
