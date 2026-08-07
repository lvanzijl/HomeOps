import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarRepairDialog } from './CalendarRepairDialog';
import * as api from './calendarRepairApi';

vi.mock('./calendarRepairApi', () => ({
  loadCalendarRepairCandidates: vi.fn(),
  previewCalendarRepair: vi.fn(),
  applyCalendarRepair: vi.fn(),
}));

const candidate = {
  eventId: 'event-1', title: 'Oude afspraak', updatedUtc: '2026-08-07T10:00:00Z',
  startDate: '2026-07-01', startTime: '09:00', endDate: '2026-07-01', endTime: '10:00', isAllDay: false,
};

describe('CalendarRepairDialog', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.mocked(api.loadCalendarRepairCandidates).mockResolvedValue([candidate]);
    vi.mocked(api.applyCalendarRepair).mockResolvedValue(undefined);
  });

  it('previews and explicitly applies one correction', async () => {
    vi.mocked(api.previewCalendarRepair).mockResolvedValue({
      eventId: candidate.eventId, currentTiming: candidate, proposedTiming: candidate,
      proposedStartUtc: '2026-07-01T07:00:00Z', proposedEndUtc: '2026-07-01T08:00:00Z',
    });
    const user = userEvent.setup();
    render(<CalendarRepairDialog onClose={vi.fn()} />);
    await screen.findByDisplayValue('Oude afspraak · 2026-07-01');
    await user.click(screen.getByRole('button', { name: 'Voorbeeld maken' }));
    await screen.findByRole('region', { name: 'Projectievoorbeeld' });
    await user.click(screen.getByText('Ik bevestig deze correctie voor één afspraak.'));
    await user.click(screen.getByRole('button', { name: 'Correctie opslaan' }));
    expect(api.applyCalendarRepair).toHaveBeenCalledWith(candidate, expect.objectContaining({ startDate: '2026-07-01', startTime: '09:00' }));
  });

  it('retains corrected input after a preview error', async () => {
    vi.mocked(api.previewCalendarRepair).mockRejectedValue(new Error('Deze tijd bestaat niet door de zomertijd.'));
    const user = userEvent.setup();
    render(<CalendarRepairDialog onClose={vi.fn()} />);
    const startTime = await screen.findByLabelText('Starttijd');
    await user.clear(startTime); await user.type(startTime, '02:30');
    await user.click(screen.getByRole('button', { name: 'Voorbeeld maken' }));
    await screen.findByText('Deze tijd bestaat niet door de zomertijd.');
    expect(startTime).toHaveProperty('value', '02:30');
  });
});
