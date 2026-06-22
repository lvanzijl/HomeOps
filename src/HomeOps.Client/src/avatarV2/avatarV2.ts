export type AvatarBase = "child" | "adult";
export type AvatarHeadVariant = "round" | "oval" | "wide";
export type PaletteToken =
  | "skinPeach"
  | "skinHoney"
  | "skinBrown"
  | "hairCocoa"
  | "hairChestnut"
  | "hairPlum"
  | "shirtSky"
  | "shirtMint"
  | "shirtRose"
  | "shirtSun"
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
export type GlassesStyle = "none" | "round" | "softSquare";
export type ShirtStyle =
  | "roundedTee"
  | "collar"
  | "hoodie"
  | "sweater"
  | "tShirt"
  | "overall";
export type AccessoryStyle =
  | "none"
  | "starClip"
  | "leafPin"
  | "tinyCrown"
  | "chestStar"
  | "star"
  | "flower"
  | "headband"
  | "bow";
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
  shirt: { style: ShirtStyle; color: PaletteToken };
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
  skinPeach: {
    base: "#f4bf9b",
    shade: "#df9778",
    highlight: "#ffd8bf",
    line: "#9f5f55",
  },
  skinHoney: {
    base: "#d99f67",
    shade: "#b97845",
    highlight: "#efbd87",
    line: "#7f523f",
  },
  skinBrown: {
    base: "#9b6547",
    shade: "#73422f",
    highlight: "#bd8060",
    line: "#55332b",
  },
  hairCocoa: {
    base: "#68402f",
    shade: "#43271f",
    highlight: "#8a5d47",
    line: "#35211d",
  },
  hairChestnut: {
    base: "#a75f34",
    shade: "#7d3f24",
    highlight: "#c98250",
    line: "#5f321f",
  },
  hairPlum: {
    base: "#6f4a66",
    shade: "#4e344d",
    highlight: "#92708a",
    line: "#3f2a3d",
  },
  shirtSky: {
    base: "#8fc8ef",
    shade: "#67a8d8",
    highlight: "#b6ddf6",
    line: "#417895",
  },
  shirtMint: {
    base: "#9edfc0",
    shade: "#70be98",
    highlight: "#c1edd7",
    line: "#4d846d",
  },
  shirtRose: {
    base: "#efa0b8",
    shade: "#d67595",
    highlight: "#fac3d2",
    line: "#9b526b",
  },
  shirtSun: {
    base: "#f2cd70",
    shade: "#d6a83f",
    highlight: "#f8df9b",
    line: "#98733b",
  },
  lineBerry: {
    base: "#7f5369",
    shade: "#5d394c",
    highlight: "#a6798d",
    line: "#4b2f3f",
  },
  lineBlue: {
    base: "#587c9b",
    shade: "#3f5c73",
    highlight: "#83a8c6",
    line: "#30495c",
  },
  accessoryLilac: {
    base: "#c5a7ef",
    shade: "#9b7bd2",
    highlight: "#decdf7",
    line: "#725a9f",
  },
  accessoryCoral: {
    base: "#f29a82",
    shade: "#d6735f",
    highlight: "#ffc2b2",
    line: "#9c554c",
  },
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
      hairline: { x: center.x, y: b.y + (variant === "oval" ? 20 : 17) },
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
  render: SvgPart;
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
  return `<g id="avatar-v2-layer-base"><ellipse cx="96" cy="113" rx="55" ry="41" fill="${skin.shade}" opacity="0.16"/>${ear("left", e.left)}${ear("right", e.right)}<path data-anatomy="head-${anatomy.head.variant}" d="${headPath(h, anatomy.head.variant)}" fill="${skin.base}" stroke="${skin.line}" stroke-width="3"/><path d="M${h.x + 19} ${h.y + 22}c17-17 45-21 64-2" fill="none" stroke="${skin.highlight}" stroke-width="8" stroke-linecap="round" opacity="0.4"/><circle cx="${anatomy.face.leftEye.x}" cy="${anatomy.face.eyeLineY}" r="5" fill="#3d2c30"/><circle cx="${anatomy.face.rightEye.x}" cy="${anatomy.face.eyeLineY}" r="5" fill="#3d2c30"/><circle cx="${anatomy.face.leftEye.x + 2}" cy="${anatomy.face.eyeLineY - 2}" r="1.5" fill="#fff8f2"/><circle cx="${anatomy.face.rightEye.x - 2}" cy="${anatomy.face.eyeLineY - 2}" r="1.5" fill="#fff8f2"/><path d="M${anatomy.face.mouth.x - 18} ${anatomy.face.mouth.y}c10 12 27 12 37-1" fill="none" stroke="#7a4545" stroke-width="4" stroke-linecap="round"/></g>`;
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
      back: `<path data-hair-style="curlyPlayful" d="M45 72c-2-26 20-47 51-48 32 0 54 20 52 48-3 20-20 34-45 36-4 0-10 0-14 0-26-2-42-16-44-36z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/><path d="M48 75c5-10 13-14 23-11M122 63c10-3 18 1 24 10" fill="none" stroke="${c.line}" stroke-width="5" stroke-linecap="round" opacity="0.45"/>`,
      front: `<path data-hair-style="curlyPlayful" d="M49 65c6-10 15-16 27-17 4-12 15-18 28-15 12 2 21 9 25 21 9 2 15 7 19 14-10 9-24 11-41 7l-11 13-10-13c-16 4-29 1-37-10z" ${common}/><path d="M57 59c7-9 17-12 29-9M82 43c9-8 22-8 32 0M110 47c12-2 22 4 29 15M70 70c9 5 18 5 27-2" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" opacity="0.45"/>`,
      hi: `<path data-hair-highlight="curlyPlayful" d="M70 48c7-6 17-7 27-3" fill="none" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.58"/><path data-hair-highlight="curlyPlayful" d="M110 47c8 1 15 6 19 13" fill="none" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.52"/><path data-hair-highlight="curlyPlayful" d="M61 63c6-4 13-5 20-2" fill="none" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>`,
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
function renderGlasses({ config, anatomy }: AvatarRenderContext): string {
  if (config.glasses.style === "none") return "";
  const c = sw(config.glasses.color),
    r = config.glasses.style === "round" ? 'rx="13"' : 'rx="8"',
    lensWidth = config.glasses.style === "round" ? 29 : 30,
    lensHeight = 24,
    leftLensX = anatomy.face.leftEye.x - lensWidth / 2,
    rightLensX = anatomy.face.rightEye.x - lensWidth / 2,
    leftInnerX = leftLensX + lensWidth,
    rightInnerX = rightLensX,
    y = anatomy.face.eyeLineY - lensHeight / 2;
  return `<g id="avatar-v2-layer-glasses" fill="none" stroke="${c.line}" stroke-width="4" stroke-linecap="round"><rect x="${leftLensX}" y="${y}" width="${lensWidth}" height="${lensHeight}" ${r}/><rect x="${rightLensX}" y="${y}" width="${lensWidth}" height="${lensHeight}" ${r}/><path d="M${leftInnerX} ${anatomy.face.eyeLineY}H${rightInnerX}"/><path d="M${leftLensX} ${anatomy.face.eyeLineY - 2}L${anatomy.ears.left.x + anatomy.ears.width / 2} ${anatomy.ears.left.y - 8}M${rightLensX + lensWidth} ${anatomy.face.eyeLineY - 2}L${anatomy.ears.right.x - anatomy.ears.width / 2} ${anatomy.ears.right.y - 8}"/></g>`;
}
export const avatarV2ClothingAssets: Record<ShirtStyle, ClothingAsset> = {
  roundedTee: {
    id: "roundedTee",
    metadata: {
      displayName: "Rounded Tee",
      category: "clothing",
      previewPriority: 20,
    },
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
    render: (_ctx, c) =>
      `${avatarV2ClothingAssets.roundedTee.render(_ctx, c)}<path d="M78 137l18 18 18-18" fill="#fff6ed" stroke="${c.line}" stroke-width="3"/>`,
  },
  tShirt: {
    id: "tShirt",
    metadata: {
      displayName: "T-Shirt",
      category: "clothing",
      previewPriority: 10,
    },
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
    render: (_ctx, c) =>
      `<path data-clothing-asset="overall" d="M42 173c8-32 27-49 54-49s46 17 54 49z" fill="${c.highlight}" stroke="${c.line}" stroke-width="3"/><path d="M68 173v-43h18l10 14 10-14h18v43z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M76 130v-12M116 130v-12" stroke="${c.line}" stroke-width="5" stroke-linecap="round"/><circle cx="82" cy="142" r="3" fill="${c.line}"/><circle cx="110" cy="142" r="3" fill="${c.line}"/>`,
  },
};
function renderShirt(ctx: AvatarRenderContext): string {
  const c = sw(ctx.config.shirt.color);
  return `<g id="avatar-v2-layer-shirt">${avatarV2ClothingAssets[ctx.config.shirt.style].render(ctx, c)}</g>`;
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
        `<path d="M0-13l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M-3-5l3-4 3 4" fill="none" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`,
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
    render: (ctx, c) =>
      `<g id="avatar-v2-layer-accessory" data-accessory-asset="headband"><path d="M${ctx.anatomy.head.bounds.x + 11} ${ctx.anatomy.head.bounds.y + 28}c22-22 62-22 84 0" fill="none" stroke="${c.line}" stroke-width="8" stroke-linecap="round"/><path d="M${ctx.anatomy.head.bounds.x + 14} ${ctx.anatomy.head.bounds.y + 29}c21-16 57-16 78 0" fill="none" stroke="${c.base}" stroke-width="4" stroke-linecap="round"/></g>`,
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
        `<path data-accessory-asset="leafPin" d="M-2-13c16 2 23 14 15 28-16-2-22-16-15-28z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M-1-8c5 5 9 11 11 18" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round"/>`,
      ),
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
  return avatarV2AccessoryAssets[ctx.config.accessory.style].render(ctx, c);
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192" role="img" aria-label="HomeOps Avatar V2 sample">${renderHairLayer(ctx, "back")}${renderShirt(ctx)}${renderHeadAndFace(ctx)}${renderHairLayer(ctx, "front")}${renderGlasses(ctx)}${renderHairLayer(ctx, "hi")}${renderAccessory(ctx)}</svg>`;
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
