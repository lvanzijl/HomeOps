import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FamilyMemberPage } from "./FamilyMemberPage";
import { avatarV2DefaultConfiguration } from "../avatarV2/avatarConfig";
import { familyMembers } from "./familyMembers";
import { loadMotivationSnapshot } from "../motivationData";
import { loadHelpfulMoments } from "../helpfulMomentsData";
import { loadTasks } from "../tasks/tasksApi";
import { createAvatarSelectionFixture } from "../avatarCatalog/avatarCatalogFixtures";
import type { KnownPerson } from "../knownPeople/knownPeople";
import {
  createKnownPerson,
  deleteKnownPerson,
  listKnownPeople,
  updateKnownPerson,
} from "../knownPeople/knownPeopleApi";

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

vi.mock("../knownPeople/knownPeopleApi", () => ({
  listKnownPeople: vi.fn(),
  createKnownPerson: vi.fn(),
  updateKnownPerson: vi.fn(),
  deleteKnownPerson: vi.fn(),
}));

const knownPersonAvatarSelection = createAvatarSelectionFixture();
const memberPeople: readonly KnownPerson[] = [
  {
    id: "person-teacher",
    displayName: "Juf Noor",
    nickname: null,
    relationshipType: "teacher",
    customRelationshipLabel: null,
    scope: "privateToMember",
    familyMemberId: "riley",
    initials: "JN",
    avatarSelection: knownPersonAvatarSelection,
  },
  {
    id: "person-friend",
    displayName: "Mila",
    nickname: "Mi",
    relationshipType: "friend",
    customRelationshipLabel: null,
    scope: "privateToMember",
    familyMemberId: "riley",
    initials: "M",
    avatarSelection: knownPersonAvatarSelection,
  },
  {
    id: "person-coach",
    displayName: "Coach Sam",
    nickname: null,
    relationshipType: "coach",
    customRelationshipLabel: null,
    scope: "privateToMember",
    familyMemberId: "riley",
    initials: "CS",
    avatarSelection: knownPersonAvatarSelection,
  },
  {
    id: "person-other-member",
    displayName: "Jordan Friend",
    nickname: null,
    relationshipType: "friend",
    customRelationshipLabel: null,
    scope: "privateToMember",
    familyMemberId: "jordan",
    initials: "JF",
    avatarSelection: knownPersonAvatarSelection,
  },
];

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
    vi.mocked(listKnownPeople).mockResolvedValue(memberPeople);
    vi.mocked(createKnownPerson).mockImplementation(async (input) => ({
      ...input,
      id: "created-person",
    }));
    vi.mocked(updateKnownPerson).mockImplementation(async (input) => input);
    vi.mocked(deleteKnownPerson).mockResolvedValue(undefined);
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
        title: "Clear the hallway shoes",
        dueDate: new Date().toISOString().slice(0, 10),
        ownershipKind: "FamilyMember",
        familyMemberId: "riley",
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-20T08:30:00Z",
        updatedUtc: "2026-06-20T08:30:00Z",
        recurrenceFrequency: "None",
        recurringTaskSeriesId: null,
      },
      {
        id: "task-3",
        title: "Put library book in backpack",
        dueDate: new Date().toISOString().slice(0, 10),
        ownershipKind: "FamilyMember",
        familyMemberId: "riley",
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-20T08:45:00Z",
        updatedUtc: "2026-06-20T08:45:00Z",
        recurrenceFrequency: "None",
        recurringTaskSeriesId: null,
      },
      {
        id: "task-4",
        title: "Water the garden herbs",
        dueDate: new Date().toISOString().slice(0, 10),
        ownershipKind: "FamilyMember",
        familyMemberId: "riley",
        isCompleted: false,
        completedUtc: null,
        createdUtc: "2026-06-20T09:00:00Z",
        updatedUtc: "2026-06-20T09:00:00Z",
        recurrenceFrequency: "None",
        recurringTaskSeriesId: null,
      },
      {
        id: "task-5",
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

  it("renders an adult dashboard without default administration in the page flow", async () => {
    render(
      <FamilyMemberPage
        member={familyMembers[0]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Alex gezinslidpagina")).not.toBeNull();
    expect(screen.getByText("Mijn overzicht")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Instellingen" })).not.toBeNull();
    expect(screen.queryByText("Persoonlijke gegevens")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Uiterlijk" })).toBeNull();
    expect(await screen.findByText("Nieuwste waardering")).not.toBeNull();
  });

  it("renders Avatar V2 in the compact identity strip when configured", () => {
    render(
      <FamilyMemberPage
        member={{
          ...familyMembers[0],
          avatarV2Config: avatarV2DefaultConfiguration,
        }}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen
        .getAllByRole("img", { name: "Avatar van Alex" })
        .some((avatar) => avatar.className.includes("family-avatar-v2")),
    ).toBe(true);
  });

  it("renders the child dashboard with bounded today, progress, and appreciation summaries", async () => {
    render(
      <FamilyMemberPage
        member={{
          ...familyMembers[2],
          avatarV2Config: avatarV2DefaultConfiguration,
        }}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Riley kindmodus")).not.toBeNull();
    expect(screen.getByText("Mijn pagina")).not.toBeNull();
    expect(screen.getByText("Hoe gaat het vandaag?")).not.toBeNull();
    expect(await screen.findByText("Vandaag")).not.toBeNull();
    expect(screen.getByText("Wat kan ik vandaag doen?")).not.toBeNull();
    expect(screen.getByText("Pack school bag")).not.toBeNull();
    expect(screen.getByText("Clear the hallway shoes")).not.toBeNull();
    expect(screen.getByText("Put library book in backpack")).not.toBeNull();
    expect(screen.getByText("+1 meer klaar")).not.toBeNull();
    expect(screen.getByText("Mijn voortgang")).not.toBeNull();
    expect(screen.getByText("Read before bed")).not.toBeNull();
    expect(await screen.findByText("Nieuwste waardering")).not.toBeNull();
    expect(await screen.findByText("Helped set the table")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Voortgang en doelen" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Herinneringen" }),
    ).not.toBeNull();
    expect(
      document.querySelectorAll(".homeops-icon-asset svg").length,
    ).toBeGreaterThan(0);
  });

  it("integrates member-scoped People with friends-first groups, search, CRUD, avatars, and bounded layout", async () => {
    const user = userEvent.setup();
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(await screen.findByText("Mila")).not.toBeNull();
    expect(listKnownPeople).toHaveBeenCalledWith({
      scope: "privateToMember",
      familyMemberId: "riley",
    });
    expect(screen.queryByText("Jordan Friend")).toBeNull();
    const peopleSection = screen.getByLabelText("People");
    expect(peopleSection.className).toContain("member-people-card");
    const headings = within(peopleSection)
      .getAllByRole("heading")
      .map((heading) => heading.textContent);
    expect(headings.indexOf("Friends")).toBeLessThan(
      headings.indexOf("Teachers"),
    );
    expect(headings).toContain("Helpers");
    expect(
      within(peopleSection).getAllByRole("img", { name: "Avatar van Mila" })
        .length,
    ).toBeGreaterThan(0);

    await user.type(
      within(peopleSection).getByPlaceholderText("Zoek op naam of relatie"),
      "noor",
    );
    expect(within(peopleSection).getByText("Juf Noor")).not.toBeNull();
    expect(within(peopleSection).queryByText("Mila")).toBeNull();
    await user.clear(
      within(peopleSection).getByPlaceholderText("Zoek op naam of relatie"),
    );

    await user.click(
      within(peopleSection).getByRole("button", { name: "Add person" }),
    );
    expect(screen.getByTestId("known-person-form")).not.toBeNull();
    expect(screen.queryByText("Scope")).toBeNull();
    expect(screen.queryByText("FamilyMember")).toBeNull();
    await user.type(screen.getByLabelText("DisplayName"), "Nina");
    await user.selectOptions(
      screen.getByLabelText("RelationshipType"),
      "classmate",
    );
    await user.click(screen.getByRole("button", { name: "Avatar edit" }));
    expect(
      screen.getByRole("dialog", { name: "Avatar van Nina bewerken" }),
    ).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Avatarbewerker sluiten" }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(createKnownPerson).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: "Nina",
          scope: "privateToMember",
          familyMemberId: "riley",
        }),
      ),
    );

    await user.click(
      within(peopleSection).getByRole("button", { name: /Mila/ }),
    );
    await user.clear(screen.getByLabelText("Nickname"));
    await user.type(screen.getByLabelText("Nickname"), "Beste maat");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateKnownPerson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "person-friend",
          familyMemberId: "riley",
          scope: "privateToMember",
          nickname: "Beste maat",
        }),
      ),
    );

    await user.click(
      within(peopleSection).getByRole("button", { name: /Mila/ }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(deleteKnownPerson).toHaveBeenCalledWith("person-friend"),
    );
  });

  it("shows member People loading, empty, and error states", async () => {
    vi.mocked(listKnownPeople).mockReturnValue(new Promise(() => undefined));
    const { unmount } = render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("People laden…")).not.toBeNull();
    unmount();

    vi.mocked(listKnownPeople).mockResolvedValue([]);
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(
      await screen.findByText("Nog geen People toegevoegd."),
    ).not.toBeNull();
    cleanup();

    vi.mocked(listKnownPeople).mockRejectedValue(new Error("nope"));
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect((await screen.findByRole("alert")).textContent).toContain(
      "niet worden geladen",
    );
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

    expect(await screen.findByText("Mijn sterren")).not.toBeNull();
    expect(await screen.findByText("Nieuwste waardering")).not.toBeNull();
  });

  it("opens goals in a bounded dialog instead of permanent page sections", async () => {
    const user = userEvent.setup();
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("dialog", { name: "Voortgang en doelen voor Riley" }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Voortgang en doelen" }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "Voortgang en doelen voor Riley",
    });
    expect(
      within(dialog).getByRole("heading", {
        name: "Voortgang en doelen voor Riley",
      }),
    ).not.toBeNull();
    expect(
      within(dialog).getByText("Persoonlijke voortgang en gezinsdoel."),
    ).not.toBeNull();
    expect(
      within(dialog).queryByText(
        "Bekijk persoonlijke voortgang en het gezinsdoel zonder de pagina te vergroten.",
      ),
    ).toBeNull();
    expect(within(dialog).getByText("Read before bed")).not.toBeNull();
    expect(within(dialog).getByText("Gezinsdoel")).not.toBeNull();
    expect(within(dialog).getByText("Board game night")).not.toBeNull();
  });

  it("opens history in a bounded dialog with memories and appreciation", async () => {
    const user = userEvent.setup();
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Herinneringen" }));

    const dialog = screen.getByRole("dialog", {
      name: "Herinneringen voor Riley",
    });
    expect(
      within(dialog).getByText("Waarderingen en vieringen."),
    ).not.toBeNull();
    expect(
      within(dialog).queryByText(
        "Lees waarderingen en vieringen terug in een begrensd overzicht.",
      ),
    ).toBeNull();
    expect(
      within(dialog).getByText("Vieringen om te onthouden"),
    ).not.toBeNull();
    expect(within(dialog).getByText("Family Picnic")).not.toBeNull();
    expect(within(dialog).getByText("Waarderingen")).not.toBeNull();
    expect(within(dialog).getByText("Helped set the table")).not.toBeNull();
  });

  it("opens child settings contextually and keeps them out of the landing view", async () => {
    const user = userEvent.setup();
    render(
      <FamilyMemberPage
        member={familyMembers[2]}
        onBack={vi.fn()}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByText("Persoonlijke gegevens")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Ouderinstellingen" }));

    const dialog = screen.getByRole("dialog", {
      name: "Instellingen voor Riley",
    });
    expect(
      within(dialog).getByText("Werk profielgegevens en gezinsopties bij."),
    ).not.toBeNull();
    expect(
      within(dialog).queryByText(
        "Werk profielgegevens en gezinsopties bij in een begrensde beheerweergave.",
      ),
    ).toBeNull();
    expect(
      within(dialog).getByLabelText("Riley instellingen voor volwassenen"),
    ).not.toBeNull();
    expect(within(dialog).getByText("Persoonlijke gegevens")).not.toBeNull();
    expect(
      within(dialog).getByRole("heading", { name: "Uiterlijk" }),
    ).not.toBeNull();
    expect(
      within(dialog).queryByText("Current avatar configuration"),
    ).toBeNull();
  });

  it("surfaces Gezinslid toevoegen inside the settings dialog household section", async () => {
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

    await user.click(screen.getByRole("button", { name: "Ouderinstellingen" }));
    const dialog = screen.getByRole("dialog", {
      name: "Instellingen voor Riley",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Gezinslid toevoegen" }),
    );

    expect(onAddFamilyMember).toHaveBeenCalledOnce();
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

    await user.click(screen.getByRole("button", { name: "Instellingen" }));
    const dialog = screen.getByRole("dialog", {
      name: "Instellingen voor Alex",
    });

    await user.clear(within(dialog).getByLabelText("Name"));
    await user.type(within(dialog).getByLabelText("Name"), "Alex Parent");
    await user.selectOptions(
      within(dialog).getByLabelText("Volwassene / kind"),
      "child",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Gegevens opslaan" }),
    );
    expect(
      within(dialog).getByText("Geboortedatum is verplicht voor kinderen."),
    ).not.toBeNull();

    await user.type(within(dialog).getByLabelText("Verjaardag"), "2015-05-06");
    await user.click(
      within(dialog).getByRole("button", { name: "Gegevens opslaan" }),
    );
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

    await user.click(screen.getByRole("button", { name: "Instellingen" }));
    const dialog = screen.getByRole("dialog", {
      name: "Instellingen voor Alex",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Gezinslid verwijderen" }),
    );
    expect(onRemove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "alex" }),
    );
  });

  it("owns avatar editing with the existing avatar editor workflow", async () => {
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
    await user.click(
      within(screen.getByLabelText("Avatarkeuzes voor Alex navigatie"))
        .getByText("Haar")
        .closest("button")!,
    );
    await user.click(
      within(screen.getByLabelText("Avatarkeuzes voor Alex")).getByRole(
        "button",
        { name: /Speelse krullen/i },
      ),
    );
    await user.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "alex",
        avatarSelection: expect.objectContaining({
          selections: expect.objectContaining({
            hairStyle: "hair.style.curly-playful",
          }),
        }),
        avatarV2Config: expect.objectContaining({ hairStyle: "curlyPlayful" }),
      }),
    );
  });
});
