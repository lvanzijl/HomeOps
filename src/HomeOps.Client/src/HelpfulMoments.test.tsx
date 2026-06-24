import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { familyMembers } from "./home/familyMembers";
import { HelpfulMomentsSection } from "./HelpfulMoments";
import { createHelpfulMoment, loadHelpfulMoments } from "./helpfulMomentsData";

vi.mock("./helpfulMomentsData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./helpfulMomentsData")>()),
  loadHelpfulMoments: vi.fn(),
  createHelpfulMoment: vi.fn(),
}));

afterEach(() => cleanup());

describe("HelpfulMomentsSection", () => {
  beforeEach(() => {
    vi.mocked(createHelpfulMoment).mockReset();
    vi.mocked(loadHelpfulMoments).mockResolvedValue([
      {
        id: "moment-1",
        householdId: "household",
        familyMemberId: "riley",
        familyMemberName: "Riley",
        familyMemberDisplayColor: "#bbf7d0",
        familyMemberInitials: "R",
        title: "Helped Jordan clean up",
        description: "Kindly joined without being asked.",
        recognitionTag: "Kindness",
        createdUtc: "2026-06-20T12:00:00Z",
      },
    ]);
  });

  it("renders warm family appreciation without points or reward economy concepts", async () => {
    render(
      <HelpfulMomentsSection
        members={familyMembers}
        title="Things My Family Appreciates"
      />,
    );

    const section = screen.getByLabelText("Things My Family Appreciates");
    expect(
      await within(section).findByText("Helped Jordan clean up"),
    ).not.toBeNull();
    expect(within(section).getByText("We noticed Riley")).not.toBeNull();
    expect(within(section).getByText("My Family Appreciates")).not.toBeNull();
    expect(within(section).getByText("Kindness")).not.toBeNull();
    expect(
      within(section).getByText("Kind things your family noticed."),
    ).not.toBeNull();
    expect(within(section).getByText("You helped.")).not.toBeNull();
    expect(
      section.querySelector("img[src*='helpful-kindness']"),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        /points?|tokens?|gems?|shop|leaderboard|balance|reward value/i,
      ),
    ).toBeNull();
  });

  it("creates appreciation through one-question-at-a-time conversation and skips the optional note", async () => {
    const user = userEvent.setup();
    vi.mocked(createHelpfulMoment).mockResolvedValueOnce({
      id: "moment-2",
      householdId: "household",
      familyMemberId: "riley",
      familyMemberName: "Riley",
      familyMemberDisplayColor: "#bbf7d0",
      familyMemberInitials: "R",
      title: "Took initiative",
      description: undefined,
      recognitionTag: "Initiative",
      createdUtc: "2026-06-20T12:05:00Z",
    });

    render(
      <HelpfulMomentsSection
        members={familyMembers}
        showCreate
        title="Things My Family Appreciates"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add appreciation" }));
    const dialog = screen.getByRole("dialog", { name: "Share appreciation" });
    expect(within(dialog).getByText("Who helped?")).not.toBeNull();

    await user.click(within(dialog).getByRole("button", { name: /Riley/ }));
    expect(within(dialog).getByText("What happened?")).not.toBeNull();
    expect(
      within(dialog)
        .getByRole("button", { name: "Continue" })
        .hasAttribute("disabled"),
    ).toBe(true);

    await user.type(within(dialog).getByRole("textbox"), "Took initiative");
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(
      within(dialog).getByText("How would you describe it?"),
    ).not.toBeNull();

    await user.click(
      within(dialog).getByRole("button", { name: /Initiative/ }),
    );
    expect(within(dialog).getByText("Anything else?")).not.toBeNull();

    await user.click(within(dialog).getByRole("button", { name: "Skip" }));
    expect(within(dialog).getByText("Ready to share this?")).not.toBeNull();
    await user.click(
      within(dialog).getByRole("button", { name: "Share appreciation" }),
    );

    expect(vi.mocked(createHelpfulMoment)).toHaveBeenCalledWith({
      familyMemberId: "riley",
      title: "Took initiative",
      description: undefined,
      recognitionTag: "Initiative",
    });
    expect(await screen.findByText("Took initiative")).not.toBeNull();
  });

  it("creates appreciation with an optional personal note", async () => {
    const user = userEvent.setup();
    vi.mocked(createHelpfulMoment).mockResolvedValueOnce({
      id: "moment-3",
      householdId: "household",
      familyMemberId: "jordan",
      familyMemberName: "Jordan",
      familyMemberDisplayColor: "#fde68a",
      familyMemberInitials: "J",
      title: "Shared blocks",
      description: "That made the afternoon feel kind.",
      recognitionTag: "Kindness",
      createdUtc: "2026-06-20T12:10:00Z",
    });

    render(
      <HelpfulMomentsSection
        members={familyMembers}
        showCreate
        title="Things My Family Appreciates"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add appreciation" }));
    const dialog = screen.getByRole("dialog", { name: "Share appreciation" });
    await user.click(within(dialog).getByRole("button", { name: /Jordan/ }));
    await user.type(within(dialog).getByRole("textbox"), "Shared blocks");
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    await user.click(within(dialog).getByRole("button", { name: /Kindness/ }));
    await user.type(
      within(dialog).getByRole("textbox"),
      "That made the afternoon feel kind.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Continue" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Share appreciation" }),
    );

    expect(vi.mocked(createHelpfulMoment)).toHaveBeenCalledWith({
      familyMemberId: "jordan",
      title: "Shared blocks",
      description: "That made the afternoon feel kind.",
      recognitionTag: "Kindness",
    });
  });

  it("closes the appreciation dialog with Escape without sharing", async () => {
    const user = userEvent.setup();

    render(
      <HelpfulMomentsSection
        members={familyMembers}
        showCreate
        title="Things My Family Appreciates"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add appreciation" }));
    expect(
      screen.getByRole("dialog", { name: "Share appreciation" }),
    ).not.toBeNull();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Share appreciation" }),
    ).toBeNull();
    expect(vi.mocked(createHelpfulMoment)).not.toHaveBeenCalled();
  });
});
