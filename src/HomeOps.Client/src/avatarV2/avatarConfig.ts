import type { AccessoryStyle, AvatarConfig, AvatarHeadVariant, HairStyle, PaletteToken, ShirtStyle } from './avatarV2';

export interface AvatarV2Configuration {
  headVariant: AvatarHeadVariant;
  hairStyle: HairStyle;
  hairColor: PaletteToken;
  clothingStyle: ShirtStyle;
  clothingColor: PaletteToken;
  accessory: AccessoryStyle;
  accessoryColor: PaletteToken;
}

export const avatarV2DefaultConfiguration: AvatarV2Configuration = {
  headVariant: 'round',
  hairStyle: 'shortMessy',
  hairColor: 'hairCocoa',
  clothingStyle: 'hoodie',
  clothingColor: 'shirtSky',
  accessory: 'star',
  accessoryColor: 'accessoryCoral',
};

const headVariants: readonly AvatarHeadVariant[] = ['round', 'oval', 'wide'];
const hairStyles: readonly HairStyle[] = ['softCrop', 'curlyCloud', 'sideBob', 'swoop', 'layeredMessy', 'shortMessy', 'longSoft', 'curlyPlayful'];
const hairColors: readonly PaletteToken[] = [
  'hairSoftBlack',
  'hairNaturalBlack',
  'hairBlueBlack',
  'hairEspresso',
  'hairCocoa',
  'hairChestnut',
  'hairWalnut',
  'hairDarkBlonde',
  'hairGoldenBlonde',
  'hairHoneyBlonde',
  'hairLightBlonde',
  'hairSoftAuburn',
  'hairRichAuburn',
  'hairLightGinger',
  'hairCopperGinger',
  'hairSteelGrey',
  'hairSilverGrey',
  'hairSoftWhite',
  'hairBrightSilver',
  'hairPearlWhite',
  'hairRoyalBlue',
  'hairElectricCyan',
  'hairEmerald',
  'hairLime',
  'hairViolet',
  'hairPink',
  'hairMagenta',
  'hairSunsetOrange',
  'hairGoldenYellow',
  'hairPlum',
];
const clothingStyles: readonly ShirtStyle[] = ['roundedTee', 'collar', 'hoodie', 'sweater', 'tShirt', 'overall'];
const clothingColors: readonly PaletteToken[] = [
  'shirtWhite',
  'shirtCream',
  'shirtLightGrey',
  'shirtCharcoal',
  'shirtBlack',
  'shirtNavy',
  'shirtDenim',
  'shirtBrown',
  'shirtBlush',
  'shirtPeach',
  'shirtButter',
  'shirtSage',
  'shirtMint',
  'shirtSky',
  'shirtLavender',
  'shirtLilac',
  'shirtRed',
  'shirtOrange',
  'shirtSun',
  'shirtGreen',
  'shirtBlue',
  'shirtPurple',
  'shirtRose',
  'shirtTeal',
  'shirtBurgundy',
  'shirtPumpkin',
  'shirtMustard',
  'shirtForest',
  'shirtEvergreen',
  'shirtWinterBlue',
  'shirtPlum',
  'shirtCocoa',
  'shirtStone',
  'shirtTaupe',
  'shirtSlate',
  'shirtMidnight',
  'shirtApricot',
  'shirtDustyRose',
  'shirtSeafoam',
  'shirtPowderBlue',
  'shirtCoral',
  'shirtAqua',
  'shirtViolet',
  'shirtLime',
  'shirtTerracotta',
  'shirtOlive',
  'shirtCranberry',
  'shirtFrost',
];
const accessories: readonly AccessoryStyle[] = ['none', 'star', 'flower', 'headband', 'bow', 'chestStar', 'leafPin', 'tinyCrown'];
const accessoryColors: readonly PaletteToken[] = [
  'accessoryLilac',
  'accessoryCoral',
  ...clothingColors,
];

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

export function normalizeAvatarV2Configuration(value: unknown): AvatarV2Configuration {
  if (!value || typeof value !== 'object') return { ...avatarV2DefaultConfiguration };
  const candidate = value as Partial<AvatarV2Configuration>;
  return {
    headVariant: includes(headVariants, candidate.headVariant) ? candidate.headVariant : avatarV2DefaultConfiguration.headVariant,
    hairStyle: includes(hairStyles, candidate.hairStyle) ? candidate.hairStyle : avatarV2DefaultConfiguration.hairStyle,
    hairColor: includes(hairColors, candidate.hairColor) ? candidate.hairColor : avatarV2DefaultConfiguration.hairColor,
    clothingStyle: includes(clothingStyles, candidate.clothingStyle) ? candidate.clothingStyle : avatarV2DefaultConfiguration.clothingStyle,
    clothingColor: includes(clothingColors, candidate.clothingColor) ? candidate.clothingColor : avatarV2DefaultConfiguration.clothingColor,
    accessory: includes(accessories, candidate.accessory) ? candidate.accessory : avatarV2DefaultConfiguration.accessory,
    accessoryColor: includes(accessoryColors, candidate.accessoryColor) ? candidate.accessoryColor : avatarV2DefaultConfiguration.accessoryColor,
  };
}

export function toAvatarV2RenderConfig(configuration: AvatarV2Configuration): AvatarConfig {
  const accessoryMounts: Partial<Record<AccessoryStyle, AvatarConfig['accessory']['mount']>> = {
    star: 'hairRight',
    flower: 'hairLeft',
    headband: 'headTop',
    bow: 'hairRight',
    chestStar: 'chestCenter',
    leafPin: 'hairRight',
    tinyCrown: 'headTop',
    starClip: 'hairRight',
  };
  return {
    base: 'child',
    headVariant: configuration.headVariant,
    skinTone: 'skinMedium',
    hair: { style: configuration.hairStyle, color: configuration.hairColor },
    glasses: { style: 'none', color: 'lineBlue' },
    mouth: { style: 'neutral' },
    shirt: { style: configuration.clothingStyle, color: configuration.clothingColor },
    accessory: {
      style: configuration.accessory,
      color: configuration.accessoryColor,
      mount: accessoryMounts[configuration.accessory],
    },
  };
}

export function avatarV2ConfigurationsEqual(a: AvatarV2Configuration, b: AvatarV2Configuration) {
  return JSON.stringify(a) === JSON.stringify(b);
}
