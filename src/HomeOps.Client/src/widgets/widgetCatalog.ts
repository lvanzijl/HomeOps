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
    title: 'Boodschappen',
    settings: {},
  },
  {
    id: 'welcome-text',
    type: 'text',
    title: 'Welkom',
    settings: {
      body: 'Hier kun je straks extra informatie voor je gezin toevoegen.',
    },
  },
  {
    id: 'house-placeholder',
    type: 'placeholder',
    title: 'Huis',
    settings: {
      body: 'Hier komt straks huisinformatie.',
    },
  },
  {
    id: 'media-placeholder',
    type: 'placeholder',
    title: 'Media',
    settings: {
      body: 'Hier komt straks media voor je gezin.',
    },
  },
  {
    id: 'calendar-portability-admin',
    type: 'calendarPortability',
    title: 'Agenda back-up en herstel',
    settings: {},
  },
  {
    id: 'settings-placeholder',
    type: 'placeholder',
    title: 'Instellingen',
    settings: {
      body: 'Hier komen straks extra instellingen.',
    },
  },
] as const;

export function getWidgetDefinition(widgetDefinitionId: string): WidgetDefinition | undefined {
  return widgetDefinitions.find((definition) => definition.id === widgetDefinitionId);
}
