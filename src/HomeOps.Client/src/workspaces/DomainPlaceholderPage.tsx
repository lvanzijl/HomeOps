interface DomainPlaceholderPageProps {
  title: string;
  purpose: string;
}

export function DomainPlaceholderPage({ title, purpose }: DomainPlaceholderPageProps) {
  return (
    <article className="domain-placeholder-page" aria-label={`${title} placeholder page`}>
      <p className="widget-type">Coming later</p>
      <h3>{title}</h3>
      <p>{purpose}</p>
      <strong>Not implemented yet.</strong>
    </article>
  );
}
