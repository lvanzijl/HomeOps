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
  itemLabelVisibility: 'visible' | 'hidden';
  groupStrategy?: 'none' | 'tag';
  optionMinWidthRem?: number;
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
  legacyIds: readonly string[];
}

export interface AvatarCatalogEditorPanel {
  id: string;
  order: number;
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

export interface AvatarCatalogDefinition {
  catalogId: string;
  schemaVersion: string;
  defaultLocale: string;
  supportedLocales: readonly string[];
  editorPanels: readonly AvatarCatalogEditorPanel[];
  categories: readonly AvatarCatalogCategory[];
  items: readonly AvatarCatalogItem[];
  defaults: Record<AvatarSelectionSlot, string>;
}

interface AvatarCatalogPaletteEntry {
  id: string;
  order: number;
  labels: AvatarCatalogText;
  groupTag: string;
  rendererToken: string;
  color: Omit<AvatarCatalogColor, 'format' | 'paletteId'>;
  status?: AvatarCatalogItem['status'];
  legacyIds?: readonly string[];
  accessoryRendererToken?: string;
  accessoryLegacyIds?: readonly string[];
}

const text = (nl: string, en: string): AvatarCatalogText => ({ 'nl-NL': nl, 'en-US': en });

const optionGroups: Readonly<Record<string, AvatarCatalogOptionGroup>> = {
  'group.skin': { id: 'group.skin', order: 10, labels: text('Huidskleuren', 'Skin tones') },
  'group.natural-black': { id: 'group.natural-black', order: 10, labels: text('Zwart', 'Black') },
  'group.natural-brown': { id: 'group.natural-brown', order: 20, labels: text('Bruin', 'Brown') },
  'group.natural-blonde': { id: 'group.natural-blonde', order: 30, labels: text('Blond', 'Blonde') },
  'group.natural-auburn': { id: 'group.natural-auburn', order: 40, labels: text('Kastanjerood', 'Auburn') },
  'group.natural-ginger': { id: 'group.natural-ginger', order: 50, labels: text('Gember', 'Ginger') },
  'group.grey-white': { id: 'group.grey-white', order: 60, labels: text('Grijs & wit', 'Grey & white') },
  'group.legacy': { id: 'group.legacy', order: 70, labels: text('Bewaarde keuzes', 'Saved choices') },
  'group.neutral': { id: 'group.neutral', order: 10, labels: text('Neutraal', 'Neutral') },
  'group.soft': { id: 'group.soft', order: 20, labels: text('Zacht', 'Soft') },
  'group.bright': { id: 'group.bright', order: 30, labels: text('Helder', 'Bright') },
  'group.seasonal': { id: 'group.seasonal', order: 40, labels: text('Seizoen', 'Seasonal') },
};

function createColorItem({
  id,
  categoryId,
  order,
  labels,
  accessibilityLabels,
  tags,
  rendererToken,
  paletteId,
  color,
  legacyIds,
  status = 'active',
}: {
  id: string;
  categoryId: string;
  order: number;
  labels: AvatarCatalogText;
  accessibilityLabels: AvatarCatalogText;
  tags: readonly string[];
  rendererToken: string;
  paletteId: AvatarCatalogPaletteId;
  color: Omit<AvatarCatalogColor, 'format' | 'paletteId'>;
  legacyIds?: readonly string[];
  status?: AvatarCatalogItem['status'];
}): AvatarCatalogItem {
  return {
    id,
    categoryId,
    type: 'color',
    status,
    order,
    labels,
    accessibilityLabels,
    tags,
    renderer: { rendererFamily: 'avatar-v2-svg', rendererToken, layer: categoryId.startsWith('skin.') ? 'skin' : categoryId.startsWith('hair.') ? 'hair' : categoryId.startsWith('accessory.') ? 'accessory' : 'shirt' },
    color: {
      format: 'expandedSwatch',
      paletteId,
      ...color,
    },
    legacyIds: legacyIds ?? [rendererToken],
  };
}

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
    presentation: { control: 'tile', density: 'compact', itemLabelVisibility: 'visible', groupStrategy: 'none', optionMinWidthRem: 8.5 },
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
    presentation: { control: 'swatch', density: 'compact', itemLabelVisibility: 'visible', groupStrategy: 'tag', optionMinWidthRem: 8.5 },
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
    presentation: { control: 'tile', density: 'compact', itemLabelVisibility: 'visible', groupStrategy: 'none', optionMinWidthRem: 8.5 },
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
    presentation: { control: 'swatch', density: 'compact', itemLabelVisibility: 'visible', groupStrategy: 'tag', optionMinWidthRem: 8.5 },
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
    presentation: { control: 'tile', density: 'compact', itemLabelVisibility: 'visible', groupStrategy: 'none', optionMinWidthRem: 8.5 },
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
    presentation: { control: 'swatch', density: 'compact', itemLabelVisibility: 'visible', groupStrategy: 'tag', optionMinWidthRem: 8.5 },
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
    presentation: { control: 'tile', density: 'compact', itemLabelVisibility: 'visible', groupStrategy: 'none', optionMinWidthRem: 8.5 },
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
    presentation: { control: 'swatch', density: 'compact', itemLabelVisibility: 'hidden', groupStrategy: 'none', optionMinWidthRem: 4.25 },
    tags: ['editor', 'skin', 'color'],
  },
];

