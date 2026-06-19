export type WorkspaceId = 'home' | 'agenda' | 'lists' | 'house' | 'media' | 'settings';

export interface WorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  description: string;
}

export const workspaceDefinitions: readonly WorkspaceDefinition[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Primary household overview workspace.',
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
    id: 'house',
    label: 'House',
    description: 'House operations and environment workspace placeholder.',
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Media and shared entertainment workspace placeholder.',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Workspace configuration and household preferences placeholder.',
  },
] as const;
