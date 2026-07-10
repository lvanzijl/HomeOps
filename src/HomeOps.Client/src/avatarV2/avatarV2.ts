export type AvatarBase = "child" | "adult";
export type AvatarHeadVariant = "round" | "oval" | "wide";
export type PaletteToken =
  | "skinVeryLight"
  | "skinLight"
  | "skinLightNeutral"
  | "skinLightMedium"
  | "skinMedium"
  | "skinMediumTan"
  | "skinTan"
  | "skinWarmBrown"
  | "skinMediumBrown"
  | "skinDeepBrown"
  | "skinRichDeep"
  | "skinDeepest"
  | "skinPeach"
  | "skinHoney"
  | "skinBrown"
  | "skinElf"
  | "skinOrc"
  | "skinGoblin"
  | "skinBlue"
  | "skinPurple"
  | "skinRed"
  | "skinGreen"
  | "skinGrey"
  | "hairSoftBlack"
  | "hairNaturalBlack"
  | "hairBlueBlack"
  | "hairEspresso"
  | "hairCocoa"
  | "hairChestnut"
  | "hairWalnut"
  | "hairDarkBlonde"
  | "hairGoldenBlonde"
  | "hairHoneyBlonde"
  | "hairLightBlonde"
  | "hairSoftAuburn"
  | "hairRichAuburn"
  | "hairLightGinger"
  | "hairCopperGinger"
  | "hairSteelGrey"
  | "hairSilverGrey"
  | "hairSoftWhite"
  | "hairBrightSilver"
  | "hairPearlWhite"
  | "hairRoyalBlue"
  | "hairElectricCyan"
  | "hairEmerald"
  | "hairLime"
  | "hairViolet"
  | "hairPink"
  | "hairMagenta"
  | "hairSunsetOrange"
  | "hairGoldenYellow"
  | "hairPlum"
  | "shirtWhite"
  | "shirtCream"
  | "shirtLightGrey"
  | "shirtCharcoal"
  | "shirtBlack"
  | "shirtNavy"
  | "shirtDenim"
  | "shirtBrown"
  | "shirtBlush"
  | "shirtPeach"
  | "shirtButter"
  | "shirtSage"
  | "shirtMint"
  | "shirtSky"
  | "shirtLavender"
  | "shirtLilac"
  | "shirtRed"
  | "shirtOrange"
  | "shirtSun"
  | "shirtGreen"
  | "shirtBlue"
  | "shirtPurple"
  | "shirtRose"
  | "shirtTeal"
  | "shirtBurgundy"
  | "shirtPumpkin"
  | "shirtMustard"
  | "shirtForest"
  | "shirtEvergreen"
  | "shirtWinterBlue"
  | "shirtPlum"
  | "shirtCocoa"
  | "shirtStone"
  | "shirtTaupe"
  | "shirtSlate"
  | "shirtMidnight"
  | "shirtApricot"
  | "shirtDustyRose"
  | "shirtSeafoam"
  | "shirtPowderBlue"
  | "shirtCoral"
  | "shirtAqua"
  | "shirtViolet"
  | "shirtLime"
  | "shirtTerracotta"
  | "shirtOlive"
  | "shirtCranberry"
  | "shirtFrost"
  | "lineBerry"
  | "lineBlue"
  | "accessoryLilac"
  | "accessoryCoral";
export type HairStyle =
  | "softCrop"
  | "curlyCloud"
  | "sideBob"
  | "swoop"
  | "layeredMessy"
  | "shortMessy"
  | "longSoft"
  | "curlyPlayful";
export type GlassesStyle =
  | "none"
  | "regular"
  | "thickFrame"
  | "round"
  | "rectangular"
  | "softSquare"
  | "sunglasses"
  | "star"
  | "heart";
export type ShirtStyle =
  | "roundedTee"
  | "collar"
  | "hoodie"
  | "sweater"
  | "tShirt"
  | "overall"
  | "polo"
  | "jacket"
  | "dress"
  | "zipHoodie"
  | "varsityJacket"
  | "rugbyShirt"
  | "contrastPocketHoodie"
  | "winterCoat"
  | "cardigan"
  | "sportsShirt"
  | "apronSmock";
export type AvatarClothingColorRegion = "primary" | "secondary";
export type EyeStyle =
  | "classicRound"
  | "softAlmond"
  | "gentleArc"
  | "brightWide";
export type MouthStyle =
  | "neutral"
  | "smile"
  | "bigSmile"
  | "openSmile"
  | "laughing"
  | "smirk"
  | "determined"
  | "surprised"
  | "sad"
  | "tongueOut";
export type AccessoryStyle =
  | "none"
  | "starClip"
  | "leafPin"
  | "tinyCrown"
  | "chestStar"
  | "star"
  | "flower"
  | "headband"
  | "bow"
  | "hairClip"
  | "ribbon"
  | "baseballCap"
  | "beanie"
  | "partyHat"
  | "crown"
  | "sunHat"
  | "helmet"
  | "necklace"
  | "scarf";
export type AvatarMountPoint =
  | "chestCenter"
  | "hairLeft"
  | "hairRight"
  | "headTop";
