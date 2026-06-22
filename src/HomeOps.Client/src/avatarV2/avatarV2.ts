export type AvatarBase = 'child' | 'adult';
export type PaletteToken = 'skinPeach' | 'skinHoney' | 'skinBrown' | 'hairCocoa' | 'hairChestnut' | 'hairPlum' | 'shirtSky' | 'shirtMint' | 'shirtRose' | 'shirtSun' | 'lineBerry' | 'lineBlue' | 'accessoryLilac' | 'accessoryCoral';
export type HairStyle = 'softCrop' | 'curlyCloud' | 'sideBob' | 'swoop';
export type GlassesStyle = 'none' | 'round' | 'softSquare';
export type ShirtStyle = 'roundedTee' | 'collar';
export type AccessoryStyle = 'none' | 'starClip' | 'leafPin' | 'tinyCrown';

export interface AvatarConfig {
  base: AvatarBase;
  skinTone: PaletteToken;
  hair: { style: HairStyle; color: PaletteToken };
  glasses: { style: GlassesStyle; color: PaletteToken };
  shirt: { style: ShirtStyle; color: PaletteToken };
  accessory: { style: AccessoryStyle; color: PaletteToken };
}

export interface ExpandedSwatch { base: string; shade: string; highlight: string; line: string }

const palette: Record<PaletteToken, ExpandedSwatch> = {
  skinPeach: { base: '#f4bf9b', shade: '#df9778', highlight: '#ffd8bf', line: '#9f5f55' },
  skinHoney: { base: '#d99f67', shade: '#b97845', highlight: '#efbd87', line: '#7f523f' },
  skinBrown: { base: '#9b6547', shade: '#73422f', highlight: '#bd8060', line: '#55332b' },
  hairCocoa: { base: '#68402f', shade: '#43271f', highlight: '#8a5d47', line: '#35211d' },
  hairChestnut: { base: '#a75f34', shade: '#7d3f24', highlight: '#c98250', line: '#5f321f' },
  hairPlum: { base: '#6f4a66', shade: '#4e344d', highlight: '#92708a', line: '#3f2a3d' },
  shirtSky: { base: '#8fc8ef', shade: '#67a8d8', highlight: '#b6ddf6', line: '#417895' },
  shirtMint: { base: '#9edfc0', shade: '#70be98', highlight: '#c1edd7', line: '#4d846d' },
  shirtRose: { base: '#efa0b8', shade: '#d67595', highlight: '#fac3d2', line: '#9b526b' },
  shirtSun: { base: '#f2cd70', shade: '#d6a83f', highlight: '#f8df9b', line: '#98733b' },
  lineBerry: { base: '#7f5369', shade: '#5d394c', highlight: '#a6798d', line: '#4b2f3f' },
  lineBlue: { base: '#587c9b', shade: '#3f5c73', highlight: '#83a8c6', line: '#30495c' },
  accessoryLilac: { base: '#c5a7ef', shade: '#9b7bd2', highlight: '#decdf7', line: '#725a9f' },
  accessoryCoral: { base: '#f29a82', shade: '#d6735f', highlight: '#ffc2b2', line: '#9c554c' },
};

export function expandAvatarPaletteToken(token: PaletteToken): ExpandedSwatch { return palette[token]; }
const sw = (token: PaletteToken) => expandAvatarPaletteToken(token);

