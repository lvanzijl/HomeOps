import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeDashboard } from './HomeDashboard';

vi.mock('../agenda/calendarEventsApi', () => ({ loadCalendarAgendaData: vi.fn() }));
vi.mock('../shopping/listsSummaryApi', () => ({ loadListSummaries: vi.fn() }));
vi.mock('../demo/demoAgendaData', () => ({ demoReadOnlyEvents: [], demoReadOnlyEventSources: [] }));

async function agendaApi() { return await import('../agenda/calendarEventsApi'); }
async function listsApi() { return await import('../shopping/listsSummaryApi'); }

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('HomeDashboard', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2026-06-19T08:30:00Z'));
    const agenda = await agendaApi();
    vi.mocked(agenda.loadCalendarAgendaData).mockResolvedValue({
      sources: [{ id: 'calendar', name: 'HomeOps Calendar', type: 'manual', enabled: true, capability: 'writable', visibility: { visibleByDefault: true }, color: { hex: '#93c5fd' } }],
      events: Array.from({ length: 7 }, (_, index) => ({
        id: `event-${index}`,
        sourceId: 'calendar',
        title: `Event ${index + 1}`,
        startsAt: `2026-06-${index < 4 ? '19' : '20'}T${String(9 + index).padStart(2, '0')}:00:00.000Z`,
        endsAt: `2026-06-${index < 4 ? '19' : '20'}T${String(10 + index).padStart(2, '0')}:00:00.000Z`,
        allDay: false,
        editable: true,
      })),
    });
    const lists = await listsApi();
    vi.mocked(lists.loadListSummaries).mockResolvedValue([
      { id: 'shopping', name: 'Shopping', activeItems: [
        { id: 'milk', text: 'Milk' }, { id: 'bread', text: 'Bread' }, { id: 'apples', text: 'Apples' },
      ] },
      { id: 'packing', name: 'Vacation Packing', activeItems: [
        { id: 'sunscreen', text: 'Sunscreen' }, { id: 'chargers', text: 'Chargers' },
      ] },
    ]);
  });

  it('renders the Home dashboard, family members, agenda summary, lists summary, and overflow', async () => {
    render(<HomeDashboard onNavigate={vi.fn()} />);

    expect(screen.getByLabelText('Home dashboard')).not.toBeNull();
    expect(screen.getByLabelText('Family Members')).not.toBeNull();
    expect(screen.getByText('Alex')).not.toBeNull();
    expect(await screen.findByText('Event 1')).not.toBeNull();
    expect(screen.getByText('Tomorrow')).not.toBeNull();
    expect(screen.getByText('Milk')).not.toBeNull();
    expect(screen.getByText('Vacation Packing')).not.toBeNull();
    expect(screen.getByText('+2 more')).not.toBeNull();
    expect(screen.getByText('+1 more')).not.toBeNull();
  });



  it('opens the household avatar editor and changes avatar parts without profile wording', async () => {
    const user = userEvent.setup();
    render(<HomeDashboard onNavigate={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Edit Alex household avatar' }));

    expect(screen.getByRole('dialog', { name: 'Alex household member avatar editor' })).not.toBeNull();
    expect(screen.getByText('This changes only the friendly Home avatar. It is not a login, account, security, or profile setting.')).not.toBeNull();
    expect(screen.queryByText(/task count|points|rewards|permissions/i)).toBeNull();

    await user.selectOptions(screen.getByLabelText('Hair style'), 'curly');
    await user.selectOptions(screen.getByLabelText('Shirt color'), '#34d399');

    expect(screen.getByLabelText('Hair style')).toHaveProperty('value', 'curly');
    expect(screen.getByLabelText('Shirt color')).toHaveProperty('value', '#34d399');
  });

  it('navigates from summary content, overflow, and quick capture actions', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<HomeDashboard onNavigate={onNavigate} />);
    await screen.findByText('Event 1');

    await user.click(screen.getByText('Event 1'));
    expect(onNavigate).toHaveBeenCalledWith('agenda');

    await user.click(screen.getByRole('button', { name: '+ Event' }));
    expect(onNavigate).toHaveBeenCalledWith('agenda');

    await user.click(screen.getByRole('button', { name: '+ List item' }));
    expect(onNavigate).toHaveBeenCalledWith('lists');

    await user.click(screen.getByRole('button', { name: '+1 more' }));
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('lists'));
  });
});
