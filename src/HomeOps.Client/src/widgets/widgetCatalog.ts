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
      body: 'FamilyBoard is klaar voor toekomstige gezinswidgets.',
    },
  },
  {
    id: 'house-placeholder',
    type: 'placeholder',
    title: 'Huis-placeholder',
    settings: {
      body: 'Huiswidgets komen in latere fases.',
    },
  },
  {
    id: 'media-placeholder',
    type: 'placeholder',
    title: 'Media-placeholder',
    settings: {
      body: 'Mediawidgets komen in latere fases.',
    },
  },
  {
    id: 'calendar-portability-admin',
    type: 'calendarPortability',
    title: 'Agenda exporteren / herstellen',
    settings: {},
  },
  {
    id: 'settings-placeholder',
    type: 'placeholder',
    title: 'Instellingen-placeholder',
    settings: {
      body: 'Instellingenwidgets komen in latere fases.',
    },
  },
] as const;

export function getWidgetDefinition(widgetDefinitionId: string): WidgetDefinition | undefined {
  return widgetDefinitions.find((definition) => definition.id === widgetDefinitionId);
}
