export type WorkspaceId = 'home' | 'agenda' | 'lists' | 'tasks' | 'motivation' | 'house' | 'media' | 'gamification' | 'settings' | 'weeklyReset';

export interface WorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  description: string;
}

export type NavigationRole = 'primary' | 'contextual' | 'administration' | 'internal';

const navigationRoles: Readonly<Record<WorkspaceId, NavigationRole>> = {
  home: 'primary',
  agenda: 'primary',
  tasks: 'primary',
  lists: 'primary',
  motivation: 'primary',
  weeklyReset: 'contextual',
  house: 'internal',
  media: 'internal',
  gamification: 'internal',
  settings: 'administration',
};

export const workspaceDefinitions: readonly WorkspaceDefinition[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Today’s family overview.',
  },
  {
    id: 'agenda',
    label: 'Agenda',
    description: 'Shared family plans and events.',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'What the family can take care of today.',
  },
  {
    id: 'lists',
    label: 'Shopping',
    description: 'Groceries and everyday family lists.',
  },
  {
    id: 'motivation',
    label: 'Motivation',
    description: 'Family encouragement, progress, and celebrations.',
  },
  {
    id: 'house',
    label: 'House Status',
    description: 'For home alerts, sensors, and device state.',
  },
  {
    id: 'media',
    label: 'Media',
    description: 'For media reminders and future household media context.',
  },
  {
    id: 'gamification',
    label: 'Gamification',
    description: 'For points, rewards, and family progress after Tasks mature.',
  },
  {
    id: 'weeklyReset',
    label: 'Weekly Reset',
    description: 'A short family review and reset.',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Household preferences and maintenance tools.',
  },
] as const;

export function getNavigationRole(workspaceId: WorkspaceId): NavigationRole {
  return navigationRoles[workspaceId];
}

export const primaryWorkspaceDefinitions = workspaceDefinitions.filter(
  (workspace) => getNavigationRole(workspace.id) === 'primary',
);

export const contextualWorkspaceDefinitions = workspaceDefinitions.filter(
  (workspace) => getNavigationRole(workspace.id) === 'contextual',
);

export const administrationWorkspaceDefinitions = workspaceDefinitions.filter(
  (workspace) => getNavigationRole(workspace.id) === 'administration',
);
