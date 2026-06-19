import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventSource, NormalizedEvent } from '../../events/eventSourceModel';
import { AgendaWidget } from './AgendaWidget';

vi.mock('../../agenda/manualEventsApi', () => ({
  loadManualAgendaData: vi.fn(),
  createManualAgendaEvent: vi.fn(),
  updateManualAgendaEvent: vi.fn(),
  deleteManualAgendaEvent: vi.fn(),
}));

async function mockedManualEventsApi() {
  return await import('../../agenda/manualEventsApi');
}

const manualSource: EventSource = {
  id: 'manual-source',
  name: 'HomeOps Manual Events',
  type: 'manual',
  enabled: true,
  capability: 'writable',
  visibility: { visibleByDefault: true, groupName: 'Household' },
  color: { hex: '#4f46e5' },
};

const dentistEvent: NormalizedEvent = {
  id: 'dentist',
  sourceId: manualSource.id,
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

describe('AgendaWidget manual events integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.localStorage.clear();
    const manualEventsApi = await mockedManualEventsApi();
    vi.mocked(manualEventsApi.loadManualAgendaData).mockResolvedValue({ sources: [manualSource], events: [dentistEvent] });
    vi.mocked(manualEventsApi.createManualAgendaEvent).mockResolvedValue({
      id: 'new-event',
      sourceId: manualSource.id,
      title: 'New Manual Event',
      startsAt: '2026-06-22T09:00:00.000Z',
      endsAt: '2026-06-22T10:00:00.000Z',
      allDay: false,
      editable: true,
    });
    vi.mocked(manualEventsApi.updateManualAgendaEvent).mockResolvedValue({ ...dentistEvent, title: 'Updated Dentist' });
    vi.mocked(manualEventsApi.deleteManualAgendaEvent).mockResolvedValue(undefined);
  });

  it('loads persisted manual events while keeping birthday events available', async () => {
    render(<AgendaWidget {...widgetProps} />);

    expect(await screen.findByText('Dentist Appointment')).not.toBeNull();
    expect(screen.getByText('Avery birthday')).not.toBeNull();
  });

  it('creates, updates, and deletes manual events through the API-backed widget UI', async () => {
    const user = userEvent.setup();
    const manualEventsApi = await mockedManualEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.type(screen.getByPlaceholderText('Manual event title'), 'New Manual Event');
    await user.click(screen.getByRole('button', { name: 'Add Manual Event' }));

    expect(manualEventsApi.createManualAgendaEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Manual Event' }));
    expect(await screen.findByText('New Manual Event')).not.toBeNull();

    await user.click(within(screen.getByText('Dentist Appointment').closest('li')!).getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByPlaceholderText('Manual event title'));
    await user.type(screen.getByPlaceholderText('Manual event title'), 'Updated Dentist');
    await user.click(screen.getByRole('button', { name: 'Update Manual Event' }));

    expect(manualEventsApi.updateManualAgendaEvent).toHaveBeenCalledWith('dentist', expect.objectContaining({ title: 'Updated Dentist' }));
    expect(await screen.findByText('Updated Dentist')).not.toBeNull();

    await user.click(within(screen.getByText('Updated Dentist').closest('li')!).getByRole('button', { name: 'Delete' }));

    expect(manualEventsApi.deleteManualAgendaEvent).toHaveBeenCalledWith('dentist');
    await waitFor(() => expect(screen.queryByText('Updated Dentist')).toBeNull());
  });

  it('shows create validation and prevents invalid timed event submission', async () => {
    const user = userEvent.setup();
    const manualEventsApi = await mockedManualEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.click(screen.getByRole('button', { name: 'Add Manual Event' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Manual event title is required.');
    expect(manualEventsApi.createManualAgendaEvent).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText('Manual event title'), 'Invalid Range');
    await user.clear(screen.getByLabelText('End'));
    await user.type(screen.getByLabelText('End'), '2026-06-22T08:00');
    await user.click(screen.getByRole('button', { name: 'Add Manual Event' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Event end must be on or after event start.');
    expect(manualEventsApi.createManualAgendaEvent).not.toHaveBeenCalled();
  });

  it('submits all-day and timed events with matching payloads', async () => {
    const user = userEvent.setup();
    const manualEventsApi = await mockedManualEventsApi();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.type(screen.getByPlaceholderText('Manual event title'), 'All Day Trip');
    await user.click(screen.getByLabelText('All day'));
    await user.clear(screen.getByLabelText('Start'));
    await user.type(screen.getByLabelText('Start'), '2026-07-01');
    await user.clear(screen.getByLabelText('End'));
    await user.type(screen.getByLabelText('End'), '2026-07-02');
    await user.click(screen.getByRole('button', { name: 'Add Manual Event' }));

    expect(manualEventsApi.createManualAgendaEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: 'All Day Trip',
      startsAt: '2026-07-01T00:00',
      endsAt: '2026-07-02T00:00',
      allDay: true,
    }));

    await user.type(screen.getByPlaceholderText('Manual event title'), 'Timed Trip');
    await user.click(screen.getByRole('button', { name: 'Add Manual Event' }));

    expect(manualEventsApi.createManualAgendaEvent).toHaveBeenLastCalledWith(expect.objectContaining({
      title: 'Timed Trip',
      startsAt: '2026-06-22T09:00',
      endsAt: '2026-06-22T10:00',
      allDay: false,
    }));
  });

  it('shows API validation errors during edit and delete failures', async () => {
    const user = userEvent.setup();
    const manualEventsApi = await mockedManualEventsApi();
    vi.mocked(manualEventsApi.updateManualAgendaEvent).mockRejectedValueOnce(Object.assign(new Error('Bad Request'), {
      response: JSON.stringify({ errors: { EndUtc: ['Event end must be on or after event start.'] } }),
    }));
    vi.mocked(manualEventsApi.deleteManualAgendaEvent).mockRejectedValueOnce(new Error('Delete failed'));
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.click(within(screen.getByText('Dentist Appointment').closest('li')!).getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Update Manual Event' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Event end must be on or after event start.');

    await user.click(within(screen.getByText('Dentist Appointment').closest('li')!).getByRole('button', { name: 'Delete' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Delete failed');
  });

  it('keeps source filtering functional for persisted manual and birthday sources', async () => {
    const user = userEvent.setup();
    render(<AgendaWidget {...widgetProps} />);

    await screen.findByText('Dentist Appointment');
    await user.click(screen.getByLabelText(/HomeOps Manual Events/));

    expect(screen.queryByText('Dentist Appointment')).toBeNull();
    expect(screen.getByText('Avery birthday')).not.toBeNull();
  });
});
