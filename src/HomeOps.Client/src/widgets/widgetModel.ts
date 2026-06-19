export type WidgetType = 'agenda' | 'calendarPortability' | 'placeholder' | 'shoppingList' | 'text';

export type WidgetSettings = Record<string, string | number | boolean | null>;

export interface WidgetDefinition {
  id: string;
  type: WidgetType;
  title: string;
  settings: WidgetSettings;
}

export interface WidgetInstance {
  id: string;
  widgetDefinitionId: WidgetDefinition['id'];
  title: string;
  settings: WidgetSettings;
}
