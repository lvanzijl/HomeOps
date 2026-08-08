import type { WorkspaceId } from './workspaceModel';

export type HouseView = 'summary' | 'climate';

export type WorkspaceRoute = {
  workspaceId: WorkspaceId;
  houseView: HouseView;
};

const routes: Readonly<Record<string, WorkspaceRoute>> = {
  '/': { workspaceId: 'home', houseView: 'summary' },
  '/agenda': { workspaceId: 'agenda', houseView: 'summary' },
  '/taken': { workspaceId: 'tasks', houseView: 'summary' },
  '/boodschappen': { workspaceId: 'lists', houseView: 'summary' },
  '/motivatie': { workspaceId: 'motivation', houseView: 'summary' },
  '/woning': { workspaceId: 'house', houseView: 'summary' },
  '/woning/klimaat': { workspaceId: 'house', houseView: 'climate' },
  '/instellingen': { workspaceId: 'settings', houseView: 'summary' },
  '/weekritueel': { workspaceId: 'weeklyReset', houseView: 'summary' },
};

const paths: Partial<Record<WorkspaceId, string>> = {
  home: '/',
  agenda: '/agenda',
  tasks: '/taken',
  lists: '/boodschappen',
  motivation: '/motivatie',
  house: '/woning',
  settings: '/instellingen',
  weeklyReset: '/weekritueel',
};

export function resolveWorkspaceRoute(pathname: string): WorkspaceRoute | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return routes[normalized] ?? null;
}

export function workspacePath(workspaceId: WorkspaceId, houseView: HouseView = 'summary'): string {
  if (workspaceId === 'house' && houseView === 'climate') {
    return '/woning/klimaat';
  }

  return paths[workspaceId] ?? '/';
}
