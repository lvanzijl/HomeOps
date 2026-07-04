import type { HTMLAttributes, ReactNode } from "react";

type CardSurface = "base" | "summary" | "review";

type CardElementProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  surface?: CardSurface;
  children: ReactNode;
};

const surfaceClassNames: Record<CardSurface, string> = {
  base: "homeops-card",
  summary: "home-summary-card",
  review: "reset-card",
};

export function Card({
  as: Component = "article",
  surface = "base",
  className,
  children,
  ...props
}: CardElementProps) {
  const surfaceClassName = surfaceClassNames[surface];
  return (
    <Component
      className={[surfaceClassName, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}

export type CardHeaderProps = {
  eyebrow?: ReactNode;
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleId?: string;
  titleLevel?: 2 | 3 | 4;
};

export function CardHeader({
  eyebrow,
  title,
  meta,
  actions,
  className = "card-header",
  titleId,
  titleLevel = 3,
}: CardHeaderProps) {
  const TitleTag = `h${titleLevel}` as "h2" | "h3" | "h4";
  return (
    <div className={className}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {title ? <TitleTag id={titleId}>{title}</TitleTag> : null}
        {meta ? <small>{meta}</small> : null}
      </div>
      {actions ? <span>{actions}</span> : null}
    </div>
  );
}

type SummaryCardProps = Omit<CardElementProps, "surface" | "as">;

export function SummaryCard({ className, ...props }: SummaryCardProps) {
  return <Card surface="summary" className={className} {...props} />;
}

type ReviewCardProps = Omit<CardElementProps, "surface" | "as">;

export function ReviewCard({ className, ...props }: ReviewCardProps) {
  return <Card surface="review" className={className} {...props} />;
}
