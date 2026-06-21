import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  getHelpfulMomentIconName,
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

  it("resolves child ownership semantic names to owned SVG assets", () => {
    expect(getHomeOpsIconAsset("childMyProgress", "spot")).toContain(
      "data-asset-name='child-my-progress'",
    );
    expect(getHomeOpsIconAsset("progress", "icon")).toContain(
      "data-asset-name='child-my-progress'",
    );
    expect(getHomeOpsIconAsset("childMyHelpMattered", "hero")).toContain(
      "data-asset-name='child-my-help-mattered'",
    );
    expect(getHomeOpsIconAsset("childFamilyParticipation", "group")).toContain(
      "data-asset-name='child-family-participation'",
    );
    expect(getHomeOpsIconAsset("childToday", "section")).toContain(
      "data-asset-name='child-today'",
    );
    expect(getHomeOpsIconAsset("childThisWeek", "section")).toContain(
      "data-asset-name='child-this-week'",
    );
  });

  it("resolves helpful moment semantic names to owned SVG assets", () => {
    expect(getHomeOpsIconAsset("kindness", "icon")).toContain(
      "data-asset-name='helpful-kindness'",
    );
    expect(getHomeOpsIconAsset("teamwork", "spot")).toContain(
      "data-asset-name='helpful-teamwork'",
    );
    expect(getHomeOpsIconAsset("initiative", "icon")).toContain(
      "data-asset-name='helpful-initiative'",
    );
    expect(getHomeOpsIconAsset("responsibility", "spot")).toContain(
      "data-asset-name='helpful-responsibility'",
    );
    expect(getHomeOpsIconAsset("routine", "icon")).toContain(
      "data-asset-name='helpful-routine'",
    );
  });

  it("maps helpful moment recognition tags through semantic names with a safe fallback", () => {
    expect(getHelpfulMomentIconName("Kindness")).toBe("kindness");
    expect(getHelpfulMomentIconName("teamwork")).toBe("teamwork");
    expect(getHelpfulMomentIconName("Initiative")).toBe("initiative");
    expect(getHelpfulMomentIconName("Responsibility")).toBe("responsibility");
    expect(getHelpfulMomentIconName("Routine")).toBe("routine");
    expect(getHelpfulMomentIconName("Unknown")).toBe("kindness");
    expect(getHelpfulMomentIconName()).toBe("kindness");
  });

  it("keeps fallback symbols stable when a semantic asset is unavailable", () => {
    expect(getHomeOpsIconAsset("completed")).toBeUndefined();
    expect(getHomeOpsIconSymbol("memory")).toBe("💛");
    expect(getHomeOpsIconSymbol("completed")).toBe("✓");
    expect(getHomeOpsIconSymbol("progress")).toBe("★");
    expect(homeOpsIconRegistry.celebration.fallback).toBe("🎉");
  });
});
