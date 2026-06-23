import { describe, expect, it } from 'vitest';
import { avatarV2DefaultConfiguration, loadAvatarV2Configuration, saveAvatarV2Configuration, toAvatarV2RenderConfig } from './avatarConfig';
import { renderAvatarV2Svg, validateAvatarV2AssetSvg } from './avatarV2';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('Avatar V2 configuration persistence', () => {
  it('persists user-facing avatar choices without renderer internals', () => {
    const storage = new MemoryStorage();
    const configuration = { ...avatarV2DefaultConfiguration, hairStyle: 'longSoft' as const, clothingColor: 'shirtRose' as const, accessory: 'flower' as const };

    saveAvatarV2Configuration(configuration, storage);

    expect(loadAvatarV2Configuration(storage)).toEqual(configuration);
    expect(storage.getItem('homeops.avatarV2.editorMvpConfiguration')).not.toContain('svg');
    expect(storage.getItem('homeops.avatarV2.editorMvpConfiguration')).not.toContain('anatomy');
  });

  it('falls back to defaults for invalid saved data', () => {
    const storage = new MemoryStorage();
    storage.setItem('homeops.avatarV2.editorMvpConfiguration', JSON.stringify({ hairStyle: 'unknown' }));

    expect(loadAvatarV2Configuration(storage)).toEqual(avatarV2DefaultConfiguration);
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