type AvatarPoint = { x: number; y: number };
type AvatarBounds = AvatarPoint & {
  width: number;
  height: number;
  rx?: number;
  ry?: number;
};
type AvatarAnchor = AvatarPoint & { rotation?: number; scale?: number };
export interface AvatarAnatomy {
  viewBox: { width: 192; height: 192 };
  head: {
    variant: AvatarHeadVariant;
    bounds: AvatarBounds;
    center: AvatarPoint;
    hairline: AvatarAnchor;
    headwear: {
      center: AvatarPoint;
      crownY: number;
      brimY: number;
      lowerY: number;
      width: number;
      scale: number;
    };
  };
  face: {
    eyeLineY: number;
    leftEye: AvatarAnchor;
    rightEye: AvatarAnchor;
    mouth: AvatarAnchor;
  };
  ears: {
    left: AvatarAnchor;
    right: AvatarAnchor;
    width: number;
    height: number;
  };
  body: { neck: AvatarBounds; shoulders: AvatarAnchor; chest: AvatarAnchor };
  mounts: Record<AvatarMountPoint, AvatarAnchor>;
}
export interface AvatarConfig {
  base: AvatarBase;
  headVariant?: AvatarHeadVariant;
  skinTone: PaletteToken;
  hair: { style: HairStyle; color: PaletteToken };
  glasses: { style: GlassesStyle; color: PaletteToken };
  eyes?: { style: EyeStyle };
  mouth?: { style: MouthStyle };
  shirt: { style: ShirtStyle; color: PaletteToken; secondaryColor?: PaletteToken };
  accessory: {
    style: AccessoryStyle;
    color: PaletteToken;
    mount?: AvatarMountPoint;
  };
}
export interface ExpandedSwatch {
  base: string;
  shade: string;
  highlight: string;
  line: string;
}
const palette: Record<PaletteToken, ExpandedSwatch> = {
  skinVeryLight: { base: "#f8d9c7", shade: "#e7bca4", highlight: "#fff0e5", line: "#b0806d" },
  skinLight: { base: "#f4cfb6", shade: "#e3b292", highlight: "#ffe8d6", line: "#a97862" },
  skinLightNeutral: { base: "#ecc3ab", shade: "#d5a088", highlight: "#f9dcc8", line: "#986a58" },
  skinLightMedium: { base: "#e3b493", shade: "#c98d6d", highlight: "#f2ccb0", line: "#8a5f49" },
  skinMedium: { base: "#d8a37d", shade: "#b97f58", highlight: "#edc09b", line: "#7e543f" },
  skinMediumTan: { base: "#c79169", shade: "#a76a47", highlight: "#ddae84", line: "#724936" },
  skinTan: { base: "#b57b55", shade: "#935939", highlight: "#cf9870", line: "#643d2b" },
  skinWarmBrown: { base: "#a96b49", shade: "#834b31", highlight: "#c88963", line: "#5e3526" },
  skinMediumBrown: { base: "#935c41", shade: "#70402b", highlight: "#af7757", line: "#502e22" },
  skinDeepBrown: { base: "#7c4e37", shade: "#5d3424", highlight: "#98634a", line: "#42261c" },
  skinRichDeep: { base: "#66412f", shade: "#4a281d", highlight: "#805540", line: "#351d17" },
  skinDeepest: { base: "#4e3025", shade: "#341b14", highlight: "#674236", line: "#231310" },
  skinPeach: { base: "#f4bf9b", shade: "#df9778", highlight: "#ffd8bf", line: "#9f5f55" },
  skinHoney: { base: "#d99f67", shade: "#b97845", highlight: "#efbd87", line: "#7f523f" },
  skinBrown: { base: "#9b6547", shade: "#73422f", highlight: "#bd8060", line: "#55332b" },
  skinElf: { base: "#d5e8cf", shade: "#b2caa8", highlight: "#eef8ea", line: "#7b9277" },
  skinOrc: { base: "#8a9c5a", shade: "#6a7b3f", highlight: "#a9ba72", line: "#4c5c2b" },
  skinGoblin: { base: "#6f8c4b", shade: "#547035", highlight: "#8baa67", line: "#3b4e25" },
  skinBlue: { base: "#84b6d9", shade: "#6192b7", highlight: "#aed2ed", line: "#456b8b" },
  skinPurple: { base: "#ad92c8", shade: "#8a6fad", highlight: "#ccb7e0", line: "#644d83" },
  skinRed: { base: "#cc7f7b", shade: "#a55d5b", highlight: "#e0a3a0", line: "#7b4342" },
  skinGreen: { base: "#85b57f", shade: "#62915d", highlight: "#a8d1a3", line: "#476744" },
  skinGrey: { base: "#b6b8c3", shade: "#9195a3", highlight: "#d5d8e0", line: "#6a6e7a" },
  hairSoftBlack: { base: "#2f2624", shade: "#1f1817", highlight: "#4a3a37", line: "#15100f" },
  hairNaturalBlack: { base: "#201918", shade: "#15100f", highlight: "#352b29", line: "#0c0909" },
  hairBlueBlack: { base: "#1c232d", shade: "#12171f", highlight: "#313a47", line: "#0c1016" },
  hairEspresso: { base: "#3d281f", shade: "#291a14", highlight: "#5a3d30", line: "#1a100d" },
  hairCocoa: { base: "#68402f", shade: "#43271f", highlight: "#8a5d47", line: "#35211d" },
  hairChestnut: { base: "#a75f34", shade: "#7d3f24", highlight: "#c98250", line: "#5f321f" },
  hairWalnut: { base: "#75503a", shade: "#553726", highlight: "#96705a", line: "#372218" },
  hairDarkBlonde: { base: "#9a7a4c", shade: "#725832", highlight: "#ba9967", line: "#4a3820" },
  hairGoldenBlonde: { base: "#c9a55c", shade: "#a47f37", highlight: "#e0c178", line: "#735825" },
  hairHoneyBlonde: { base: "#d7b26e", shade: "#b38b48", highlight: "#eccb91", line: "#7b5f2c" },
  hairLightBlonde: { base: "#e6d09a", shade: "#c7ad6d", highlight: "#f6e6b8", line: "#8f7843" },
  hairSoftAuburn: { base: "#a35a3d", shade: "#7c4029", highlight: "#c97a57", line: "#512a1c" },
  hairRichAuburn: { base: "#85432f", shade: "#632b1e", highlight: "#a95d43", line: "#421a13" },
  hairLightGinger: { base: "#d48a51", shade: "#b26b36", highlight: "#e9ad73", line: "#7b4721" },
  hairCopperGinger: { base: "#be6d3b", shade: "#944d24", highlight: "#da8b58", line: "#663116" },
  hairSteelGrey: { base: "#7f8791", shade: "#5e6570", highlight: "#a2abb6", line: "#454b53" },
  hairSilverGrey: { base: "#b7bcc4", shade: "#8f959f", highlight: "#d4d8df", line: "#676d77" },
  hairSoftWhite: { base: "#f1f3f5", shade: "#d6d9de", highlight: "#ffffff", line: "#9aa1aa" },
  hairBrightSilver: { base: "#d5d8df", shade: "#b2b7c1", highlight: "#f2f4f7", line: "#7e858f" },
  hairPearlWhite: { base: "#f8f7f2", shade: "#ddd9d0", highlight: "#ffffff", line: "#a9a59d" },
  hairRoyalBlue: { base: "#3f67d2", shade: "#2c4aa5", highlight: "#6f90ea", line: "#1f3472" },
  hairElectricCyan: { base: "#3dc9de", shade: "#2699ae", highlight: "#75e4ef", line: "#1d6f7f" },
  hairEmerald: { base: "#31a36c", shade: "#217a4f", highlight: "#58c28a", line: "#19573a" },
  hairLime: { base: "#a0c940", shade: "#7a9d2c", highlight: "#c0df72", line: "#576f1f" },
  hairViolet: { base: "#8f63d7", shade: "#6b45af", highlight: "#b090ee", line: "#4a307b" },
  hairPink: { base: "#e890bf", shade: "#c96b9f", highlight: "#f3b2d3", line: "#94506f" },
  hairMagenta: { base: "#c756b8", shade: "#9a3990", highlight: "#de82d1", line: "#6f2868" },
  hairSunsetOrange: { base: "#e88549", shade: "#bb5f2f", highlight: "#f4a56f", line: "#874220" },
  hairGoldenYellow: { base: "#e0bc43", shade: "#b28f2c", highlight: "#f0d56f", line: "#7e641f" },
  hairPlum: { base: "#6f4a66", shade: "#4e344d", highlight: "#92708a", line: "#3f2a3d" },
  shirtWhite: { base: "#f7f7f7", shade: "#dcdde1", highlight: "#ffffff", line: "#a3a6ad" },
  shirtCream: { base: "#f1e6cf", shade: "#d7c3a1", highlight: "#fbf4e6", line: "#a89068" },
  shirtLightGrey: { base: "#d6d9df", shade: "#b2b8c2", highlight: "#eceef2", line: "#7d8692" },
  shirtCharcoal: { base: "#525760", shade: "#3b4048", highlight: "#707780", line: "#2b2f35" },
  shirtBlack: { base: "#2a2c31", shade: "#191b1f", highlight: "#41444b", line: "#101115" },
  shirtNavy: { base: "#365072", shade: "#273a54", highlight: "#4d6a8f", line: "#1b2736" },
  shirtDenim: { base: "#5a79a0", shade: "#405a7a", highlight: "#7d97b8", line: "#2f4056" },
  shirtBrown: { base: "#8a6246", shade: "#654531", highlight: "#a87e61", line: "#452d21" },
  shirtBlush: { base: "#e9bec6", shade: "#ce97a0", highlight: "#f5d6dc", line: "#8f626a" },
  shirtPeach: { base: "#f0c5ad", shade: "#d8a184", highlight: "#f8dccb", line: "#9a6a56" },
  shirtButter: { base: "#f3dfa0", shade: "#dbc06a", highlight: "#faedc4", line: "#9a7e39" },
  shirtSage: { base: "#b9cda6", shade: "#91ab7b", highlight: "#d2dfc4", line: "#647655" },
  shirtMint: { base: "#9edfc0", shade: "#70be98", highlight: "#c1edd7", line: "#4d846d" },
  shirtSky: { base: "#8fc8ef", shade: "#67a8d8", highlight: "#b6ddf6", line: "#417895" },
  shirtLavender: { base: "#bcaee8", shade: "#9486c7", highlight: "#d8cef4", line: "#695b9b" },
  shirtLilac: { base: "#d1b8ea", shade: "#b08dcd", highlight: "#e6d7f6", line: "#846499" },
  shirtRed: { base: "#e55a61", shade: "#c33a43", highlight: "#f0888d", line: "#8d2a31" },
  shirtOrange: { base: "#f08b44", shade: "#cf6828", highlight: "#f6ae74", line: "#93421b" },
  shirtSun: { base: "#f2cd70", shade: "#d6a83f", highlight: "#f8df9b", line: "#98733b" },
  shirtGreen: { base: "#59bf68", shade: "#3d9d4e", highlight: "#86d991", line: "#2b6f38" },
  shirtBlue: { base: "#4d87e2", shade: "#3366c0", highlight: "#78a7ef", line: "#244787" },
  shirtPurple: { base: "#8c67db", shade: "#6945b7", highlight: "#af92ee", line: "#4a307f" },
  shirtRose: { base: "#efa0b8", shade: "#d67595", highlight: "#fac3d2", line: "#9b526b" },
  shirtTeal: { base: "#44b3b0", shade: "#2f8f8e", highlight: "#73d1cf", line: "#216565" },
  shirtBurgundy: { base: "#8f3f59", shade: "#6c2b41", highlight: "#b15f79", line: "#4a1d2d" },
  shirtPumpkin: { base: "#cc6d2d", shade: "#a8511e", highlight: "#e08e4b", line: "#733514" },
  shirtMustard: { base: "#c3a23b", shade: "#9f7f24", highlight: "#dbc05e", line: "#6f5818" },
  shirtForest: { base: "#3d7750", shade: "#29583b", highlight: "#5a9770", line: "#1c3b28" },
  shirtEvergreen: { base: "#2f6658", shade: "#204a3f", highlight: "#4b8574", line: "#16322b" },
  shirtWinterBlue: { base: "#5a7fb9", shade: "#405f8d", highlight: "#7e9dce", line: "#2d4464" },
  shirtPlum: { base: "#7b5aa2", shade: "#5b417f", highlight: "#9a7ac2", line: "#402c59" },
  shirtCocoa: { base: "#8b5c45", shade: "#66412f", highlight: "#a97860", line: "#452d21" },
  shirtStone: { base: "#cfc9bf", shade: "#aba395", highlight: "#e4dfd6", line: "#7e776c" },
  shirtTaupe: { base: "#b59e8a", shade: "#927b67", highlight: "#ceb8a6", line: "#6a5647" },
  shirtSlate: { base: "#6f7f93", shade: "#566476", highlight: "#8d9cb0", line: "#3e4856" },
  shirtMidnight: { base: "#24324a", shade: "#182235", highlight: "#40526e", line: "#111826" },
  shirtApricot: { base: "#f2bb92", shade: "#d6946b", highlight: "#f8d1b4", line: "#986347" },
  shirtDustyRose: { base: "#d9a6b2", shade: "#bb7f8d", highlight: "#ebc3cb", line: "#835864" },
  shirtSeafoam: { base: "#9fd9d0", shade: "#73bbb0", highlight: "#c2ece6", line: "#4f857d" },
  shirtPowderBlue: { base: "#b2c9ec", shade: "#88a8d2", highlight: "#d1def6", line: "#60789f" },
  shirtCoral: { base: "#ef7f6f", shade: "#cf5c4c", highlight: "#f5a191", line: "#994237" },
  shirtAqua: { base: "#3bc5c6", shade: "#27999a", highlight: "#73dfdf", line: "#1d6d6d" },
  shirtViolet: { base: "#7353d7", shade: "#5438b4", highlight: "#9a84ec", line: "#3c287f" },
  shirtLime: { base: "#9bce3d", shade: "#76a52a", highlight: "#bde16d", line: "#54731d" },
  shirtTerracotta: { base: "#b55b3c", shade: "#8e4127", highlight: "#cf7c5e", line: "#64301e" },
  shirtOlive: { base: "#7f8c3f", shade: "#616b2b", highlight: "#9ca95a", line: "#464d1f" },
  shirtCranberry: { base: "#a33f56", shade: "#7a2a3f", highlight: "#c36177", line: "#561d2c" },
  shirtFrost: { base: "#c7d9f3", shade: "#9eb7da", highlight: "#e1ebfb", line: "#7088a7" },
  lineBerry: { base: "#7f5369", shade: "#5d394c", highlight: "#a6798d", line: "#4b2f3f" },
  lineBlue: { base: "#587c9b", shade: "#3f5c73", highlight: "#83a8c6", line: "#30495c" },
  accessoryLilac: { base: "#8fc8ef", shade: "#67a8d8", highlight: "#b6ddf6", line: "#417895" },
  accessoryCoral: { base: "#9edfc0", shade: "#72bf9a", highlight: "#c5efd9", line: "#4f8f70" },
};
export function expandAvatarPaletteToken(token: PaletteToken): ExpandedSwatch {
  return palette[token];
}
const sw = (token: PaletteToken) => expandAvatarPaletteToken(token);
export interface AvatarRenderContext {
  config: AvatarConfig;
  anatomy: AvatarAnatomy;
}
export function resolveAvatarAnatomy(config: AvatarConfig): AvatarAnatomy {
  const variant =
    config.headVariant ?? (config.base === "child" ? "round" : "oval");
  const presets: Record<AvatarHeadVariant, AvatarBounds> = {
    round: { x: 45, y: 34, width: 102, height: 92, rx: 50, ry: 45 },
    oval: { x: 52, y: 27, width: 88, height: 106, rx: 40, ry: 53 },
    wide: { x: 39, y: 40, width: 114, height: 84, rx: 38, ry: 36 },
  };
  const b = presets[variant];
  const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  const headwearWidth = b.width * 0.92;
  const headwearScale = headwearWidth / 94;
  const hairlineY = b.y + (variant === "oval" ? 20 : 17);
  const faceTuning = {
    round: {
      eyeYOffset: 49,
      eyeSpread: 19,
      mouthYOffset: 70,
      earYOffset: 61,
      earW: 17,
      earH: 25,
      earInset: -1,
    },
    oval: {
      eyeYOffset: 55,
      eyeSpread: 17,
      mouthYOffset: 79,
      earYOffset: 67,
      earW: 16,
      earH: 27,
      earInset: -1,
    },
    wide: {
      eyeYOffset: 46,
      eyeSpread: 21,
      mouthYOffset: 66,
      earYOffset: 57,
      earW: 18,
      earH: 24,
      earInset: -1,
    },
  }[variant];
  const chest = { x: 96, y: 151, scale: 1 };
  return {
    viewBox: { width: 192, height: 192 },
    head: {
      variant,
      bounds: b,
      center,
      hairline: { x: center.x, y: hairlineY },
      headwear: {
        center: { x: center.x, y: b.y + b.height * 0.18 },
        crownY: b.y + 4,
        brimY: hairlineY + 15,
        lowerY: hairlineY + 21,
        width: headwearWidth,
        scale: headwearScale,
      },
    },
    face: {
      eyeLineY: b.y + faceTuning.eyeYOffset,
      leftEye: {
        x: center.x - faceTuning.eyeSpread,
        y: b.y + faceTuning.eyeYOffset,
      },
      rightEye: {
        x: center.x + faceTuning.eyeSpread,
        y: b.y + faceTuning.eyeYOffset,
      },
      mouth: { x: center.x, y: b.y + faceTuning.mouthYOffset },
    },
    ears: {
      left: { x: b.x + faceTuning.earInset, y: b.y + faceTuning.earYOffset },
      right: {
        x: b.x + b.width - faceTuning.earInset,
        y: b.y + faceTuning.earYOffset,
      },
      width: faceTuning.earW,
      height: faceTuning.earH,
    },
    body: {
      neck: { x: 81, y: 118, width: 30, height: 26, rx: 12 },
      shoulders: { x: 96, y: 139 },
      chest,
    },
    mounts: {
      chestCenter: chest,
      hairLeft: { x: center.x - 30, y: b.y + 27, rotation: -12, scale: 0.92 },
      hairRight: { x: center.x + 31, y: b.y + 26, rotation: 12, scale: 0.92 },
      headTop: { x: center.x, y: b.y + 18, scale: 1 },
    },
  };
}

