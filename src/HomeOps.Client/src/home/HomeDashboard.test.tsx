import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeDashboard } from './HomeDashboard';
import { familyMembers } from './familyMembers';

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
    render(<HomeDashboard members={familyMembers} onNavigate={vi.fn()} onSelectFamilyMember={vi.fn()} />);

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



  it('selects a family member instead of opening the avatar editor on Home', async () => {
    const user = userEvent.setup();
    const onSelectFamilyMember = vi.fn();
    render(<HomeDashboard members={familyMembers} onNavigate={vi.fn()} onSelectFamilyMember={onSelectFamilyMember} />);

    await user.click(screen.getByRole('button', { name: 'Open Alex family member page' }));

    expect(onSelectFamilyMember).toHaveBeenCalledWith('alex');
    expect(screen.queryByRole('dialog', { name: /avatar editor/i })).toBeNull();
  });

  it('navigates from summary content, overflow, and quick capture actions', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<HomeDashboard members={familyMembers} onNavigate={onNavigate} onSelectFamilyMember={vi.fn()} />);
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
