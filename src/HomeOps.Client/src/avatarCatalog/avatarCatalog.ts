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
}

export interface AvatarCatalogPreview {
  hiddenSelections?: Partial<Record<AvatarSelectionSlot, string>>;
}

export interface AvatarCatalogCategory {
  id: string;
  slot: AvatarSelectionSlot;
  required: boolean;
  allowsNone: boolean;
  order: number;
  labels: AvatarCatalogText;
  accessibilityLabels: AvatarCatalogText;
  descriptions: AvatarCatalogText;
  presentation: AvatarCatalogPresentation;
  tags: readonly string[];
  preview?: AvatarCatalogPreview;
}

export interface AvatarCatalogRendererBinding {
  rendererFamily: 'avatar-v2-svg';
  rendererToken: string;
  layer?: string;
  mountPoint?: 'chestCenter' | 'hairLeft' | 'hairRight' | 'headTop';
}

export interface AvatarCatalogColor {
  format: 'expandedSwatch';
  base: string;
  shade: string;
  highlight: string;
  line: string;
  paletteId: 'skin' | 'hair' | 'clothing';
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
  legacyIds: readonly string[];
}

export interface AvatarCatalogDefinition {
  catalogId: string;
  schemaVersion: string;
  defaultLocale: string;
  supportedLocales: readonly string[];
  categories: readonly AvatarCatalogCategory[];
  items: readonly AvatarCatalogItem[];
  defaults: Record<AvatarSelectionSlot, string>;
}

const text = (nl: string, en: string): AvatarCatalogText => ({ 'nl-NL': nl, 'en-US': en });

const categories: readonly AvatarCatalogCategory[] = [
  {
    id: 'hair.style',
    slot: avatarSelectionSlots.hairStyle,
    required: true,
    allowsNone: false,
    order: 10,
    labels: text('Haar', 'Hair'),
    accessibilityLabels: text('Kapselkeuzes', 'Hairstyle choices'),
    descriptions: text('Kies een kapsel.', 'Choose a hairstyle.'),
    presentation: { control: 'tile', density: 'compact' },
    tags: ['editor', 'hair'],
    preview: {
      hiddenSelections: {
        [avatarSelectionSlots.accessoryStyle]: 'accessory.style.none',
      },
    },
  },
  {
    id: 'hair.color',
    slot: avatarSelectionSlots.hairColor,
    required: true,
    allowsNone: false,
    order: 20,
    labels: text('Haarkleur', 'Hair color'),
    accessibilityLabels: text('Haarkleurkeuzes', 'Hair color choices'),
    descriptions: text('Kies een haarkleur.', 'Choose a hair color.'),
    presentation: { control: 'swatch', density: 'compact' },
    tags: ['editor', 'hair', 'color'],
  },
  {
    id: 'clothing.style',
    slot: avatarSelectionSlots.clothingStyle,
    required: true,
    allowsNone: false,
    order: 30,
    labels: text('Kleding', 'Clothing'),
    accessibilityLabels: text('Kledingkeuzes', 'Clothing choices'),
    descriptions: text('Kies een outfit.', 'Choose an outfit.'),
    presentation: { control: 'tile', density: 'compact' },
    tags: ['editor', 'clothing'],
  },
  {
    id: 'clothing.color',
    slot: avatarSelectionSlots.clothingColor,
    required: true,
    allowsNone: false,
    order: 40,
    labels: text('Kledingkleur', 'Clothing color'),
    accessibilityLabels: text('Kledingkleurkeuzes', 'Clothing color choices'),
    descriptions: text('Kies een kledingkleur.', 'Choose a clothing color.'),
    presentation: { control: 'swatch', density: 'compact' },
    tags: ['editor', 'clothing', 'color'],
  },
  {
    id: 'accessory.style',
    slot: avatarSelectionSlots.accessoryStyle,
    required: true,
    allowsNone: true,
    order: 50,
    labels: text('Accessoire', 'Accessory'),
    accessibilityLabels: text('Accessoirekeuzes', 'Accessory choices'),
    descriptions: text('Kies iets extra’s.', 'Choose an extra detail.'),
    presentation: { control: 'tile', density: 'compact' },
    tags: ['editor', 'accessory'],
  },
  {
    id: 'accessory.color',
    slot: avatarSelectionSlots.accessoryColor,
    required: true,
    allowsNone: false,
    order: 60,
    labels: text('Accessoirekleur', 'Accessory color'),
    accessibilityLabels: text('Accessoirekleurkeuzes', 'Accessory color choices'),
    descriptions: text('Kies een accessoirekleur.', 'Choose an accessory color.'),
    presentation: { control: 'swatch', density: 'compact' },
    tags: ['editor', 'accessory', 'color'],
  },
  {
    id: 'head.variant',
    slot: avatarSelectionSlots.headVariant,
    required: true,
    allowsNone: false,
    order: 70,
    labels: text('Hoofdvorm', 'Head shape'),
    accessibilityLabels: text('Hoofdvormkeuzes', 'Head shape choices'),
    descriptions: text('Kies een hoofdvorm.', 'Choose a head shape.'),
    presentation: { control: 'tile', density: 'compact' },
    tags: ['editor', 'head'],
  },
  {
    id: 'skin.tone',
    slot: avatarSelectionSlots.skinTone,
    required: true,
    allowsNone: false,
    order: 80,
    labels: text('Huidskleur', 'Skin tone'),
    accessibilityLabels: text('Huidskleurkeuzes', 'Skin tone choices'),
    descriptions: text('Kies een huidskleur.', 'Choose a skin tone.'),
    presentation: { control: 'swatch', density: 'compact' },
    tags: ['editor', 'skin', 'color'],
  },
];

