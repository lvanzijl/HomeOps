import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceShell } from './WorkspaceShell';
import type { WorkspaceId } from './workspaceModel';

vi.mock('./workspaceLayout', () => ({
  loadWorkspaceLayout: vi.fn(),
}));


vi.mock('../home/familyMembersApi', () => ({
  loadFamilyMembers: vi.fn(async () => [{ id: 'alex', name: 'Alex', displayColor: '#f8c8dc', initials: 'A', memberKind: 'adult', dateOfBirth: null }]),
  createFamilyMember: vi.fn(),
  saveFamilyMember: vi.fn(async (member) => member),
  removeFamilyMember: vi.fn(async () => undefined),
}));

vi.mock('../home/HomeDashboard', () => ({
  HomeDashboard: ({ onNavigate, onSelectFamilyMember }: { onNavigate: (destination: WorkspaceId) => void; onSelectFamilyMember: (memberId: string) => void }) => (
    <section aria-label="Home dashboard">
      <button onClick={() => onNavigate('agenda')} type="button">Open Agenda</button>
      <button onClick={() => onSelectFamilyMember('alex')} type="button">Open Alex</button>
    </section>
  ),
}));

vi.mock('../widgets/WidgetRenderer', () => ({
  WidgetRenderer: ({ instance }: { instance: { title: string } }) => <article>{instance.title}</article>,
}));

async function mockedWorkspaceLayout() {
  return await import('./workspaceLayout');
}

afterEach(() => cleanup());

describe('WorkspaceShell API-backed layouts', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const workspaceLayout = await mockedWorkspaceLayout();
    vi.mocked(workspaceLayout.loadWorkspaceLayout).mockImplementation(async (workspaceId) => ({
      source: 'api',
      widgetInstances: workspaceId === 'home'
        ? [
            { id: 'home-agenda', widgetDefinitionId: 'agenda-mvp', title: 'Agenda', settings: {} },
            { id: 'home-shopping', widgetDefinitionId: 'shopping-list-mvp', title: 'Shopping List', settings: {} },
          ]
        : [{ id: `${workspaceId}-placeholder`, widgetDefinitionId: `${workspaceId}-placeholder`, title: `${workspaceId} placeholder`, settings: {} }],
    }));
  });

  it('loads and renders widgets from the persisted active workspace layout', async () => {
    const workspaceLayout = await mockedWorkspaceLayout();

    render(<WorkspaceShell />);

    expect(await screen.findByText('Open Agenda')).not.toBeNull();
    expect(screen.getByLabelText('Home dashboard')).not.toBeNull();
    expect(workspaceLayout.loadWorkspaceLayout).toHaveBeenCalledWith('home');
  });

  it('reserves a non-interactive back slot until a family member detail page needs it', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const reservedSlot = document.querySelector('.workspace-back-slot-hidden');
    expect(reservedSlot).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Terug naar familieoverzicht' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Open Alex' }));

    const backButton = await screen.findByRole('button', { name: 'Terug naar familieoverzicht' });
    expect(backButton.className).toContain('workspace-back-button');
    expect(document.querySelector('.workspace-back-slot-hidden')).toBeNull();

    await user.click(backButton);
    expect(await screen.findByText('Open Agenda')).not.toBeNull();
  });

  it('restricts primary navigation to daily household work', async () => {
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const dailyWork = screen.getByLabelText('Dagelijkse gezinsplekken');
    expect(within(dailyWork).getByRole('button', { name: 'Thuis' })).not.toBeNull();
    expect(within(dailyWork).getByRole('button', { name: 'Agenda' })).not.toBeNull();
    expect(within(dailyWork).getByRole('button', { name: 'Taken' })).not.toBeNull();
    expect(within(dailyWork).getByRole('button', { name: 'Boodschappen' })).not.toBeNull();
    expect(within(dailyWork).getByRole('button', { name: 'Motivatie' })).not.toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'Instellingen' })).toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'Weekritueel' })).toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'Media' })).toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'House Status' })).toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'Gamification' })).toBeNull();
  });

  it('removes future surfaces from user-facing beta navigation', async () => {
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    expect(screen.queryByRole('button', { name: 'House Status' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Media' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Gamification' })).toBeNull();
    expect(screen.queryByLabelText('Incidenteel en toekomstig werk')).toBeNull();
  });

  it('keeps settings available as administration instead of primary navigation', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const administration = screen.getByLabelText('Gezinsinstellingen');
    expect(within(administration).getByRole('button', { name: 'Instellingen voor gezinsinstellingen' })).not.toBeNull();

    await user.click(within(administration).getByRole('button', { name: 'Instellingen voor gezinsinstellingen' }));
    expect(await screen.findByText('Agenda exporteren / herstellen')).not.toBeNull();
  });

  it('keeps Weekly Reset reachable contextually from Tasks', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    await user.click(screen.getByRole('button', { name: 'Taken' }));
    await user.click(await screen.findByRole('button', { name: 'Gezinsreset openen' }));
    expect(await screen.findByRole('heading', { name: 'Weekritueel' })).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Thuis' }));
    expect(screen.queryByRole('button', { name: 'Weekritueel' })).toBeNull();
  });

  it('applies the active workspace domain color class to the shell', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const shell = screen.getByLabelText('Gezinsbord');
    expect(shell.className).toContain('domain-home');

    await user.click(screen.getByRole('button', { name: 'Taken' }));
    expect(shell.className).toContain('domain-tasks');
  });

  it('wraps workspace content in a dedicated page body container', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const homePanel = document.querySelector('.workspace-panel-home');
    const homePageBody = homePanel?.querySelector('.workspace-page-body');
    expect(homePageBody).not.toBeNull();
    expect(homePageBody?.querySelector('[aria-label="Home dashboard"]')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Agenda' }));

    const agendaPanel = document.querySelector('.workspace-panel-agenda');
    const agendaPageBody = agendaPanel?.querySelector('.workspace-page-body');
    expect(agendaPageBody).not.toBeNull();
    expect(agendaPageBody?.querySelector('[aria-label="Agenda widgets"]')).not.toBeNull();
  });
});
