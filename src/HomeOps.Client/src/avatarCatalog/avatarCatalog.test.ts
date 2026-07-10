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

  it('exposes a single-select eyewear category defaulting to no glasses', () => {
    const eyewear = getAvatarCatalogItems('eyewear.style');
    expect(eyewear.map((item) => item.id)).toEqual([
      'eyewear.style.none',
      'eyewear.style.regular',
      'eyewear.style.thick-frame',
      'eyewear.style.round',
      'eyewear.style.rectangular',
      'eyewear.style.sunglasses',
      'eyewear.style.star',
      'eyewear.style.heart',
    ]);
    expect(eyewear.every((item) => item.status === 'active')).toBe(true);
    expect(avatarCatalog.defaults.eyewearStyle).toBe('eyewear.style.none');

    const eyewearCategory = avatarCatalog.categories.find((category) => category.id === 'eyewear.style');
    expect(eyewearCategory?.slot).toBe('eyewearStyle');
    expect(eyewearCategory?.allowsNone).toBe(true);

    // Eyewear is surfaced within the Face editor category.
    const facePanel = avatarCatalog.editorPanels.find((panel) => panel.id === 'face');
    expect(facePanel?.categoryIds).toContain('eyewear.style');
    expect(facePanel?.categoryIds[0]).toBe('eyewear.style');
  });

  it('renders every active eyewear style through the Avatar V2 glasses layer', () => {
    for (const item of getAvatarCatalogItems('eyewear.style')) {
      const svg = renderAvatarV2Svg(
        avatarSelectionToAvatarV2RenderConfig(updateAvatarSelection(defaultAvatarSelection, 'eyewearStyle', item.id)),
      );
      expect(svg.startsWith('<svg')).toBe(true);
      if (item.id === 'eyewear.style.none') {
        expect(svg).not.toContain('avatar-v2-layer-glasses');
      } else {
        expect(svg).toContain('avatar-v2-layer-glasses');
      }
    }
  });
});
