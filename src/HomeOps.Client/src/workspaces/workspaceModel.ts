import { WidgetInstance } from '../widgets/widgetModel';

export type WorkspaceId = 'home' | 'house' | 'media' | 'settings';

export interface WorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  description: string;
  widgetInstances: readonly WidgetInstance[];
}

export const workspaceDefinitions: readonly WorkspaceDefinition[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Primary household overview workspace.',
    widgetInstances: [
      {
        id: 'home-agenda-widget',
        widgetDefinitionId: 'agenda-mvp',
        title: 'Agenda',
        settings: {},
      },
      {
        id: 'home-shopping-list-widget',
        widgetDefinitionId: 'shopping-list-mvp',
        title: 'Shopping List',
        settings: {},
      },
      {
        id: 'home-welcome-widget',
        widgetDefinitionId: 'welcome-text',
        title: 'Welcome widget',
        settings: {},
      },
    ],
  },
  {
    id: 'house',
    label: 'House',
    description: 'House operations and environment workspace placeholder.',
    widgetInstances: [
      {
        id: 'house-placeholder-widget',
        widgetDefinitionId: 'house-placeholder',
        title: 'House placeholder widget',
        settings: {},
      },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Media and shared entertainment workspace placeholder.',
    widgetInstances: [
      {
        id: 'media-placeholder-widget',
        widgetDefinitionId: 'media-placeholder',
        title: 'Media placeholder widget',
        settings: {},
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Workspace configuration and household preferences placeholder.',
    widgetInstances: [
      {
        id: 'settings-placeholder-widget',
        widgetDefinitionId: 'settings-placeholder',
        title: 'Settings placeholder widget',
        settings: {},
      },
    ],
  },
] as const;
