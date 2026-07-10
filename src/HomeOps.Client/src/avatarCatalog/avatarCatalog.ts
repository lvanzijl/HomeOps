export const avatarCatalogId = 'familyboard.avatar';
export const avatarCatalogSchemaVersion = '1.0';
export const avatarCatalogDefaultLocale = 'nl-NL';

export const avatarSelectionSlots = {
  headVariant: 'headVariant',
  skinTone: 'skinTone',
  hairStyle: 'hairStyle',
  hairColor: 'hairColor',
  clothingStyle: 'clothingStyle',
  clothingColor: 'clothingColor',
  clothingSecondaryColor: 'clothingSecondaryColor',
  eyeStyle: 'eyeStyle',
  mouthStyle: 'mouthStyle',
  eyewearStyle: 'eyewearStyle',
  accessoryStyle: 'accessoryStyle',
  accessoryColor: 'accessoryColor',
} as const;

export type AvatarSelectionSlot = typeof avatarSelectionSlots[keyof typeof avatarSelectionSlots];

export interface AvatarCatalogSelection {
  schemaVersion: string;
  selections: Record<AvatarSelectionSlot, string>;
}

export interface AvatarCatalogText {
  [locale: string]: string;
}

export interface AvatarCatalogPresentation {
  control: 'tile' | 'swatch';
  density: 'compact';
  itemLabelVisibility: 'visible' | 'hidden';
  groupStrategy?: 'none' | 'tag';
  optionMinWidthRem?: number;
}

export interface AvatarCatalogPreview {
  hiddenSelections?: Partial<Record<AvatarSelectionSlot, string>>;
}

export type AvatarClothingColorRegion = 'primary' | 'secondary';

export interface AvatarCatalogCategory {
  id: string;
  slot: AvatarSelectionSlot;
  required: boolean;
  allowsNone: boolean;
  order: number;
  labels: AvatarCatalogText;
  shortLabels?: AvatarCatalogText;
  accessibilityLabels: AvatarCatalogText;
  descriptions: AvatarCatalogText;
  presentation: AvatarCatalogPresentation;
  tags: readonly string[];
  preview?: AvatarCatalogPreview;
  /**
   * When set, marks this category as controlling a specific clothing color
   * region. A "secondary" region category is only offered while the garment
   * selected in {@link governingSlot} declares support for that region.
   */
  colorRegion?: AvatarClothingColorRegion;
  governingSlot?: AvatarSelectionSlot;
}

export interface AvatarCatalogRendererBinding {
  rendererFamily: 'avatar-v2-svg';
  rendererToken: string;
  layer?: string;
  mountPoint?: 'chestCenter' | 'hairLeft' | 'hairRight' | 'headTop';
}

export type AvatarCatalogPaletteId = 'skin' | 'hair' | 'clothing';

export interface AvatarCatalogColor {
  format: 'expandedSwatch';
  base: string;
  shade: string;
  highlight: string;
  line: string;
  paletteId: AvatarCatalogPaletteId;
}

export interface AvatarCatalogItem {
  id: string;
  categoryId: string;
  type: 'rendererStyle' | 'color' | 'none';
  status: 'active' | 'deprecated' | 'hidden' | 'retired';
  order: number;
  labels: AvatarCatalogText;
  shortLabels?: AvatarCatalogText;
  accessibilityLabels: AvatarCatalogText;
  descriptions?: AvatarCatalogText;
  tags: readonly string[];
  renderer?: AvatarCatalogRendererBinding;
  color?: AvatarCatalogColor;
  /** Colorable regions this renderer style draws. Defaults to primary-only when omitted. */
  colorRegions?: readonly AvatarClothingColorRegion[];
  legacyIds: readonly string[];
}

export interface AvatarCatalogEditorPanel {
  id: string;
  order: number;
  icon?: string;
  labels: AvatarCatalogText;
  accessibilityLabels: AvatarCatalogText;
  descriptions: AvatarCatalogText;
  categoryIds: readonly string[];
}

