import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  getHomeOpsIconAsset,
  getHomeOpsIconSymbol,
  homeOpsIconRegistry,
  HomeOpsIcon,
} from "./homeOpsIcons";

describe("HomeOpsIcon", () => {
  it("renders semantic celebration assets from the central registry", () => {
    render(<HomeOpsIcon name="celebration" label="Celebration" />);

    const icon = screen.getByLabelText("Celebration");
    expect(icon.querySelector("img")?.getAttribute("src")).toContain(
      "data-asset-name='celebration-ready'",
    );
  });

  it("resolves celebration semantic variants to owned SVG assets", () => {
    expect(getHomeOpsIconAsset("celebrationUpcoming", "spot")).toContain(
      "data-asset-name='celebration-upcoming'",
    );
    expect(getHomeOpsIconAsset("celebrationReady", "hero")).toContain(
      "data-asset-name='celebration-ready'",
    );
    expect(getHomeOpsIconAsset("celebrationCelebrated", "spot")).toContain(
      "data-asset-name='celebration-celebrated'",
    );
    expect(getHomeOpsIconAsset("celebrationMemory", "keepsake")).toContain(
      "data-asset-name='celebration-memory'",
    );
  });

  it("keeps fallback symbols stable when a semantic asset is unavailable", () => {
    expect(getHomeOpsIconAsset("completed")).toBeUndefined();
    expect(getHomeOpsIconSymbol("memory")).toBe("💛");
    expect(getHomeOpsIconSymbol("completed")).toBe("✓");
    expect(getHomeOpsIconSymbol("progress")).toBe("★");
    expect(homeOpsIconRegistry.celebration.fallback).toBe("🎉");
  });
});
