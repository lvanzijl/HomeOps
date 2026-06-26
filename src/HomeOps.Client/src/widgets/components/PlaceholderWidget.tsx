import type { WidgetRenderProps } from '../WidgetRenderer';

export function PlaceholderWidget({ definition, instance }: WidgetRenderProps) {
  const body = String(instance.settings.body ?? definition.settings.body ?? 'A cozy family space for later');

  return (
    <article className="widget-card" aria-label={instance.title}>
      <p className="widget-type">Coming later</p>
      <h3>{instance.title}</h3>
      <p>{body}</p>
    </article>
  );
}
