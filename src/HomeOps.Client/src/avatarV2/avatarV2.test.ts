import { describe, expect, it } from "vitest";
import {
  avatarV2SampleConfigs,
  expandAvatarPaletteToken,
  renderAvatarV2Svg,
  resolveAvatarAnatomy,
} from "./avatarV2";

describe("Avatar V2 SVG renderer", () => {
  it("renders an SVG root", () => {
    expect(
      renderAvatarV2Svg(avatarV2SampleConfigs.playfulChild).startsWith("<svg"),
    ).toBe(true);
  });

  it("renders selected layers in deterministic order", () => {
    const svg = renderAvatarV2Svg(avatarV2SampleConfigs.adult);
    const order = [
      "avatar-v2-layer-shirt",
      "avatar-v2-layer-base",
      "avatar-v2-layer-front-hair",
      "avatar-v2-layer-glasses",
      "avatar-v2-layer-hair-highlights",
      "avatar-v2-layer-accessory",
    ].map((layer) => svg.indexOf(layer));
    expect(order.every((index) => index > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(svg).toBe(renderAvatarV2Svg(avatarV2SampleConfigs.adult));
  });

  it("omits optional glasses and accessory layers without breaking rendering", () => {
    const svg = renderAvatarV2Svg(avatarV2SampleConfigs.calmChildWithGlasses);
    const withoutOptional = renderAvatarV2Svg({
      ...avatarV2SampleConfigs.calmChildWithGlasses,
      glasses: {
        ...avatarV2SampleConfigs.calmChildWithGlasses.glasses,
        style: "none",
      },
      accessory: {
        ...avatarV2SampleConfigs.calmChildWithGlasses.accessory,
        style: "none",
      },
    });
    expect(svg).toContain("avatar-v2-layer-glasses");
    expect(withoutOptional).toContain("avatar-v2-layer-base");
    expect(withoutOptional).not.toContain("avatar-v2-layer-glasses");
    expect(withoutOptional).not.toContain("avatar-v2-layer-accessory");
  });

  it("expands palette tokens to internal SVG colors", () => {
    expect(expandAvatarPaletteToken("shirtMint")).toEqual({
      base: "#9edfc0",
      shade: "#70be98",
      highlight: "#c1edd7",
      line: "#4d846d",
    });
  });

  it("keeps ear placement driven by anatomy anchors", () => {
    const round = resolveAvatarAnatomy({
      ...avatarV2SampleConfigs.playfulChild,
      headVariant: "round",
    });
    const oval = resolveAvatarAnatomy({
      ...avatarV2SampleConfigs.playfulChild,
      headVariant: "oval",
    });
    expect(round.ears.left.x).not.toBe(oval.ears.left.x);
    expect(
      renderAvatarV2Svg({
        ...avatarV2SampleConfigs.playfulChild,
        headVariant: "round",
      }),
    ).toContain(`data-anatomy=\"ear-left\" cx=\"${round.ears.left.x}\"`);
  });


  it("keeps ears physically attached to round, oval, and wide head silhouettes", () => {
    const expectedMinimumOverlap = 8;
    const variants = ["round", "oval", "wide"] as const;

    for (const headVariant of variants) {
      const anatomy = resolveAvatarAnatomy({
        ...avatarV2SampleConfigs.playfulChild,
        headVariant,
      });
      const { head, ears } = anatomy;
      const leftEarInsideHead =
        ears.left.x + ears.width / 2 - head.bounds.x;
      const rightEarInsideHead =
        head.bounds.x + head.bounds.width - (ears.right.x - ears.width / 2);

      expect(leftEarInsideHead).toBeGreaterThanOrEqual(expectedMinimumOverlap);
      expect(rightEarInsideHead).toBeGreaterThanOrEqual(expectedMinimumOverlap);
      expect(ears.left.y).toBeGreaterThan(head.bounds.y);
      expect(ears.left.y).toBeLessThan(head.bounds.y + head.bounds.height);
      expect(ears.right.y).toBe(ears.left.y);
    }
  });

  it("renders the golden sample with layered hair, hoodie, and mounted chest accessory", () => {
    const svg = renderAvatarV2Svg(avatarV2SampleConfigs.goldenSample);
    const order = [
      "avatar-v2-layer-back-hair",
      "avatar-v2-layer-shirt",
      "avatar-v2-layer-base",
      "avatar-v2-layer-front-hair",
      "avatar-v2-layer-hair-highlights",
      "avatar-v2-layer-accessory",
    ].map((layer) => svg.indexOf(layer));
    expect(order.every((index) => index > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(svg).toContain('transform=\"translate(96 151) scale(1)\"');
    expect(svg).not.toContain("<image");
    expect(svg).not.toMatch(/(?:href|src)=\"https?:\/\//);
  });

  it("renders visibly distinct head variants with anatomy-driven anchors", () => {
    const variants = ["round", "oval", "wide"] as const;
    const anatomies = variants.map((headVariant) =>
      resolveAvatarAnatomy({
        ...avatarV2SampleConfigs.playfulChild,
        headVariant,
      }),
    );
    expect(new Set(anatomies.map((a) => a.head.bounds.width)).size).toBe(3);
    expect(new Set(anatomies.map((a) => a.head.bounds.height)).size).toBe(3);
    expect(new Set(anatomies.map((a) => a.face.eyeLineY)).size).toBe(3);
    expect(new Set(anatomies.map((a) => a.ears.left.x)).size).toBe(3);
    for (const variant of variants) {
      expect(
        renderAvatarV2Svg({
          ...avatarV2SampleConfigs.playfulChild,
          headVariant: variant,
        }),
      ).toContain(`data-anatomy="head-${variant}"`);
    }
  });

  it("renders the three quality hairstyles with back hair, front hair, and deterministic output", () => {
    const styles = ["shortMessy", "longSoft", "curlyPlayful"] as const;
    for (const style of styles) {
      const config = {
        ...avatarV2SampleConfigs.showcaseSampleA,
        hair: { ...avatarV2SampleConfigs.showcaseSampleA.hair, style },
      };
      const svg = renderAvatarV2Svg(config);
      expect(svg).toContain("avatar-v2-layer-back-hair");
      expect(svg).toContain("avatar-v2-layer-front-hair");
      expect(svg).toContain(`data-hair-style="${style}"`);
      expect(svg).toBe(renderAvatarV2Svg(config));
      expect(svg).not.toContain("<image");
      expect(svg).not.toMatch(/(?:href|src)=\"https?:\/\//);
    }
  });

  it("defines exactly four showcase samples for silhouette validation", () => {
    const showcaseKeys = Object.keys(avatarV2SampleConfigs).filter((key) =>
      key.startsWith("showcaseSample"),
    );
    expect(showcaseKeys).toEqual([
      "showcaseSampleA",
      "showcaseSampleB",
      "showcaseSampleC",
      "showcaseSampleD",
    ]);
    for (const key of showcaseKeys) {
      const svg = renderAvatarV2Svg(
        avatarV2SampleConfigs[key as keyof typeof avatarV2SampleConfigs],
      );
      expect(svg).toContain("avatar-v2-layer-shirt");
      expect(svg).toContain("avatar-v2-layer-back-hair");
      expect(svg).toContain("avatar-v2-layer-front-hair");
    }
  });

  it("renders all sample configs without exception", () => {
    for (const config of Object.values(avatarV2SampleConfigs)) {
      expect(() => renderAvatarV2Svg(config)).not.toThrow();
      expect(renderAvatarV2Svg(config)).toContain('viewBox="0 0 192 192"');
    }
  });
});
