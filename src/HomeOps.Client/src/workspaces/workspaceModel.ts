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
    label: 'Thuis',
    description: 'Het gezinsoverzicht voor vandaag.',
  },
  {
    id: 'agenda',
    label: 'Agenda',
    description: 'Gedeelde gezinsplanning en afspraken.',
  },
  {
    id: 'tasks',
    label: 'Taken',
    description: 'Wat het gezin vandaag kan oppakken.',
  },
  {
    id: 'lists',
    label: 'Boodschappen',
    description: 'Boodschappen en dagelijkse gezinslijstjes.',
  },
  {
    id: 'motivation',
    label: 'Motivatie',
    description: 'Aanmoediging, voortgang en vieringen voor het gezin.',
  },
  {
    id: 'house',
    label: 'Huisstatus',
    description: 'Voor toekomstige huisstatus, meldingen en apparaten.',
  },
  {
    id: 'media',
    label: 'Media',
    description: 'For media reminders and future household media context.',
  },
  {
    id: 'gamification',
    label: 'Beloningen',
    description: 'Voor toekomstige punten, beloningen en gezinsvoortgang.',
  },
  {
    id: 'weeklyReset',
    label: 'Weekritueel',
    description: 'Een rustige gezinscheck voor volgende week.',
  },
  {
    id: 'settings',
    label: 'Instellingen',
    description: 'Gezinsvoorkeuren en onderhoud.',
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
