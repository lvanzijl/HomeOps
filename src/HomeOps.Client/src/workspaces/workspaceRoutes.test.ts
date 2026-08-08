import { describe, expect, it } from 'vitest';
import { resolveWorkspaceRoute, workspacePath } from './workspaceRoutes';

describe('workspace routes', () => {
  it('maps every visible top-level workspace through one route table', () => {
    expect(resolveWorkspaceRoute('/')).toEqual({ workspaceId: 'home', houseView: 'summary' });
    expect(resolveWorkspaceRoute('/agenda')).toEqual({ workspaceId: 'agenda', houseView: 'summary' });
    expect(resolveWorkspaceRoute('/taken')).toEqual({ workspaceId: 'tasks', houseView: 'summary' });
    expect(resolveWorkspaceRoute('/boodschappen')).toEqual({ workspaceId: 'lists', houseView: 'summary' });
    expect(resolveWorkspaceRoute('/motivatie')).toEqual({ workspaceId: 'motivation', houseView: 'summary' });
    expect(resolveWorkspaceRoute('/woning')).toEqual({ workspaceId: 'house', houseView: 'summary' });
    expect(resolveWorkspaceRoute('/woning/klimaat/')).toEqual({ workspaceId: 'house', houseView: 'climate' });
    expect(resolveWorkspaceRoute('/instellingen')).toEqual({ workspaceId: 'settings', houseView: 'summary' });
    expect(resolveWorkspaceRoute('/weekritueel')).toEqual({ workspaceId: 'weeklyReset', houseView: 'summary' });
    expect(resolveWorkspaceRoute('/onbekend')).toBeNull();
  });

  it('generates stable Woning summary and climate paths', () => {
    expect(workspacePath('house')).toBe('/woning');
    expect(workspacePath('house', 'climate')).toBe('/woning/klimaat');
    expect(workspacePath('settings')).toBe('/instellingen');
  });
});
