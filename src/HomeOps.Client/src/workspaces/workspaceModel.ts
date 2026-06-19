export type WorkspaceId = 'home' | 'house' | 'media' | 'settings';

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
