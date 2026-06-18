import type { WidgetRenderProps } from '../WidgetRenderer';

export function TextWidget({ definition, instance }: WidgetRenderProps) {
  const body = String(instance.settings.body ?? definition.settings.body ?? 'Text widget');

  return (
    <article className="widget-card" aria-label={instance.title}>
      <p className="widget-type">Text Widget</p>
      <h3>{instance.title}</h3>
      <p>{body}</p>
    </article>
  );
}
