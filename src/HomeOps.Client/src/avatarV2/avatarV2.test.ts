import { describe, expect, it } from "vitest";
import {
  avatarV2SampleConfigs,
  avatarV2AccessoryAssets,
  avatarV2ClothingAssets,
  expandAvatarPaletteToken,
  renderAvatarV2Svg,
  resolveAvatarAnatomy,
  validateAvatarV2AssetSvg,
  validateAvatarV2HairSvg,
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

  it("keeps ears visibly attached without embedding them in round, oval, and wide silhouettes", () => {
    const variants = ["round", "oval", "wide"] as const;

    for (const headVariant of variants) {
      const anatomy = resolveAvatarAnatomy({
        ...avatarV2SampleConfigs.playfulChild,
        headVariant,
      });
      const { head, ears } = anatomy;
      const leftVisibleOutsideHead =
        head.bounds.x - (ears.left.x - ears.width / 2);
      const rightVisibleOutsideHead =
        ears.right.x + ears.width / 2 - (head.bounds.x + head.bounds.width);
      const leftAttachedInsideHead =
        ears.left.x + ears.width / 2 - head.bounds.x;
      const rightAttachedInsideHead =
        head.bounds.x + head.bounds.width - (ears.right.x - ears.width / 2);

      expect(leftVisibleOutsideHead).toBeGreaterThanOrEqual(6);
      expect(rightVisibleOutsideHead).toBeGreaterThanOrEqual(6);
      expect(leftAttachedInsideHead).toBeGreaterThanOrEqual(6);
      expect(rightAttachedInsideHead).toBeGreaterThanOrEqual(6);
      expect(ears.left.y).toBeGreaterThan(
        head.bounds.y + head.bounds.height * 0.5,
      );
      expect(ears.left.y).toBeLessThan(
        head.bounds.y + head.bounds.height * 0.78,
      );
      expect(ears.right.y).toBe(ears.left.y);
    }
  });

  it("aligns glasses to anatomy eye anchors for round, oval, and wide heads", () => {
    const variants = ["round", "oval", "wide"] as const;

    for (const headVariant of variants) {
      const config = {
        ...avatarV2SampleConfigs.calmChildWithGlasses,
        headVariant,
        glasses: {
          ...avatarV2SampleConfigs.calmChildWithGlasses.glasses,
          style: "softSquare" as const,
        },
      };
      const anatomy = resolveAvatarAnatomy(config);
      const svg = renderAvatarV2Svg(config);
      const lensWidth = 30;
      const leftLensX = anatomy.face.leftEye.x - lensWidth / 2;
      const rightLensX = anatomy.face.rightEye.x - lensWidth / 2;

      expect(svg).toContain(`rect x="${leftLensX}"`);
      expect(svg).toContain(`rect x="${rightLensX}"`);
      expect(svg).toContain(
        `M${leftLensX + lensWidth} ${anatomy.face.eyeLineY}H${rightLensX}`,
      );
      expect(anatomy.face.leftEye.x).toBeGreaterThan(leftLensX);
      expect(anatomy.face.leftEye.x).toBeLessThan(leftLensX + lensWidth);
      expect(anatomy.face.rightEye.x).toBeGreaterThan(rightLensX);
      expect(anatomy.face.rightEye.x).toBeLessThan(rightLensX + lensWidth);
    }
  });

  it("keeps symmetric head anatomy and glasses geometry mirrored", () => {
    const variants = ["round", "oval", "wide"] as const;

    for (const headVariant of variants) {
      const config = {
        ...avatarV2SampleConfigs.calmChildWithGlasses,
        headVariant,
        glasses: {
          ...avatarV2SampleConfigs.calmChildWithGlasses.glasses,
          style: "softSquare" as const,
        },
      };
      const anatomy = resolveAvatarAnatomy(config);
      const centerX = anatomy.head.center.x;
      const svg = renderAvatarV2Svg(config);
      const lensWidth = 30;
      const lensHeight = 24;
      const lensY = anatomy.face.eyeLineY - lensHeight / 2;
      const leftLensX = anatomy.face.leftEye.x - lensWidth / 2;
      const rightLensX = anatomy.face.rightEye.x - lensWidth / 2;
      const leftTempleEndX = anatomy.ears.left.x + anatomy.ears.width / 2;
      const rightTempleEndX = anatomy.ears.right.x - anatomy.ears.width / 2;
      const templeStartY = anatomy.face.eyeLineY - 2;
      const templeEndY = anatomy.ears.left.y - 8;

      expect(anatomy.ears.left.x + anatomy.ears.right.x).toBe(centerX * 2);
      expect(anatomy.ears.left.y).toBe(anatomy.ears.right.y);
      expect(anatomy.face.leftEye.x + anatomy.face.rightEye.x).toBe(
        centerX * 2,
      );
      expect(anatomy.face.leftEye.y).toBe(anatomy.face.rightEye.y);
      expect(leftLensX + rightLensX + lensWidth).toBe(centerX * 2);
      expect(leftTempleEndX + rightTempleEndX).toBe(centerX * 2);
      expect(svg).toContain(
        `<rect x="${leftLensX}" y="${lensY}" width="${lensWidth}" height="${lensHeight}"`,
      );
      expect(svg).toContain(
        `<rect x="${rightLensX}" y="${lensY}" width="${lensWidth}" height="${lensHeight}"`,
      );
      expect(svg).toContain(
        `M${leftLensX} ${templeStartY}L${leftTempleEndX} ${templeEndY}`,
      );
      expect(svg).toContain(
        `M${rightLensX + lensWidth} ${templeStartY}L${rightTempleEndX} ${templeEndY}`,
      );
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
    expect(svg).toContain('transform="translate(96 151) rotate(0) scale(1)"');
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
      expect(validateAvatarV2HairSvg(svg, style)).toBe(true);
    }
  });

  it("validates practical hair quality constraints for prioritized dark and light hair renders", () => {
    const styles = ["shortMessy", "longSoft", "curlyPlayful"] as const;
    const colors = ["hairCocoa", "hairChestnut", "hairPlum"] as const;

    for (const style of styles) {
      for (const color of colors) {
        const config = {
          ...avatarV2SampleConfigs.showcaseSampleA,
          hair: { style, color },
          accessory: {
            ...avatarV2SampleConfigs.showcaseSampleA.accessory,
            style: "none" as const,
          },
        };
        const svg = renderAvatarV2Svg(config);

        expect(validateAvatarV2HairSvg(svg, style)).toBe(true);
        expect(svg).toContain(`data-hair-highlight="${style}"`);
        expect(svg).not.toContain("<image");
        expect(svg).not.toMatch(/(?:href|src)=\"https?:\/\//);
        expect(svg).toBe(renderAvatarV2Svg(config));
      }
    }
  });

  it("defines exactly six showcase samples for asset diversity validation", () => {
    const showcaseKeys = Object.keys(avatarV2SampleConfigs).filter((key) =>
      key.startsWith("showcaseSample"),
    );
    expect(showcaseKeys).toEqual([
      "showcaseSampleA",
      "showcaseSampleB",
      "showcaseSampleC",
      "showcaseSampleD",
      "showcaseSampleE",
      "showcaseSampleF",
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

  it("exposes editor-safe clothing and accessory metadata", () => {
    expect(Object.keys(avatarV2ClothingAssets)).toEqual([
      "roundedTee",
      "collar",
      "tShirt",
      "sweater",
      "hoodie",
      "overall",
    ]);
    expect(Object.keys(avatarV2AccessoryAssets)).toEqual([
      "chestStar",
      "star",
      "flower",
      "headband",
      "bow",
      "starClip",
      "leafPin",
      "tinyCrown",
    ]);
    for (const asset of [
      ...Object.values(avatarV2ClothingAssets),
      ...Object.values(avatarV2AccessoryAssets),
    ]) {
      expect(asset.metadata.displayName.length).toBeGreaterThan(0);
      expect(asset.metadata.previewPriority).toBeGreaterThanOrEqual(0);
      expect(["clothing", "accessory"]).toContain(asset.metadata.category);
    }
    expect(avatarV2AccessoryAssets.flower.metadata.recommendedMount).toBe(
      "hairLeft",
    );
  });

  it("renders new asset V1 clothing and accessories deterministically as valid SVG", () => {
    const clothing = ["hoodie", "sweater", "tShirt", "overall"] as const;
    const accessories = ["star", "flower", "headband", "bow"] as const;

    for (const style of clothing) {
      const config = {
        ...avatarV2SampleConfigs.showcaseSampleA,
        shirt: { ...avatarV2SampleConfigs.showcaseSampleA.shirt, style },
        accessory: {
          ...avatarV2SampleConfigs.showcaseSampleA.accessory,
          style: "none" as const,
        },
      };
      const svg = renderAvatarV2Svg(config);
      expect(svg).toContain(`data-clothing-asset=\"${style}\"`);
      expect(validateAvatarV2AssetSvg(svg)).toBe(true);
      expect(svg).toBe(renderAvatarV2Svg(config));
    }

    for (const style of accessories) {
      const config = {
        ...avatarV2SampleConfigs.showcaseSampleA,
        accessory: {
          style,
          color: "accessoryCoral" as const,
          mount: avatarV2AccessoryAssets[style].metadata.recommendedMount,
        },
      };
      const svg = renderAvatarV2Svg(config);
      expect(svg).toContain("avatar-v2-layer-accessory");
      expect(svg).toContain(`data-accessory-asset=\"${style}\"`);
      expect(validateAvatarV2AssetSvg(svg)).toBe(true);
      expect(svg).toBe(renderAvatarV2Svg(config));
    }
  });

  it("renders redesigned curly hair and rejected accessories with asset-specific guards", () => {
    const baseConfig = {
      ...avatarV2SampleConfigs.showcaseSampleF,
      hair: { style: "curlyPlayful" as const, color: "hairPlum" as const },
    };
    const curlyOnly = renderAvatarV2Svg({
      ...baseConfig,
      accessory: { style: "none" as const, color: "accessoryCoral" as const },
    });
    expect(curlyOnly).toContain('data-hair-style="curlyPlayful"');
    expect(curlyOnly.match(/data-hair-style="curlyPlayful"/g)?.length).toBeGreaterThanOrEqual(4);
    expect(curlyOnly).toContain('data-hair-highlight="curlyPlayful"');
    expect(validateAvatarV2HairSvg(curlyOnly, "curlyPlayful")).toBe(true);

    const leafPin = renderAvatarV2Svg({
      ...baseConfig,
      accessory: {
        style: "leafPin" as const,
        color: "accessoryCoral" as const,
        mount: "hairRight" as const,
      },
    });
    expect(leafPin).toContain('data-accessory-asset="leafPin"');
    expect(leafPin).toContain("C-5-14 10-16 17-4");
    expect(leafPin).toContain("M-10 1C-2-1 7-4 14-8");
    expect(validateAvatarV2AssetSvg(leafPin)).toBe(true);
    expect(leafPin).toBe(renderAvatarV2Svg({
      ...baseConfig,
      accessory: {
        style: "leafPin" as const,
        color: "accessoryCoral" as const,
        mount: "hairRight" as const,
      },
    }));
  });

  it("renders headbands behind curly foreground hair instead of pasted above curls", () => {
    const config = {
      ...avatarV2SampleConfigs.showcaseSampleC,
      hair: { style: "curlyPlayful" as const, color: "hairPlum" as const },
      accessory: {
        style: "headband" as const,
        color: "accessoryCoral" as const,
        mount: "headTop" as const,
      },
    };
    const svg = renderAvatarV2Svg(config);
    const headbandIndex = svg.indexOf('data-accessory-asset="headband"');
    const frontHairIndex = svg.indexOf("avatar-v2-layer-front-hair");
    const highlightsIndex = svg.indexOf("avatar-v2-layer-hair-highlights");
    expect(headbandIndex).toBeGreaterThan(svg.indexOf("avatar-v2-layer-base"));
    expect(headbandIndex).toBeLessThan(frontHairIndex);
    expect(frontHairIndex).toBeLessThan(highlightsIndex);
    expect(svg).toContain('data-accessory-layer-rule="behind-front-hair"');
    expect(svg).toBe(renderAvatarV2Svg(config));
  });

  it("renders all sample configs without exception", () => {
    for (const config of Object.values(avatarV2SampleConfigs)) {
      expect(() => renderAvatarV2Svg(config)).not.toThrow();
      expect(renderAvatarV2Svg(config)).toContain('viewBox="0 0 192 192"');
    }
  });
});