export type AvatarAssetCategory = "hair" | "clothing" | "accessory";
export interface AvatarAssetMetadata {
  displayName: string;
  category: AvatarAssetCategory;
  previewPriority: number;
  recommendedMount?: AvatarMountPoint;
}
type SvgPart = (ctx: AvatarRenderContext, swatch: ExpandedSwatch) => string;
export interface HairAsset {
  id: HairStyle;
  metadata: AvatarAssetMetadata & {
    manualReviewChecks: typeof avatarV2HairManualReviewChecks;
  };
  render: (ctx: AvatarRenderContext) => {
    back: string;
    front: string;
    hi: string;
  };
}
export interface ClothingAsset {
  id: ShirtStyle;
  metadata: AvatarAssetMetadata;
  /**
   * Independently colorable regions this garment draws. Every garment supports
   * "primary". Garments that also list "secondary" receive a distinct secondary
   * swatch; primary-only garments ignore the secondary swatch entirely, so they
   * render identically regardless of any secondary color selection.
   */
  colorRegions: readonly AvatarClothingColorRegion[];
  render: (ctx: AvatarRenderContext, primary: ExpandedSwatch, secondary: ExpandedSwatch) => string;
}
export interface AccessoryAsset {
  id: Exclude<AccessoryStyle, "none">;
  metadata: AvatarAssetMetadata;
  render: SvgPart;
}
export const avatarV2HairManualReviewChecks = [
  "Hair must have an identifiable silhouette without relying on color.",
  "Hair must have a visible growth direction from crown or part to fringe or sides.",
  "BackHair and FrontHair must describe the same hairstyle and must not contradict each other.",
  "Highlights must align with strand or curl flow rather than crossing it.",
  "Hair must remain believable in dark colors at small showcase sizes.",
] as const;

const noRaster = (svg: string) =>
  !/<image\b/i.test(svg) && !/(?:href|src)="https?:\/\//i.test(svg);

function headPath(h: AvatarBounds, variant: AvatarHeadVariant): string {
  if (variant === "oval") {
    return `M${h.x + h.width / 2} ${h.y}c27 0 44 22 44 53 0 34-18 53-44 53s-44-19-44-53c0-31 17-53 44-53z`;
  }
  if (variant === "wide") {
    return `M${h.x + 18} ${h.y + 12}C${h.x + 36} ${h.y - 2} ${h.x + h.width - 36} ${h.y - 2} ${h.x + h.width - 18} ${h.y + 12}C${h.x + h.width - 3} ${h.y + 24} ${h.x + h.width - 1} ${h.y + 57} ${h.x + h.width - 16} ${h.y + 73}C${h.x + h.width - 34} ${h.y + 93} ${h.x + 34} ${h.y + 93} ${h.x + 16} ${h.y + 73}C${h.x + 1} ${h.y + 57} ${h.x + 3} ${h.y + 24} ${h.x + 18} ${h.y + 12}z`;
  }
  return `M${h.x + h.width / 2} ${h.y}c30 0 51 20 51 46 0 29-21 46-51 46s-51-17-51-46c0-26 21-46 51-46z`;
}
function renderHeadAndFace({ config, anatomy }: AvatarRenderContext): string {
  const skin = sw(config.skinTone),
    h = anatomy.head.bounds,
    e = anatomy.ears;
  const ear = (side: string, a: AvatarAnchor) =>
    `<ellipse data-anatomy="ear-${side}" cx="${a.x}" cy="${a.y}" rx="${e.width / 2}" ry="${e.height / 2}" fill="${skin.base}" stroke="${skin.line}" stroke-width="3"/>`;
  return `<g id="avatar-v2-layer-base">${ear("left", e.left)}${ear("right", e.right)}<path data-anatomy="head-${anatomy.head.variant}" d="${headPath(h, anatomy.head.variant)}" fill="${skin.base}" stroke="${skin.line}" stroke-width="3"/><path d="M${h.x + 19} ${h.y + 22}c17-17 45-21 64-2" fill="none" stroke="${skin.highlight}" stroke-width="8" stroke-linecap="round" opacity="0.4"/></g>`;
}
export const avatarV2EyeStyles = ["classicRound", "softAlmond", "gentleArc", "brightWide"] as const satisfies readonly EyeStyle[];
export const avatarV2DefaultEyeStyle: EyeStyle = "classicRound";
const EYE_INK = "#3d2c30";
const EYE_CATCHLIGHT = "#fff8f2";
const eyeCatchlight = (x: number, y: number, side: "left" | "right") =>
  `<circle cx="${x + (side === "left" ? 2 : -2)}" cy="${y - 2}" r="1.5" fill="${EYE_CATCHLIGHT}"/>`;
function eyeStyleArtwork(anchor: AvatarAnchor, style: EyeStyle, side: "left" | "right"): string {
  const { x } = anchor;
  const y = anchor.y;
  if (style === "softAlmond") {
    return `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="4.25" fill="${EYE_INK}"/>${eyeCatchlight(x, y, side)}`;
  }
  if (style === "gentleArc") {
    return `<ellipse cx="${x}" cy="${y + 0.5}" rx="5.4" ry="4.6" fill="${EYE_INK}"/><path d="M${x - 5.5} ${y - 2.2}Q${x} ${y - 6} ${x + 5.5} ${y - 2.2}" fill="none" stroke="#6f4448" stroke-width="2" stroke-linecap="round" opacity="0.72"/>${eyeCatchlight(x, y + 0.5, side)}`;
  }
  if (style === "brightWide") {
    return `<ellipse cx="${x}" cy="${y}" rx="5.7" ry="6" fill="${EYE_INK}"/>${eyeCatchlight(x, y, side)}`;
  }
  return `<circle cx="${x}" cy="${y}" r="5" fill="${EYE_INK}"/>${eyeCatchlight(x, y, side)}`;
}
function renderEyes({ config, anatomy }: AvatarRenderContext): string {
  const style = config.eyes?.style ?? avatarV2DefaultEyeStyle;
  const safeStyle = avatarV2EyeStyles.includes(style) ? style : avatarV2DefaultEyeStyle;
  return `<g id="avatar-v2-layer-eyes" data-eye-style="${safeStyle}">${eyeStyleArtwork(anatomy.face.leftEye, safeStyle, "left")}${eyeStyleArtwork(anatomy.face.rightEye, safeStyle, "right")}</g>`;
}
export const avatarV2MouthStyles = [
  "neutral",
  "smile",
  "bigSmile",
  "openSmile",
  "laughing",
  "smirk",
  "determined",
  "surprised",
  "sad",
  "tongueOut",
] as const satisfies readonly MouthStyle[];
export const avatarV2DefaultMouthStyle: MouthStyle = "neutral";

// Shared mouth ink matching the original face line so every style keeps the
// established FamilyBoard stroke weight and warm colour.
const MOUTH_LINE = "#7a4545";
const MOUTH_INNER = "#8a5152";
const MOUTH_TONGUE = "#d98a8a";
const MOUTH_TEETH = "#fff8f2";
const mouthLine = (d: string) =>
  `<path d="${d}" fill="none" stroke="${MOUTH_LINE}" stroke-width="4" stroke-linecap="round"/>`;
const mouthFilled = (d: string, fill: string) =>
  `<path d="${d}" fill="${fill}" stroke="${MOUTH_LINE}" stroke-width="3" stroke-linejoin="round"/>`;

