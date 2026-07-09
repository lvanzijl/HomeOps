import { describe, expect, it } from 'vitest';
import { avatarCatalog, getAvatarCatalogEditorItems } from './avatarCatalog';
import { avatarSelectionToAvatarV2Configuration, avatarSelectionToAvatarV2RenderConfig, avatarV2ConfigurationToAvatarSelection, defaultAvatarSelection } from './avatarCatalogAdapter';
import { createAvatarSelectionFixture } from './avatarCatalogFixtures';

function ids(items: readonly { id: string }[]) {
  return items.map((item) => item.id);
}

describe('avatar catalog adapter', () => {
  it('maps default catalog selections back to the current Avatar V2 renderer output', () => {
    expect(avatarSelectionToAvatarV2Configuration(defaultAvatarSelection)).toEqual({
      headVariant: 'round',
      hairStyle: 'shortMessy',
      hairColor: 'hairCocoa',
      clothingStyle: 'hoodie',
      clothingColor: 'shirtSky',
      accessory: 'star',
      accessoryColor: 'accessoryCoral',
    });
  });

  it('renders expanded skin, hair, clothing, and accessory selections through Avatar V2 tokens', () => {
    expect(avatarSelectionToAvatarV2RenderConfig(createAvatarSelectionFixture({
      skinTone: 'skin.tone.elf',
      hairColor: 'hair.color.royal-blue',
      clothingColor: 'clothing.color.midnight',
      accessoryColor: 'accessory.color.frost',
    }))).toEqual(expect.objectContaining({
      skinTone: 'skinElf',
      hair: expect.objectContaining({ color: 'hairRoyalBlue' }),
      shirt: expect.objectContaining({ color: 'shirtMidnight' }),
      accessory: expect.objectContaining({ color: 'shirtFrost' }),
    }));
  });

  it('uses the shared clothing palette for accessory colors while preserving legacy Avatar V2 tokens where needed', () => {
    expect(avatarSelectionToAvatarV2RenderConfig(createAvatarSelectionFixture({
      accessoryColor: 'accessory.color.rose',
      skinTone: 'skin.tone.deep-brown',
    }))).toEqual(expect.objectContaining({
      skinTone: 'skinDeepBrown',
      accessory: expect.objectContaining({ color: 'shirtRose' }),
    }));

    expect(avatarSelectionToAvatarV2Configuration(createAvatarSelectionFixture({
      accessoryColor: 'accessory.color.sky',
    }))).toEqual(expect.objectContaining({
      accessoryColor: 'accessoryLilac',
    }));
  });

  it('builds catalog selections from legacy Avatar V2 configurations', () => {
    expect(avatarV2ConfigurationToAvatarSelection({
      headVariant: 'oval',
      hairStyle: 'curlyPlayful',
      hairColor: 'hairPlum',
      clothingStyle: 'overall',
      clothingColor: 'shirtMint',
      accessory: 'flower',
      accessoryColor: 'accessoryLilac',
    }).selections).toEqual(expect.objectContaining({
      headVariant: 'head.variant.oval',
      hairStyle: 'hair.style.curly-playful',
      hairColor: 'hair.color.plum',
      accessoryColor: 'accessory.color.sky',
      skinTone: 'skin.tone.medium',
    }));
  });

  it('keeps deprecated legacy colors selectable only when already chosen', () => {
    expect(ids(getAvatarCatalogEditorItems('hair.color', 'hair.color.plum'))).toContain('hair.color.plum');
    expect(ids(getAvatarCatalogEditorItems('hair.color', avatarCatalog.defaults.hairColor))).not.toContain('hair.color.plum');
  });
});