export interface AvatarCatalogOptionGroup {
  id: string;
  order: number;
  labels: AvatarCatalogText;
}

export interface AvatarCatalogPalette {
  id: AvatarCatalogPaletteId;
  order: number;
  labels: AvatarCatalogText;
  categoryIds: readonly string[];
}

export interface AvatarCatalogDefinition {
  catalogId: string;
  schemaVersion: string;
  defaultLocale: string;
  supportedLocales: readonly string[];
  palettes: readonly AvatarCatalogPalette[];
  editorPanels: readonly AvatarCatalogEditorPanel[];
  categories: readonly AvatarCatalogCategory[];
  items: readonly AvatarCatalogItem[];
  defaults: Record<AvatarSelectionSlot, string>;
}

import avatarCatalogSource from '../../../shared/avatar-catalog.json';

interface AvatarCatalogSourceDefinition extends Omit<AvatarCatalogDefinition, 'defaults'> {
  optionGroups: readonly AvatarCatalogOptionGroup[];
  defaults: Record<string, string>;
}

const sourceCatalog = avatarCatalogSource as AvatarCatalogSourceDefinition;

export const avatarCatalog: AvatarCatalogDefinition = {
  catalogId: sourceCatalog.catalogId,
  schemaVersion: sourceCatalog.schemaVersion,
  defaultLocale: sourceCatalog.defaultLocale,
  supportedLocales: sourceCatalog.supportedLocales,
  palettes: sourceCatalog.palettes,
  editorPanels: sourceCatalog.editorPanels,
  categories: sourceCatalog.categories,
  items: sourceCatalog.items,
  defaults: sourceCatalog.defaults as Record<AvatarSelectionSlot, string>,
};

const optionGroups = new Map(sourceCatalog.optionGroups.map((group) => [group.id, group]));
const categoryById = new Map(avatarCatalog.categories.map((category) => [category.id, category]));
const itemById = new Map(avatarCatalog.items.map((item) => [item.id, item]));

export function getAvatarCatalogEditorPanels(): readonly AvatarCatalogEditorPanel[] {
  return [...avatarCatalog.editorPanels].sort((left, right) => left.order - right.order);
}

export function getAvatarCatalogCategories(): readonly AvatarCatalogCategory[] {
  return [...avatarCatalog.categories].sort((left, right) => left.order - right.order);
}

export function getAvatarCatalogCategoryForSlot(slot: AvatarSelectionSlot): AvatarCatalogCategory | undefined {
  return avatarCatalog.categories.find((category) => category.slot === slot);
}

export function getAvatarCatalogCategory(categoryId: string): AvatarCatalogCategory | undefined {
  return categoryById.get(categoryId);
}

export function getAvatarCatalogItem(itemId: string): AvatarCatalogItem | undefined {
  return itemById.get(itemId);
}

export function getAvatarCatalogItems(categoryId: string): readonly AvatarCatalogItem[] {
  return avatarCatalog.items
    .filter((item) => item.categoryId === categoryId)
    .sort((left, right) => left.order - right.order);
}

export function getAvatarCatalogEditorItems(categoryId: string, selectedItemId: string): readonly AvatarCatalogItem[] {
  return getAvatarCatalogItems(categoryId).filter((item) => item.status === 'active' || item.id === selectedItemId);
}

export function getAvatarCatalogOptionGroup(item: AvatarCatalogItem): AvatarCatalogOptionGroup | undefined {
  const groupTag = item.tags.find((tag) => tag.startsWith('group.'));
  return groupTag ? optionGroups.get(groupTag) : undefined;
}

export function getAvatarCatalogStyleColorRegions(item: AvatarCatalogItem | undefined): readonly AvatarClothingColorRegion[] {
  return item?.colorRegions ?? ['primary'];
}

/**
 * Determines whether a category should be offered for the current selection.
 * Region-gated color categories (e.g. the secondary clothing color) are only
 * available while the governing style selection supports that region, so
 * single-color garments never expose an inert control.
 */
