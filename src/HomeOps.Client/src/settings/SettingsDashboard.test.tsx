import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarExportDocument } from '../api/homeOpsApiClient';
import { SettingsDashboard } from './SettingsDashboard';

const exportDocument = CalendarExportDocument.fromJS({
  format: 'homeops.calendar.export',
  schemaVersion: 1,
  exportedUtc: '2026-06-19T00:00:00.000Z',
  household: { id: '11111111-1111-1111-1111-111111111111', timeZoneId: 'Europe/Amsterdam' },
  calendar: { version: 1, eventSources: [], eventSeries: [], recurrence: { rules: [] }, exceptions: [], metadata: {} },
  metadata: {},
});

const exportCalendar = vi.fn();
const restoreCalendar = vi.fn();
const downloadCalendarExport = vi.fn();

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

afterEach(() => cleanup());

describe('SettingsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportCalendar.mockResolvedValue(exportDocument);
    restoreCalendar.mockResolvedValue(undefined);
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
});
