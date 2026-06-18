import { AgendaWidget } from './components/AgendaWidget';
import { PlaceholderWidget } from './components/PlaceholderWidget';
import { ShoppingListWidget } from './components/ShoppingListWidget';
import { TextWidget } from './components/TextWidget';
import { ComponentType } from 'react';
import { WidgetDefinition, WidgetInstance, WidgetType } from './widgetModel';

export interface WidgetRenderProps {
  definition: WidgetDefinition;
  instance: WidgetInstance;
}

type WidgetComponent = ComponentType<WidgetRenderProps>;

const widgetRegistry: Record<WidgetType, WidgetComponent> = {
  agenda: AgendaWidget,
  placeholder: PlaceholderWidget,
  shoppingList: ShoppingListWidget,
  text: TextWidget,
};

export function WidgetRenderer({ definition, instance }: WidgetRenderProps) {
  const Component = widgetRegistry[definition.type];

  return <Component definition={definition} instance={instance} />;
}
