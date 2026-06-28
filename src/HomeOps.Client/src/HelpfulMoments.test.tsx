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
        title="Wat wij waarderen"
      />,
    );

    const section = screen.getByLabelText("Wat wij waarderen");
    expect(
      await within(section).findByText("Helped Jordan clean up"),
    ).not.toBeNull();
    expect(within(section).getByText("Riley")).not.toBeNull();
    expect(within(section).getByText("Wat wij waarderen")).not.toBeNull();
    expect(within(section).getByText("Kindness")).not.toBeNull();
    expect(
      within(section).getByText("Lieve dingen die jullie hebben gezien."),
    ).not.toBeNull();
    expect(within(section).getByText("Dank je wel.")).not.toBeNull();
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
        title="Wat wij waarderen"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Waardering toevoegen" }));
    const dialog = screen.getByRole("dialog", { name: "Waardering delen" });
    expect(within(dialog).getByText("Wie hielp?")).not.toBeNull();

    await user.click(within(dialog).getByRole("button", { name: /Riley/ }));
    expect(within(dialog).getByText("Wat gebeurde er?")).not.toBeNull();
    expect(
      within(dialog)
        .getByRole("button", { name: "Verder" })
        .hasAttribute("disabled"),
    ).toBe(true);

    await user.type(within(dialog).getByRole("textbox"), "Took initiative");
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    expect(
      within(dialog).getByText("Hoe zou je het noemen?"),
    ).not.toBeNull();

    await user.click(
      within(dialog).getByRole("button", { name: /Initiative/ }),
    );
    expect(within(dialog).getByText("Nog iets erbij?")).not.toBeNull();

    await user.click(within(dialog).getByRole("button", { name: "Overslaan" }));
    expect(within(dialog).getByText("Klaar om te delen?")).not.toBeNull();
    await user.click(
      within(dialog).getByRole("button", { name: "Waardering delen" }),
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
        title="Wat wij waarderen"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Waardering toevoegen" }));
    const dialog = screen.getByRole("dialog", { name: "Waardering delen" });
    await user.click(within(dialog).getByRole("button", { name: /Jordan/ }));
    await user.type(within(dialog).getByRole("textbox"), "Shared blocks");
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(within(dialog).getByRole("button", { name: /Kindness/ }));
    await user.type(
      within(dialog).getByRole("textbox"),
      "That made the afternoon feel kind.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Waardering delen" }),
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
        title="Wat wij waarderen"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Waardering toevoegen" }));
    expect(
      screen.getByRole("dialog", { name: "Waardering delen" }),
    ).not.toBeNull();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Waardering delen" }),
    ).toBeNull();
    expect(vi.mocked(createHelpfulMoment)).not.toHaveBeenCalled();
  });
});
