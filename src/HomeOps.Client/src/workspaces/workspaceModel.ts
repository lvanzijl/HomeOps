export type WorkspaceId = 'home' | 'agenda' | 'lists' | 'tasks' | 'motivation' | 'house' | 'media' | 'gamification' | 'settings';

export interface WorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  description: string;
}

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
    id: 'lists',
    label: 'Lists',
    description: 'Full lists page for household list management.',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Urgency-first page for ad-hoc household tasks.',
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
    id: 'settings',
    label: 'Settings',
    description: 'Workspace configuration and household preferences placeholder.',
  },
] as const;
