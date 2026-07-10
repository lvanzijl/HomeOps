import type { ReactElement, SVGProps } from 'react';

type GlyphProps = SVGProps<SVGSVGElement>;

/**
 * Lightweight, decorative inline glyphs for the avatar editor category rail.
 * These are purely presentational (rendered with aria-hidden) so category
 * navigation stays visual without depending on the global icon asset set.
 */
const glyphs: Record<string, (props: GlyphProps) => ReactElement> = {
  skin: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.2" fill="currentColor" opacity="0.16" />
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9.4" cy="11" r="1" fill="currentColor" />
      <circle cx="14.6" cy="11" r="1" fill="currentColor" />
      <path d="M9.4 14.6c1.6 1.4 3.6 1.4 5.2 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  hair: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 13c0-4.4 3.1-7.5 7-7.5s7 3.1 7 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 13c.2-3 1.7-4.6 3.2-5.4M19 13c-.2-3-1.7-4.6-3.2-5.4M12 5.5v6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 13c0 2.6 1.8 4.5 4 4.5s4-1.9 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    </svg>
  ),
  face: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15.4" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12.4h.4M4.6 11.4L6 12M19.4 11.4L18 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  clothing: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M8.5 5l3.5 2 3.5-2 3.5 2-1.8 3-1.7-.8V19H8.5V9.2L6.8 10 5 7z" fill="currentColor" opacity="0.16" />
      <path d="M8.5 5l3.5 2 3.5-2 3.5 2-1.8 3-1.7-.8V19H8.5V9.2L6.8 10 5 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  accessories: (props) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="currentColor" opacity="0.16" />
      <path d="M12 5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
};

export function AvatarCategoryGlyph({ icon, ...props }: { icon?: string } & GlyphProps) {
  const Glyph = (icon && glyphs[icon]) || glyphs.accessories;
  return <Glyph {...props} />;
}
