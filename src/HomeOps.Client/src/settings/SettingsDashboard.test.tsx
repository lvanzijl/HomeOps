import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarExportDocument } from '../api/homeOpsApiClient';
import { SettingsDashboard } from './SettingsDashboard';

const manualSource = {
  id: 'manual-source',
  name: 'HomeOps Calendar',
  icon: '📅',
  type: 'manual' as const,
  enabled: true,
  writable: true,
  isSystem: true,
  state: 'healthy' as const,
  canDisplayEvents: true,
  pollInterval: 'every8Hours' as const,
  providerConfiguration: null,
};

const schoolFeedSource = {
  id: 'school-feed',
  name: 'School Feed',
  icon: '🏫',
  type: 'iCalFeed' as const,
  enabled: true,
  writable: false,
  isSystem: false,
  state: 'failed' as const,
  canDisplayEvents: false,
  pollInterval: 'hourly' as const,
  lastError: { message: 'De schoolfeed is nu niet bereikbaar.' },
  providerConfiguration: { kind: 'iCalFeed' as const, feedUrl: 'https://example.test/school.ics' },
};

const exportDocument = CalendarExportDocument.fromJS({
  format: 'homeops.calendar.export',
  schemaVersion: 1,
  exportedUtc: '2026-06-19T00:00:00.000Z',
  household: { id: '11111111-1111-1111-1111-111111111111', timeZoneId: 'Europe/Amsterdam' },
  calendar: { version: 1, eventSources: [], eventSeries: [], recurrence: { rules: [] }, exceptions: [], metadata: {} },
  metadata: {},
});

const { exportCalendar, restoreCalendar, downloadCalendarExport } = vi.hoisted(() => ({
  exportCalendar: vi.fn(),
  restoreCalendar: vi.fn(),
  downloadCalendarExport: vi.fn(),
}));

const {
  loadCalendarSources,
  refreshAllCalendarSources,
  refreshCalendarSource,
  createCalendarSource,
  updateCalendarSource,
  setCalendarSourceEnabled,
  deleteCalendarSource,
} = vi.hoisted(() => ({
  loadCalendarSources: vi.fn(),
  refreshAllCalendarSources: vi.fn(),
  refreshCalendarSource: vi.fn(),
  createCalendarSource: vi.fn(),
  updateCalendarSource: vi.fn(),
  setCalendarSourceEnabled: vi.fn(),
  deleteCalendarSource: vi.fn(),
}));

vi.mock('../calendarPortability', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../calendarPortability')>();
  return {
    ...actual,
    createCalendarPortabilityClient: () => ({
      exportCalendar,
      restoreCalendar,
    }),
    downloadCalendarExport,
  };
});

vi.mock('../calendarSources/calendarSourcesApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../calendarSources/calendarSourcesApi')>();
  return {
    ...actual,
    loadCalendarSources,
    refreshAllCalendarSources,
    refreshCalendarSource,
    createCalendarSource,
    updateCalendarSource,
    setCalendarSourceEnabled,
    deleteCalendarSource,
  };
});

afterEach(() => cleanup());

