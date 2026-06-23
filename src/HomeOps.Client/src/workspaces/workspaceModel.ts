export type WorkspaceId = 'home' | 'agenda' | 'lists' | 'tasks' | 'motivation' | 'house' | 'media' | 'gamification' | 'settings' | 'weeklyReset' | 'avatarEditor';

export interface WorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  description: string;
}

export type NavigationRole = 'primary' | 'secondary' | 'administration';

const navigationRoles: Readonly<Record<WorkspaceId, NavigationRole>> = {
  home: 'primary',
  agenda: 'primary',
  tasks: 'primary',
  lists: 'primary',
  motivation: 'primary',
  weeklyReset: 'secondary',
  house: 'secondary',
  media: 'secondary',
  gamification: 'secondary',
  settings: 'administration',
  avatarEditor: 'administration',
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
    description: 'Full agenda page for calendar browsing and event management.',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Urgency-first page for ad-hoc household tasks.',
  },
  {
    id: 'lists',
    label: 'Lists',
    description: 'Full lists page for household list management.',
  },
  {
    id: 'motivation',
    label: 'Motivation',
    description: 'Family encouragement goals and warm progress.',
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
    description: 'A short parent-facing review and recap.',
  },
  {
    id: 'avatarEditor',
    label: 'Avatar Editor',
    description: 'Try Avatar V2 styles before profile integration.',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Workspace configuration and household preferences placeholder.',
  },
] as const;

export function getNavigationRole(workspaceId: WorkspaceId): NavigationRole {
  return navigationRoles[workspaceId];
}

export const primaryWorkspaceDefinitions = workspaceDefinitions.filter(
  (workspace) => getNavigationRole(workspace.id) === 'primary',
);

export const secondaryWorkspaceDefinitions = workspaceDefinitions.filter(
  (workspace) => getNavigationRole(workspace.id) === 'secondary',
);

export const administrationWorkspaceDefinitions = workspaceDefinitions.filter(
  (workspace) => getNavigationRole(workspace.id) === 'administration',
);
