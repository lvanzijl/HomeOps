# FamilyBoard Design Asset System

FamilyBoard visual assets live under `src/design` and are organized by asset type: icons, illustrations, decorations, and registries. The foundation currently implements semantic inline React SVG icons only.

## Adding icons

1. Add an inline React SVG component under `src/design/icons/`.
2. Draw with `viewBox="0 0 24 24"` for normal UI icons.
3. Use `stroke="currentColor"` and avoid hard-coded colors.
4. Register the component in `src/design/registry/iconRegistry.ts` with a semantic name and category.
5. Export through `src/design/index.ts` only when a public API change is needed.
6. Add focused tests when behavior, naming, accessibility, or sizing changes.

## Naming rules

- Use semantic product names such as `core.add`, `navigation.settings`, or `status.ready`.
- Prefer the product meaning over the drawing shape.
- Do not add Agenda, Shopping, illustration, or decoration names before their migration slice needs them.
- Keep Avatar V2 separate from this registry.

## Accessibility rules

- Decorative icons default to `aria-hidden="true"`.
- Meaningful standalone icons must pass `decorative={false}` and a `title`.
- Icon-only buttons still need an accessible button label; do not rely on the SVG title alone.
- Do not communicate state only through color.

## `currentColor` usage

Icons inherit color from surrounding text or domain styling. This lets future page migrations use FamilyBoard domain colors without creating duplicate assets.

## Prohibited practices

- No PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary artwork.
- No external icon libraries.
- No emoji or browser glyphs as product iconography.
- No ad hoc page-local SVGs for reusable semantics.
- No imported SVG files for the new generic FamilyBoard icon registry.
