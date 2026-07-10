import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { familyMembers } from "./home/familyMembers";
import { FamilyCelebrationStatus } from "./api/homeOpsApiClient";
import { MotivationPage } from "./MotivationPage";
import {
  archiveIndividualGoal,
  createFamilyGoal,
  createIndividualGoal,
  loadMotivationSnapshot,
  markFamilyGoalCelebrated,
  updateFamilyGoal,
  updateIndividualGoal,
} from "./motivationData";

vi.mock("./motivationData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./motivationData")>()),
  loadMotivationSnapshot: vi.fn(),
  createFamilyGoal: vi.fn(),
  updateFamilyGoal: vi.fn(),
  createIndividualGoal: vi.fn(),
  updateIndividualGoal: vi.fn(),
  archiveIndividualGoal: vi.fn(),
  markFamilyGoalCelebrated: vi.fn(),
}));

afterEach(() => cleanup());

describe("MotivationPage", () => {
  beforeEach(() => {
    vi.mocked(createFamilyGoal).mockReset();
    vi.mocked(updateFamilyGoal).mockReset();
    vi.mocked(markFamilyGoalCelebrated).mockReset();
    vi.mocked(createIndividualGoal).mockReset();
    vi.mocked(updateIndividualGoal).mockReset();
    vi.mocked(archiveIndividualGoal).mockReset();
    vi.mocked(loadMotivationSnapshot).mockResolvedValue({
      familyGoal: {
        id: "family-goal",
        title: "Fill the family helper path",
        targetCount: 20,
        currentProgress: 13,
        unitLabel: "helpful actions",
        celebration: {
          title: "Board game night together",
          status: FamilyCelebrationStatus.Planned,
        },
      },
      celebrationMemories: [
        {
          familyGoalId: "old-goal",
          title: "Ice Cream",
          description: "Scoops after teamwork.",
          celebratedUtc: "2026-06-20T12:00:00Z",
        },
      ],
      individualGoals: [
        {
          id: "alex-goal",
          familyMemberId: "alex",
          familyMemberName: "Alex",
          title: "Finish morning routine",
          targetCount: 5,
          currentProgress: 3,
          unitLabel: "checkmarks",
          visualKind: "checkmarks",
        },
        {
          id: "sam-goal",
          familyMemberId: "sam",
          familyMemberName: "Sam",
          title: "Help with dinner",
          targetCount: 3,
          currentProgress: 2,
          unitLabel: "stars",
          visualKind: "stars",
        },
      ],
    });
  });

  it("renders the family goal and individual family member goal cards", async () => {
    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByLabelText("Motivatiedashboard")).not.toBeNull();
    expect(
      await screen.findByLabelText("Aanmoediging en waardering"),
    ).not.toBeNull();
    expect(screen.getByText("Aanmoediging en waardering")).not.toBeNull();
    const familyGoal = screen.getByLabelText("Gedeeld familiedoel");
    expect(
      await within(familyGoal).findByText("Fill the family helper path"),
    ).not.toBeNull();
    expect(within(familyGoal).getByText("Familiedoel")).not.toBeNull();
    expect(within(familyGoal).getByText("Volgende stap")).not.toBeNull();
    expect(
      within(familyGoal).getByText("Elke stap brengt jullie dichter bij samen vieren."),
    ).not.toBeNull();
    expect(within(familyGoal).queryByText("Gedeeld familiekompas")).toBeNull();
    expect(
      within(familyGoal).queryByText(
        "Elke kleine stap laat zien waar jullie als gezin samen naartoe groeien.",
      ),
    ).toBeNull();
    expect(
      familyGoal
        .querySelector(".motivation-ownership-asset img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='child-family-participation'");
    expect(within(familyGoal).getByLabelText("13 van 20 helpful actions")).not.toBeNull();
    expect(
      within(familyGoal).getAllByText(
        "Nog 7 helpful actions tot Board game night together.",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      within(familyGoal).getByLabelText("Viering"),
    ).not.toBeNull();
    expect(
      within(familyGoal)
        .getByLabelText("Viering")
        .querySelector("img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='celebration-upcoming'");
    expect(
      within(familyGoal).getAllByText(/Board game night together/).length,
    ).toBeGreaterThan(0);
    const celebrationCard = screen.getByLabelText("Gezinsviering");
    expect(within(celebrationCard).getByText("Gezinsviering")).not.toBeNull();
    expect(
      within(celebrationCard).getByText("1 herinneringen om te bewaren"),
    ).not.toBeNull();
    expect(screen.queryByText("Vieringsverhaal")).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "Historie bekijken" }));
    expect(await screen.findByLabelText("Vieringsherinneringen")).not.toBeNull();
    expect(screen.getByText("Vieringen die we onthouden")).not.toBeNull();
    expect(screen.getAllByText("Ice Cream").length).toBeGreaterThan(0);
    expect(screen.getByText(/Dit hebben we samen/)).not.toBeNull();
    expect(
      screen
        .getByText(/Dit hebben we samen/)
        .querySelector("img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='child-my-help-mattered'");
    expect(
      screen.queryByText("Ondersteunend bewijs bij jullie gedeelde verhaal."),
    ).toBeNull();

    await userEvent.setup().click(screen.getByRole("button", { name: "Doelen beheren" }));
    const individualGoals = await screen.findByLabelText(
      "Persoonlijke aanmoedigingsdoelen",
    );
    expect(within(individualGoals).getByText("Alex")).not.toBeNull();
    expect(
      within(individualGoals).getByRole("img", { name: "Avatar van Alex" }).className,
    ).toContain("family-avatar-v2");
    expect(
      within(individualGoals).getByText("Finish morning routine"),
    ).not.toBeNull();
    expect(
      individualGoals
        .querySelector(".motivation-ownership-asset img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='child-my-progress'");
    expect(
      within(individualGoals).getByRole("button", {
        name: "Persoonlijk doel toevoegen",
      }),
    ).not.toBeNull();
    expect(within(individualGoals).getByText("Sam")).not.toBeNull();
    expect(
      within(individualGoals).getByText("Help with dinner"),
    ).not.toBeNull();

    await userEvent.setup().click(screen.getByRole("button", { name: "Meer voortgang" }));
    expect(await screen.findByText("Voortgang per onderdeel.")).not.toBeNull();
  });

  it("marks a ready family celebration as celebrated", async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      familyGoal: {
        id: "family-goal",
        title: "Fill the family helper path",
        targetCount: 20,
        currentProgress: 20,
        unitLabel: "helpful actions",
        celebration: {
          title: "Movie night",
          status: FamilyCelebrationStatus.ReadyToCelebrate,
        },
      },
      individualGoals: [],
    });
    vi.mocked(markFamilyGoalCelebrated).mockResolvedValueOnce({
      id: "family-goal",
      title: "Fill the family helper path",
      targetCount: 20,
      currentProgress: 20,
      unitLabel: "helpful actions",
      celebration: {
        title: "Movie night",
        status: FamilyCelebrationStatus.Celebrated,
        celebratedUtc: "2026-06-21T10:00:00Z",
      },
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByLabelText("Viering")).not.toBeNull();
    expect(screen.getByText("Gelukt — klaar om te vieren")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Als gevierd markeren" }));

    expect(markFamilyGoalCelebrated).toHaveBeenCalledWith("family-goal");
    expect((await screen.findAllByText("Samen gevierd")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Movie night").length).toBeGreaterThanOrEqual(2);
    await user.click(screen.getByRole("button", { name: "Historie bekijken" }));
    expect(await screen.findByLabelText("Vieringsherinneringen")).not.toBeNull();
  });

  it("does not render reward economy or competitive wording", async () => {
    render(<MotivationPage members={familyMembers} />);

    expect(
      await screen.findByText("Fill the family helper path"),
    ).not.toBeNull();
    expect(screen.queryByText(/shop/i)).toBeNull();
    expect(screen.queryByText(/^gems?$/i)).toBeNull();
    expect(screen.queryByText(/leaderboard/i)).toBeNull();
    expect(screen.queryByText(/balance/i)).toBeNull();
  });

  it("renders an actionable empty state that creates the first family goal", async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      individualGoals: [],
    });
    vi.mocked(createFamilyGoal).mockResolvedValueOnce({
      id: "new-family-goal",
      title: "Complete 10 helpful tasks",
      targetCount: 10,
      currentProgress: 0,
      unitLabel: "helpful tasks",
      celebration: {
        title: "Movie night together",
        status: FamilyCelebrationStatus.Planned,
      },
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText("Nog geen familiedoel.")).not.toBeNull();
    expect(screen.getByText("Maak één gezamenlijk doel.")).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Familiedoel maken" }),
    );
    expect(screen.getByRole("button", { name: "Verder" }).hasAttribute("disabled")).toBe(true);
    await user.type(
      screen.getByLabelText("Titel van familiedoel"),
      "Complete 10 helpful tasks",
    );
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.clear(screen.getByLabelText("Doelaantal"));
    await user.type(screen.getByLabelText("Doelaantal"), "10");
    await user.clear(screen.getByLabelText("Voortgangslabel"));
    await user.type(screen.getByLabelText("Voortgangslabel"), "helpful tasks");
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.type(
      screen.getByLabelText("Titel van familieviering, optioneel"),
      "Movie night together",
    );
    await user.click(screen.getByRole("button", { name: "Verder" }));
    expect(screen.getByLabelText("Controle familiedoel")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Doel maken" }));

    expect(vi.mocked(createFamilyGoal)).toHaveBeenCalledWith({
      title: "Complete 10 helpful tasks",
      targetCount: 10,
      unitLabel: "helpful tasks",
      celebrationTitle: "Movie night together",
      celebrationDescription: undefined,
    });
    expect(await screen.findByText("Complete 10 helpful tasks")).not.toBeNull();
    expect(screen.getByLabelText("0 van 10 helpful tasks")).not.toBeNull();
  });

  it("edits the active family goal without introducing reward economy concepts", async () => {
    const user = userEvent.setup();
    vi.mocked(updateFamilyGoal).mockResolvedValueOnce({
      id: "family-goal",
      title: "Complete 15 helpful household tasks",
      targetCount: 15,
      currentProgress: 13,
      unitLabel: "helpful tasks",
      celebration: undefined,
    });

    render(<MotivationPage members={familyMembers} />);

    expect(
      await screen.findByText("Fill the family helper path"),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Familiedoel aanpassen" }));
    expect((screen.getByLabelText("Titel van familiedoel") as HTMLInputElement).value).toBe(
      "Fill the family helper path",
    );
    await user.clear(screen.getByLabelText("Titel van familiedoel"));
    await user.type(
      screen.getByLabelText("Titel van familiedoel"),
      "Complete 15 helpful household tasks",
    );
    await user.click(screen.getByRole("button", { name: "Verder" }));
    expect((screen.getByLabelText("Doelaantal") as HTMLInputElement).value).toBe("20");
    await user.clear(screen.getByLabelText("Doelaantal"));
    await user.type(screen.getByLabelText("Doelaantal"), "15");
    await user.clear(screen.getByLabelText("Voortgangslabel"));
    await user.type(screen.getByLabelText("Voortgangslabel"), "helpful tasks");
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.clear(
      screen.getByLabelText("Titel van familieviering, optioneel"),
    );
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.click(screen.getByRole("button", { name: "Doel bewaren" }));

    expect(vi.mocked(updateFamilyGoal)).toHaveBeenCalledWith("family-goal", {
      title: "Complete 15 helpful household tasks",
      targetCount: 15,
      unitLabel: "helpful tasks",
      celebrationTitle: undefined,
      celebrationDescription: undefined,
    });
    expect(
      await screen.findByText("Complete 15 helpful household tasks"),
    ).not.toBeNull();
    expect(screen.getByLabelText("13 van 15 helpful tasks")).not.toBeNull();
    expect(
      screen.queryByText(/coins?|tokens?|shop|leaderboard|negative points/i),
    ).toBeNull();
  });


  it("validates required title and numeric target in the family goal conversation", async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      individualGoals: [],
    });

    render(<MotivationPage members={familyMembers} />);

    await screen.findByText("Nog geen familiedoel.");
    await user.click(screen.getByRole("button", { name: "Familiedoel maken" }));
    expect(screen.getByRole("button", { name: "Verder" }).hasAttribute("disabled")).toBe(true);
    await user.type(screen.getByLabelText("Titel van familiedoel"), "Try a family reset");
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.clear(screen.getByLabelText("Doelaantal"));
    await user.type(screen.getByLabelText("Doelaantal"), "0");
    expect(screen.getByText("Gebruik een doel van 1 tot 999 en een voortgangslabel.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Verder" }).hasAttribute("disabled")).toBe(true);
    expect(createFamilyGoal).not.toHaveBeenCalled();
  });

  it("allows creating a family goal while skipping the optional celebration", async () => {
    const user = userEvent.setup();
    vi.mocked(loadMotivationSnapshot).mockResolvedValueOnce({
      individualGoals: [],
    });
    vi.mocked(createFamilyGoal).mockResolvedValueOnce({
      id: "skip-celebration-goal",
      title: "Clear the landing zone",
      targetCount: 5,
      currentProgress: 0,
      unitLabel: "quick resets",
      celebration: undefined,
    });

    render(<MotivationPage members={familyMembers} />);

    await screen.findByText("Nog geen familiedoel.");
    await user.click(screen.getByRole("button", { name: "Familiedoel maken" }));
    await user.type(screen.getByLabelText("Titel van familiedoel"), "Clear the landing zone");
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.clear(screen.getByLabelText("Doelaantal"));
    await user.type(screen.getByLabelText("Doelaantal"), "5");
    await user.clear(screen.getByLabelText("Voortgangslabel"));
    await user.type(screen.getByLabelText("Voortgangslabel"), "quick resets");
    await user.click(screen.getByRole("button", { name: "Verder" }));
    await user.click(screen.getByRole("button", { name: "Verder" }));
    expect(screen.getByText("Nog geen viering — die kunnen we later toevoegen.")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Doel maken" }));

    expect(createFamilyGoal).toHaveBeenCalledWith({
      title: "Clear the landing zone",
      targetCount: 5,
      unitLabel: "quick resets",
      celebrationTitle: undefined,
      celebrationDescription: undefined,
    });
  });

  it("closes the family goal dialog with Escape without saving", async () => {
    const user = userEvent.setup();

    render(<MotivationPage members={familyMembers} />);

    await screen.findByText("Fill the family helper path");
    await user.click(screen.getByRole("button", { name: "Familiedoel aanpassen" }));
    expect(screen.getByRole("dialog", { name: "Familiedoel aanpassen" })).not.toBeNull();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Familiedoel aanpassen" })).toBeNull();
    expect(updateFamilyGoal).not.toHaveBeenCalled();
    expect(screen.getByText("Fill the family helper path")).not.toBeNull();
  });

  it("creates a personal goal for a family member", async () => {
    const user = userEvent.setup();
    vi.mocked(createIndividualGoal).mockResolvedValueOnce({
      id: "read-goal",
      familyMemberId: "alex",
      familyMemberName: "Alex",
      title: "Read books",
      targetCount: 4,
      currentProgress: 0,
      unitLabel: "books",
      visualKind: "stars",
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByLabelText("Motivatiedashboard")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Doelen beheren" }));
    expect(await screen.findByText("Persoonlijke doelen deze week")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Persoonlijk doel toevoegen" }));
    const createForm = screen.getByLabelText("Persoonlijk doel maken formulier");
    await user.selectOptions(
      within(createForm).getByLabelText("Gezinslid"),
      "alex",
    );
    await user.type(
      within(createForm).getByLabelText("Doeltitel"),
      "Read books",
    );
    await user.clear(within(createForm).getByLabelText("Doelaantal"));
    await user.type(within(createForm).getByLabelText("Doelaantal"), "4");
    await user.clear(within(createForm).getByLabelText("Eenheid"));
    await user.type(within(createForm).getByLabelText("Eenheid"), "books");
    await user.click(
      screen.getByRole("button", { name: "Persoonlijk doel bewaren" }),
    );

    expect(createIndividualGoal).toHaveBeenCalledWith({
      familyMemberId: "alex",
      title: "Read books",
      targetCount: 4,
      unitLabel: "books",
    });
    expect(await screen.findByText("Read books")).not.toBeNull();
  });

  it("edits a personal goal and preserves returned progress", async () => {
    const user = userEvent.setup();
    vi.mocked(updateIndividualGoal).mockResolvedValueOnce({
      id: "alex-goal",
      familyMemberId: "sam",
      familyMemberName: "Sam",
      title: "Bedtime routine",
      targetCount: 2,
      currentProgress: 2,
      unitLabel: "nights",
      visualKind: "stars",
    });

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByLabelText("Motivatiedashboard")).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Doelen beheren" }),
    );
    expect(await screen.findByText("Finish morning routine")).not.toBeNull();
    const alexCard = screen
      .getByText("Finish morning routine")
      .closest("article")!;
    await user.click(within(alexCard).getByRole("button", { name: "Aanpassen" }));
    const editForm = screen.getByLabelText("Persoonlijk doel aanpassen formulier");
    await user.selectOptions(
      within(editForm).getByLabelText("Gezinslid"),
      "sam",
    );
    await user.clear(within(editForm).getByLabelText("Doeltitel"));
    await user.type(
      within(editForm).getByLabelText("Doeltitel"),
      "Bedtime routine",
    );
    await user.clear(within(editForm).getByLabelText("Doelaantal"));
    await user.type(within(editForm).getByLabelText("Doelaantal"), "2");
    await user.clear(within(editForm).getByLabelText("Eenheid"));
    await user.type(within(editForm).getByLabelText("Eenheid"), "nights");
    await user.click(
      screen.getByRole("button", { name: "Persoonlijk doel bewaren" }),
    );

    expect(updateIndividualGoal).toHaveBeenCalledWith("alex-goal", {
      familyMemberId: "sam",
      title: "Bedtime routine",
      targetCount: 2,
      unitLabel: "nights",
    });
    expect(await screen.findByText("Bedtime routine")).not.toBeNull();
    expect(screen.getByLabelText("2 of 2 nights")).not.toBeNull();
  });

  it("retires a personal goal from active motivation display", async () => {
    const user = userEvent.setup();
    vi.mocked(archiveIndividualGoal).mockResolvedValueOnce(undefined);

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByLabelText("Motivatiedashboard")).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Doelen beheren" }),
    );
    expect(await screen.findByText("Finish morning routine")).not.toBeNull();
    const alexCard = screen
      .getByText("Finish morning routine")
      .closest("article")!;
    await user.click(within(alexCard).getByRole("button", { name: "Aanpassen" }));
    await user.click(screen.getByRole("button", { name: "Doel stoppen" }));

    expect(archiveIndividualGoal).toHaveBeenCalledWith("alex-goal");
    expect(screen.queryByText("Finish morning routine")).toBeNull();
    expect(screen.getByText("Help with dinner")).not.toBeNull();
  });

  it("keeps detail workflows behind progressive disclosure", async () => {
    const user = userEvent.setup();

    render(<MotivationPage members={familyMembers} />);

    expect(
      await screen.findByText("Fill the family helper path"),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Aanpassen" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Doelen beheren" }),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Doelen beheren" }),
    );
    expect(
      screen.getAllByRole("button", { name: "Aanpassen" }).length,
    ).toBeGreaterThan(0);
  });

  it("opens Motivation detail access for memories and helpful moments", async () => {
    const user = userEvent.setup();

    render(<MotivationPage members={familyMembers} />);

    expect(await screen.findByText("Fill the family helper path")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Historie bekijken" }),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Historie bekijken" }),
    );
    expect(await screen.findByLabelText("Vieringsherinneringen")).not.toBeNull();

    expect(
      await screen.findByLabelText("Aanmoediging en waardering"),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Waardering toevoegen" }));
    expect(screen.getByLabelText("Waardering delen")).not.toBeNull();
  });
});