const editorPanels: readonly AvatarCatalogEditorPanel[] = [
  {
    id: 'skin-tone',
    order: 10,
    labels: text('Huidskleur', 'Skin tone'),
    accessibilityLabels: text('Categorie huidskleur', 'Skin tone category'),
    descriptions: text('Kies een huidskleur voor het live voorbeeld.', 'Choose a skin tone for the live preview.'),
    categoryIds: ['skin.tone'],
  },
  {
    id: 'hair-style',
    order: 20,
    labels: text('Kapsel', 'Hair style'),
    accessibilityLabels: text('Categorie kapsel', 'Hair style category'),
    descriptions: text('Kies één kapsel tegelijk.', 'Choose one hairstyle at a time.'),
    categoryIds: ['hair.style'],
  },
  {
    id: 'hair-color',
    order: 30,
    labels: text('Haarkleur', 'Hair color'),
    accessibilityLabels: text('Categorie haarkleur', 'Hair color category'),
    descriptions: text('Natuurlijke haarkleuren blijven eenvoudig en herkenbaar.', 'Natural hair colors stay simple and recognizable.'),
    categoryIds: ['hair.color'],
  },
  {
    id: 'clothing-style',
    order: 40,
    labels: text('Kledingstijl', 'Clothing style'),
    accessibilityLabels: text('Categorie kledingstijl', 'Clothing style category'),
    descriptions: text('Kies een outfit voor het gezinsbord.', 'Choose an outfit for the family board.'),
    categoryIds: ['clothing.style'],
  },
  {
    id: 'clothing-color',
    order: 50,
    labels: text('Kledingkleur', 'Clothing color'),
    accessibilityLabels: text('Categorie kledingkleur', 'Clothing color category'),
    descriptions: text('Kies uit rustige, zachte, heldere of seizoenskleuren.', 'Choose from neutral, soft, bright, or seasonal colors.'),
    categoryIds: ['clothing.color'],
  },
  {
    id: 'accessories',
    order: 60,
    labels: text('Accessoires', 'Accessories'),
    accessibilityLabels: text('Categorie accessoires', 'Accessories category'),
    descriptions: text('Kies een extra detail en laat de kleur meebewegen met het kledingpalet.', 'Choose an extra detail and let the color reuse the clothing palette.'),
    categoryIds: ['accessory.style', 'accessory.color'],
  },
];

