import { describe, expect, it } from 'vitest';
import { avatarSelectionToAvatarV2RenderConfig, defaultAvatarSelection } from './avatarCatalogAdapter';
import { avatarCatalog, getAvatarCatalogItems, localizeAvatarCatalogText, updateAvatarSelection } from './avatarCatalog';
import { renderAvatarV2Svg } from '../avatarV2/avatarV2';

describe('avatar catalog metadata', () => {
  it('exposes the expanded skin, hair, clothing, and accessory palettes', () => {
    expect(getAvatarCatalogItems('skin.tone')).toHaveLength(20);
    expect(getAvatarCatalogItems('hair.color').filter((item) => item.status === 'active')).toHaveLength(29);
    expect(getAvatarCatalogItems('clothing.color')).toHaveLength(48);
    expect(getAvatarCatalogItems('accessory.color')).toHaveLength(48);
  });

  it('provides accessibility labels for every selectable item', () => {
    for (const item of avatarCatalog.items) {
      expect(localizeAvatarCatalogText(item.accessibilityLabels, '')).not.toBe('');
    }
  });

  it('reuses the clothing palette data for accessory colors without duplicating swatch values', () => {
    const clothingColors = getAvatarCatalogItems('clothing.color');
    const accessoryColors = getAvatarCatalogItems('accessory.color');

    expect(accessoryColors.map((item) => item.id.replace('accessory.color.', ''))).toEqual(
      clothingColors.map((item) => item.id.replace('clothing.color.', '')),
    );

    for (const clothingColor of clothingColors) {
      const suffix = clothingColor.id.replace('clothing.color.', '');
      const accessoryColor = accessoryColors.find((item) => item.id === `accessory.color.${suffix}`);
      expect(accessoryColor?.labels).toEqual(clothingColor.labels);
      expect(accessoryColor?.color).toEqual(clothingColor.color);
    }
  });

  it('renders every active expanded color choice through the existing Avatar V2 renderer', () => {
    const colorCategories = [
      ['skin.tone', 'skinTone'],
      ['hair.color', 'hairColor'],
      ['clothing.color', 'clothingColor'],
      ['accessory.color', 'accessoryColor'],
    ] as const;

    for (const [categoryId, slot] of colorCategories) {
      for (const item of getAvatarCatalogItems(categoryId).filter((candidate) => candidate.status === 'active')) {
        const svg = renderAvatarV2Svg(
          avatarSelectionToAvatarV2RenderConfig(updateAvatarSelection(defaultAvatarSelection, slot, item.id)),
        );

        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).toContain('avatar-v2-layer-base');
      }
    }
  });
});
