import { describe, expect, it } from 'vitest';
import { avatarSelectionToAvatarV2Configuration, avatarSelectionToAvatarV2RenderConfig, avatarV2ConfigurationToAvatarSelection, defaultAvatarSelection } from './avatarCatalogAdapter';
import { createAvatarSelectionFixture } from './avatarCatalogFixtures';

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

  it('uses the shared clothing palette for accessory colors while preserving Avatar V2 tokens', () => {
    expect(avatarSelectionToAvatarV2RenderConfig(createAvatarSelectionFixture({
      accessoryColor: 'accessory.color.rose',
      skinTone: 'skin.tone.deep',
    }))).toEqual(expect.objectContaining({
      skinTone: 'skinBrown',
      accessory: expect.objectContaining({ color: 'shirtRose' }),
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
      accessoryColor: 'accessory.color.sky',
      skinTone: 'skin.tone.peach',
    }));
  });
});
