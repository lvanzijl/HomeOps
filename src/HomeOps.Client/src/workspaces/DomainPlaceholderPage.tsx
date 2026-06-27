interface DomainPlaceholderPageProps {
  title: string;
  purpose: string;
}

export function DomainPlaceholderPage({ title, purpose }: DomainPlaceholderPageProps) {
  return (
    <article className="domain-placeholder-page" aria-label={`${title} placeholderpagina`}>
      <p className="widget-type">Komt later</p>
      <h3>{title}</h3>
      <p>{purpose}</p>
      <strong>Nog niet beschikbaar.</strong>
    </article>
  );
}
