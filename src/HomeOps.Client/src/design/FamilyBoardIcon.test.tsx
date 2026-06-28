import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FamilyBoardIcon, familyBoardIconRegistry, resolveFamilyBoardIconSize } from "./index";

describe("FamilyBoardIcon", () => {
  it("renders decorative inline SVG icons with currentColor", () => {
    const { container } = render(<FamilyBoardIcon name="core.add" />);

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.querySelector("img")).toBeNull();
  });

  it("supports accessible titles for meaningful standalone icons", () => {
    render(<FamilyBoardIcon decorative={false} name="status.ready" title="Ready" />);

    const icon = screen.getByRole("img", { name: "Ready" });
    expect(icon.querySelector("title")?.textContent).toBe("Ready");
  });

  it("uses shared sizing tokens", () => {
    const { container } = render(<FamilyBoardIcon name="navigation.settings" size="large" />);

    expect(resolveFamilyBoardIconSize("small")).toBe(16);
    expect(resolveFamilyBoardIconSize("normal")).toBe(20);
    expect(resolveFamilyBoardIconSize("large")).toBe(24);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("24");
  });

  it("exposes semantic registry entries without agenda or shopping migration icons", () => {
    expect(Object.keys(familyBoardIconRegistry)).toEqual([
      "core.add",
      "core.close",
      "navigation.home",
      "navigation.settings",
      "status.ready",
    ]);
  });
});
