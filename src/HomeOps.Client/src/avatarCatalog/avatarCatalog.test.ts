import { describe, expect, it } from 'vitest';
import { avatarSelectionToAvatarV2RenderConfig, defaultAvatarSelection } from './avatarCatalogAdapter';
import { avatarCatalog, getAvatarCatalogItems, getAvatarCatalogStyleColorRegions, isAvatarCatalogCategoryAvailable, localizeAvatarCatalogText, updateAvatarSelection } from './avatarCatalog';
import { renderAvatarV2Svg } from '../avatarV2/avatarV2';

describe('avatar catalog metadata', () => {
  it('exposes the expanded skin, hair, clothing, and accessory palettes', () => {
    expect(getAvatarCatalogItems('skin.tone')).toHaveLength(20);
    expect(getAvatarCatalogItems('hair.color').filter((item) => item.status === 'active')).toHaveLength(29);
    expect(getAvatarCatalogItems('clothing.color')).toHaveLength(48);
    expect(getAvatarCatalogItems('accessory.color')).toHaveLength(48);
    expect(getAvatarCatalogItems('clothing.secondary-color')).toHaveLength(48);
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

    // Eyewear is surfaced within the Face editor category, alongside mouth styles.
    const facePanel = avatarCatalog.editorPanels.find((panel) => panel.id === 'face');
    expect(facePanel?.categoryIds).toContain('eyewear.style');
    expect(facePanel?.categoryIds).toContain('mouth.style');
    expect(facePanel?.categoryIds[0]).toBe('mouth.style');
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

  it('exposes ten mouth styles defaulting to the neutral compatibility mouth', () => {
    const mouths = getAvatarCatalogItems('mouth.style');
    expect(mouths.map((item) => item.id)).toEqual([
      'mouth.style.neutral',
      'mouth.style.smile',
      'mouth.style.big-smile',
      'mouth.style.open-smile',
      'mouth.style.laughing',
      'mouth.style.smirk',
      'mouth.style.determined',
      'mouth.style.surprised',
      'mouth.style.sad',
      'mouth.style.tongue-out',
    ]);
    expect(mouths.every((item) => item.status === 'active')).toBe(true);
    expect(avatarCatalog.defaults.mouthStyle).toBe('mouth.style.neutral');

    const mouthCategory = avatarCatalog.categories.find((category) => category.id === 'mouth.style');
    expect(mouthCategory?.slot).toBe('mouthStyle');
    expect(mouthCategory?.required).toBe(false);
    expect(mouthCategory?.allowsNone).toBe(false);
  });

  it('renders every active mouth style through the Avatar V2 mouth layer', () => {
    for (const item of getAvatarCatalogItems('mouth.style')) {
      const svg = renderAvatarV2Svg(
        avatarSelectionToAvatarV2RenderConfig(updateAvatarSelection(defaultAvatarSelection, 'mouthStyle', item.id)),
      );
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('avatar-v2-layer-mouth');
      expect(svg).toContain(`data-mouth-style="${item.renderer?.rendererToken}"`);
    }
  });

  it('exposes clothing styles with declared color regions', () => {
    const styles = getAvatarCatalogItems('clothing.style');
    expect(styles.map((item) => item.id)).toEqual([
      'clothing.style.t-shirt',
      'clothing.style.rounded-tee',
      'clothing.style.polo',
      'clothing.style.collar',
      'clothing.style.dress',
      'clothing.style.hoodie',
      'clothing.style.sweater',
      'clothing.style.jacket',
      'clothing.style.overall',
      'clothing.style.zip-hoodie',
      'clothing.style.varsity-jacket',
      'clothing.style.rugby-shirt',
      'clothing.style.contrast-pocket-hoodie',
      'clothing.style.winter-coat',
      'clothing.style.cardigan',
      'clothing.style.sports-shirt',
      'clothing.style.apron-smock',
    ]);

    const dualColor = ['clothing.style.polo', 'clothing.style.dress', 'clothing.style.jacket', 'clothing.style.zip-hoodie', 'clothing.style.varsity-jacket', 'clothing.style.rugby-shirt', 'clothing.style.contrast-pocket-hoodie', 'clothing.style.winter-coat', 'clothing.style.cardigan', 'clothing.style.sports-shirt', 'clothing.style.apron-smock'];
    for (const style of styles) {
      const regions = getAvatarCatalogStyleColorRegions(style);
      expect(regions).toEqual(dualColor.includes(style.id) ? ['primary', 'secondary'] : ['primary']);
    }
  });

  it('mirrors the clothing palette for the secondary clothing color category', () => {
    const clothingColors = getAvatarCatalogItems('clothing.color');
    const secondaryColors = getAvatarCatalogItems('clothing.secondary-color');

    expect(secondaryColors.map((item) => item.id.replace('clothing.secondary-color.', ''))).toEqual(
      clothingColors.map((item) => item.id.replace('clothing.color.', '')),
    );

    for (const clothingColor of clothingColors) {
      const suffix = clothingColor.id.replace('clothing.color.', '');
      const secondaryColor = secondaryColors.find((item) => item.id === `clothing.secondary-color.${suffix}`);
      expect(secondaryColor?.color).toEqual(clothingColor.color);
      expect(secondaryColor?.renderer?.rendererToken).toEqual(clothingColor.renderer?.rendererToken);
    }

    const secondaryCategory = avatarCatalog.categories.find((category) => category.id === 'clothing.secondary-color');
    expect(secondaryCategory?.slot).toBe('clothingSecondaryColor');
    expect(secondaryCategory?.required).toBe(false);
    expect(secondaryCategory?.colorRegion).toBe('secondary');
    expect(secondaryCategory?.governingSlot).toBe('clothingStyle');
    expect(avatarCatalog.defaults.clothingSecondaryColor).toBe('clothing.secondary-color.white');

    // Secondary color is surfaced within the Clothing editor panel.
    const clothingPanel = avatarCatalog.editorPanels.find((panel) => panel.id === 'clothing');
    expect(clothingPanel?.categoryIds).toContain('clothing.secondary-color');
  });

  it('offers the secondary clothing color only for garments that support it', () => {
    const secondaryCategory = avatarCatalog.categories.find((category) => category.id === 'clothing.secondary-color');
    expect(secondaryCategory).toBeDefined();

    const primaryOnly = updateAvatarSelection(defaultAvatarSelection, 'clothingStyle', 'clothing.style.hoodie');
    expect(isAvatarCatalogCategoryAvailable(secondaryCategory!, primaryOnly)).toBe(false);

    for (const id of ['clothing.style.polo', 'clothing.style.dress', 'clothing.style.jacket', 'clothing.style.zip-hoodie', 'clothing.style.varsity-jacket', 'clothing.style.rugby-shirt', 'clothing.style.contrast-pocket-hoodie', 'clothing.style.winter-coat', 'clothing.style.cardigan', 'clothing.style.sports-shirt', 'clothing.style.apron-smock']) {
      const dualColor = updateAvatarSelection(defaultAvatarSelection, 'clothingStyle', id);
      expect(isAvatarCatalogCategoryAvailable(secondaryCategory!, dualColor)).toBe(true);
    }
  });

  it('renders a distinct secondary clothing color for dual-color garments', () => {
    const dualSelection = updateAvatarSelection(
      updateAvatarSelection(
        updateAvatarSelection(defaultAvatarSelection, 'clothingStyle', 'clothing.style.jacket'),
        'clothingColor',
        'clothing.color.navy',
      ),
      'clothingSecondaryColor',
      'clothing.secondary-color.butter',
    );

    const config = avatarSelectionToAvatarV2RenderConfig(dualSelection);
    expect(config.shirt.style).toBe('jacket');
    expect(config.shirt.color).toBe('shirtNavy');
    expect(config.shirt.secondaryColor).toBe('shirtButter');

    const svg = renderAvatarV2Svg(config);
    expect(svg).toContain('data-clothing-asset="jacket"');
  });
});
