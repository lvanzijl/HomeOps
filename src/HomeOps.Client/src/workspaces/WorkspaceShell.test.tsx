import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceShell } from './WorkspaceShell';

vi.mock('./workspaceLayout', () => ({
  loadWorkspaceLayout: vi.fn(),
}));

vi.mock('../home/HomeDashboard', () => ({
  HomeDashboard: ({ onNavigate }: { onNavigate: (destination: 'agenda' | 'lists' | 'tasks' | 'house' | 'media' | 'gamification' | 'settings') => void }) => (
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

  it('keeps workspace navigation functional while loading layouts by workspace', async () => {
    const user = userEvent.setup();
    const workspaceLayout = await mockedWorkspaceLayout();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');
    await user.click(screen.getByRole('button', { name: 'House Status' }));

    await waitFor(() => expect(workspaceLayout.loadWorkspaceLayout).toHaveBeenCalledWith('house'));
    const placeholder = await screen.findByLabelText('House Status placeholder page');
    expect(within(placeholder).getByText('House Status')).not.toBeNull();
    expect(within(placeholder).getByText('For home alerts, sensors, and device state.')).not.toBeNull();
    expect(within(placeholder).getByText('Not implemented yet.')).not.toBeNull();
  });

  it('shows future domain navigation and placeholder pages with domain classes', async () => {
    const user = userEvent.setup();
    render(<WorkspaceShell />);

    await screen.findByText('Open Agenda');

    const mediaButton = screen.getByRole('button', { name: 'Media' });
    const gamificationButton = screen.getByRole('button', { name: 'Gamification' });
    expect(mediaButton.className).toContain('domain-media');
    expect(gamificationButton.className).toContain('domain-gamification');

    await user.click(mediaButton);
    const mediaPlaceholder = await screen.findByLabelText('Media placeholder page');
    expect(within(mediaPlaceholder).getByText('For media reminders and future household media context.')).not.toBeNull();

    await user.click(gamificationButton);
    const gamificationPlaceholder = await screen.findByLabelText('Gamification placeholder page');
    expect(within(gamificationPlaceholder).getByText('For points, rewards, and family progress after Tasks mature.')).not.toBeNull();
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
