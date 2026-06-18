import type { WidgetRenderProps } from '../WidgetRenderer';

export function PlaceholderWidget({ definition, instance }: WidgetRenderProps) {
  const body = String(instance.settings.body ?? definition.settings.body ?? 'Placeholder widget');

  return (
    <article className="widget-card" aria-label={instance.title}>
      <p className="widget-type">Placeholder Widget</p>
      <h3>{instance.title}</h3>
      <p>{body}</p>
    </article>
  );
}