function mouthStyleArtwork(cx: number, cy: number): Record<MouthStyle, string> {
  const teethTop = (spread: number, top: number, depth: number) =>
    `<path d="M${cx - spread} ${cy + top}Q${cx} ${cy + top + 3} ${cx + spread} ${cy + top}L${cx + spread - 1} ${cy + top + depth}Q${cx} ${cy + top + depth + 3} ${cx - spread + 1} ${cy + top + depth}Z" fill="${MOUTH_TEETH}"/>`;
  return {
    // Compatibility default: identical geometry to the original face mouth.
    neutral: mouthLine(`M${cx - 18} ${cy}c10 12 27 12 37-1`),
    smile: mouthLine(`M${cx - 19} ${cy - 2}c10 15 28 15 38-1`),
    bigSmile: mouthLine(`M${cx - 22} ${cy - 3}c11 19 33 19 44-1`),
    openSmile:
      mouthFilled(
        `M${cx - 16} ${cy - 2}Q${cx} ${cy + 2} ${cx + 16} ${cy - 2}Q${cx} ${cy + 15} ${cx - 16} ${cy - 2}Z`,
        MOUTH_INNER,
      ) + teethTop(13, -1, 3),
    laughing:
      mouthFilled(
        `M${cx - 18} ${cy - 3}Q${cx} ${cy + 1} ${cx + 18} ${cy - 3}Q${cx} ${cy + 22} ${cx - 18} ${cy - 3}Z`,
        MOUTH_INNER,
      ) +
      teethTop(15, -2, 4) +
      `<path d="M${cx - 8} ${cy + 9}Q${cx} ${cy + 6} ${cx + 8} ${cy + 9}Q${cx + 10} ${cy + 19} ${cx} ${cy + 19}Q${cx - 10} ${cy + 19} ${cx - 8} ${cy + 9}Z" fill="${MOUTH_TONGUE}"/>`,
    smirk: mouthLine(`M${cx - 16} ${cy + 3}Q${cx - 2} ${cy + 6} ${cx + 16} ${cy - 6}`),
    determined: mouthLine(`M${cx - 16} ${cy}Q${cx} ${cy + 3} ${cx + 16} ${cy}`),
    surprised: `<ellipse cx="${cx}" cy="${cy + 3}" rx="8.5" ry="11" fill="${MOUTH_INNER}" stroke="${MOUTH_LINE}" stroke-width="3"/>`,
    sad: mouthLine(`M${cx - 16} ${cy + 4}Q${cx} ${cy - 6} ${cx + 16} ${cy + 4}`),
    tongueOut:
      `<path d="M${cx - 7} ${cy + 2}Q${cx - 9} ${cy + 15} ${cx} ${cy + 16}Q${cx + 9} ${cy + 15} ${cx + 7} ${cy + 2}Z" fill="${MOUTH_TONGUE}" stroke="${MOUTH_LINE}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M${cx} ${cy + 6}L${cx} ${cy + 13}" fill="none" stroke="${MOUTH_LINE}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>` +
      mouthLine(`M${cx - 17} ${cy - 1}q17 13 34 -1`),
  };
}

function renderMouth({ config, anatomy }: AvatarRenderContext): string {
  const style = config.mouth?.style ?? avatarV2DefaultMouthStyle;
  const artwork = mouthStyleArtwork(anatomy.face.mouth.x, anatomy.face.mouth.y);
  const art = artwork[style] ?? artwork[avatarV2DefaultMouthStyle];
  return `<g id="avatar-v2-layer-mouth" data-mouth-style="${style}">${art}</g>`;
}
function hairParts(ctx: AvatarRenderContext) {
  const c = sw(ctx.config.hair.color),
    common = `fill="${c.base}" stroke="${c.line}" stroke-width="3"`,
    s = ctx.config.hair.style;
  if (s === "shortMessy")
    return {
      back: `<path data-hair-style="shortMessy" d="M47 73c-1-26 18-44 49-45 31 0 51 17 50 43-10-6-22-8-35-5-18 4-35 2-50-6-6 3-11 8-14 13z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/>`,
      front: `<path data-hair-style="shortMessy" d="M49 66c7-22 25-36 49-37 18-1 34 5 45 17 4 4 6 9 7 15-11-4-22-3-33 3l-9 13-10-17-15 19-6-17c-10 8-20 9-28 4z" ${common}/><path d="M62 47c8-8 19-13 32-15M88 35c-5 8-8 17-9 27M116 36c10 5 17 13 22 24" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" opacity="0.46"/>`,
      hi: `<path data-hair-highlight="shortMessy" d="M68 45c14-8 33-10 50-4" fill="none" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.58"/><path data-hair-highlight="shortMessy" d="M90 56c-4 5-7 10-11 15" fill="none" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.42"/>`,
    };
  if (s === "longSoft")
    return {
      back: `<path data-hair-style="longSoft" d="M47 70c-2-29 18-47 49-47 30 0 50 18 49 48 6 31-7 57-31 65-2-17-7-35-18-51-11 16-16 34-18 51-24-8-37-34-31-66z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/><path d="M61 74c-2 22 3 42 16 58M132 74c2 22-3 42-17 58" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" opacity="0.38"/>`,
      front: `<path data-hair-style="longSoft" d="M50 65c5-24 23-39 49-39 24 0 41 13 47 37-17-6-33-7-49-2-15 5-31 9-47 4z" ${common}/><path d="M95 28c-6 17-19 30-39 38M103 30c15 8 27 19 39 34" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" opacity="0.45"/>`,
      hi: `<path data-hair-highlight="longSoft" d="M65 54c17-13 38-17 60-11" fill="none" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.52"/><path data-hair-highlight="longSoft" d="M126 75c3 18-1 35-10 50" fill="none" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.38"/>`,
    };
  if (s === "curlyPlayful")
    return {
      back: `<path data-hair-style="curlyPlayful" data-concept="loose-wavy-curls-fixed" d="M49 71c-2-27 18-46 48-46 29 1 48 19 47 45 7 24 0 45-18 58-5-18-13-31-27-42-14 10-24 24-30 42-18-13-26-34-20-57z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/><path d="M61 74c3 19 10 34 22 46M132 72c-2 19-10 34-23 46" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" opacity="0.38"/>`,
      front: `<path data-hair-style="curlyPlayful" data-concept="loose-wavy-curls-fixed" d="M51 65c7-23 25-37 49-37 23 0 39 13 44 34-12-5-25-4-36 2-10 5-20 8-30 6-9-1-18-3-27-5z" ${common}/><path d="M97 29c-7 12-18 22-36 34M103 31c14 7 25 17 36 31M76 70c10 6 24 4 37-4" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`,
      hi: `<path data-hair-highlight="curlyPlayful" data-concept="loose-wavy-curls-fixed" d="M66 54c16-13 34-17 55-10" fill="none" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.58"/><path data-hair-highlight="curlyPlayful" data-concept="loose-wavy-curls-fixed" d="M121 64c7 4 12 11 14 20" fill="none" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round" opacity="0.42"/>`,
    };
  if (s === "layeredMessy")
    return {
      back: `<path d="M49 76c-4-28 15-49 47-50 32 0 52 21 48 51-9-10-19-14-31-12-16 3-31 6-48-2-7 3-12 7-16 13z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/>`,
      front: `<path d="M50 65c11-25 31-34 57-31 20 2 34 11 40 27-15-5-29-5-43-1l-11 18-8-15c-11 9-22 12-35 2z" ${common}/><path d="M68 38c-9 9-14 17-16 28M122 39c13 8 20 16 24 25" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" opacity="0.45"/>`,
      hi: `<path d="M70 44c18-10 39-10 55 1" fill="none" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.55"/><path d="M88 61c10-7 22-9 34-6" fill="none" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.35"/>`,
    };
  const front =
    s === "curlyCloud"
      ? `<path d="M50 62c0-24 22-39 48-38 27 0 49 16 48 40-10-8-22-11-33-7-16 6-31 4-45-4-8 3-13 6-18 9z" ${common}/><circle cx="63" cy="55" r="14" ${common}/><circle cx="91" cy="43" r="16" ${common}/><circle cx="121" cy="53" r="15" ${common}/>`
      : s === "sideBob"
        ? `<path d="M49 68c3-29 22-43 50-42 27 2 44 18 47 48-16-10-31-12-47-10-20 3-35 1-50 4z" ${common}/><path d="M135 63c8 20 3 43-14 54" ${common}/>`
        : s === "swoop"
          ? `<path d="M51 66c6-26 25-39 52-39 22 0 38 12 43 33-31-12-53-3-78 14-6 4-12 2-17-8z" ${common}/>`
          : `<path d="M50 65c5-25 24-38 48-38s42 12 48 36c-15-5-32-4-48 1-17 5-32 4-48 1z" ${common}/>`;
  return {
    back: "",
    front,
    hi: `<path d="M69 42c16-9 38-10 54 0" fill="none" stroke="${c.highlight}" stroke-width="6" stroke-linecap="round" opacity="0.45"/>`,
  };
}
export const avatarV2HairAssets: Record<HairStyle, HairAsset> = {
  softCrop: {
    id: "softCrop",
    metadata: {
      displayName: "Soft Crop",
      category: "hair",
      previewPriority: 10,
      manualReviewChecks: avatarV2HairManualReviewChecks,
    },
    render: hairParts,
  },
  curlyCloud: {
    id: "curlyCloud",
    metadata: {
      displayName: "Curly Cloud",
      category: "hair",
      previewPriority: 20,
      manualReviewChecks: avatarV2HairManualReviewChecks,
    },
    render: hairParts,
  },
  sideBob: {
    id: "sideBob",
    metadata: {
      displayName: "Side Bob",
      category: "hair",
      previewPriority: 30,
      manualReviewChecks: avatarV2HairManualReviewChecks,
    },
    render: hairParts,
  },
  swoop: {
    id: "swoop",
    metadata: {
      displayName: "Swoop",
      category: "hair",
      previewPriority: 40,
      manualReviewChecks: avatarV2HairManualReviewChecks,
    },
    render: hairParts,
  },
  layeredMessy: {
    id: "layeredMessy",
    metadata: {
      displayName: "Layered Messy",
      category: "hair",
      previewPriority: 50,
      manualReviewChecks: avatarV2HairManualReviewChecks,
    },
    render: hairParts,
  },
  shortMessy: {
    id: "shortMessy",
    metadata: {
      displayName: "Short Messy",
      category: "hair",
      previewPriority: 60,
      manualReviewChecks: avatarV2HairManualReviewChecks,
    },
    render: hairParts,
  },
  longSoft: {
    id: "longSoft",
    metadata: {
      displayName: "Long Soft",
      category: "hair",
      previewPriority: 70,
      manualReviewChecks: avatarV2HairManualReviewChecks,
    },
    render: hairParts,
  },
  curlyPlayful: {
    id: "curlyPlayful",
    metadata: {
      displayName: "Curly Playful",
      category: "hair",
      previewPriority: 80,
      manualReviewChecks: avatarV2HairManualReviewChecks,
    },
    render: hairParts,
  },
};
function renderHairLayer(
  ctx: AvatarRenderContext,
  part: "back" | "front" | "hi",
) {
  const parts = hairParts(ctx);
  const id =
    part === "back"
      ? "avatar-v2-layer-back-hair"
      : part === "front"
        ? "avatar-v2-layer-front-hair"
        : "avatar-v2-layer-hair-highlights";
  return parts[part] ? `<g id="${id}">${parts[part]}</g>` : "";
}
const round2 = (value: number) => Math.round(value * 100) / 100;

function glassesNoveltyLensPath(style: "star" | "heart", cx: number, cy: number): string {
  if (style === "star") {
    const outerRadius = 12;
    const innerRadius = 4.8;
    const points = 5;
    const coordinates: string[] = [];
    for (let index = 0; index < points * 2; index += 1) {
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (index * Math.PI) / points;
      coordinates.push(`${round2(cx + radius * Math.cos(angle))} ${round2(cy + radius * Math.sin(angle))}`);
    }
    return `M${coordinates.join("L")}Z`;
  }

  return `M${cx} ${cy + 8}C${cx - 12} ${cy - 3} ${cx - 12} ${cy - 15} ${cx} ${cy - 8}C${cx + 12} ${cy - 15} ${cx + 12} ${cy - 3} ${cx} ${cy + 8}Z`;
}

