import { describe, expect, it } from 'vitest';
import { avatarV2DefaultConfiguration, normalizeAvatarV2Configuration, toAvatarV2RenderConfig } from './avatarConfig';
import { renderAvatarV2Svg, validateAvatarV2AssetSvg } from './avatarV2';

describe('Avatar V2 configuration', () => {
  it('normalizes user-facing avatar choices without renderer internals', () => {
    const configuration = { ...avatarV2DefaultConfiguration, hairStyle: 'longSoft' as const, clothingColor: 'shirtRose' as const, accessory: 'flower' as const };

    expect(normalizeAvatarV2Configuration({ ...configuration, svg: '<svg />', anatomy: {} })).toEqual(configuration);
  });

  it('falls back to defaults for invalid API data', () => {
    expect(normalizeAvatarV2Configuration({ hairStyle: 'unknown' })).toEqual(avatarV2DefaultConfiguration);
  });

  it('renders deterministic SVG-only output from persisted configuration', () => {
    const renderConfig = toAvatarV2RenderConfig({ ...avatarV2DefaultConfiguration, accessory: 'headband' });
    const first = renderAvatarV2Svg(renderConfig);
    const second = renderAvatarV2Svg(renderConfig);

    expect(first).toBe(second);
    expect(validateAvatarV2AssetSvg(first)).toBe(true);
    expect(first).not.toContain('<image');
  });
});
