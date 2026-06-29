import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FamilyMemberPage } from "./FamilyMemberPage";
import { avatarV2DefaultConfiguration } from "../avatarV2/avatarConfig";
import { familyMembers } from "./familyMembers";
import { loadMotivationSnapshot } from "../motivationData";
import { loadHelpfulMoments } from "../helpfulMomentsData";
import { loadTasks } from "../tasks/tasksApi";

vi.mock("../motivationData", async () => {
  const actual =
    await vi.importActual<typeof import("../motivationData")>(
      "../motivationData",
    );
  return { ...actual, loadMotivationSnapshot: vi.fn() };
});

vi.mock("../helpfulMomentsData", async () => {
  const actual = await vi.importActual<typeof import("../helpfulMomentsData")>(
    "../helpfulMomentsData",
  );
  return { ...actual, loadHelpfulMoments: vi.fn() };
});

vi.mock("../tasks/tasksApi", () => ({
  loadTasks: vi.fn(),
}));

afterEach(cleanup);

describe("FamilyMemberPage", () => {
  beforeEach(() => {
    vi.mocked(loadMotivationSnapshot).mockResolvedValue({
      familyGoal: {
        id: "family-goal",
        title: "Fill the family helper path",
        targetCount: 20,
        currentProgress: 13,
        unitLabel: "helpful steps",
        celebration: {
          title: "Board game night",
          description: "A cozy game after teamwork.",
          status: 0,
        },
      },
      celebrationMemories: [
        {
          familyGoalId: "old-goal",
          title: "Family Picnic",
          description: "Lunch at the park.",
          celebratedUtc: "2026-06-20T12:00:00Z",
        },
      ],
      individualGoals: [
        {
          id: "riley-goal",
          familyMemberId: "riley",
          familyMemberName: "Riley",
          title: "Read before bed",
          targetCount: 5,
          currentProgress: 3,
          unitLabel: "stars",
          visualKind: "stars",
        },
        {
          id: "jordan-goal",
          familyMemberId: "jordan",
          familyMemberName: "Jordan",
          title: "Brush teeth",
          targetCount: 4,
          currentProgress: 2,
          unitLabel: "checks",
          visualKind: "stars",
        },
      ],
    });
    vi.mocked(loadTasks).mockResolvedValue([
      {
        id: "task-1",
        title: "Pack school bag",
        dueDate: new Date().toISOString().slice(0, 10),
        ownershipKind: "FamilyMember",
        familyMemberId: "riley",
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-20T08:00:00Z",
        updatedUtc: "2026-06-20T08:00:00Z",
        recurrenceFrequency: "None",
        recurringTaskSeriesId: null,
      },
      {
        id: "task-2",
        title: "Shared kitchen reset",
        dueDate: new Date().toISOString().slice(0, 10),
        ownershipKind: "SharedHousehold",
        familyMemberId: null,
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-20T09:00:00Z",
        updatedUtc: "2026-06-20T09:00:00Z",
        recurrenceFrequency: "None",
        recurringTaskSeriesId: null,
      },
    ]);
    vi.mocked(loadHelpfulMoments).mockResolvedValue([
      {
        id: "moment-1",
        householdId: "household",
        familyMemberId: "riley",
        familyMemberName: "Riley",
        familyMemberDisplayColor: "#bbf7d0",
        familyMemberInitials: "R",
        title: "Helped set the table",
        description: "Noticed dinner was almost ready and jumped in.",
        recognitionTag: "Initiative",
        createdUtc: "2026-06-20T12:00:00Z",
      },
    ]);
  });

  it("renders parent settings without legacy avatar configuration fields", () => {
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Alex gezinslidpagina")).not.toBeNull();
    expect(screen.getByText("Persoonlijke gegevens")).not.toBeNull();
    expect(screen.getAllByText("Verjaardag").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Uiterlijk" })).not.toBeNull();
    expect(screen.getByText(/administratieve kleurinstelling/)).not.toBeNull();
    expect(screen.queryByText("Current avatar configuration")).toBeNull();
    expect(screen.queryByText("Age group")).toBeNull();
    expect(screen.queryByText("Presentation")).toBeNull();
    expect(screen.queryByText("Skin tone")).toBeNull();
    expect(screen.queryByText("Current avatar configuration")).toBeNull();
    expect(screen.queryByText("Glasses")).toBeNull();
    expect(screen.queryByText("Shirt color")).toBeNull();
  });

  it("renders Avatar V2 in the Family Member hero when configured", () => {
    render(
      <FamilyMemberPage
        member={{ ...familyMembers[0], avatarV2Config: avatarV2DefaultConfiguration }}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen
        .getAllByRole("img", { name: "Alex household avatar" })
        .some((avatar) => avatar.className.includes("family-avatar-v2")),
    ).toBe(true);
  });

  it("renders child progress with family and individual goals", async () => {
    render(
      <FamilyMemberPage
        member={{ ...familyMembers[2], avatarV2Config: avatarV2DefaultConfiguration }}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Riley kindmodus")).not.toBeNull();
    expect(screen.getByLabelText("Kindoverzicht")).not.toBeNull();
    expect(screen.getAllByRole("img", { name: "Riley household avatar" }).some((avatar) => avatar.className.includes("family-avatar-v2"))).toBe(true);
    expect(screen.getByLabelText("Huidig doel en voortgang")).not.toBeNull();
    expect(screen.getByLabelText("Family goal")).not.toBeNull();
    expect(
      await screen.findByLabelText("Samenvatting gezinsviering"),
    ).not.toBeNull();
    expect(screen.getByText("Herinneringen bekijken")).not.toBeNull();
    expect(await screen.findByText("Vandaag")).not.toBeNull();
    expect(screen.getByText("Wat kan ik vandaag doen?")).not.toBeNull();
    expect(screen.getByText("Pack school bag")).not.toBeNull();
    expect(document.querySelectorAll(".homeops-icon-asset svg").length).toBeGreaterThan(0);
    expect(screen.getByText("Mijn voortgang")).not.toBeNull();
    expect(
      screen.getByLabelText("Huidig doel en voortgang").querySelector("img"),
    ).toBeNull();
    expect(
      screen.getByLabelText("Vandaag").querySelector("img")?.getAttribute("src"),
    ).toContain("data-asset-name='child-today'");
    expect(
      screen
        .getByLabelText("Deze week")
        .querySelector("img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='child-this-week'");
    expect(screen.getAllByText("Gezinsdoel").length).toBeGreaterThan(0);
    expect(screen.getByText(/Hier werken we samen naartoe/)).not.toBeNull();
    expect(
      screen
        .getByLabelText("Family goal")
        .querySelector("img")
        ?.getAttribute("src"),
    ).toContain("data-asset-name='child-family-participation'");
    expect(screen.getByText("Mijn pagina")).not.toBeNull();
    expect(
      (await screen.findAllByText("Fill the family helper path")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Read before bed").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Gezinsviering")).not.toBeNull();
    expect(screen.getAllByText(/Jij hebt geholpen|Jij hielp mee/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Board game night").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Nog maar 7 helpful steps tot Board game night|Only 7 more helpful steps tot Board game night/)
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 stars te gaan/).length).toBeGreaterThan(0);
    expect(await screen.findByText("Helped set the table")).not.toBeNull();
    expect(screen.getAllByText("Riley").length).toBeGreaterThan(0);
    expect(screen.getByText("Initiative")).not.toBeNull();
    expect(screen.getAllByText(/Jij hebt geholpen|Jij hielp mee/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Gems|Shop|Leaderboard|balance/i)).toBeNull();
  });

  it("uses simpler visual language for younger children", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[3]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(await screen.findByText("Sterren om te verzamelen")).not.toBeNull();
    expect((await screen.findAllByText(/Brush teeth/)).length).toBeGreaterThan(
      0,
    );
  });

  it("uses richer progress language for school-age children", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(await screen.findByText("Mijn voortgang")).not.toBeNull();
    expect(await screen.findByLabelText("Voortgang")).not.toBeNull();
    expect(screen.getByLabelText("Deze week")).not.toBeNull();
    expect(
      await screen.findByLabelText("3 of 5 stars"),
    ).not.toBeNull();
  });

  it("renders the Gezinsdoel journey section with celebration context", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      await screen.findByLabelText("Meedoen met gezinsdoel"),
    ).not.toBeNull();
    expect(screen.getAllByText("Gezinsdoel").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Gezinsviering")).not.toBeNull();
    expect(screen.getAllByText(/Jij hebt geholpen|Jij hielp mee/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Board game night").length).toBeGreaterThan(0);
  });

  it("surfaces Gezinslid toevoegen only in Oudermodus household section", async () => {
    const user = userEvent.setup();
    const onAddFamilyMember = vi.fn();
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onAddFamilyMember={onAddFamilyMember}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const adminDisclosure = screen
      .getByText("Ouderinstellingen")
      .closest("details");
    expect(adminDisclosure?.hasAttribute("open")).toBe(false);

    await user.click(screen.getByText("Ouderinstellingen"));
    await user.click(screen.getByRole("button", { name: "Gezinslid toevoegen" }));

    expect(onAddFamilyMember).toHaveBeenCalledOnce();
  });

  it("opens Ouderinstellingen grown-up settings without making them the landing content", async () => {
    const user = userEvent.setup();
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Riley kindmodus")).not.toBeNull();
    expect(screen.getByText("Vandaag")).not.toBeNull();
    const adminDisclosure = screen
      .getByText("Ouderinstellingen")
      .closest("details");
    expect(adminDisclosure?.hasAttribute("open")).toBe(false);

    await user.click(screen.getByText("Ouderinstellingen"));

    expect(adminDisclosure?.hasAttribute("open")).toBe(true);
    expect(screen.getByLabelText("Riley instellingen voor volwassenen")).not.toBeNull();
    expect(screen.getByText("Persoonlijke gegevens")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Uiterlijk" })).not.toBeNull();
    expect(screen.queryByText("Current avatar configuration")).toBeNull();
    expect(screen.queryByText("Skin tone")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Avatar bewerken" }).length).toBeGreaterThan(0);
  });

  it("keeps child-first ordering before Oudermodus controls", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      (await screen.findAllByText("Fill the family helper path")).length,
    ).toBeGreaterThan(0);
    const pageText = document.body.textContent ?? "";
    expect(pageText.indexOf("Pagina van Riley")).toBeLessThan(
      pageText.indexOf("Vandaag"),
    );
    expect(pageText.indexOf("Vandaag")).toBeLessThan(
      pageText.indexOf("Mijn voortgang bekijken"),
    );
    const familyGoalAfterDisclosure = pageText.indexOf(
      "Only 7 more helpful steps",
      pageText.indexOf("Meedoen met gezinsdoel"),
    );
    expect(pageText.indexOf("Mijn voortgang bekijken")).toBeLessThan(
      familyGoalAfterDisclosure,
    );
    expect(pageText.indexOf("Nieuwste waardering")).toBeLessThan(
      pageText.indexOf("Mijn voortgang bekijken"),
    );
    expect(pageText.indexOf("Nieuwste waardering")).toBeLessThan(
      pageText.indexOf("Ouderinstellingen"),
    );
    expect(pageText.indexOf("Mijn voortgang bekijken")).toBeLessThan(
      pageText.indexOf("Ouderinstellingen"),
    );
    expect(pageText.indexOf("Fill the family helper path")).toBeLessThan(
      pageText.indexOf("Ouderinstellingen"),
    );
    expect(pageText).not.toContain("Edit member");
  });

  it("edits member details and requires child date of birth", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Alex Parent");
    await user.selectOptions(screen.getByLabelText("Volwassene / kind"), "child");
    await user.click(screen.getByRole("button", { name: "Gegevens opslaan" }));
    expect(
      screen.getByText("Geboortedatum is verplicht voor kinderen."),
    ).not.toBeNull();

    await user.type(screen.getByLabelText("Verjaardag"), "2015-05-06");
    await user.click(screen.getByRole("button", { name: "Gegevens opslaan" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Alex Parent",
        memberKind: "child",
        dateOfBirth: "2015-05-06",
      }),
    );
  });

  it("confirms removal before notifying the shell", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Gezinslid verwijderen" }));
    expect(onRemove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "alex" }),
    );
  });

  it("owns avatar editing with live editor controls", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );

    await user.click(
      screen.getAllByRole("button", { name: "Avatar bewerken" })[0],
    );

    expect(
      screen.getByRole("dialog", {
        name: "Avatarbewerker voor Alex",
      }),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: /Speelse krullen/i }));
    await user.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "alex",
        avatarV2Config: expect.objectContaining({ hairStyle: "curlyPlayful" }),
      }),
    );
  });
});
