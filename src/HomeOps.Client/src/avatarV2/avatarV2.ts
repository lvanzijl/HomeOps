export type AvatarBase = "child" | "adult";
export type AvatarHeadVariant = "round" | "oval";
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
  | "layeredMessy";
export type GlassesStyle = "none" | "round" | "softSquare";
export type ShirtStyle = "roundedTee" | "collar" | "hoodie";
export type AccessoryStyle =
  | "none"
  | "starClip"
  | "leafPin"
  | "tinyCrown"
  | "chestStar";
export type AvatarMountPoint = "chestCenter";
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
  const b =
    variant === "round"
      ? { x: 47, y: 35, width: 98, height: 88, rx: 45, ry: 43 }
      : { x: 50, y: 31, width: 92, height: 96, rx: 42, ry: 48 };
  const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  const chest = { x: 96, y: 151, scale: 1 };
  return {
    viewBox: { width: 192, height: 192 },
    head: {
      variant,
      bounds: b,
      center,
      hairline: { x: center.x, y: b.y + 18 },
    },
    face: {
      eyeLineY: b.y + 48,
      leftEye: { x: center.x - 20, y: b.y + 48 },
      rightEye: { x: center.x + 20, y: b.y + 48 },
      mouth: { x: center.x, y: b.y + 70 },
    },
    ears: {
      left: { x: b.x + 6, y: b.y + 62 },
      right: { x: b.x + b.width - 6, y: b.y + 62 },
      width: 17,
      height: 25,
    },
    body: {
      neck: { x: 81, y: 118, width: 30, height: 26, rx: 12 },
      shoulders: { x: 96, y: 139 },
      chest,
    },
    mounts: { chestCenter: chest },
  };
}
function renderHeadAndFace({ config, anatomy }: AvatarRenderContext): string {
  const skin = sw(config.skinTone),
    h = anatomy.head.bounds,
    e = anatomy.ears;
  const ear = (side: string, a: AvatarAnchor) =>
    `<ellipse data-anatomy="ear-${side}" cx="${a.x}" cy="${a.y}" rx="${e.width / 2}" ry="${e.height / 2}" fill="${skin.base}" stroke="${skin.line}" stroke-width="3"/>`;
  return `<g id="avatar-v2-layer-base"><ellipse cx="96" cy="113" rx="55" ry="41" fill="${skin.shade}" opacity="0.16"/>${ear("left", e.left)}${ear("right", e.right)}<rect x="${h.x}" y="${h.y}" width="${h.width}" height="${h.height}" rx="${h.rx}" ry="${h.ry}" fill="${skin.base}" stroke="${skin.line}" stroke-width="3"/><path d="M${h.x + 19} ${h.y + 22}c17-17 45-21 64-2" fill="none" stroke="${skin.highlight}" stroke-width="8" stroke-linecap="round" opacity="0.4"/><circle cx="${anatomy.face.leftEye.x}" cy="${anatomy.face.eyeLineY}" r="5" fill="#3d2c30"/><circle cx="${anatomy.face.rightEye.x}" cy="${anatomy.face.eyeLineY - 1}" r="5" fill="#3d2c30"/><circle cx="${anatomy.face.leftEye.x + 2}" cy="${anatomy.face.eyeLineY - 2}" r="1.5" fill="#fff8f2"/><circle cx="${anatomy.face.rightEye.x + 2}" cy="${anatomy.face.eyeLineY - 3}" r="1.5" fill="#fff8f2"/><path d="M${anatomy.face.mouth.x - 18} ${anatomy.face.mouth.y}c10 12 27 12 37-1" fill="none" stroke="#7a4545" stroke-width="4" stroke-linecap="round"/></g>`;
}
function hairParts(ctx: AvatarRenderContext) {
  const c = sw(ctx.config.hair.color),
    common = `fill="${c.base}" stroke="${c.line}" stroke-width="3"`,
    s = ctx.config.hair.style;
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
    y = anatomy.face.eyeLineY - 12;
  return `<g id="avatar-v2-layer-glasses" fill="none" stroke="${c.line}" stroke-width="4" stroke-linecap="round"><rect x="${anatomy.face.leftEye.x - 15}" y="${y}" width="29" height="24" ${r}/><rect x="${anatomy.face.rightEye.x - 15}" y="${y - 1}" width="31" height="24" ${r}/><path d="M${anatomy.face.leftEye.x + 14} ${anatomy.face.eyeLineY - 1}h11"/><path d="M${anatomy.face.leftEye.x - 15} ${anatomy.face.eyeLineY - 2}l-10-4M${anatomy.face.rightEye.x + 16} ${anatomy.face.eyeLineY - 3}l10-5"/></g>`;
}
function renderShirt({ config }: AvatarRenderContext): string {
  const c = sw(config.shirt.color);
  if (config.shirt.style === "hoodie")
    return `<g id="avatar-v2-layer-shirt"><path d="M41 173c7-33 27-51 55-51s48 18 55 51z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M63 139c10-17 23-24 33-24s23 7 33 24c-12 11-54 11-66 0z" fill="${c.shade}" stroke="${c.line}" stroke-width="3"/><path d="M78 130c8 9 27 11 36 0" fill="none" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.65"/><path d="M88 137l-4 21M104 137l4 21" stroke="${c.line}" stroke-width="3" stroke-linecap="round"/><circle cx="84" cy="160" r="2.5" fill="${c.line}"/><circle cx="108" cy="160" r="2.5" fill="${c.line}"/><path d="M55 164c16-7 66-7 82 0" fill="none" stroke="${c.highlight}" stroke-width="5" stroke-linecap="round" opacity="0.5"/></g>`;
  const collar =
    config.shirt.style === "collar"
      ? `<path d="M78 137l18 18 18-18" fill="#fff6ed" stroke="${c.line}" stroke-width="3"/>`
      : "";
  return `<g id="avatar-v2-layer-shirt"><path d="M42 172c8-32 27-49 54-49s46 17 54 49z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M62 150c17-13 48-14 68 0" fill="none" stroke="${c.highlight}" stroke-width="7" stroke-linecap="round" opacity="0.5"/>${collar}</g>`;
}
function renderAccessory({ config, anatomy }: AvatarRenderContext): string {
  if (config.accessory.style === "none") return "";
  const c = sw(config.accessory.color);
  if (config.accessory.style === "chestStar") {
    const m = anatomy.mounts[config.accessory.mount ?? "chestCenter"];
    return `<g id="avatar-v2-layer-accessory" transform="translate(${m.x} ${m.y}) scale(${m.scale ?? 1})"><path d="M0-13l4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M-3-5l3-4 3 4" fill="none" stroke="${c.highlight}" stroke-width="3" stroke-linecap="round" opacity="0.7"/></g>`;
  }
  const shapes = {
    starClip: `<path d="M128 42l5 10 11 1-8 8 2 11-10-5-10 5 2-11-8-8 11-1z"`,
    leafPin: `<path d="M131 44c16 2 23 14 15 28-16-2-22-16-15-28z"`,
    tinyCrown: `<path d="M66 38l10 12 15-15 14 15 12-12 2 25H64z"`,
  }[config.accessory.style];
  return `<g id="avatar-v2-layer-accessory">${shapes} fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M130 48c4 3 7 6 9 11" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.65"/></g>`;
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
} satisfies Record<string, AvatarConfig>;
