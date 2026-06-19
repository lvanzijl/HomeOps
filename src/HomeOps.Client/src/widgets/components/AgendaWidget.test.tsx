import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventSource, NormalizedEvent } from '../../events/eventSourceModel';
import { AgendaWidget } from './AgendaWidget';

vi.mock('../../agenda/calendarEventsApi', () => ({
  loadCalendarAgendaData: vi.fn(),
  createCalendarAgendaEvent: vi.fn(),
  updateCalendarAgendaEvent: vi.fn(),
  deleteCalendarAgendaEvent: vi.fn(),
}));

async function mockedCalendarEventsApi() {
  return await import('../../agenda/calendarEventsApi');
}

const calendarSource: EventSource = {
  id: 'manual-source',
  name: 'HomeOps Calendar',
  type: 'manual',
  enabled: true,
  capability: 'writable',
  visibility: { visibleByDefault: true, groupName: 'Household' },
  color: { hex: '#4f46e5' },
};

const dentistEvent: NormalizedEvent = {
  id: 'dentist',
  sourceId: calendarSource.id,
  title: 'Dentist Appointment',
  startsAt: '2026-06-18T09:30:00.000Z',
  endsAt: '2026-06-18T10:15:00.000Z',
  allDay: false,
  editable: true,
};

const widgetProps = {
  definition: {
    id: 'agenda-mvp',
    type: 'agenda' as const,
    title: 'Agenda',
    settings: {},
  },
  instance: {
    id: 'home-agenda-widget',
    widgetDefinitionId: 'agenda-mvp',
    title: 'Agenda',
    settings: {},
  },
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('AgendaWidget HomeOps Calendar event integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.localStorage.clear();
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.loadCalendarAgendaData).mockResolvedValue({ sources: [calendarSource], events: [dentistEvent] });
    vi.mocked(calendarEventsApi.createCalendarAgendaEvent).mockResolvedValue({
      id: 'new-event',
      sourceId: calendarSource.id,
      title: 'New Calendar Event',
      startsAt: '2026-06-22T09:00:00.000Z',
      endsAt: '2026-06-22T10:00:00.000Z',
      allDay: false,
      editable: true,
    });
    vi.mocked(calendarEventsApi.updateCalendarAgendaEvent).mockResolvedValue({ ...dentistEvent, title: 'Updated Dentist' });
    vi.mocked(calendarEventsApi.deleteCalendarAgendaEvent).mockResolvedValue(undefined);
  });

  it('loads persisted calendar events while keeping birthday events available', async () => {
    render(<AgendaWidget {...widgetProps} />);

    expect(await screen.findByText('Dentist Appointment')).not.toBeNull();
    expect(screen.getByText('Avery birthday')).not.toBeNull();
  });

  it('creates, updates, and deletes calendar events through the API-backed widget UI', async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.type(screen.getByPlaceholderText('Calendar event title'), 'New Calendar Event');
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Calendar Event' }));
    expect(await screen.findByText('New Calendar Event')).not.toBeNull();

    await user.click(within(screen.getByText('Dentist Appointment').closest('li')!).getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByPlaceholderText('Calendar event title'));
    await user.type(screen.getByPlaceholderText('Calendar event title'), 'Updated Dentist');
    await user.click(screen.getByRole('button', { name: 'Update Event' }));

    expect(calendarEventsApi.updateCalendarAgendaEvent).toHaveBeenCalledWith('dentist', expect.objectContaining({ title: 'Updated Dentist' }));
    expect(await screen.findByText('Updated Dentist')).not.toBeNull();

    await user.click(within(screen.getByText('Updated Dentist').closest('li')!).getByRole('button', { name: 'Delete' }));

    expect(calendarEventsApi.deleteCalendarAgendaEvent).toHaveBeenCalledWith('dentist');
    await waitFor(() => expect(screen.queryByText('Updated Dentist')).toBeNull());
  });

  it('shows create validation and prevents invalid timed event submission', async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Calendar event title is required.');
    expect(calendarEventsApi.createCalendarAgendaEvent).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText('Calendar event title'), 'Invalid Range');
    await user.clear(screen.getByLabelText('End'));
    await user.type(screen.getByLabelText('End'), '2026-06-22T08:00');
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Event end must be on or after event start.');
    expect(calendarEventsApi.createCalendarAgendaEvent).not.toHaveBeenCalled();
  });

  it('submits all-day and timed events with matching payloads', async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.type(screen.getByPlaceholderText('Calendar event title'), 'All Day Trip');
    await user.click(screen.getByLabelText('All day'));
    await user.clear(screen.getByLabelText('Start'));
    await user.type(screen.getByLabelText('Start'), '2026-07-01');
    await user.clear(screen.getByLabelText('End'));
    await user.type(screen.getByLabelText('End'), '2026-07-02');
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: 'All Day Trip',
      startsAt: '2026-07-01T00:00',
      endsAt: '2026-07-02T00:00',
      allDay: true,
    }));

    await user.type(screen.getByPlaceholderText('Calendar event title'), 'Timed Trip');
    await user.click(screen.getByRole('button', { name: 'Add Event' }));

    expect(calendarEventsApi.createCalendarAgendaEvent).toHaveBeenLastCalledWith(expect.objectContaining({
      title: 'Timed Trip',
      startsAt: '2026-06-22T09:00',
      endsAt: '2026-06-22T10:00',
      allDay: false,
    }));
  });

  it('shows API validation errors during edit and delete failures', async () => {
    const user = userEvent.setup();
    const calendarEventsApi = await mockedCalendarEventsApi();
    vi.mocked(calendarEventsApi.updateCalendarAgendaEvent).mockRejectedValueOnce(Object.assign(new Error('Bad Request'), {
      response: JSON.stringify({ errors: { EndUtc: ['Event end must be on or after event start.'] } }),
    }));
    vi.mocked(calendarEventsApi.deleteCalendarAgendaEvent).mockRejectedValueOnce(new Error('Delete failed'));
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.click(within(screen.getByText('Dentist Appointment').closest('li')!).getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Update Event' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Event end must be on or after event start.');

    await user.click(within(screen.getByText('Dentist Appointment').closest('li')!).getByRole('button', { name: 'Delete' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Delete failed');
  });

  it('keeps source filtering functional for persisted calendar and birthday sources', async () => {
    const user = userEvent.setup();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.click(screen.getByLabelText(/HomeOps Calendar/));

    expect(screen.queryByText('Dentist Appointment')).toBeNull();
    expect(screen.getByText('Avery birthday')).not.toBeNull();
  });
});