function renderGlasses({ config, anatomy }: AvatarRenderContext): string {
  const style = config.glasses.style;
  if (style === "none") return "";
  const c = sw(config.glasses.color);
  const leftTempleEndX = anatomy.ears.left.x + anatomy.ears.width / 2;
  const rightTempleEndX = anatomy.ears.right.x - anatomy.ears.width / 2;
  const templeStartY = anatomy.face.eyeLineY - 2;
  const leftTempleEndY = anatomy.ears.left.y - 8;
  const rightTempleEndY = anatomy.ears.right.y - 8;

  if (style === "star" || style === "heart") {
    const leftPath = glassesNoveltyLensPath(style, anatomy.face.leftEye.x, anatomy.face.eyeLineY);
    const rightPath = glassesNoveltyLensPath(style, anatomy.face.rightEye.x, anatomy.face.eyeLineY);
    const bridgeStartX = anatomy.face.leftEye.x + 12;
    const bridgeEndX = anatomy.face.rightEye.x - 12;
    return `<g id="avatar-v2-layer-glasses" stroke="${c.line}" stroke-width="3" stroke-linejoin="round"><path fill="${c.base}" d="${leftPath}"/><path fill="${c.base}" d="${rightPath}"/><path fill="none" stroke-linecap="round" d="M${bridgeStartX} ${anatomy.face.eyeLineY}H${bridgeEndX}M${anatomy.face.leftEye.x - 12} ${templeStartY}L${leftTempleEndX} ${leftTempleEndY}M${anatomy.face.rightEye.x + 12} ${templeStartY}L${rightTempleEndX} ${rightTempleEndY}"/></g>`;
  }

  const round = style === "round";
  const rx = round ? 13 : style === "rectangular" ? 4 : 8;
  const strokeWidth = style === "thickFrame" ? 6 : 4;
  const lensWidth = round ? 29 : 30;
  const lensHeight = 24;
  const leftLensX = anatomy.face.leftEye.x - lensWidth / 2;
  const rightLensX = anatomy.face.rightEye.x - lensWidth / 2;
  const leftInnerX = leftLensX + lensWidth;
  const rightInnerX = rightLensX;
  const y = anatomy.face.eyeLineY - lensHeight / 2;
  const lensFill = style === "sunglasses" ? c.line : "none";
  const bridge = `<path fill="none" d="M${leftInnerX} ${anatomy.face.eyeLineY}H${rightInnerX}"/>`;
  const temples = `<path fill="none" d="M${leftLensX} ${templeStartY}L${leftTempleEndX} ${leftTempleEndY}M${rightLensX + lensWidth} ${templeStartY}L${rightTempleEndX} ${rightTempleEndY}"/>`;
  return `<g id="avatar-v2-layer-glasses" fill="${lensFill}" stroke="${c.line}" stroke-width="${strokeWidth}" stroke-linecap="round"><rect x="${leftLensX}" y="${y}" width="${lensWidth}" height="${lensHeight}" rx="${rx}"/><rect x="${rightLensX}" y="${y}" width="${lensWidth}" height="${lensHeight}" rx="${rx}"/>${bridge}${temples}</g>`;
}
export const avatarV2ClothingAssets: Record<ShirtStyle, ClothingAsset> = {
  roundedTee: {
    id: "roundedTee",
    metadata: {
      displayName: "Rounded Tee",
      category: "clothing",
      previewPriority: 20,
    },
    colorRegions: ["primary"],
    render: (_ctx, c) =>
      `<path data-clothing-asset="roundedTee" d="M42 172c8-32 27-49 54-49s46 17 54 49z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M62 150c17-13 48-14 68 0" fill="none" stroke="${c.highlight}" stroke-width="7" stroke-linecap="round" opacity="0.5"/>`,
  },
  collar: {
    id: "collar",
    metadata: {
      displayName: "Collared Shirt",
      category: "clothing",
      previewPriority: 30,
    },
    colorRegions: ["primary"],
    render: (_ctx, c, s) =>
      `${avatarV2ClothingAssets.roundedTee.render(_ctx, c, s)}<path d="M78 137l18 18 18-18" fill="#fff6ed" stroke="${c.line}" stroke-width="3"/>`,
  },
  tShirt: {
    id: "tShirt",
    metadata: {
      displayName: "T-Shirt",
      category: "clothing",
      previewPriority: 10,
    },
    colorRegions: ["primary"],
    render: (_ctx, c) =>
      `<path data-clothing-asset="tShirt" d="M39 173l8-29c6-13 19-20 34-22l15 13 15-13c16 2 28 9 34 22l8 29z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M80 123c5 8 27 8 32 0" fill="none" stroke="${c.line}" stroke-width="3"/><path d="M54 151h84" stroke="${c.highlight}" stroke-width="6" stroke-linecap="round" opacity="0.48"/>`,
  },
  sweater: {
    id: "sweater",
    metadata: {
      displayName: "Sweater",
      category: "clothing",
      previewPriority: 40,
    },
    colorRegions: ["primary"],
    render: (_ctx, c) =>
      `<path data-clothing-asset="sweater" d="M40 173c7-33 27-51 56-51s49 18 56 51z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M73 125c7 14 39 14 46 0" fill="none" stroke="${c.line}" stroke-width="4"/><path d="M58 146h76M54 160h84" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.5"/>`,
  },
  hoodie: {
    id: "hoodie",
    metadata: {
      displayName: "Hoodie",
      category: "clothing",
      previewPriority: 50,
    },
    colorRegions: ["primary"],
    render: (_ctx, c) =>
      `<path data-clothing-asset="hoodie" d="M41 173c7-33 27-51 55-51s48 18 55 51z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M63 139c10-17 23-24 33-24s23 7 33 24c-12 11-54 11-66 0z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/><path d="M78 130c8 9 27 11 36 0" fill="none" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.65"/><path d="M88 137l-4 21M104 137l4 21" stroke="${c.line}" stroke-width="3" stroke-linecap="round"/><circle cx="84" cy="160" r="2.5" fill="${c.line}"/><circle cx="108" cy="160" r="2.5" fill="${c.line}"/>`,
  },
  overall: {
    id: "overall",
    metadata: {
      displayName: "Overall",
      category: "clothing",
      previewPriority: 60,
    },
    colorRegions: ["primary"],
    render: (_ctx, c) =>
      `<path data-clothing-asset="overall" d="M42 173c8-32 27-49 54-49s46 17 54 49z" fill="${c.highlight}" stroke="${c.line}" stroke-width="3"/><path d="M68 173v-43h18l10 14 10-14h18v43z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M76 130v-12M116 130v-12" stroke="${c.line}" stroke-width="5" stroke-linecap="round"/><circle cx="82" cy="142" r="3" fill="${c.line}"/><circle cx="110" cy="142" r="3" fill="${c.line}"/>`,
  },
  polo: {
    id: "polo",
    metadata: {
      displayName: "Polo",
      category: "clothing",
      previewPriority: 25,
    },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="polo" d="M42 173c8-33 27-51 54-51s46 18 54 51z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M60 154h72" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.4"/><rect x="91" y="132" width="10" height="27" rx="2.5" fill="${s.base}" stroke="${s.line}" stroke-width="2.5"/><path d="M82 123L96 138L84 142Z" fill="${s.base}" stroke="${s.line}" stroke-width="2.5" stroke-linejoin="round"/><path d="M110 123L96 138L108 142Z" fill="${s.base}" stroke="${s.line}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="96" cy="142" r="1.9" fill="${s.line}"/><circle cx="96" cy="151" r="1.9" fill="${s.line}"/>`,
  },
  jacket: {
    id: "jacket",
    metadata: {
      displayName: "Jacket",
      category: "clothing",
      previewPriority: 55,
    },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="jacket" d="M41 173c7-33 27-51 55-51s48 18 55 51z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M88 126h16l-3 47h-10z" fill="${s.base}" stroke="${s.line}" stroke-width="2.5"/><path d="M88 132h16M88 142h16M88 152h16M88 162h16" stroke="${s.shade}" stroke-width="1.6" stroke-linecap="round"/><path d="M69 128c9-6 20-8 27-8l-8 16-22 12z" fill="${c.shade}" stroke="${c.line}" stroke-width="3" stroke-linejoin="round"/><path d="M123 128c-9-6-20-8-27-8l8 16 22 12z" fill="${c.shade}" stroke="${c.line}" stroke-width="3" stroke-linejoin="round"/><path d="M96 126v47" stroke="${s.line}" stroke-width="2" stroke-linecap="round"/>`,
  },

  zipHoodie: {
    id: "zipHoodie",
    metadata: { displayName: "Zip Hoodie", category: "clothing", previewPriority: 70 },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="zipHoodie" d="M40 173c7-34 27-52 56-52s49 18 56 52z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M60 140c9-19 23-29 36-29s27 10 36 29c-13 11-59 11-72 0z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/><path d="M72 137c7-11 16-16 24-16s17 5 24 16c-13 7-35 7-48 0z" fill="${s.base}" stroke="${s.line}" stroke-width="2.5"/><path d="M96 128v45" stroke="${s.line}" stroke-width="3" stroke-linecap="round"/><path d="M87 137l-5 21M105 137l5 21" stroke="${s.line}" stroke-width="2.5" stroke-linecap="round"/><circle cx="82" cy="160" r="2.3" fill="${s.line}"/><circle cx="110" cy="160" r="2.3" fill="${s.line}"/><path d="M58 155h76" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.38"/>`,
  },
  varsityJacket: {
    id: "varsityJacket",
    metadata: { displayName: "Varsity Jacket", category: "clothing", previewPriority: 75 },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="varsityJacket" d="M42 173c7-33 27-51 54-51s47 18 54 51z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M44 173l8-28c4-10 11-17 21-20l10 48zM148 173l-8-28c-4-10-11-17-21-20l-10 48z" fill="${s.base}" stroke="${s.line}" stroke-width="3" stroke-linejoin="round"/><path d="M75 124c8 7 34 7 42 0l-8 13H83z" fill="${s.base}" stroke="${s.line}" stroke-width="2.5"/><path d="M56 157h80M52 169h88" stroke="${s.line}" stroke-width="4" stroke-linecap="round"/><path d="M96 128v45" stroke="${c.line}" stroke-width="2.5" stroke-linecap="round"/><path d="M65 151h62" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.35"/>`,
  },
  rugbyShirt: {
    id: "rugbyShirt",
    metadata: { displayName: "Rugby Shirt", category: "clothing", previewPriority: 80 },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="rugbyShirt" d="M39 173l8-29c6-13 19-20 34-22l15 13 15-13c16 2 28 9 34 22l8 29z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M80 123l16 18 16-18" fill="${s.base}" stroke="${s.line}" stroke-width="3" stroke-linejoin="round"/><rect x="90" y="133" width="12" height="25" rx="2.5" fill="${s.base}" stroke="${s.line}" stroke-width="2.5"/><path d="M56 158h22M114 158h22" stroke="${s.line}" stroke-width="5" stroke-linecap="round"/><circle cx="96" cy="143" r="1.9" fill="${s.line}"/><path d="M55 149h82" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.35"/>`,
  },
  contrastPocketHoodie: {
    id: "contrastPocketHoodie",
    metadata: { displayName: "Contrast Pocket Hoodie", category: "clothing", previewPriority: 85 },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="contrastPocketHoodie" d="M41 173c7-33 27-51 55-51s48 18 55 51z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M64 138c10-18 22-25 32-25s22 7 32 25c-12 10-52 10-64 0z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/><path d="M78 134c6 8 30 8 36 0" fill="none" stroke="${s.line}" stroke-width="4" stroke-linecap="round"/><path d="M72 151h48l8 22H64z" fill="${s.base}" stroke="${s.line}" stroke-width="3" stroke-linejoin="round"/><path d="M74 161h44" stroke="${s.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.55"/><path d="M88 138l-5 15M104 138l5 15" stroke="${s.line}" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  winterCoat: {
    id: "winterCoat",
    metadata: { displayName: "Winter Coat", category: "clothing", previewPriority: 90 },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="winterCoat" d="M38 173c5-34 25-54 58-54s53 20 58 54z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M68 125c8 10 48 10 56 0l-9 24H77z" fill="${s.base}" stroke="${s.line}" stroke-width="3" stroke-linejoin="round"/><path d="M86 128h20l-4 45H90z" fill="${s.base}" stroke="${s.line}" stroke-width="2.5"/><path d="M55 160h26M111 160h26" stroke="${s.line}" stroke-width="5" stroke-linecap="round"/><circle cx="96" cy="142" r="2.3" fill="${s.line}"/><circle cx="96" cy="154" r="2.3" fill="${s.line}"/><path d="M57 151h78" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.35"/>`,
  },
  cardigan: {
    id: "cardigan",
    metadata: { displayName: "Cardigan", category: "clothing", previewPriority: 95 },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="cardigan" d="M42 173c8-33 27-51 54-51s46 18 54 51z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M82 126h28l9 47H73z" fill="${s.base}" stroke="${s.line}" stroke-width="2.5"/><path d="M82 126c-11 8-18 23-20 47M110 126c11 8 18 23 20 47" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round"/><path d="M96 129v44" stroke="${s.line}" stroke-width="2.5" stroke-linecap="round"/><circle cx="96" cy="141" r="2" fill="${s.line}"/><circle cx="96" cy="153" r="2" fill="${s.line}"/><path d="M57 156h23M112 156h23" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.42"/>`,
  },
  sportsShirt: {
    id: "sportsShirt",
    metadata: { displayName: "Sports Shirt", category: "clothing", previewPriority: 100 },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="sportsShirt" d="M39 173l8-29c6-13 19-20 34-22l15 13 15-13c16 2 28 9 34 22l8 29z" fill="${s.base}" stroke="${s.line}" stroke-width="3"/><path d="M68 173l8-49c7-2 13-2 20 11 7-13 13-13 20-11l8 49z" fill="${c.base}" stroke="${c.line}" stroke-width="3" stroke-linejoin="round"/><path d="M80 123c5 8 27 8 32 0" fill="none" stroke="${s.line}" stroke-width="3"/><path d="M54 148l22 2M138 148l-22 2" stroke="${s.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.5"/><path d="M83 154h26" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.4"/>`,
  },
  apronSmock: {
    id: "apronSmock",
    metadata: { displayName: "Apron / Smock", category: "clothing", previewPriority: 105 },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="apronSmock" d="M39 173l8-29c6-13 19-20 34-22l15 13 15-13c16 2 28 9 34 22l8 29z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M78 128l18 16 18-16" fill="none" stroke="${s.line}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M72 142h48l10 31H62z" fill="${s.base}" stroke="${s.line}" stroke-width="3" stroke-linejoin="round"/><path d="M74 153h44" stroke="${s.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.5"/><path d="M64 169h64" stroke="${s.shade}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>`,
  },
  dress: {
    id: "dress",
    metadata: {
      displayName: "Dress",
      category: "clothing",
      previewPriority: 35,
    },
    colorRegions: ["primary", "secondary"],
    render: (_ctx, c, s) =>
      `<path data-clothing-asset="dress" d="M56 152L42 173H150L136 152Z" fill="${s.base}" stroke="${s.line}" stroke-width="3" stroke-linejoin="round"/><path d="M70 160q26 9 52 0" fill="none" stroke="${s.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.5"/><path d="M55 153c5-19 21-31 41-31s36 12 41 31z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M74 125c7 12 41 12 48 0" fill="none" stroke="${c.line}" stroke-width="3"/><path d="M60 150h72" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.45"/>`,
  },
};
function renderShirt(ctx: AvatarRenderContext): string {
  const asset = avatarV2ClothingAssets[ctx.config.shirt.style];
  const primary = sw(ctx.config.shirt.color);
  const supportsSecondary = asset.colorRegions.includes("secondary");
  const secondary = supportsSecondary && ctx.config.shirt.secondaryColor
    ? sw(ctx.config.shirt.secondaryColor)
    : primary;
  return `<g id="avatar-v2-layer-shirt">${asset.render(ctx, primary, secondary)}</g>`;
}
export const avatarV2AccessoryAssets: Record<
  Exclude<AccessoryStyle, "none">,
  AccessoryAsset
> = {
  chestStar: {
    id: "chestStar",
    metadata: {
      displayName: "Chest Star",
      category: "accessory",
      previewPriority: 40,
      recommendedMount: "chestCenter",
    },
    render: (ctx, c) =>
      renderMounted(
        ctx,
        c,
        "chestCenter",
        `<path data-accessory-asset="chestStar" d="M0-13l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M-3-5l3-4 3 4" fill="none" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`,
      ),
  },
  star: {
    id: "star",
    metadata: {
      displayName: "Star Clip",
      category: "accessory",
      previewPriority: 10,
      recommendedMount: "hairRight",
    },
    render: (ctx, c) =>
      renderMounted(
        ctx,
        c,
        "hairRight",
        `<path data-accessory-asset="star" d="M0-14l5 9 10 1-7 7 2 10-10-5-10 5 2-10-7-7 10-1z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M-3-4l3-4 3 4" fill="none" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`,
      ),
  },
  flower: {
    id: "flower",
    metadata: {
      displayName: "Flower Clip",
      category: "accessory",
      previewPriority: 20,
      recommendedMount: "hairLeft",
    },
    render: (ctx, c) =>
      renderMounted(
        ctx,
        c,
        "hairLeft",
        `<circle data-accessory-asset="flower" cx="0" cy="0" r="5" fill="${c.highlight}" stroke="${c.line}" stroke-width="2"/><circle cx="-8" cy="0" r="6" fill="${c.base}" stroke="${c.line}" stroke-width="2"/><circle cx="8" cy="0" r="6" fill="${c.base}" stroke="${c.line}" stroke-width="2"/><circle cx="0" cy="-8" r="6" fill="${c.base}" stroke="${c.line}" stroke-width="2"/><circle cx="0" cy="8" r="6" fill="${c.base}" stroke="${c.line}" stroke-width="2"/><path d="M-11 10c7 5 16 5 22 0" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" opacity="0.55"/>`,
      ),
  },
  headband: {
    id: "headband",
    metadata: {
      displayName: "Headband",
      category: "accessory",
      previewPriority: 30,
      recommendedMount: "headTop",
    },
    render: (ctx, c) => renderHeadband(ctx, c, "normal"),
  },
  bow: {
    id: "bow",
    metadata: {
      displayName: "Bow",
      category: "accessory",
      previewPriority: 50,
      recommendedMount: "hairRight",
    },
    render: (ctx, c) =>
      renderMounted(
        ctx,
        c,
        "hairRight",
        `<path data-accessory-asset="bow" d="M0 0c-10-12-21-10-24 2 4 10 14 13 24 3 10 10 20 7 24-3-3-12-14-14-24-2z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><circle cx="0" cy="2" r="5" fill="${c.shade}" stroke="${c.line}" stroke-width="2"/>`,
      ),
  },
  starClip: {
    id: "starClip",
    metadata: {
      displayName: "Legacy Star Clip",
      category: "accessory",
      previewPriority: 90,
      recommendedMount: "hairRight",
    },
    render: (ctx, c) => avatarV2AccessoryAssets.star.render(ctx, c),
  },
  leafPin: {
    id: "leafPin",
    metadata: {
      displayName: "Leaf Pin",
      category: "accessory",
      previewPriority: 80,
      recommendedMount: "hairRight",
    },
    render: (ctx, c) =>
      renderMounted(
        ctx,
        c,
        "hairRight",
        `<path data-accessory-asset="leafPin" d="M-14 2C-5-14 10-16 17-4 10 13-5 17-14 2z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M-10 1C-2-1 7-4 14-8" fill="none" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round"/><path d="M-2-1l-3-7M4-3l3 6" fill="none" stroke="${c.line}" stroke-width="2" stroke-linecap="round" opacity="0.55"/>`,
      ),
  },

  hairClip: {
    id: "hairClip",
    metadata: { displayName: "Hair Clip", category: "accessory", previewPriority: 52, recommendedMount: "hairRight" },
    render: (ctx, c) =>
      renderMounted(ctx, c, "hairRight", `<rect data-accessory-asset="hairClip" x="-17" y="-5" width="34" height="10" rx="5" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M-10-1h20" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round" opacity="0.75"/>`),
  },
  ribbon: {
    id: "ribbon",
    metadata: { displayName: "Ribbon", category: "accessory", previewPriority: 54, recommendedMount: "hairRight" },
    render: (ctx, c) =>
      renderMounted(ctx, c, "hairRight", `<path data-accessory-asset="ribbon" d="M-5 0c-9-8-17-6-19 3 4 7 12 8 19 2 7 6 15 5 19-2-2-9-10-11-19-3z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M-4 6l-5 17 9-5 8 5-4-17z" fill="${c.shade}" stroke="${c.line}" stroke-width="3" stroke-linejoin="round"/><circle cx="0" cy="3" r="4" fill="${c.highlight}" stroke="${c.line}" stroke-width="2"/>`),
  },
  baseballCap: {
    id: "baseballCap",
    metadata: { displayName: "Baseball Cap", category: "accessory", previewPriority: 56, recommendedMount: "headTop" },
    render: (ctx, c) => renderHeadwear(ctx, c, "baseballCap"),
  },
  beanie: {
    id: "beanie",
    metadata: { displayName: "Beanie", category: "accessory", previewPriority: 58, recommendedMount: "headTop" },
    render: (ctx, c) => renderHeadwear(ctx, c, "beanie"),
  },
  partyHat: {
    id: "partyHat",
    metadata: { displayName: "Party Hat", category: "accessory", previewPriority: 60, recommendedMount: "headTop" },
    render: (ctx, c) => renderHeadwear(ctx, c, "partyHat"),
  },
  crown: {
    id: "crown",
    metadata: { displayName: "Crown", category: "accessory", previewPriority: 62, recommendedMount: "headTop" },
    render: (ctx, c) => renderHeadwear(ctx, c, "crown"),
  },
  sunHat: {
    id: "sunHat",
    metadata: { displayName: "Sun Hat", category: "accessory", previewPriority: 64, recommendedMount: "headTop" },
    render: (ctx, c) => renderHeadwear(ctx, c, "sunHat"),
  },
  helmet: {
    id: "helmet",
    metadata: { displayName: "Helmet", category: "accessory", previewPriority: 66, recommendedMount: "headTop" },
    render: (ctx, c) => renderHeadwear(ctx, c, "helmet"),
  },
  necklace: {
    id: "necklace",
    metadata: { displayName: "Necklace", category: "accessory", previewPriority: 68, recommendedMount: "chestCenter" },
    render: (ctx, c) => renderNeckAccessory(ctx, c, "necklace"),
  },
  scarf: {
    id: "scarf",
    metadata: { displayName: "Scarf", category: "accessory", previewPriority: 69, recommendedMount: "chestCenter" },
    render: (ctx, c) => renderNeckAccessory(ctx, c, "scarf"),
  },
  tinyCrown: {
    id: "tinyCrown",
    metadata: {
      displayName: "Tiny Crown",
      category: "accessory",
      previewPriority: 70,
      recommendedMount: "headTop",
    },
    render: (ctx, c) =>
      renderMounted(
        ctx,
        c,
        "headTop",
        `<path data-accessory-asset="tinyCrown" d="M-28-9l10 12 15-15 14 15 12-12 2 25h-55z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/>`,
      ),
  },
};
type HeadwearStyle = "baseballCap" | "beanie" | "partyHat" | "crown" | "sunHat" | "helmet";

function renderHeadwear(ctx: AvatarRenderContext, c: ExpandedSwatch, style: HeadwearStyle): string {
  const headwear = ctx.anatomy.head.headwear;
  const cx = headwear.center.x;
  const top = headwear.crownY;
  const brim = headwear.brimY;
  const lower = headwear.lowerY;
  const w = headwear.width;
  const scale = headwear.scale;
  const hw = w / 2;
  const line = c.line;
  const shapes: Record<HeadwearStyle, string> = {
    baseballCap: `<path data-accessory-asset="baseballCap" data-headwear-center-x="${n(cx)}" data-headwear-baseline-y="${n(brim)}" d="M${n(cx - hw * 0.78)} ${n(brim - 6)}c${n(w * 0.18)}-${n(w * 0.28)} ${n(w * 0.78)}-${n(w * 0.28)} ${n(w * 0.96)} 0v${n(12 * scale)}h-${n(w * 0.96)}z" fill="${c.base}" stroke="${line}" stroke-width="3"/><path d="M${n(cx + hw * 0.22)} ${n(brim + 5)}c${n(16 * scale)}-1 ${n(31 * scale)} 3 ${n(41 * scale)} ${n(11 * scale)}-${n(18 * scale)} ${n(6 * scale)}-${n(36 * scale)} ${n(4 * scale)}-${n(49 * scale)}-${n(5 * scale)}z" fill="${c.shade}" stroke="${line}" stroke-width="3"/><path d="M${n(cx - hw * 0.3)} ${n(brim - 7)}c${n(11 * scale)}-${n(6 * scale)} ${n(25 * scale)}-${n(7 * scale)} ${n(38 * scale)}-1" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.65"/>`,
    beanie: `<path data-accessory-asset="beanie" data-headwear-center-x="${n(cx)}" data-headwear-baseline-y="${n(lower)}" d="M${n(cx - hw * 0.82)} ${n(lower - 10)}c${n(5 * scale)}-${n(35 * scale)} ${n(w * 0.82)}-${n(35 * scale)} ${n(w * 0.88)} 0v${n(12 * scale)}h-${n(w * 0.88)}z" fill="${c.base}" stroke="${line}" stroke-width="3"/><path d="M${n(cx - hw * 0.86)} ${n(lower)}h${n(w * 0.92)}" stroke="${line}" stroke-width="${n(8 * scale)}" stroke-linecap="round"/><circle cx="${n(cx)}" cy="${n(Math.max(8, top - 4 * scale))}" r="${n(8 * scale)}" fill="${c.highlight}" stroke="${line}" stroke-width="3"/>`,
    partyHat: `<path data-accessory-asset="partyHat" data-headwear-center-x="${n(cx)}" data-headwear-baseline-y="${n(brim)}" d="M${n(cx - hw * 0.37)} ${n(brim)}L${n(cx + 4 * scale)} ${n(Math.max(8, top - 10 * scale))}L${n(cx + hw * 0.42)} ${n(brim)}z" fill="${c.base}" stroke="${line}" stroke-width="3"/><path d="M${n(cx - hw * 0.18)} ${n(brim - 23 * scale)}l${n(30 * scale)} ${n(11 * scale)}M${n(cx - hw * 0.04)} ${n(brim - 45 * scale)}l${n(18 * scale)} ${n(7 * scale)}" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.7"/><circle cx="${n(cx + 4 * scale)}" cy="${n(Math.max(6, top - 13 * scale))}" r="${n(6 * scale)}" fill="${c.highlight}" stroke="${line}" stroke-width="2"/>`,
    crown: `<path data-accessory-asset="crown" data-headwear-center-x="${n(cx)}" data-headwear-baseline-y="${n(brim)}" d="M${n(cx - hw * 0.8)} ${n(brim - 6)}l${n(10 * scale)}-${n(24 * scale)} ${n(20 * scale)} ${n(19 * scale)} ${n(18 * scale)}-${n(28 * scale)} ${n(20 * scale)} ${n(28 * scale)} ${n(20 * scale)}-${n(19 * scale)} ${n(10 * scale)} ${n(24 * scale)}v${n(17 * scale)}h-${n(w * 0.96)}z" fill="${c.base}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/><path d="M${n(cx - 22 * scale)} ${n(brim + 2 * scale)}h${n(44 * scale)}" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.65"/>`,
    sunHat: `<path data-accessory-asset="sunHat" data-headwear-center-x="${n(cx)}" data-headwear-baseline-y="${n(brim)}" d="M${n(cx - hw * 0.75)} ${n(brim - 9)}c${n(7 * scale)}-${n(26 * scale)} ${n(w * 0.78)}-${n(26 * scale)} ${n(w * 0.86)} 0v${n(12 * scale)}h-${n(w * 0.86)}z" fill="${c.base}" stroke="${line}" stroke-width="3"/><path d="M${n(cx - hw * 1.15)} ${n(brim + 3)}c${n(w * 0.62)}-${n(12 * scale)} ${n(w * 1.06)}-${n(12 * scale)} ${n(w * 1.68)} 0-${n(18 * scale)} ${n(15 * scale)}-${n(w * 1.5)} ${n(15 * scale)}-${n(w * 1.68)} 0z" fill="${c.shade}" stroke="${line}" stroke-width="3"/><path d="M${n(cx - hw * 0.55)} ${n(brim - 8)}c${n(18 * scale)}-${n(6 * scale)} ${n(42 * scale)}-${n(6 * scale)} ${n(61 * scale)} 0" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>`,
    helmet: `<path data-accessory-asset="helmet" data-headwear-center-x="${n(cx)}" data-headwear-baseline-y="${n(lower)}" d="M${n(cx - hw * 0.92)} ${n(lower - 2)}c0-${n(38 * scale)} ${n(21 * scale)}-${n(56 * scale)} ${n(hw * 0.92)}-${n(56 * scale)}s${n(hw * 0.92)} ${n(18 * scale)} ${n(hw * 0.92)} ${n(56 * scale)}v${n(9 * scale)}h-${n(w * 0.92)}z" fill="${c.base}" stroke="${line}" stroke-width="3"/><path d="M${n(cx)} ${n(lower - 55 * scale)}v${n(53 * scale)}M${n(cx - hw * 0.68)} ${n(lower - 20 * scale)}c${n(23 * scale)} ${n(7 * scale)} ${n(52 * scale)} ${n(7 * scale)} ${n(75 * scale)} 0" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.62"/>`,
  };
  return `<g id="avatar-v2-layer-accessory" data-avatar-mount="headTop" data-headwear-model="anatomy-relative" data-headwear-width="${n(w)}" data-headwear-scale="${n(scale)}">${shapes[style]}</g>`;
}

function renderNeckAccessory(ctx: AvatarRenderContext, c: ExpandedSwatch, style: "necklace" | "scarf"): string {
  const cx = ctx.anatomy.body.chest.x;
  const y = ctx.anatomy.body.neck.y + 14;
  if (style === "necklace") {
    return `<g id="avatar-v2-layer-accessory" data-avatar-mount="chestCenter"><path data-accessory-asset="necklace" d="M${cx - 24} ${y}q24 34 48 0" fill="none" stroke="${c.line}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${y + 27}" r="8" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M${cx - 3} ${y + 25}h6" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round" opacity="0.7"/></g>`;
  }
  return `<g id="avatar-v2-layer-accessory" data-avatar-mount="chestCenter"><path data-accessory-asset="scarf" d="M${cx - 31} ${y + 1}c15 14 47 14 62 0v15c-16 13-47 13-62 0z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M${cx - 2} ${y + 12}l-10 35h20l8-33z" fill="${c.shade}" stroke="${c.line}" stroke-width="3" stroke-linejoin="round"/><path d="M${cx - 20} ${y + 12}c11 6 28 6 40 0" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.55"/></g>`;
}

function headbandAnchorCurve(anatomy: AvatarAnatomy) {
  const h = anatomy.head.bounds;
  const left = { x: h.x + h.width * 0.07, y: h.y + h.height * 0.36 };
  const right = { x: h.x + h.width * 0.93, y: h.y + h.height * 0.36 };
  const leftC = { x: h.x + h.width * 0.22, y: h.y + h.height * 0.1 };
  const rightC = { x: h.x + h.width * 0.78, y: h.y + h.height * 0.1 };
  return { left, right, leftC, rightC };
}

const n = (value: number) => Math.round(value * 10) / 10;

function renderHeadband(
  ctx: AvatarRenderContext,
  c: ExpandedSwatch,
  segment: "normal" | "curlyRear" | "curlyVisible",
): string {
  const a = headbandAnchorCurve(ctx.anatomy);
  const path = `M${n(a.left.x)} ${n(a.left.y)}C${n(a.leftC.x)} ${n(a.leftC.y)} ${n(a.rightC.x)} ${n(a.rightC.y)} ${n(a.right.x)} ${n(a.right.y)}`;
  const innerPath = `M${n(a.left.x + 3)} ${n(a.left.y - 1)}C${n(a.leftC.x + 3)} ${n(a.leftC.y + 5)} ${n(a.rightC.x - 3)} ${n(a.rightC.y + 5)} ${n(a.right.x - 3)} ${n(a.right.y - 1)}`;

  if (ctx.config.hair.style !== "curlyPlayful" || segment === "normal") {
    return `<g id="avatar-v2-layer-accessory" data-accessory-asset="headband" data-accessory-layer-rule="normal"><path d="${path}" fill="none" stroke="${c.line}" stroke-width="7" stroke-linecap="round"/><path d="${innerPath}" fill="none" stroke="${c.base}" stroke-width="4" stroke-linecap="round"/></g>`;
  }

  if (segment === "curlyRear") {
    return `<g id="avatar-v2-layer-accessory" data-accessory-asset="headband" data-accessory-layer-rule="partial-occlusion-rear" data-headband-model="anatomy-anchor-curve"><path d="${path}" fill="none" stroke="${c.line}" stroke-width="8" stroke-linecap="round"/><path d="${innerPath}" fill="none" stroke="${c.base}" stroke-width="4" stroke-linecap="round"/></g>`;
  }

  const leftOuter = `M${n(a.left.x)} ${n(a.left.y)}C${n(a.left.x + 5)} ${n(a.left.y - 7)} ${n(a.leftC.x - 4)} ${n(a.leftC.y + 8)} ${n(a.leftC.x + 2)} ${n(a.leftC.y + 5)}`;
  const rightOuter = `M${n(a.rightC.x - 2)} ${n(a.rightC.y + 5)}C${n(a.rightC.x + 4)} ${n(a.rightC.y + 8)} ${n(a.right.x - 5)} ${n(a.right.y - 7)} ${n(a.right.x)} ${n(a.right.y)}`;
  const leftInner = `M${n(a.left.x + 3)} ${n(a.left.y - 1)}C${n(a.left.x + 7)} ${n(a.left.y - 6)} ${n(a.leftC.x - 1)} ${n(a.leftC.y + 10)} ${n(a.leftC.x + 5)} ${n(a.leftC.y + 7)}`;
  const rightInner = `M${n(a.rightC.x - 5)} ${n(a.rightC.y + 7)}C${n(a.rightC.x + 1)} ${n(a.rightC.y + 10)} ${n(a.right.x - 7)} ${n(a.right.y - 6)} ${n(a.right.x - 3)} ${n(a.right.y - 1)}`;
  return `<g id="avatar-v2-layer-accessory-visible" data-accessory-asset="headband" data-accessory-layer-rule="partial-occlusion-visible" data-headband-model="anatomy-anchor-curve"><path d="${leftOuter}${rightOuter}" fill="none" stroke="${c.line}" stroke-width="8" stroke-linecap="round"/><path d="${leftInner}${rightInner}" fill="none" stroke="${c.base}" stroke-width="4" stroke-linecap="round"/></g>`;
}

function renderMounted(
  ctx: AvatarRenderContext,
  _c: ExpandedSwatch,
  fallbackMount: AvatarMountPoint,
  shapes: string,
): string {
  const m = ctx.anatomy.mounts[ctx.config.accessory.mount ?? fallbackMount];
  return `<g id="avatar-v2-layer-accessory" data-avatar-mount="${ctx.config.accessory.mount ?? fallbackMount}" transform="translate(${m.x} ${m.y}) rotate(${m.rotation ?? 0}) scale(${m.scale ?? 1})">${shapes}</g>`;
}
function renderAccessory(ctx: AvatarRenderContext): string {
  if (ctx.config.accessory.style === "none") return "";
  const c = sw(ctx.config.accessory.color);
  if (shouldRenderAccessoryBehindFrontHair(ctx)) return renderHeadband(ctx, c, "curlyVisible");
  return avatarV2AccessoryAssets[ctx.config.accessory.style].render(ctx, c);
}
function shouldRenderAccessoryBehindFrontHair(ctx: AvatarRenderContext): boolean {
  return (
    ctx.config.hair.style === "curlyPlayful" &&
    ctx.config.accessory.style === "headband"
  );
}
function renderBehindFrontHairAccessory(ctx: AvatarRenderContext): string {
  if (!shouldRenderAccessoryBehindFrontHair(ctx)) return "";
  const c = sw(ctx.config.accessory.color);
  return renderHeadband(ctx, c, "curlyRear");
}
export function validateAvatarV2AssetSvg(svg: string): boolean {
  return svg.startsWith("<svg") && svg.endsWith("</svg>") && noRaster(svg);
}
export function validateAvatarV2HairSvg(svg: string, style: HairStyle): boolean {
  const hasReadableSilhouette =
    svg.includes(`data-hair-style="${style}"`) &&
    svg.includes("avatar-v2-layer-front-hair");
  const hasLayerRelationship =
    svg.includes("avatar-v2-layer-back-hair") &&
    svg.indexOf("avatar-v2-layer-back-hair") <
    svg.indexOf("avatar-v2-layer-front-hair");
  const hasFlowHighlights =
    svg.includes("avatar-v2-layer-hair-highlights") &&
    svg.includes(`data-hair-highlight="${style}"`) &&
    /data-hair-highlight="[^"]+"[^>]*d="M/.test(svg);
  const hasSvgOnlyDeterminismGuards = validateAvatarV2AssetSvg(svg);

  return (
    hasReadableSilhouette &&
    hasLayerRelationship &&
    hasFlowHighlights &&
    hasSvgOnlyDeterminismGuards
  );
}
export function renderAvatarV2Svg(config: AvatarConfig): string {
  const anatomy = resolveAvatarAnatomy(config),
    ctx = { config, anatomy };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192" role="img" aria-label="HomeOps Avatar V2 sample">${renderHairLayer(ctx, "back")}${renderShirt(ctx)}${renderHeadAndFace(ctx)}${renderEyes(ctx)}${renderMouth(ctx)}${renderBehindFrontHairAccessory(ctx)}${renderHairLayer(ctx, "front")}${renderGlasses(ctx)}${renderHairLayer(ctx, "hi")}${renderAccessory(ctx)}</svg>`;
}
export const avatarV2SampleConfigs = {
  playfulChild: {
    base: "child",
    skinTone: "skinPeach",
    hair: { style: "curlyCloud", color: "hairChestnut" },
    glasses: { style: "none", color: "lineBlue" },
    shirt: { style: "roundedTee", color: "shirtMint" },
    accessory: { style: "starClip", color: "accessoryCoral" },
  },
  calmChildWithGlasses: {
    base: "child",
    skinTone: "skinHoney",
    hair: { style: "softCrop", color: "hairCocoa" },
    glasses: { style: "round", color: "lineBlue" },
    shirt: { style: "collar", color: "shirtSky" },
    accessory: { style: "none", color: "accessoryLilac" },
  },
  adult: {
    base: "adult",
    skinTone: "skinBrown",
    hair: { style: "sideBob", color: "hairPlum" },
    glasses: { style: "softSquare", color: "lineBerry" },
    shirt: { style: "roundedTee", color: "shirtRose" },
    accessory: { style: "leafPin", color: "accessoryLilac" },
  },
  expressiveChildSpecialAccessory: {
    base: "child",
    skinTone: "skinPeach",
    hair: { style: "swoop", color: "hairCocoa" },
    glasses: { style: "none", color: "lineBerry" },
    shirt: { style: "roundedTee", color: "shirtSun" },
    accessory: { style: "tinyCrown", color: "accessoryLilac" },
  },
  goldenSample: {
    base: "child",
    headVariant: "round",
    skinTone: "skinPeach",
    hair: { style: "layeredMessy", color: "hairChestnut" },
    glasses: { style: "none", color: "lineBlue" },
    shirt: { style: "hoodie", color: "shirtMint" },
    accessory: {
      style: "chestStar",
      color: "accessoryCoral",
      mount: "chestCenter",
    },
  },
  showcaseSampleA: {
    base: "child",
    headVariant: "round",
    skinTone: "skinPeach",
    hair: { style: "shortMessy", color: "hairCocoa" },
    glasses: { style: "none", color: "lineBlue" },
    shirt: { style: "hoodie", color: "shirtSky" },
    accessory: { style: "star", color: "accessoryCoral", mount: "hairRight" },
  },
  showcaseSampleB: {
    base: "child",
    headVariant: "oval",
    skinTone: "skinHoney",
    hair: { style: "longSoft", color: "hairChestnut" },
    glasses: { style: "none", color: "lineBlue" },
    shirt: { style: "sweater", color: "shirtRose" },
    accessory: { style: "flower", color: "accessoryLilac", mount: "hairLeft" },
  },
  showcaseSampleC: {
    base: "child",
    headVariant: "wide",
    skinTone: "skinBrown",
    hair: { style: "curlyPlayful", color: "hairPlum" },
    glasses: { style: "none", color: "lineBlue" },
    shirt: { style: "tShirt", color: "shirtMint" },
    accessory: { style: "headband", color: "accessoryCoral", mount: "headTop" },
  },
  showcaseSampleD: {
    base: "child",
    headVariant: "wide",
    skinTone: "skinHoney",
    hair: { style: "shortMessy", color: "hairChestnut" },
    glasses: { style: "softSquare", color: "lineBerry" },
    shirt: { style: "overall", color: "shirtSun" },
    accessory: { style: "bow", color: "accessoryCoral", mount: "hairRight" },
  },
  showcaseSampleE: {
    base: "adult",
    headVariant: "oval",
    skinTone: "skinBrown",
    hair: { style: "layeredMessy", color: "hairChestnut" },
    glasses: { style: "round", color: "lineBlue" },
    shirt: { style: "collar", color: "shirtSky" },
    accessory: {
      style: "chestStar",
      color: "accessoryLilac",
      mount: "chestCenter",
    },
  },
  showcaseSampleF: {
    base: "child",
    headVariant: "round",
    skinTone: "skinHoney",
    hair: { style: "curlyPlayful", color: "hairPlum" },
    glasses: { style: "none", color: "lineBerry" },
    shirt: { style: "roundedTee", color: "shirtMint" },
    accessory: {
      style: "leafPin",
      color: "accessoryCoral",
      mount: "hairRight",
    },
  },
} satisfies Record<string, AvatarConfig>;