function renderBase(config: AvatarConfig): string {
  const skin = sw(config.skinTone); const isChild = config.base === 'child';
  const headY = isChild ? 36 : 32; const headH = isChild ? 84 : 92;
  return `<g id="avatar-v2-layer-base"><ellipse cx="96" cy="112" rx="54" ry="40" fill="${skin.shade}" opacity="0.18"/><rect x="48" y="${headY}" width="96" height="${headH}" rx="44" fill="${skin.base}" stroke="${skin.line}" stroke-width="3"/><path d="M66 ${headY + 22}c17-18 46-22 65-2" fill="none" stroke="${skin.highlight}" stroke-width="8" stroke-linecap="round" opacity="0.45"/><circle cx="77" cy="82" r="5" fill="#3d2c30"/><circle cx="116" cy="80" r="5" fill="#3d2c30"/><circle cx="79" cy="80" r="1.5" fill="#fff8f2"/><circle cx="118" cy="78" r="1.5" fill="#fff8f2"/><path d="M78 104c10 12 28 12 38-1" fill="none" stroke="#7a4545" stroke-width="4" stroke-linecap="round"/><path d="M58 92c-6-1-10 4-9 10 1 7 7 10 13 7" fill="${skin.base}" stroke="${skin.line}" stroke-width="3"/><path d="M134 91c7-1 11 4 10 11-1 7-7 10-13 7" fill="${skin.base}" stroke="${skin.line}" stroke-width="3"/></g>`;
}
function renderHair(config: AvatarConfig): string { const c = sw(config.hair.color); const common = `fill="${c.base}" stroke="${c.line}" stroke-width="3"`; const hi = `<path d="M69 42c16-9 38-10 54 0" fill="none" stroke="${c.highlight}" stroke-width="6" stroke-linecap="round" opacity="0.45"/>`; const s = config.hair.style; return `<g id="avatar-v2-layer-hair">${s==='curlyCloud'?`<path d="M50 62c0-24 22-39 48-38 27 0 49 16 48 40-10-8-22-11-33-7-16 6-31 4-45-4-8 3-13 6-18 9z" ${common}/><circle cx="63" cy="55" r="14" ${common}/><circle cx="91" cy="43" r="16" ${common}/><circle cx="121" cy="53" r="15" ${common}/>`:s==='sideBob'?`<path d="M49 68c3-29 22-43 50-42 27 2 44 18 47 48-16-10-31-12-47-10-20 3-35 1-50 4z" ${common}/><path d="M135 63c8 20 3 43-14 54" ${common}/>`:s==='swoop'?`<path d="M51 66c6-26 25-39 52-39 22 0 38 12 43 33-31-12-53-3-78 14-6 4-12 2-17-8z" ${common}/>`:`<path d="M50 65c5-25 24-38 48-38s42 12 48 36c-15-5-32-4-48 1-17 5-32 4-48 1z" ${common}/>`}${hi}</g>`; }
function renderGlasses(config: AvatarConfig): string { if (config.glasses.style === 'none') return ''; const c=sw(config.glasses.color); const r=config.glasses.style==='round'?'rx="13"':'rx="8"'; return `<g id="avatar-v2-layer-glasses" fill="none" stroke="${c.line}" stroke-width="4" stroke-linecap="round"><rect x="62" y="70" width="29" height="24" ${r}/><rect x="102" y="69" width="31" height="24" ${r}/><path d="M91 81h11"/><path d="M62 79l-10-4M133 78l10-5"/></g>`; }
function renderShirt(config: AvatarConfig): string { const c=sw(config.shirt.color); const collar=config.shirt.style==='collar'?`<path d="M78 137l18 18 18-18" fill="#fff6ed" stroke="${c.line}" stroke-width="3"/>`:''; return `<g id="avatar-v2-layer-shirt"><path d="M42 172c8-32 27-49 54-49s46 17 54 49z" fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M62 150c17-13 48-14 68 0" fill="none" stroke="${c.highlight}" stroke-width="7" stroke-linecap="round" opacity="0.5"/>${collar}</g>`; }
function renderAccessory(config: AvatarConfig): string { if (config.accessory.style==='none') return ''; const c=sw(config.accessory.color); const shapes={starClip:`<path d="M128 42l5 10 11 1-8 8 2 11-10-5-10 5 2-11-8-8 11-1z"`,leafPin:`<path d="M131 44c16 2 23 14 15 28-16-2-22-16-15-28z"`,tinyCrown:`<path d="M66 38l10 12 15-15 14 15 12-12 2 25H64z"`}[config.accessory.style]; return `<g id="avatar-v2-layer-accessory">${shapes} fill="${c.base}" stroke="${c.line}" stroke-width="3"/><path d="M130 48c4 3 7 6 9 11" stroke="${c.highlight}" stroke-width="4" stroke-linecap="round" opacity="0.65"/></g>`; }

export function renderAvatarV2Svg(config: AvatarConfig): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192" role="img" aria-label="HomeOps Avatar V2 sample">${renderShirt(config)}${renderBase(config)}${renderHair(config)}${renderGlasses(config)}${renderAccessory(config)}</svg>`;
}

export const avatarV2SampleConfigs = {
  playfulChild: { base: 'child', skinTone: 'skinPeach', hair: { style: 'curlyCloud', color: 'hairChestnut' }, glasses: { style: 'none', color: 'lineBlue' }, shirt: { style: 'roundedTee', color: 'shirtMint' }, accessory: { style: 'starClip', color: 'accessoryCoral' } },
  calmChildWithGlasses: { base: 'child', skinTone: 'skinHoney', hair: { style: 'softCrop', color: 'hairCocoa' }, glasses: { style: 'round', color: 'lineBlue' }, shirt: { style: 'collar', color: 'shirtSky' }, accessory: { style: 'none', color: 'accessoryLilac' } },
  adult: { base: 'adult', skinTone: 'skinBrown', hair: { style: 'sideBob', color: 'hairPlum' }, glasses: { style: 'softSquare', color: 'lineBerry' }, shirt: { style: 'roundedTee', color: 'shirtRose' }, accessory: { style: 'leafPin', color: 'accessoryLilac' } },
  expressiveChildSpecialAccessory: { base: 'child', skinTone: 'skinPeach', hair: { style: 'swoop', color: 'hairCocoa' }, glasses: { style: 'none', color: 'lineBerry' }, shirt: { style: 'roundedTee', color: 'shirtSun' }, accessory: { style: 'tinyCrown', color: 'accessoryLilac' } },
} satisfies Record<string, AvatarConfig>;