export function isAvatarCatalogCategoryAvailable(category: AvatarCatalogCategory, selection: AvatarCatalogSelection): boolean {
  if (!category.colorRegion || category.colorRegion === 'primary' || !category.governingSlot) {
    return true;
  }

  const governingItem = getAvatarCatalogItem(selection.selections[category.governingSlot]);
  return getAvatarCatalogStyleColorRegions(governingItem).includes(category.colorRegion);
}

export function localizeAvatarCatalogText(texts: AvatarCatalogText | undefined, fallback: string, locale = avatarCatalog.defaultLocale): string {
  if (!texts) return fallback;
  return texts[locale] ?? texts[avatarCatalog.defaultLocale] ?? Object.values(texts)[0] ?? fallback;
}

export function getAvatarCatalogSelectionLabel(selection: AvatarCatalogSelection, slot: AvatarSelectionSlot, locale = avatarCatalog.defaultLocale): string {
  const item = getAvatarCatalogItem(selection.selections[slot]);
  if (!item) {
    return '';
  }

  return localizeAvatarCatalogText(item.labels, item.id, locale);
}

export function getAvatarCatalogCategoryTabLabel(category: AvatarCatalogCategory, locale = avatarCatalog.defaultLocale): string {
  const fallback = localizeAvatarCatalogText(category.labels, category.id, locale);
  return localizeAvatarCatalogText(category.shortLabels, fallback, locale);
}

export function getAvatarCatalogPanelSummary(panel: AvatarCatalogEditorPanel, selection: AvatarCatalogSelection, locale = avatarCatalog.defaultLocale): string {
  return panel.categoryIds
    .map((categoryId) => getAvatarCatalogCategory(categoryId))
    .filter((category): category is AvatarCatalogCategory => Boolean(category))
    .filter((category) => isAvatarCatalogCategoryAvailable(category, selection))
    .map((category) => getAvatarCatalogSelectionLabel(selection, category.slot, locale))
    .filter((label) => label.length > 0)
    .join(' · ');
}

export function createAvatarSelection(overrides: Partial<Record<AvatarSelectionSlot, string>> = {}): AvatarCatalogSelection {
  return {
    schemaVersion: avatarCatalog.schemaVersion,
    selections: {
      ...avatarCatalog.defaults,
      ...overrides,
    },
  };
}

export function normalizeAvatarSelection(value: unknown): AvatarCatalogSelection {
  const candidate = value && typeof value === 'object' ? value as Partial<AvatarCatalogSelection> : {};
  const selections = candidate.selections && typeof candidate.selections === 'object'
    ? candidate.selections as Partial<Record<AvatarSelectionSlot, string>>
    : {};

  const normalized = {} as Record<AvatarSelectionSlot, string>;

  for (const category of avatarCatalog.categories) {
    const itemId = selections[category.slot];
    const item = itemId ? getAvatarCatalogItem(itemId) : undefined;
    normalized[category.slot] = item && item.categoryId === category.id
      ? item.id
      : avatarCatalog.defaults[category.slot];
  }

  return {
    schemaVersion: avatarCatalog.schemaVersion,
    selections: normalized,
  };
}

export function updateAvatarSelection(selection: AvatarCatalogSelection, slot: AvatarSelectionSlot, itemId: string): AvatarCatalogSelection {
  return {
    schemaVersion: avatarCatalog.schemaVersion,
    selections: {
      ...selection.selections,
      [slot]: itemId,
    },
  };
}

export function avatarSelectionsEqual(left: AvatarCatalogSelection, right: AvatarCatalogSelection): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function buildAvatarTilePreviewSelection(selection: AvatarCatalogSelection, category: AvatarCatalogCategory, itemId: string): AvatarCatalogSelection {
  const previewSelection = updateAvatarSelection(selection, category.slot, itemId);
  return category.preview?.hiddenSelections
    ? {
        schemaVersion: previewSelection.schemaVersion,
        selections: {
          ...previewSelection.selections,
          ...category.preview.hiddenSelections,
        },
      }
    : previewSelection;
}
