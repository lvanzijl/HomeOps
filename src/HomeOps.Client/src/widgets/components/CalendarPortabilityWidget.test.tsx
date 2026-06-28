import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarExportDocument } from '../../api/homeOpsApiClient';
import { CalendarPortabilityWidget } from './CalendarPortabilityWidget';

const exportDocument = CalendarExportDocument.fromJS({
  format: 'homeops.calendar.export',
  schemaVersion: 1,
  exportedUtc: '2026-06-19T00:00:00.000Z',
  household: { id: '11111111-1111-1111-1111-111111111111', timeZoneId: 'Europe/Amsterdam' },
  calendar: { version: 1, eventSources: [], eventSeries: [], recurrence: { rules: [] }, exceptions: [], metadata: {} },
  metadata: {},
});

const restoreCalendar = vi.fn();

vi.mock('../../calendarPortability', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../calendarPortability')>();
  return {
    ...actual,
    createCalendarPortabilityClient: () => ({
      exportCalendar: vi.fn(),
      restoreCalendar,
    }),
    downloadCalendarExport: vi.fn(),
  };
});

afterEach(() => cleanup());

describe('CalendarPortabilityWidget restore safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    restoreCalendar.mockResolvedValue(undefined);
  });

  it('requires explicit confirmation before running destructive restore', async () => {
    const user = userEvent.setup();
    const file = new File([JSON.stringify(exportDocument.toJSON())], 'calendar.json', { type: 'application/json' });

    render(<CalendarPortabilityWidget />);

    expect(screen.getByText(/Herstellen vervangt de huidige gezinsagenda door de gekozen back-up/i)).not.toBeNull();
    const restoreButton = screen.getByRole('button', { name: 'Agenda herstellen' });
    expect(restoreButton).toHaveProperty('disabled', true);

    await user.upload(screen.getByLabelText(/Back-upbestand kiezen/i), file);
    await waitFor(() => expect(screen.getByText(/Back-up van 2026-06-19T00:00:00.000Z/i)).not.toBeNull());
    expect(restoreButton).toHaveProperty('disabled', true);

    await user.click(screen.getByLabelText(/Ik begrijp dat herstellen de huidige gezinsagenda vervangt/i));
    expect(restoreButton).toHaveProperty('disabled', false);
    await user.click(restoreButton);

    expect(restoreCalendar).toHaveBeenCalledWith(expect.objectContaining({ format: 'homeops.calendar.export' }));
  });
});
