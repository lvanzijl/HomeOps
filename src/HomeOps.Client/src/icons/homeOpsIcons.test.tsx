import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  getHomeOpsIconSymbol,
  homeOpsIconRegistry,
  HomeOpsIcon,
} from "./homeOpsIcons";

describe("HomeOpsIcon", () => {
  it("renders semantic icon symbols from the central registry", () => {
    render(<HomeOpsIcon name="celebration" label="Celebration" />);

    expect(screen.getByLabelText("Celebration").textContent).toBe(
      homeOpsIconRegistry.celebration,
    );
  });

  it("keeps registry lookup stable for future asset migration", () => {
    expect(getHomeOpsIconSymbol("memory")).toBe("💛");
    expect(getHomeOpsIconSymbol("completed")).toBe("✓");
    expect(getHomeOpsIconSymbol("progress")).toBe("★");
  });
});
