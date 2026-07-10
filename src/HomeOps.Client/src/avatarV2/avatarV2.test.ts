import { describe, expect, it } from "vitest";
import {
  avatarV2SampleConfigs,
  avatarV2AccessoryAssets,
  avatarV2ClothingAssets,
  avatarV2DefaultMouthStyle,
  avatarV2MouthStyles,
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

  it("renders framed, tinted, and novelty eyewear styles with a stable glasses layer", () => {
    const framed = ["regular", "thickFrame", "round", "rectangular", "sunglasses"] as const;
    for (const style of framed) {
      const svg = renderAvatarV2Svg({
        ...avatarV2SampleConfigs.calmChildWithGlasses,
        glasses: { ...avatarV2SampleConfigs.calmChildWithGlasses.glasses, style },
      });
      expect(svg).toContain("avatar-v2-layer-glasses");
      expect(svg).toContain("<rect");
    }

    for (const style of ["star", "heart"] as const) {
      const svg = renderAvatarV2Svg({
        ...avatarV2SampleConfigs.calmChildWithGlasses,
        glasses: { ...avatarV2SampleConfigs.calmChildWithGlasses.glasses, style },
      });
      expect(svg).toContain("avatar-v2-layer-glasses");
      // Novelty lenses use shaped paths rather than rectangular frames.
      expect(svg).toMatch(/id="avatar-v2-layer-glasses"[^>]*>\s*<path/);
    }
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

  it("does not render a center body overlay in the base layer", () => {
    for (const config of Object.values(avatarV2SampleConfigs)) {
      const svg = renderAvatarV2Svg(config);

      expect(svg).not.toContain('rx="55" ry="41"');
      expect(svg).not.toContain('opacity="0.16"');
    }
  });

  it("renders the mouth layer with the neutral compatibility default", () => {
    const config = avatarV2SampleConfigs.adult;
    const anatomy = resolveAvatarAnatomy(config);
    const svg = renderAvatarV2Svg(config);

    expect(svg).toContain("avatar-v2-layer-mouth");
    expect(svg).toContain('data-mouth-style="neutral"');
    // The default mouth keeps the exact geometry and ink of the original face
    // so existing avatars stay visually unchanged.
    expect(svg).toContain(
      `<path d="M${anatomy.face.mouth.x - 18} ${anatomy.face.mouth.y}c10 12 27 12 37-1" fill="none" stroke="#7a4545" stroke-width="4" stroke-linecap="round"/>`,
    );
    // Configs without a mouth fall back to the neutral compatibility default.
    expect(renderAvatarV2Svg(config)).toBe(
      renderAvatarV2Svg({ ...config, mouth: { style: avatarV2DefaultMouthStyle } }),
    );
  });

  it("renders every mouth style through a stable, deterministic mouth layer", () => {
    expect(avatarV2MouthStyles).toHaveLength(10);
    for (const style of avatarV2MouthStyles) {
      const config = { ...avatarV2SampleConfigs.adult, mouth: { style } };
      const svg = renderAvatarV2Svg(config);
      expect(validateAvatarV2AssetSvg(svg)).toBe(true);
      expect(svg).toContain(`data-mouth-style="${style}"`);
      // The mouth sits above the base face but below front hair.
      expect(svg.indexOf("avatar-v2-layer-mouth")).toBeGreaterThan(svg.indexOf("avatar-v2-layer-base"));
      expect(svg.indexOf("avatar-v2-layer-mouth")).toBeLessThan(svg.indexOf("avatar-v2-layer-front-hair"));
      expect(svg).toBe(renderAvatarV2Svg(config));
    }
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
      "polo",
      "jacket",
      "zipHoodie",
      "varsityJacket",
      "rugbyShirt",
      "contrastPocketHoodie",
      "winterCoat",
      "cardigan",
      "sportsShirt",
      "apronSmock",
      "dress",
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

  it("declares clothing color regions and keeps single-color garments primary-only", () => {
    const singleColor = ["roundedTee", "collar", "tShirt", "sweater", "hoodie", "overall"] as const;
    const dualColor = ["polo", "jacket", "dress", "zipHoodie", "varsityJacket", "rugbyShirt", "contrastPocketHoodie", "winterCoat", "cardigan", "sportsShirt", "apronSmock"] as const;

    for (const style of singleColor) {
      expect(avatarV2ClothingAssets[style].colorRegions).toEqual(["primary"]);
    }
    for (const style of dualColor) {
      expect(avatarV2ClothingAssets[style].colorRegions).toEqual(["primary", "secondary"]);
    }
  });

  it("ignores the secondary color for single-color garments (backward compatibility)", () => {
    for (const style of ["roundedTee", "collar", "tShirt", "sweater", "hoodie", "overall"] as const) {
      const base = {
        ...avatarV2SampleConfigs.showcaseSampleA,
        accessory: { ...avatarV2SampleConfigs.showcaseSampleA.accessory, style: "none" as const },
      };
      const withoutSecondary = renderAvatarV2Svg({ ...base, shirt: { style, color: "shirtSky" as const } });
      const withSecondary = renderAvatarV2Svg({ ...base, shirt: { style, color: "shirtSky" as const, secondaryColor: "shirtRed" as const } });
      expect(withSecondary).toBe(withoutSecondary);
    }
  });

  it("applies an independent secondary color for dual-color garments", () => {
    for (const style of ["polo", "jacket", "dress", "zipHoodie", "varsityJacket", "rugbyShirt", "contrastPocketHoodie", "winterCoat", "cardigan", "sportsShirt", "apronSmock"] as const) {
      const base = {
        ...avatarV2SampleConfigs.showcaseSampleA,
        accessory: { ...avatarV2SampleConfigs.showcaseSampleA.accessory, style: "none" as const },
      };
      const config = { ...base, shirt: { style, color: "shirtNavy" as const, secondaryColor: "shirtButter" as const } };
      const svg = renderAvatarV2Svg(config);
      expect(svg).toContain(`data-clothing-asset="${style}"`);
      expect(validateAvatarV2AssetSvg(svg)).toBe(true);
      // Secondary swatch base color must appear in the output.
      expect(svg).toContain(expandAvatarPaletteToken("shirtButter").base);
      // Changing only the secondary color must change the rendering.
      const recolored = renderAvatarV2Svg({ ...base, shirt: { style, color: "shirtNavy" as const, secondaryColor: "shirtGreen" as const } });
      expect(recolored).not.toBe(svg);
      // Deterministic output.
      expect(renderAvatarV2Svg(config)).toBe(svg);
    }
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
    expect(curlyOnly.match(/data-hair-style="curlyPlayful"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(curlyOnly).toContain('data-hair-highlight="curlyPlayful"');

    expect(curlyOnly).toContain('data-concept="loose-wavy-curls-fixed"');
    expect(curlyOnly).not.toContain("M119 74c5 14 3 29-6 43");
    expect(curlyOnly).toContain("M121 64c7 4 12 11 14 20");
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

  it("renders curly headbands as partially occluded visible wraps instead of hidden bands", () => {
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
    const rearHeadbandIndex = svg.indexOf('data-accessory-layer-rule="partial-occlusion-rear"');
    const frontHairIndex = svg.indexOf("avatar-v2-layer-front-hair");
    const visibleHeadbandIndex = svg.indexOf('data-accessory-layer-rule="partial-occlusion-visible"');
    const highlightsIndex = svg.indexOf("avatar-v2-layer-hair-highlights");
    expect(rearHeadbandIndex).toBeGreaterThan(svg.indexOf("avatar-v2-layer-base"));
    expect(rearHeadbandIndex).toBeLessThan(frontHairIndex);
    expect(frontHairIndex).toBeLessThan(visibleHeadbandIndex);
    expect(visibleHeadbandIndex).toBeGreaterThan(highlightsIndex);
    expect(svg).toContain('id="avatar-v2-layer-accessory-visible"');
    expect(svg).toContain('data-headband-model="anatomy-anchor-curve"');
    expect(svg).toContain('M47 70.2C64.1 48.4 127.9 48.4 145 70.2');
    expect(svg).not.toContain('<image');
    expect(svg).not.toMatch(/(?:href|src)="https?:\/\//i);
    expect(svg.match(/data-accessory-asset="headband"/g)).toHaveLength(2);
    expect(svg).toBe(renderAvatarV2Svg(config));
  });

  it("renders all sample configs without exception", () => {
    for (const config of Object.values(avatarV2SampleConfigs)) {
      expect(() => renderAvatarV2Svg(config)).not.toThrow();
      expect(renderAvatarV2Svg(config)).toContain('viewBox="0 0 192 192"');
    }
  });
});
