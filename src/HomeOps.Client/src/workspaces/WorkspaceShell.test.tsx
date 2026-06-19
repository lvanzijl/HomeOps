import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceShell } from './WorkspaceShell';

vi.mock('./workspaceLayout', () => ({
  loadWorkspaceLayout: vi.fn(),
}));

vi.mock('../home/HomeDashboard', () => ({
  HomeDashboard: ({ onNavigate }: { onNavigate: (destination: 'agenda' | 'lists') => void }) => (
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
    await user.click(screen.getByRole('button', { name: 'House' }));

    await waitFor(() => expect(workspaceLayout.loadWorkspaceLayout).toHaveBeenCalledWith('house'));
    expect(await screen.findByText('house placeholder')).not.toBeNull();
  });
});