const hairStyleItems: readonly AvatarCatalogItem[] = [
  { id: 'hair.style.soft-crop', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 10, labels: text('Zachte coupe', 'Soft crop'), accessibilityLabels: text('Kapsel zachte coupe', 'Soft crop hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'softCrop', layer: 'hair' }, legacyIds: ['softCrop'] },
  { id: 'hair.style.curly-cloud', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 20, labels: text('Krullenwolk', 'Curly cloud'), accessibilityLabels: text('Kapsel krullenwolk', 'Curly cloud hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'curlyCloud', layer: 'hair' }, legacyIds: ['curlyCloud'] },
  { id: 'hair.style.side-bob', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 30, labels: text('Bob opzij', 'Side bob'), accessibilityLabels: text('Kapsel bob opzij', 'Side bob hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'sideBob', layer: 'hair' }, legacyIds: ['sideBob'] },
  { id: 'hair.style.swoop', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 40, labels: text('Zijslag', 'Swoop'), accessibilityLabels: text('Kapsel zijslag', 'Swoop hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'swoop', layer: 'hair' }, legacyIds: ['swoop'] },
  { id: 'hair.style.layered-messy', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 50, labels: text('Speelse laagjes', 'Layered messy'), accessibilityLabels: text('Kapsel speelse laagjes', 'Layered messy hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'layeredMessy', layer: 'hair' }, legacyIds: ['layeredMessy'] },
  { id: 'hair.style.short-messy', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 60, labels: text('Kort speels', 'Short messy'), accessibilityLabels: text('Kapsel kort speels', 'Short messy hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'shortMessy', layer: 'hair' }, legacyIds: ['shortMessy'] },
  { id: 'hair.style.long-soft', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 70, labels: text('Lang zacht', 'Long soft'), accessibilityLabels: text('Kapsel lang zacht', 'Long soft hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'longSoft', layer: 'hair' }, legacyIds: ['longSoft'] },
  { id: 'hair.style.curly-playful', categoryId: 'hair.style', type: 'rendererStyle', status: 'active', order: 80, labels: text('Speelse krullen', 'Playful curls'), accessibilityLabels: text('Kapsel speelse krullen', 'Playful curls hairstyle'), tags: ['hair'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'curlyPlayful', layer: 'hair' }, legacyIds: ['curlyPlayful'] },
];

const skinTonePalette: readonly AvatarCatalogPaletteEntry[] = [
  { id: 'very-light', order: 10, labels: text('Zeer licht', 'Very light'), groupTag: 'group.skin', rendererToken: 'skinVeryLight', color: { base: '#f8d9c7', shade: '#e7bca4', highlight: '#fff0e5', line: '#b0806d' } },
  { id: 'light', order: 20, labels: text('Licht', 'Light'), groupTag: 'group.skin', rendererToken: 'skinLight', color: { base: '#f4cfb6', shade: '#e3b292', highlight: '#ffe8d6', line: '#a97862' } },
  { id: 'light-neutral', order: 30, labels: text('Licht neutraal', 'Light neutral'), groupTag: 'group.skin', rendererToken: 'skinLightNeutral', color: { base: '#ecc3ab', shade: '#d5a088', highlight: '#f9dcc8', line: '#986a58' } },
  { id: 'light-medium', order: 40, labels: text('Licht midden', 'Light medium'), groupTag: 'group.skin', rendererToken: 'skinLightMedium', color: { base: '#e3b493', shade: '#c98d6d', highlight: '#f2ccb0', line: '#8a5f49' } },
  { id: 'medium', order: 50, labels: text('Midden', 'Medium'), groupTag: 'group.skin', rendererToken: 'skinMedium', color: { base: '#d8a37d', shade: '#b97f58', highlight: '#edc09b', line: '#7e543f' } },
  { id: 'medium-tan', order: 60, labels: text('Midden getint', 'Medium tan'), groupTag: 'group.skin', rendererToken: 'skinMediumTan', color: { base: '#c79169', shade: '#a76a47', highlight: '#ddae84', line: '#724936' } },
  { id: 'tan', order: 70, labels: text('Getint', 'Tan'), groupTag: 'group.skin', rendererToken: 'skinTan', color: { base: '#b57b55', shade: '#935939', highlight: '#cf9870', line: '#643d2b' } },
  { id: 'warm-brown', order: 80, labels: text('Warmbruin', 'Warm brown'), groupTag: 'group.skin', rendererToken: 'skinWarmBrown', color: { base: '#a96b49', shade: '#834b31', highlight: '#c88963', line: '#5e3526' } },
  { id: 'medium-brown', order: 90, labels: text('Middenbruin', 'Medium brown'), groupTag: 'group.skin', rendererToken: 'skinMediumBrown', color: { base: '#935c41', shade: '#70402b', highlight: '#af7757', line: '#502e22' } },
  { id: 'deep-brown', order: 100, labels: text('Diepbruin', 'Deep brown'), groupTag: 'group.skin', rendererToken: 'skinDeepBrown', color: { base: '#7c4e37', shade: '#5d3424', highlight: '#98634a', line: '#42261c' }, legacyIds: ['skinBrown'] },
  { id: 'rich-deep', order: 110, labels: text('Rijk donker', 'Rich deep'), groupTag: 'group.skin', rendererToken: 'skinRichDeep', color: { base: '#66412f', shade: '#4a281d', highlight: '#805540', line: '#351d17' } },
  { id: 'deepest', order: 120, labels: text('Zeer donker', 'Deepest'), groupTag: 'group.skin', rendererToken: 'skinDeepest', color: { base: '#4e3025', shade: '#341b14', highlight: '#674236', line: '#231310' } },
];

const hairColorPalette: readonly AvatarCatalogPaletteEntry[] = [
  { id: 'soft-black', order: 10, labels: text('Zacht zwart', 'Soft black'), groupTag: 'group.natural-black', rendererToken: 'hairSoftBlack', color: { base: '#2f2624', shade: '#1f1817', highlight: '#4a3a37', line: '#15100f' } },
  { id: 'natural-black', order: 20, labels: text('Natuurlijk zwart', 'Natural black'), groupTag: 'group.natural-black', rendererToken: 'hairNaturalBlack', color: { base: '#201918', shade: '#15100f', highlight: '#352b29', line: '#0c0909' } },
  { id: 'blue-black', order: 30, labels: text('Blauwzwart', 'Blue black'), groupTag: 'group.natural-black', rendererToken: 'hairBlueBlack', color: { base: '#1c232d', shade: '#12171f', highlight: '#313a47', line: '#0c1016' } },
  { id: 'espresso', order: 40, labels: text('Espresso', 'Espresso'), groupTag: 'group.natural-brown', rendererToken: 'hairEspresso', color: { base: '#3d281f', shade: '#291a14', highlight: '#5a3d30', line: '#1a100d' } },
  { id: 'cocoa', order: 50, labels: text('Cacao', 'Cocoa'), groupTag: 'group.natural-brown', rendererToken: 'hairCocoa', color: { base: '#5b3926', shade: '#3f2418', highlight: '#8a5b3d', line: '#2a1810' }, legacyIds: ['hairCocoa'] },
  { id: 'chestnut', order: 60, labels: text('Kastanje', 'Chestnut'), groupTag: 'group.natural-brown', rendererToken: 'hairChestnut', color: { base: '#8c4a2f', shade: '#65311f', highlight: '#b56c48', line: '#3d1e14' }, legacyIds: ['hairChestnut'] },
  { id: 'walnut', order: 70, labels: text('Walnoot', 'Walnut'), groupTag: 'group.natural-brown', rendererToken: 'hairWalnut', color: { base: '#75503a', shade: '#553726', highlight: '#96705a', line: '#372218' } },
  { id: 'dark-blonde', order: 80, labels: text('Donkerblond', 'Dark blonde'), groupTag: 'group.natural-blonde', rendererToken: 'hairDarkBlonde', color: { base: '#9a7a4c', shade: '#725832', highlight: '#ba9967', line: '#4a3820' } },
  { id: 'golden-blonde', order: 90, labels: text('Goudblond', 'Golden blonde'), groupTag: 'group.natural-blonde', rendererToken: 'hairGoldenBlonde', color: { base: '#c9a55c', shade: '#a47f37', highlight: '#e0c178', line: '#735825' } },
  { id: 'honey-blonde', order: 100, labels: text('Honingblond', 'Honey blonde'), groupTag: 'group.natural-blonde', rendererToken: 'hairHoneyBlonde', color: { base: '#d7b26e', shade: '#b38b48', highlight: '#eccb91', line: '#7b5f2c' } },
  { id: 'light-blonde', order: 110, labels: text('Lichtblond', 'Light blonde'), groupTag: 'group.natural-blonde', rendererToken: 'hairLightBlonde', color: { base: '#e6d09a', shade: '#c7ad6d', highlight: '#f6e6b8', line: '#8f7843' } },
  { id: 'soft-auburn', order: 120, labels: text('Zacht kastanjerood', 'Soft auburn'), groupTag: 'group.natural-auburn', rendererToken: 'hairSoftAuburn', color: { base: '#a35a3d', shade: '#7c4029', highlight: '#c97a57', line: '#512a1c' } },
  { id: 'rich-auburn', order: 130, labels: text('Diep kastanjerood', 'Rich auburn'), groupTag: 'group.natural-auburn', rendererToken: 'hairRichAuburn', color: { base: '#85432f', shade: '#632b1e', highlight: '#a95d43', line: '#421a13' } },
  { id: 'light-ginger', order: 140, labels: text('Licht gember', 'Light ginger'), groupTag: 'group.natural-ginger', rendererToken: 'hairLightGinger', color: { base: '#d48a51', shade: '#b26b36', highlight: '#e9ad73', line: '#7b4721' } },
  { id: 'copper-ginger', order: 150, labels: text('Koper gember', 'Copper ginger'), groupTag: 'group.natural-ginger', rendererToken: 'hairCopperGinger', color: { base: '#be6d3b', shade: '#944d24', highlight: '#da8b58', line: '#663116' } },
  { id: 'steel-grey', order: 160, labels: text('Staalgrijs', 'Steel grey'), groupTag: 'group.grey-white', rendererToken: 'hairSteelGrey', color: { base: '#7f8791', shade: '#5e6570', highlight: '#a2abb6', line: '#454b53' } },
  { id: 'silver-grey', order: 170, labels: text('Zilvergrijs', 'Silver grey'), groupTag: 'group.grey-white', rendererToken: 'hairSilverGrey', color: { base: '#b7bcc4', shade: '#8f959f', highlight: '#d4d8df', line: '#676d77' } },
  { id: 'soft-white', order: 180, labels: text('Zacht wit', 'Soft white'), groupTag: 'group.grey-white', rendererToken: 'hairSoftWhite', color: { base: '#f1f3f5', shade: '#d6d9de', highlight: '#ffffff', line: '#9aa1aa' } },
  { id: 'plum', order: 190, labels: text('Pruim', 'Plum'), groupTag: 'group.legacy', rendererToken: 'hairPlum', color: { base: '#5b3a67', shade: '#41284d', highlight: '#7a5590', line: '#2a1933' }, status: 'deprecated', legacyIds: ['hairPlum'] },
];

const clothingColorPalette: readonly AvatarCatalogPaletteEntry[] = [
  { id: 'white', order: 10, labels: text('Wit', 'White'), groupTag: 'group.neutral', rendererToken: 'shirtWhite', color: { base: '#f7f7f7', shade: '#dcdde1', highlight: '#ffffff', line: '#a3a6ad' } },
  { id: 'cream', order: 20, labels: text('Crème', 'Cream'), groupTag: 'group.neutral', rendererToken: 'shirtCream', color: { base: '#f1e6cf', shade: '#d7c3a1', highlight: '#fbf4e6', line: '#a89068' } },
  { id: 'light-grey', order: 30, labels: text('Lichtgrijs', 'Light grey'), groupTag: 'group.neutral', rendererToken: 'shirtLightGrey', color: { base: '#d6d9df', shade: '#b2b8c2', highlight: '#eceef2', line: '#7d8692' } },
  { id: 'charcoal', order: 40, labels: text('Antraciet', 'Charcoal'), groupTag: 'group.neutral', rendererToken: 'shirtCharcoal', color: { base: '#525760', shade: '#3b4048', highlight: '#707780', line: '#2b2f35' } },
  { id: 'black', order: 50, labels: text('Zwart', 'Black'), groupTag: 'group.neutral', rendererToken: 'shirtBlack', color: { base: '#2a2c31', shade: '#191b1f', highlight: '#41444b', line: '#101115' } },
  { id: 'navy', order: 60, labels: text('Marineblauw', 'Navy'), groupTag: 'group.neutral', rendererToken: 'shirtNavy', color: { base: '#365072', shade: '#273a54', highlight: '#4d6a8f', line: '#1b2736' } },
  { id: 'denim', order: 70, labels: text('Denim', 'Denim'), groupTag: 'group.neutral', rendererToken: 'shirtDenim', color: { base: '#5a79a0', shade: '#405a7a', highlight: '#7d97b8', line: '#2f4056' } },
  { id: 'brown', order: 80, labels: text('Bruin', 'Brown'), groupTag: 'group.neutral', rendererToken: 'shirtBrown', color: { base: '#8a6246', shade: '#654531', highlight: '#a87e61', line: '#452d21' } },
  { id: 'blush', order: 90, labels: text('Blush', 'Blush'), groupTag: 'group.soft', rendererToken: 'shirtBlush', color: { base: '#e9bec6', shade: '#ce97a0', highlight: '#f5d6dc', line: '#8f626a' } },
  { id: 'peach', order: 100, labels: text('Perzik', 'Peach'), groupTag: 'group.soft', rendererToken: 'shirtPeach', color: { base: '#f0c5ad', shade: '#d8a184', highlight: '#f8dccb', line: '#9a6a56' } },
  { id: 'butter', order: 110, labels: text('Botergeel', 'Butter yellow'), groupTag: 'group.soft', rendererToken: 'shirtButter', color: { base: '#f3dfa0', shade: '#dbc06a', highlight: '#faedc4', line: '#9a7e39' } },
  { id: 'sage', order: 120, labels: text('Salie', 'Sage'), groupTag: 'group.soft', rendererToken: 'shirtSage', color: { base: '#b9cda6', shade: '#91ab7b', highlight: '#d2dfc4', line: '#647655' } },
  { id: 'mint', order: 130, labels: text('Mintgroen', 'Mint'), groupTag: 'group.soft', rendererToken: 'shirtMint', color: { base: '#9edfc0', shade: '#72bf9a', highlight: '#c5efd9', line: '#4f8f70' }, legacyIds: ['shirtMint'], accessoryRendererToken: 'accessoryCoral', accessoryLegacyIds: ['accessoryCoral', 'shirtMint'] },
  { id: 'sky', order: 140, labels: text('Hemelsblauw', 'Sky blue'), groupTag: 'group.soft', rendererToken: 'shirtSky', color: { base: '#8fc8ef', shade: '#67a8d8', highlight: '#b6ddf6', line: '#417895' }, legacyIds: ['shirtSky'], accessoryRendererToken: 'accessoryLilac', accessoryLegacyIds: ['accessoryLilac', 'shirtSky'] },
  { id: 'lavender', order: 150, labels: text('Lavendel', 'Lavender'), groupTag: 'group.soft', rendererToken: 'shirtLavender', color: { base: '#bcaee8', shade: '#9486c7', highlight: '#d8ceF4', line: '#695b9b' } },
  { id: 'lilac', order: 160, labels: text('Sering', 'Lilac'), groupTag: 'group.soft', rendererToken: 'shirtLilac', color: { base: '#d1b8ea', shade: '#b08dcd', highlight: '#e6d7f6', line: '#846499' } },
  { id: 'red', order: 170, labels: text('Rood', 'Red'), groupTag: 'group.bright', rendererToken: 'shirtRed', color: { base: '#e55a61', shade: '#c33a43', highlight: '#f0888d', line: '#8d2a31' } },
  { id: 'orange', order: 180, labels: text('Oranje', 'Orange'), groupTag: 'group.bright', rendererToken: 'shirtOrange', color: { base: '#f08b44', shade: '#cf6828', highlight: '#f6ae74', line: '#93421b' } },
  { id: 'sun', order: 190, labels: text('Zonnig geel', 'Sun yellow'), groupTag: 'group.bright', rendererToken: 'shirtSun', color: { base: '#f7d56e', shade: '#e6b94b', highlight: '#ffe89a', line: '#9a7a2f' }, legacyIds: ['shirtSun'] },
  { id: 'green', order: 200, labels: text('Groen', 'Green'), groupTag: 'group.bright', rendererToken: 'shirtGreen', color: { base: '#59bf68', shade: '#3d9d4e', highlight: '#86d991', line: '#2b6f38' } },
  { id: 'blue', order: 210, labels: text('Blauw', 'Blue'), groupTag: 'group.bright', rendererToken: 'shirtBlue', color: { base: '#4d87e2', shade: '#3366c0', highlight: '#78a7ef', line: '#244787' } },
  { id: 'purple', order: 220, labels: text('Paars', 'Purple'), groupTag: 'group.bright', rendererToken: 'shirtPurple', color: { base: '#8c67db', shade: '#6945b7', highlight: '#af92ee', line: '#4a307f' } },
  { id: 'rose', order: 230, labels: text('Roze', 'Pink'), groupTag: 'group.bright', rendererToken: 'shirtRose', color: { base: '#f0a8bd', shade: '#d97f9c', highlight: '#f7c8d7', line: '#9a5268' }, legacyIds: ['shirtRose'] },
  { id: 'teal', order: 240, labels: text('Teal', 'Teal'), groupTag: 'group.bright', rendererToken: 'shirtTeal', color: { base: '#44b3b0', shade: '#2f8f8e', highlight: '#73d1cf', line: '#216565' } },
  { id: 'burgundy', order: 250, labels: text('Bordeaux', 'Burgundy'), groupTag: 'group.seasonal', rendererToken: 'shirtBurgundy', color: { base: '#8f3f59', shade: '#6c2b41', highlight: '#b15f79', line: '#4a1d2d' } },
  { id: 'pumpkin', order: 260, labels: text('Pompoen', 'Pumpkin'), groupTag: 'group.seasonal', rendererToken: 'shirtPumpkin', color: { base: '#cc6d2d', shade: '#a8511e', highlight: '#e08e4b', line: '#733514' } },
  { id: 'mustard', order: 270, labels: text('Mosterd', 'Mustard'), groupTag: 'group.seasonal', rendererToken: 'shirtMustard', color: { base: '#c3a23b', shade: '#9f7f24', highlight: '#dbc05e', line: '#6f5818' } },
  { id: 'forest', order: 280, labels: text('Bosgroen', 'Forest'), groupTag: 'group.seasonal', rendererToken: 'shirtForest', color: { base: '#3d7750', shade: '#29583b', highlight: '#5a9770', line: '#1c3b28' } },
  { id: 'evergreen', order: 290, labels: text('Dennengroen', 'Evergreen'), groupTag: 'group.seasonal', rendererToken: 'shirtEvergreen', color: { base: '#2f6658', shade: '#204a3f', highlight: '#4b8574', line: '#16322b' } },
  { id: 'winter-blue', order: 300, labels: text('Winterblauw', 'Winter blue'), groupTag: 'group.seasonal', rendererToken: 'shirtWinterBlue', color: { base: '#5a7fb9', shade: '#405f8d', highlight: '#7e9dce', line: '#2d4464' } },
  { id: 'plum', order: 310, labels: text('Pruim', 'Plum'), groupTag: 'group.seasonal', rendererToken: 'shirtPlum', color: { base: '#7b5aa2', shade: '#5b417f', highlight: '#9a7ac2', line: '#402c59' } },
  { id: 'cocoa', order: 320, labels: text('Cacao', 'Cocoa'), groupTag: 'group.seasonal', rendererToken: 'shirtCocoa', color: { base: '#8b5c45', shade: '#66412f', highlight: '#a97860', line: '#452d21' } },
];

const hairColorItems = hairColorPalette.map((entry) => createColorItem({
  id: `hair.color.${entry.id}`,
  categoryId: 'hair.color',
  order: entry.order,
  labels: entry.labels,
  accessibilityLabels: text(`Haarkleur: ${entry.labels['nl-NL']}`, `Hair color: ${entry.labels['en-US']}`),
  tags: ['hair', 'color', 'palette.hair', entry.groupTag],
  rendererToken: entry.rendererToken,
  paletteId: 'hair',
  color: entry.color,
  legacyIds: entry.legacyIds,
  status: entry.status,
}));

const clothingColorItems = clothingColorPalette.map((entry) => createColorItem({
  id: `clothing.color.${entry.id}`,
  categoryId: 'clothing.color',
  order: entry.order,
  labels: entry.labels,
  accessibilityLabels: text(`Kledingkleur: ${entry.labels['nl-NL']}`, `Clothing color: ${entry.labels['en-US']}`),
  tags: ['clothing', 'color', 'palette.clothing', entry.groupTag],
  rendererToken: entry.rendererToken,
  paletteId: 'clothing',
  color: entry.color,
  legacyIds: entry.legacyIds,
  status: entry.status,
}));

const accessoryColorItems = clothingColorPalette.map((entry) => createColorItem({
  id: `accessory.color.${entry.id}`,
  categoryId: 'accessory.color',
  order: entry.order,
  labels: entry.labels,
  accessibilityLabels: text(`Accessoirekleur: ${entry.labels['nl-NL']}`, `Accessory color: ${entry.labels['en-US']}`),
  tags: ['accessory', 'color', 'palette.clothing', entry.groupTag],
  rendererToken: entry.accessoryRendererToken ?? entry.rendererToken,
  paletteId: 'clothing',
  color: entry.color,
  legacyIds: entry.accessoryLegacyIds ?? entry.legacyIds,
  status: entry.status,
}));

const skinToneItems = skinTonePalette.map((entry) => createColorItem({
  id: `skin.tone.${entry.id}`,
  categoryId: 'skin.tone',
  order: entry.order,
  labels: entry.labels,
  accessibilityLabels: text(`Huidskleur: ${entry.labels['nl-NL']}`, `Skin tone: ${entry.labels['en-US']}`),
  tags: ['skin', 'color', 'palette.skin', entry.groupTag],
  rendererToken: entry.rendererToken,
  paletteId: 'skin',
  color: entry.color,
  legacyIds: entry.legacyIds,
  status: entry.status,
}));

const clothingStyleItems: readonly AvatarCatalogItem[] = [
  { id: 'clothing.style.t-shirt', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 10, labels: text('T-shirt', 'T-shirt'), accessibilityLabels: text('T-shirt outfit', 'T-shirt outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'tShirt', layer: 'shirt' }, legacyIds: ['tShirt'] },
  { id: 'clothing.style.rounded-tee', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 20, labels: text('Rond shirt', 'Rounded tee'), accessibilityLabels: text('Rond shirt outfit', 'Rounded tee outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'roundedTee', layer: 'shirt' }, legacyIds: ['roundedTee'] },
  { id: 'clothing.style.collar', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 30, labels: text('Shirt met kraag', 'Collar shirt'), accessibilityLabels: text('Shirt met kraag outfit', 'Collar shirt outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'collar', layer: 'shirt' }, legacyIds: ['collar'] },
  { id: 'clothing.style.hoodie', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 40, labels: text('Hoodie', 'Hoodie'), accessibilityLabels: text('Hoodie outfit', 'Hoodie outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'hoodie', layer: 'shirt' }, legacyIds: ['hoodie'] },
  { id: 'clothing.style.sweater', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 50, labels: text('Trui', 'Sweater'), accessibilityLabels: text('Trui outfit', 'Sweater outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'sweater', layer: 'shirt' }, legacyIds: ['sweater'] },
  { id: 'clothing.style.overall', categoryId: 'clothing.style', type: 'rendererStyle', status: 'active', order: 60, labels: text('Tuinbroek', 'Overall'), accessibilityLabels: text('Tuinbroek outfit', 'Overall outfit'), tags: ['clothing'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'overall', layer: 'shirt' }, legacyIds: ['overall'] },
];

const accessoryStyleItems: readonly AvatarCatalogItem[] = [
  { id: 'accessory.style.none', categoryId: 'accessory.style', type: 'none', status: 'active', order: 10, labels: text('Geen accessoire', 'No accessory'), accessibilityLabels: text('Geen accessoire', 'No accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'none', layer: 'accessory' }, legacyIds: ['none'] },
  { id: 'accessory.style.star', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 20, labels: text('Ster', 'Star'), accessibilityLabels: text('Steraccessoire', 'Star accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'star', layer: 'accessory', mountPoint: 'hairRight' }, legacyIds: ['star'] },
  { id: 'accessory.style.flower', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 30, labels: text('Bloemspeld', 'Flower pin'), accessibilityLabels: text('Bloemspeld accessoire', 'Flower pin accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'flower', layer: 'accessory', mountPoint: 'hairLeft' }, legacyIds: ['flower'] },
  { id: 'accessory.style.headband', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 40, labels: text('Haarband', 'Headband'), accessibilityLabels: text('Haarband accessoire', 'Headband accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'headband', layer: 'accessory', mountPoint: 'headTop' }, legacyIds: ['headband'] },
  { id: 'accessory.style.bow', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 50, labels: text('Strik', 'Bow'), accessibilityLabels: text('Strik accessoire', 'Bow accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'bow', layer: 'accessory', mountPoint: 'hairRight' }, legacyIds: ['bow'] },
  { id: 'accessory.style.chest-star', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 60, labels: text('Ster op trui', 'Chest star'), accessibilityLabels: text('Ster op trui accessoire', 'Chest star accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'chestStar', layer: 'accessory', mountPoint: 'chestCenter' }, legacyIds: ['chestStar'] },
  { id: 'accessory.style.leaf-pin', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 70, labels: text('Bladspeld', 'Leaf pin'), accessibilityLabels: text('Bladspeld accessoire', 'Leaf pin accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'leafPin', layer: 'accessory', mountPoint: 'hairRight' }, legacyIds: ['leafPin'] },
  { id: 'accessory.style.tiny-crown', categoryId: 'accessory.style', type: 'rendererStyle', status: 'active', order: 80, labels: text('Kroontje', 'Tiny crown'), accessibilityLabels: text('Kroontje accessoire', 'Tiny crown accessory'), tags: ['accessory'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'tinyCrown', layer: 'accessory', mountPoint: 'headTop' }, legacyIds: ['tinyCrown'] },
];

const headVariantItems: readonly AvatarCatalogItem[] = [
  { id: 'head.variant.round', categoryId: 'head.variant', type: 'rendererStyle', status: 'active', order: 10, labels: text('Rond', 'Round'), accessibilityLabels: text('Ronde hoofdvorm', 'Round head shape'), tags: ['head'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'round', layer: 'head' }, legacyIds: ['round'] },
  { id: 'head.variant.oval', categoryId: 'head.variant', type: 'rendererStyle', status: 'active', order: 20, labels: text('Ovaal', 'Oval'), accessibilityLabels: text('Ovale hoofdvorm', 'Oval head shape'), tags: ['head'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'oval', layer: 'head' }, legacyIds: ['oval'] },
  { id: 'head.variant.wide', categoryId: 'head.variant', type: 'rendererStyle', status: 'active', order: 30, labels: text('Breed', 'Wide'), accessibilityLabels: text('Brede hoofdvorm', 'Wide head shape'), tags: ['head'], renderer: { rendererFamily: 'avatar-v2-svg', rendererToken: 'wide', layer: 'head' }, legacyIds: ['wide'] },
];

const items: readonly AvatarCatalogItem[] = [
  ...hairStyleItems,
  ...hairColorItems,
  ...clothingStyleItems,
  ...clothingColorItems,
  ...accessoryStyleItems,
  ...accessoryColorItems,
  ...headVariantItems,
  ...skinToneItems,
];

export const avatarCatalog: AvatarCatalogDefinition = {
  catalogId: avatarCatalogId,
  schemaVersion: avatarCatalogSchemaVersion,
  defaultLocale: avatarCatalogDefaultLocale,
  supportedLocales: ['nl-NL', 'en-US'],
  editorPanels,
  categories,
  items,
  defaults: {
    [avatarSelectionSlots.headVariant]: 'head.variant.round',
    [avatarSelectionSlots.skinTone]: 'skin.tone.medium',
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
  return groupTag ? optionGroups[groupTag] : undefined;
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

export function getAvatarCatalogPanelSummary(panel: AvatarCatalogEditorPanel, selection: AvatarCatalogSelection, locale = avatarCatalog.defaultLocale): string {
  return panel.categoryIds
    .map((categoryId) => getAvatarCatalogCategory(categoryId))
    .filter((category): category is AvatarCatalogCategory => Boolean(category))
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