const items: readonly AvatarCatalogItem[] = [
  { id: 'hair.style.soft-crop', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 10, labels: text('Zachte coupe', 'Soft crop'), accessibilityLabels: text('Kapsel zachte coupe', 'Soft crop hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'softCrop', layer: 'hair' }, legacyIds: ['softCrop'] },
  { id: 'hair.style.curly-cloud', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 20, labels: text('Krullenwolk', 'Curly cloud'), accessibilityLabels: text('Kapsel krullenwolk', 'Curly cloud hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'curlyCloud', layer: 'hair' }, legacyIds: ['curlyCloud'] },
  { id: 'hair.style.side-bob', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 30, labels: text('Bob opzij', 'Side bob'), accessibilityLabels: text('Kapsel bob opzij', 'Side bob hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'sideBob', layer: 'hair' }, legacyIds: ['sideBob'] },
  { id: 'hair.style.swoop', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 40, labels: text('Zijslag', 'Swoop'), accessibilityLabels: text('Kapsel zijslag', 'Swoop hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'swoop', layer: 'hair' }, legacyIds: ['swoop'] },
  { id: 'hair.style.layered-messy', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 50, labels: text('Speelse laagjes', 'Layered messy'), accessibilityLabels: text('Kapsel speelse laagjes', 'Layered messy hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'layeredMessy', layer: 'hair' }, legacyIds: ['layeredMessy'] },
  { id: 'hair.style.short-messy', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 60, labels: text('Kort speels', 'Short messy'), accessibilityLabels: text('Kapsel kort speels', 'Short messy hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'shortMessy', layer: 'hair' }, legacyIds: ['shortMessy'] },
  { id: 'hair.style.long-soft', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 70, labels: text('Lang zacht', 'Long soft'), accessibilityLabels: text('Kapsel lang zacht', 'Long soft hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'longSoft', layer: 'hair' }, legacyIds: ['longSoft'] },
  { id: 'hair.style.curly-playful', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 80, labels: text('Speelse krullen', 'Playful curls'), accessibilityLabels: text('Kapsel speelse krullen', 'Playful curls hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'curlyPlayful', layer: 'hair' }, legacyIds: ['curlyPlayful'] },
  { id: 'hair.color.cocoa', categoryId: 'hair.color', type: 'color', status: 'active', order: 10, labels: text('Cacao', 'Cocoa'), accessibilityLabels: text('Cacao haarkleur', 'Cocoa hair color'), tags: ['hair', 'color', 'palette.hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'hairCocoa', layer: 'hair' }, color: { format: 'expandedSwatch', base: '#5b3926', shade: '#3f2418', highlight: '#8a5b3d', line: '#2a1810', paletteId: 'hair' }, legacyIds: ['hairCocoa'] },
  { id: 'hair.color.chestnut', categoryId: 'hair.color', type: 'color', status: 'active', order: 20, labels: text('Kastanje', 'Chestnut'), accessibilityLabels: text('Kastanje haarkleur', 'Chestnut hair color'), tags: ['hair', 'color', 'palette.hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'hairChestnut', layer: 'hair' }, color: { format: 'expandedSwatch', base: '#8c4a2f', shade: '#65311f', highlight: '#b56c48', line: '#3d1e14', paletteId: 'hair' }, legacyIds: ['hairChestnut'] },
  { id: 'hair.color.plum', categoryId: 'hair.color', type: 'color', status: 'active', order: 30, labels: text('Pruim', 'Plum'), accessibilityLabels: text('Pruim haarkleur', 'Plum hair color'), tags: ['hair', 'color', 'palette.hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'hairPlum', layer: 'hair' }, color: { format: 'expandedSwatch', base: '#5b3a67', shade: '#41284d', highlight: '#7a5590', line: '#2a1933', paletteId: 'hair' }, legacyIds: ['hairPlum'] },
  { id: 'clothing.style.t-shirt', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 10, labels: text('T-shirt', 'T-shirt'), accessibilityLabels: text('T-shirt outfit', 'T-shirt outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'tShirt', layer: 'shirt' }, legacyIds: ['tShirt'] },
  { id: 'clothing.style.rounded-tee', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 20, labels: text('Rond shirt', 'Rounded tee'), accessibilityLabels: text('Rond shirt outfit', 'Rounded tee outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'roundedTee', layer: 'shirt' }, legacyIds: ['roundedTee'] },
  { id: 'clothing.style.collar', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 30, labels: text('Shirt met kraag', 'Collar shirt'), accessibilityLabels: text('Shirt met kraag outfit', 'Collar shirt outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'collar', layer: 'shirt' }, legacyIds: ['collar'] },
  { id: 'clothing.style.hoodie', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 40, labels: text('Hoodie', 'Hoodie'), accessibilityLabels: text('Hoodie outfit', 'Hoodie outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'hoodie', layer: 'shirt' }, legacyIds: ['hoodie'] },
  { id: 'clothing.style.sweater', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 50, labels: text('Trui', 'Sweater'), accessibilityLabels: text('Trui outfit', 'Sweater outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'sweater', layer: 'shirt' }, legacyIds: ['sweater'] },
  { id: 'clothing.style.overall', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 60, labels: text('Tuinbroek', 'Overall'), accessibilityLabels: text('Tuinbroek outfit', 'Overall outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'overall', layer: 'shirt' }, legacyIds: ['overall'] },
  { id: 'clothing.color.sky', categoryId: 'clothing.color', type: 'color', status: 'active', order: 10, labels: text('Hemelsblauw', 'Sky blue'), accessibilityLabels: text('Hemelsblauwe kledingkleur', 'Sky blue clothing color'), tags: ['clothing', 'color', 'palette.clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'shirtSky', layer: 'shirt' }, color: { format: 'expandedSwatch', base: '#8fc8ef', shade: '#67a8d8', highlight: '#b6ddf6', line: '#417895', paletteId: 'clothing' }, legacyIds: ['shirtSky'] },
  { id: 'clothing.color.mint', categoryId: 'clothing.color', type: 'color', status: 'active', order: 20, labels: text('Mintgroen', 'Mint'), accessibilityLabels: text('Mintgroene kledingkleur', 'Mint clothing color'), tags: ['clothing', 'color', 'palette.clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'shirtMint', layer: 'shirt' }, color: { format: 'expandedSwatch', base: '#9edfc0', shade: '#72bf9a', highlight: '#c5efd9', line: '#4f8f70', paletteId: 'clothing' }, legacyIds: ['shirtMint'] },
  { id: 'clothing.color.rose', categoryId: 'clothing.color', type: 'color', status: 'active', order: 30, labels: text('Roze', 'Rose'), accessibilityLabels: text('Roze kledingkleur', 'Rose clothing color'), tags: ['clothing', 'color', 'palette.clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'shirtRose', layer: 'shirt' }, color: { format: 'expandedSwatch', base: '#f0a8bd', shade: '#d97f9c', highlight: '#f7c8d7', line: '#9a5268', paletteId: 'clothing' }, legacyIds: ['shirtRose'] },
  { id: 'clothing.color.sun', categoryId: 'clothing.color', type: 'color', status: 'active', order: 40, labels: text('Zonnig geel', 'Sun'), accessibilityLabels: text('Zonnig gele kledingkleur', 'Sun clothing color'), tags: ['clothing', 'color', 'palette.clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'shirtSun', layer: 'shirt' }, color: { format: 'expandedSwatch', base: '#f7d56e', shade: '#e6b94b', highlight: '#ffe89a', line: '#9a7a2f', paletteId: 'clothing' }, legacyIds: ['shirtSun'] },
  { id: 'accessory.style.none', categoryId: 'accessory.style', type: 'none', status: 'active', order: 10, labels: text('Geen accessoire', 'No accessory'), accessibilityLabels: text('Geen accessoire', 'No accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'none', layer: 'accessory' }, legacyIds: ['none'] },
  { id: 'accessory.style.star', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 20, labels: text('Ster', 'Star'), accessibilityLabels: text('Steraccessoire', 'Star accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'star', layer: 'accessory', mountPoint: 'hairRight' }, legacyIds: ['star'] },
  { id: 'accessory.style.flower', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 30, labels: text('Bloemspeld', 'Flower pin'), accessibilityLabels: text('Bloemspeld accessoire', 'Flower pin accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'flower', layer: 'accessory', mountPoint: 'hairLeft' }, legacyIds: ['flower'] },
  { id: 'accessory.style.headband', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 40, labels: text('Haarband', 'Headband'), accessibilityLabels: text('Haarband accessoire', 'Headband accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'headband', layer: 'accessory', mountPoint: 'headTop' }, legacyIds: ['headband'] },
  { id: 'accessory.style.bow', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 50, labels: text('Strik', 'Bow'), accessibilityLabels: text('Strik accessoire', 'Bow accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'bow', layer: 'accessory', mountPoint: 'hairRight' }, legacyIds: ['bow'] },
  { id: 'accessory.style.chest-star', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 60, labels: text('Ster op trui', 'Chest star'), accessibilityLabels: text('Ster op trui accessoire', 'Chest star accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'chestStar', layer: 'accessory', mountPoint: 'chestCenter' }, legacyIds: ['chestStar'] },
  { id: 'accessory.style.leaf-pin', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 70, labels: text('Bladspeld', 'Leaf pin'), accessibilityLabels: text('Bladspeld accessoire', 'Leaf pin accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'leafPin', layer: 'accessory', mountPoint: 'hairRight' }, legacyIds: ['leafPin'] },
  { id: 'accessory.style.tiny-crown', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 80, labels: text('Kroontje', 'Tiny crown'), accessibilityLabels: text('Kroontje accessoire', 'Tiny crown accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'tinyCrown', layer: 'accessory', mountPoint: 'headTop' }, legacyIds: ['tinyCrown'] },
  { id: 'accessory.color.sky', categoryId: 'accessory.color', type: 'color', status: 'active', order: 10, labels: text('Hemelsblauw', 'Sky blue'), accessibilityLabels: text('Hemelsblauwe accessoirekleur', 'Sky blue accessory color'), tags: ['accessory', 'color', 'palette.clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'accessoryLilac', layer: 'accessory' }, color: { format: 'expandedSwatch', base: '#8fc8ef', shade: '#67a8d8', highlight: '#b6ddf6', line: '#417895', paletteId: 'clothing' }, legacyIds: ['accessoryLilac'] },
  { id: 'accessory.color.mint', categoryId: 'accessory.color', type: 'color', status: 'active', order: 20, labels: text('Mintgroen', 'Mint'), accessibilityLabels: text('Mintgroene accessoirekleur', 'Mint accessory color'), tags: ['accessory', 'color', 'palette.clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'accessoryCoral', layer: 'accessory' }, color: { format: 'expandedSwatch', base: '#9edfc0', shade: '#72bf9a', highlight: '#c5efd9', line: '#4f8f70', paletteId: 'clothing' }, legacyIds: ['accessoryCoral'] },
  { id: 'accessory.color.rose', categoryId: 'accessory.color', type: 'color', status: 'active', order: 30, labels: text('Roze', 'Rose'), accessibilityLabels: text('Roze accessoirekleur', 'Rose accessory color'), tags: ['accessory', 'color', 'palette.clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'shirtRose', layer: 'accessory' }, color: { format: 'expandedSwatch', base: '#f0a8bd', shade: '#d97f9c', highlight: '#f7c8d7', line: '#9a5268', paletteId: 'clothing' }, legacyIds: ['shirtRose'] },
  { id: 'accessory.color.sun', categoryId: 'accessory.color', type: 'color', status: 'active', order: 40, labels: text('Zonnig geel', 'Sun'), accessibilityLabels: text('Zonnig gele accessoirekleur', 'Sun accessory color'), tags: ['accessory', 'color', 'palette.clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'shirtSun', layer: 'accessory' }, color: { format: 'expandedSwatch', base: '#f7d56e', shade: '#e6b94b', highlight: '#ffe89a', line: '#9a7a2f', paletteId: 'clothing' }, legacyIds: ['shirtSun'] },
  { id: 'head.variant.round', categoryId: 'head.variant', type: 'rendererStyle', status: 'active', order: 10, labels: text('Rond', 'Round'), accessibilityLabels: text('Ronde hoofdvorm', 'Round head shape'), tags: ['head'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'round', layer: 'head' }, legacyIds: ['round'] },
  { id: 'head.variant.oval', categoryId: 'head.variant', type: 'rendererStyle', status: 'active', order: 20, labels: text('Ovaal', 'Oval'), accessibilityLabels: text('Ovale hoofdvorm', 'Oval head shape'), tags: ['head'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'oval', layer: 'head' }, legacyIds: ['oval'] },
  { id: 'head.variant.wide', categoryId: 'head.variant', type: 'rendererStyle', status: 'active', order: 30, labels: text('Breed', 'Wide'), accessibilityLabels: text('Brede hoofdvorm', 'Wide head shape'), tags: ['head'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'wide', layer: 'head' }, legacyIds: ['wide'] },
  { id: 'skin.tone.peach', categoryId: 'skin.tone', type: 'color', status: 'active', order: 10, labels: text('Perzik', 'Peach'), accessibilityLabels: text('Perzikkleurige huidskleur', 'Peach skin tone'), tags: ['skin', 'color', 'palette.skin'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'skinPeach', layer: 'skin' }, color: { format: 'expandedSwatch', base: '#f5c7a9', shade: '#e2a783', highlight: '#ffe0c8', line: '#9a684e', paletteId: 'skin' }, legacyIds: ['skinPeach'] },
  { id: 'skin.tone.golden', categoryId: 'skin.tone', type: 'color', status: 'active', order: 20, labels: text('Goudbruin', 'Golden'), accessibilityLabels: text('Goudbruine huidskleur', 'Golden skin tone'), tags: ['skin', 'color', 'palette.skin'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'skinHoney', layer: 'skin' }, color: { format: 'expandedSwatch', base: '#d8a06f', shade: '#b97f50', highlight: '#efc59a', line: '#7b4f31', paletteId: 'skin' }, legacyIds: ['skinHoney'] },
  { id: 'skin.tone.deep', categoryId: 'skin.tone', type: 'color', status: 'active', order: 30, labels: text('Diep bruin', 'Deep brown'), accessibilityLabels: text('Diepbruine huidskleur', 'Deep brown skin tone'), tags: ['skin', 'color', 'palette.skin'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'skinBrown', layer: 'skin' }, color: { format: 'expandedSwatch', base: '#8f5a3c', shade: '#6f3f29', highlight: '#b77a54', line: '#4f2d1f', paletteId: 'skin' }, legacyIds: ['skinBrown'] },
];

export const avatarCatalog: AvatarCatalogDefinition = {
  catalogId: avatarCatalogId,
  schemaVersion: avatarCatalogSchemaVersion,
  defaultLocale: avatarCatalogDefaultLocale,
  supportedLocales: ['nl-NL', 'en-US'],
  categories,
  items,
  defaults: {
    [avatarSelectionSlots.headVariant]: 'head.variant.round',
    [avatarSelectionSlots.skinTone]: 'skin.tone.peach',
    [avatarSelectionSlots.hairStyle]: 'hair.style.short-messy',
    [avatarSelectionSlots.hairColor]: 'hair.color.cocoa',
    [avatarSelectionSlots.clothingStyle]: 'clothing.style.hoodie',
    [avatarSelectionSlots.clothingColor]: 'clothing.color.sky',
    [avatarSelectionSlots.accessoryStyle]: 'accessory.style.star',
    [avatarSelectionSlots.accessoryColor]: 'accessory.color.mint',
  },
};

const categoryById = new Map(avatarCatalog.categories.map((category) => [category.id, category]));
const itemById = new Map(avatarCatalog.items.map((item) => [item.id, item]));

export function getAvatarCatalogCategories(): readonly AvatarCatalogCategory[] {
  return [...avatarCatalog.categories].sort((left, right) => left.order - right.order);
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

export function localizeAvatarCatalogText(texts: AvatarCatalogText | undefined, fallback: string, locale = avatarCatalog.defaultLocale): string {
  if (!texts) return fallback;
  return texts[locale] ?? texts[avatarCatalog.defaultLocale] ?? Object.values(texts)[0] ?? fallback;
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
