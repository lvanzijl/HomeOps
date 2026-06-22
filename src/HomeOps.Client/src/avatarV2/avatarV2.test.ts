import { describe, expect, it } from 'vitest';
import { avatarV2SampleConfigs, expandAvatarPaletteToken, renderAvatarV2Svg } from './avatarV2';

describe('Avatar V2 SVG renderer', () => {
  it('renders an SVG root', () => {
    expect(renderAvatarV2Svg(avatarV2SampleConfigs.playfulChild).startsWith('<svg')).toBe(true);
  });

  it('renders selected layers in deterministic order', () => {
    const svg = renderAvatarV2Svg(avatarV2SampleConfigs.adult);
    const order = ['avatar-v2-layer-shirt', 'avatar-v2-layer-base', 'avatar-v2-layer-hair', 'avatar-v2-layer-glasses', 'avatar-v2-layer-accessory'].map((layer) => svg.indexOf(layer));
    expect(order.every((index) => index > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(svg).toBe(renderAvatarV2Svg(avatarV2SampleConfigs.adult));
  });

  it('omits optional glasses and accessory layers without breaking rendering', () => {
    const svg = renderAvatarV2Svg(avatarV2SampleConfigs.calmChildWithGlasses);
    const withoutOptional = renderAvatarV2Svg({
      ...avatarV2SampleConfigs.calmChildWithGlasses,
      glasses: { ...avatarV2SampleConfigs.calmChildWithGlasses.glasses, style: 'none' },
      accessory: { ...avatarV2SampleConfigs.calmChildWithGlasses.accessory, style: 'none' },
    });
    expect(svg).toContain('avatar-v2-layer-glasses');
    expect(withoutOptional).toContain('avatar-v2-layer-base');
    expect(withoutOptional).not.toContain('avatar-v2-layer-glasses');
    expect(withoutOptional).not.toContain('avatar-v2-layer-accessory');
  });

  it('expands palette tokens to internal SVG colors', () => {
    expect(expandAvatarPaletteToken('shirtMint')).toEqual({ base: '#9edfc0', shade: '#70be98', highlight: '#c1edd7', line: '#4d846d' });
  });

  it('renders all sample configs without exception', () => {
    for (const config of Object.values(avatarV2SampleConfigs)) {
      expect(() => renderAvatarV2Svg(config)).not.toThrow();
      expect(renderAvatarV2Svg(config)).toContain('viewBox="0 0 192 192"');
    }
  });
});
