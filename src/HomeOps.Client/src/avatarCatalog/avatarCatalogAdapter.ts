import { avatarV2DefaultConfiguration, normalizeAvatarV2Configuration, type AvatarV2Configuration } from '../avatarV2/avatarConfig';
import type { AvatarConfig, PaletteToken } from '../avatarV2/avatarV2';
import { avatarCatalog, avatarSelectionSlots, createAvatarSelection, getAvatarCatalogCategories, getAvatarCatalogItem, normalizeAvatarSelection, type AvatarCatalogSelection, type AvatarSelectionSlot } from './avatarCatalog';

function rendererToken(itemId: string, expectedCategoryId: string): string {
  const item = getAvatarCatalogItem(itemId);
  if (!item || item.categoryId !== expectedCategoryId || !item.renderer?.rendererToken) {
    throw new Error(`Missing renderer token for ${itemId}.`);
  }

  return item.renderer.rendererToken;
}

function selectionIdForRendererToken(slot: AvatarSelectionSlot, rendererValue: string): string {
  const category = getAvatarCatalogCategories().find((candidate) => candidate.slot === slot);
  if (!category) return avatarCatalog.defaults[slot];

  return avatarCatalog.items.find(
    (item) => item.categoryId === category.id && (item.renderer?.rendererToken === rendererValue || item.legacyIds.includes(rendererValue)),
  )?.id ?? avatarCatalog.defaults[slot];
}

export const defaultAvatarSelection = createAvatarSelection();

export function avatarSelectionToAvatarV2Configuration(selection: AvatarCatalogSelection): AvatarV2Configuration {
  const normalized = normalizeAvatarSelection(selection);
  return {
    headVariant: rendererToken(normalized.selections.headVariant, 'head.variant') as AvatarV2Configuration['headVariant'],
    hairStyle: rendererToken(normalized.selections.hairStyle, 'hair.style') as AvatarV2Configuration['hairStyle'],
    hairColor: rendererToken(normalized.selections.hairColor, 'hair.color') as AvatarV2Configuration['hairColor'],
    clothingStyle: rendererToken(normalized.selections.clothingStyle, 'clothing.style') as AvatarV2Configuration['clothingStyle'],
    clothingColor: rendererToken(normalized.selections.clothingColor, 'clothing.color') as AvatarV2Configuration['clothingColor'],
    accessory: rendererToken(normalized.selections.accessoryStyle, 'accessory.style') as AvatarV2Configuration['accessory'],
    accessoryColor: rendererToken(normalized.selections.accessoryColor, 'accessory.color') as AvatarV2Configuration['accessoryColor'],
  };
}

export function avatarSelectionToAvatarV2RenderConfig(selection: AvatarCatalogSelection): AvatarConfig {
  const normalized = normalizeAvatarSelection(selection);
  const accessoryItem = getAvatarCatalogItem(normalized.selections.accessoryStyle);

  return {
    base: 'child',
    headVariant: rendererToken(normalized.selections.headVariant, 'head.variant') as AvatarConfig['headVariant'],
    skinTone: rendererToken(normalized.selections.skinTone, 'skin.tone') as PaletteToken,
    hair: {
      style: rendererToken(normalized.selections.hairStyle, 'hair.style') as AvatarConfig['hair']['style'],
      color: rendererToken(normalized.selections.hairColor, 'hair.color') as PaletteToken,
    },
    glasses: {
      style: rendererToken(normalized.selections.eyewearStyle, 'eyewear.style') as AvatarConfig['glasses']['style'],
      color: 'lineBlue',
    },
    shirt: {
      style: rendererToken(normalized.selections.clothingStyle, 'clothing.style') as AvatarConfig['shirt']['style'],
      color: rendererToken(normalized.selections.clothingColor, 'clothing.color') as PaletteToken,
    },
    accessory: {
      style: rendererToken(normalized.selections.accessoryStyle, 'accessory.style') as AvatarConfig['accessory']['style'],
      color: rendererToken(normalized.selections.accessoryColor, 'accessory.color') as PaletteToken,
      mount: accessoryItem?.renderer?.mountPoint,
    },
  };
}

export function avatarV2ConfigurationToAvatarSelection(configuration: unknown): AvatarCatalogSelection {
  const normalized = normalizeAvatarV2Configuration(configuration ?? avatarV2DefaultConfiguration);

  return createAvatarSelection({
    [avatarSelectionSlots.headVariant]: selectionIdForRendererToken(avatarSelectionSlots.headVariant, normalized.headVariant),
    [avatarSelectionSlots.skinTone]: avatarCatalog.defaults.skinTone,
    [avatarSelectionSlots.hairStyle]: selectionIdForRendererToken(avatarSelectionSlots.hairStyle, normalized.hairStyle),
    [avatarSelectionSlots.hairColor]: selectionIdForRendererToken(avatarSelectionSlots.hairColor, normalized.hairColor),
    [avatarSelectionSlots.clothingStyle]: selectionIdForRendererToken(avatarSelectionSlots.clothingStyle, normalized.clothingStyle),
    [avatarSelectionSlots.clothingColor]: selectionIdForRendererToken(avatarSelectionSlots.clothingColor, normalized.clothingColor),
    [avatarSelectionSlots.accessoryStyle]: selectionIdForRendererToken(avatarSelectionSlots.accessoryStyle, normalized.accessory),
    [avatarSelectionSlots.accessoryColor]: selectionIdForRendererToken(avatarSelectionSlots.accessoryColor, normalized.accessoryColor),
  });
}