describe('SettingsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportCalendar.mockResolvedValue(exportDocument);
    restoreCalendar.mockResolvedValue(undefined);
    loadCalendarSources.mockResolvedValue([manualSource]);
    refreshAllCalendarSources.mockResolvedValue([]);
    refreshCalendarSource.mockResolvedValue(undefined);
    createCalendarSource.mockResolvedValue(undefined);
    updateCalendarSource.mockResolvedValue(undefined);
    setCalendarSourceEnabled.mockResolvedValue(undefined);
    deleteCalendarSource.mockResolvedValue(undefined);
  });

  it('shows a status-first dashboard while keeping restore contextual', async () => {
    const user = userEvent.setup();

    render(<SettingsDashboard widgetInstances={[]} />);

    expect(screen.getByText('Is alles in orde?')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Alles is in orde.' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Back-up maken' })).not.toBeNull();
    expect(screen.queryByLabelText(/Back-upbestand kiezen/i)).toBeNull();
    expect(screen.queryByText(/Herstellen vervangt de huidige gezinsagenda/i)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Herstellen' }));

    const dialog = await screen.findByRole('dialog', { name: 'Herstellen vanuit back-up' });
    expect(within(dialog).getByLabelText(/Back-upbestand kiezen/i)).not.toBeNull();
    expect(within(dialog).getByText(/Herstellen vervangt de huidige gezinsagenda/i)).not.toBeNull();
  });

  it('shows a friendly empty state when only the manual source exists', async () => {
    render(<SettingsDashboard widgetInstances={[]} />);

    expect(await screen.findByText('Voeg een iCal-bron toe')).not.toBeNull();
    expect(screen.getByText(/Je handmatige gezinsagenda staat al klaar/i)).not.toBeNull();
  });

  it('requires explicit confirmation before running destructive restore', async () => {
    const user = userEvent.setup();
    const file = new File([JSON.stringify(exportDocument.toJSON())], 'calendar.json', { type: 'application/json' });

    render(<SettingsDashboard widgetInstances={[]} />);

    await user.click(screen.getByRole('button', { name: 'Herstellen' }));

    const dialog = await screen.findByRole('dialog', { name: 'Herstellen vanuit back-up' });
    const restoreButton = within(dialog).getByRole('button', { name: 'Agenda herstellen' });

    expect(restoreButton).toHaveProperty('disabled', true);

    await user.upload(within(dialog).getByLabelText(/Back-upbestand kiezen/i), file);
    await waitFor(() => expect(within(dialog).getByText(/Back-up van 2026-06-19T00:00:00.000Z/i)).not.toBeNull());
    expect(restoreButton).toHaveProperty('disabled', true);

    await user.click(within(dialog).getByLabelText(/Ik begrijp dat herstellen de huidige gezinsagenda vervangt/i));
    expect(restoreButton).toHaveProperty('disabled', false);

    await user.click(restoreButton);

    expect(restoreCalendar).toHaveBeenCalledWith(expect.objectContaining({ format: 'homeops.calendar.export' }));
  });

  it('renders configured calendar sources with household-friendly status', async () => {
    loadCalendarSources.mockResolvedValueOnce([manualSource, schoolFeedSource]);

    render(<SettingsDashboard widgetInstances={[]} />);

    expect(await screen.findByText('School Feed')).not.toBeNull();
    expect(screen.getByText('Bronnen beheren')).not.toBeNull();
    expect(screen.getByText('Mislukt')).not.toBeNull();
    expect(screen.getAllByText('De schoolfeed is nu niet bereikbaar.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Alles verversen' })).not.toBeNull();
  });

  it('creates a new iCal feed source from the add dialog', async () => {
    const user = userEvent.setup();
    const createdSource = {
      id: 'sports-feed',
      name: 'Sportclub',
      icon: '⚽',
      type: 'iCalFeed' as const,
      enabled: true,
      writable: false,
      isSystem: false,
      state: 'neverSynced' as const,
      canDisplayEvents: false,
      pollInterval: 'daily' as const,
      providerConfiguration: { kind: 'iCalFeed' as const, feedUrl: 'https://example.test/sports.ics' },
    };

    createCalendarSource.mockResolvedValueOnce(createdSource);
    loadCalendarSources
      .mockResolvedValueOnce([manualSource])
      .mockResolvedValueOnce([manualSource, createdSource]);

    render(<SettingsDashboard widgetInstances={[]} />);

    await user.click(await screen.findByRole('button', { name: 'Bron toevoegen' }));

    const dialog = await screen.findByRole('dialog', { name: 'Kalenderbron toevoegen' });
    await user.type(within(dialog).getByLabelText('Naam'), 'Sportclub');
    await user.clear(within(dialog).getByLabelText('Icoon'));
    await user.type(within(dialog).getByLabelText('Icoon'), '⚽');
    await user.selectOptions(within(dialog).getByLabelText('Verversritme'), 'daily');
    await user.type(within(dialog).getByLabelText('Feedadres'), 'https://example.test/sports.ics');
    await user.click(within(dialog).getByRole('button', { name: 'Bron toevoegen' }));

    await waitFor(() =>
      expect(createCalendarSource).toHaveBeenCalledWith({
        name: 'Sportclub',
        icon: '⚽',
        enabled: true,
        type: 'iCalFeed',
        pollInterval: 'daily',
        providerConfiguration: { kind: 'iCalFeed', feedUrl: 'https://example.test/sports.ics' },
      }),
    );
    expect(await screen.findByText('Sportclub is toegevoegd.')).not.toBeNull();
    expect(await screen.findByText('Sportclub')).not.toBeNull();
  });

  it('updates, refreshes, toggles, and removes a managed source', async () => {
    const user = userEvent.setup();
    const updatedSource = {
      ...schoolFeedSource,
      name: 'Schoolagenda',
      state: 'healthy' as const,
      canDisplayEvents: true,
      lastSuccessfulSyncUtc: '2026-07-05T20:00:00.000Z',
      lastError: undefined,
    };

    loadCalendarSources
      .mockResolvedValueOnce([manualSource, schoolFeedSource])
      .mockResolvedValueOnce([manualSource, updatedSource])
      .mockResolvedValueOnce([manualSource, updatedSource])
      .mockResolvedValueOnce([manualSource, { ...updatedSource, enabled: false, state: 'disabled' as const, canDisplayEvents: false }]);
    updateCalendarSource.mockResolvedValueOnce(updatedSource);
    setCalendarSourceEnabled.mockResolvedValueOnce({
      ...updatedSource,
      enabled: false,
      state: 'disabled' as const,
      canDisplayEvents: false,
    });
    refreshCalendarSource.mockResolvedValueOnce({
      sourceId: updatedSource.id,
      succeeded: true,
      state: 'healthy',
      attemptedAtUtc: '2026-07-05T20:05:00.000Z',
      successfulAtUtc: '2026-07-05T20:05:00.000Z',
      createdCount: 2,
      updatedCount: 1,
      deletedCount: 0,
      unchangedCount: 3,
      warningCount: 0,
    });

    render(<SettingsDashboard widgetInstances={[]} />);

    await user.click(await screen.findByRole('button', { name: 'Bewerken' }));
    const editDialog = await screen.findByRole('dialog', { name: 'Kalenderbron bewerken' });
    const nameInput = within(editDialog).getByLabelText('Naam');
    await user.clear(nameInput);
    await user.type(nameInput, 'Schoolagenda');
    await user.click(within(editDialog).getByRole('button', { name: 'Bron opslaan' }));

    expect(await screen.findByText('Schoolagenda is bijgewerkt.')).not.toBeNull();
    expect(await screen.findByText('Schoolagenda')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Verversen' }));
    expect(await screen.findByText('Schoolagenda: Verversd: 2 nieuw, 1 bijgewerkt, 3 gelijk gebleven.')).not.toBeNull();

    await user.click(screen.getByLabelText('Schoolagenda uitschakelen'));
    await waitFor(() =>
      expect(setCalendarSourceEnabled).toHaveBeenCalledWith(expect.objectContaining({ id: 'school-feed' }), false),
    );
    expect(await screen.findByText('Schoolagenda is uitgeschakeld.')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Verwijderen' }));
    const deleteDialog = await screen.findByRole('dialog', { name: 'Kalenderbron verwijderen' });
    await user.click(within(deleteDialog).getByRole('button', { name: 'Bron verwijderen' }));

    await waitFor(() => expect(deleteCalendarSource).toHaveBeenCalledWith('school-feed'));
    expect(await screen.findByText('Schoolagenda is verwijderd.')).not.toBeNull();
  });

  it('shows refresh-all results without a page reload', async () => {
    const user = userEvent.setup();

    loadCalendarSources
      .mockResolvedValueOnce([manualSource, schoolFeedSource])
      .mockResolvedValueOnce([
        manualSource,
        { ...schoolFeedSource, state: 'healthy' as const, canDisplayEvents: true, lastError: undefined },
      ]);
    refreshAllCalendarSources.mockResolvedValueOnce([
      {
        sourceId: 'school-feed',
        succeeded: true,
        state: 'healthy',
        attemptedAtUtc: '2026-07-05T20:05:00.000Z',
        successfulAtUtc: '2026-07-05T20:05:00.000Z',
        createdCount: 1,
        updatedCount: 0,
        deletedCount: 0,
        unchangedCount: 4,
        warningCount: 0,
      },
    ]);

    render(<SettingsDashboard widgetInstances={[]} />);

    await user.click(await screen.findByRole('button', { name: 'Alles verversen' }));

    expect(await screen.findByText('1 bron ververst zonder fouten.')).not.toBeNull();
    expect(screen.getByText('Verversd: 1 nieuw, 4 gelijk gebleven.')).not.toBeNull();
  });
});
