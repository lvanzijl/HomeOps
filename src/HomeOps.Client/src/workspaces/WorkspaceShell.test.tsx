import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceShell } from './WorkspaceShell';
import type { WorkspaceId } from './workspaceModel';

vi.mock('./workspaceLayout', () => ({
  loadWorkspaceLayout: vi.fn(),
}));

vi.mock('../home/HomeDashboard', () => ({
  HomeDashboard: ({ onNavigate }: { onNavigate: (destination: WorkspaceId) => void }) => (
    <section aria-label="Home dashboard"><button onClick={() => onNavigate('agenda')} type="button">Open Agenda</button></section>
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

  it('restricts primary navigation to daily household work', async () => {
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const dailyWork = screen.getByLabelText('Daily work');
    expect(within(dailyWork).getByRole('button', { name: 'Home' })).not.toBeNull();
    expect(within(dailyWork).getByRole('button', { name: 'Agenda' })).not.toBeNull();
    expect(within(dailyWork).getByRole('button', { name: 'Tasks' })).not.toBeNull();
    expect(within(dailyWork).getByRole('button', { name: 'Lists' })).not.toBeNull();
    expect(within(dailyWork).getByRole('button', { name: 'Motivation' })).not.toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'Settings' })).toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'Weekly Reset' })).toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'Media' })).toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'House Status' })).toBeNull();
    expect(within(dailyWork).queryByRole('button', { name: 'Gamification' })).toBeNull();
  });

  it('keeps secondary and future routes reachable outside primary navigation', async () => {
    const user = userEvent.setup();
    const workspaceLayout = await mockedWorkspaceLayout();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const secondary = screen.getByLabelText('Occasional and future work');
    await user.click(within(secondary).getByRole('button', { name: 'House Status' }));

    await waitFor(() => expect(workspaceLayout.loadWorkspaceLayout).toHaveBeenCalledWith('house'));
    const placeholder = await screen.findByLabelText('House Status placeholder page');
    expect(within(placeholder).getByText('House Status')).not.toBeNull();
    expect(within(placeholder).getByText('For home alerts, sensors, and device state.')).not.toBeNull();
    expect(within(placeholder).getByText('Not implemented yet.')).not.toBeNull();
  });

  it('keeps settings available as administration instead of primary navigation', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const administration = screen.getByLabelText('Administration');
    expect(within(administration).getByRole('button', { name: 'Settings administration' })).not.toBeNull();

    await user.click(within(administration).getByRole('button', { name: 'Settings administration' }));
    expect(await screen.findByText('Calendar Export / Restore')).not.toBeNull();
  });

  it('keeps Weekly Reset reachable as occasional work and from Tasks', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    await user.click(screen.getByRole('button', { name: 'Tasks' }));
    await user.click(await screen.findByRole('button', { name: 'Open full reset' }));
    expect(await screen.findByRole('heading', { name: 'Weekly Reset' })).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Home' }));
    const secondary = screen.getByLabelText('Occasional and future work');
    await user.click(within(secondary).getByRole('button', { name: 'Weekly Reset' }));
    expect(await screen.findByRole('heading', { name: 'Weekly Reset' })).not.toBeNull();
  });

  it('applies the active workspace domain color class to the shell', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    const shell = screen.getByLabelText('Workspace shell');
    expect(shell.className).toContain('domain-home');

    await user.click(screen.getByRole('button', { name: 'Tasks' }));
    expect(shell.className).toContain('domain-tasks');
  });
});
