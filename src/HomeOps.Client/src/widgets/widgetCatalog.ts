import { WidgetDefinition } from './widgetModel';

export const widgetDefinitions: readonly WidgetDefinition[] = [
  {
    id: 'agenda-mvp',
    type: 'agenda',
    title: 'Agenda',
    settings: {
      defaultView: 'week',
    },
  },
  {
    id: 'shopping-list-mvp',
    type: 'shoppingList',
    title: 'Shopping List',
    settings: {},
  },
  {
    id: 'welcome-text',
    type: 'text',
    title: 'Welcome',
    settings: {
      body: 'HomeOps workspace foundation is ready for future household widgets.',
    },
  },
  {
    id: 'house-placeholder',
    type: 'placeholder',
    title: 'House Placeholder',
    settings: {
      body: 'House widgets will appear here in future slices.',
    },
  },
  {
    id: 'media-placeholder',
    type: 'placeholder',
    title: 'Media Placeholder',
    settings: {
      body: 'Media widgets will appear here in future slices.',
    },
  },
  {
    id: 'settings-placeholder',
    type: 'placeholder',
    title: 'Settings Placeholder',
    settings: {
      body: 'Settings widgets will appear here in future slices.',
    },
  },
] as const;

export function getWidgetDefinition(widgetDefinitionId: string): WidgetDefinition | undefined {
  return widgetDefinitions.find((definition) => definition.id === widgetDefinitionId);
}
