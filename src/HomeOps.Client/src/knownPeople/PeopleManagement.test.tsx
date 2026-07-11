import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAvatarSelectionFixture } from "../avatarCatalog/avatarCatalogFixtures";
import type { FamilyMember } from "../home/familyMembers";
import type { KnownPerson } from "./knownPeople";
import { PeopleManagement } from "./PeopleManagement";

const {
  listKnownPeople,
  createKnownPerson,
  updateKnownPerson,
  deleteKnownPerson,
} = vi.hoisted(() => ({
  listKnownPeople: vi.fn(),
  createKnownPerson: vi.fn(),
  updateKnownPerson: vi.fn(),
  deleteKnownPerson: vi.fn(),
}));
vi.mock("./knownPeopleApi", () => ({
  listKnownPeople,
  createKnownPerson,
  updateKnownPerson,
  deleteKnownPerson,
}));

const avatarSelection = createAvatarSelectionFixture();
const members: readonly FamilyMember[] = [
  {
    id: "thomas",
    name: "Thomas",
    displayColor: "#ddd",
    initials: "T",
    memberKind: "child",
    avatarSelection,
  },
  {
    id: "robin",
    name: "Robin",
    displayColor: "#eee",
    initials: "R",
    memberKind: "child",
    avatarSelection,
  },
];
const people: readonly KnownPerson[] = [
  {
    id: "shared-1",
    displayName: "Oma Els",
    nickname: "Oma",
    relationshipType: "grandparent",
    customRelationshipLabel: null,
    scope: "shared",
    familyMemberId: null,
    initials: "OE",
    avatarSelection,
  },
  {
    id: "private-1",
    displayName: "Juf Noor",
    nickname: null,
    relationshipType: "teacher",
    customRelationshipLabel: null,
    scope: "privateToMember",
    familyMemberId: "thomas",
    initials: "JN",
    avatarSelection,
  },
  {
    id: "private-2",
    displayName: "Mila",
    nickname: "Mi",
    relationshipType: "friend",
    customRelationshipLabel: null,
    scope: "privateToMember",
    familyMemberId: "robin",
    initials: "M",
    avatarSelection,
  },
];
function renderPeople(data: readonly KnownPerson[] = people) {
  listKnownPeople.mockResolvedValue(data);
  render(<PeopleManagement members={members} />);
}
beforeEach(() => {
  vi.clearAllMocks();
  createKnownPerson.mockImplementation(async (input) => ({
    ...input,
    id: "created-1",
  }));
  updateKnownPerson.mockImplementation(async (input) => input);
  deleteKnownPerson.mockResolvedValue(undefined);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => cleanup());

describe("PeopleManagement", () => {
  it("shows loading, family summary, shared and private relationship groups", async () => {
    renderPeople();
    expect(screen.getByText("Bekenden laden…")).not.toBeNull();
    expect(
      await screen.findByRole("heading", { name: "Gezinsleden" }),
    ).not.toBeNull();
    expect(
      within(screen.getByLabelText("Gezinsleden")).getByText("Thomas"),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Gedeelde bekenden" }),
    ).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Familie" })).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Leerkrachten" }),
    ).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Vrienden" })).not.toBeNull();
  });
  it("shows empty and error states", async () => {
    renderPeople([]);
    expect(
      await screen.findByText("Nog geen bekenden toegevoegd."),
    ).not.toBeNull();
    cleanup();
    listKnownPeople.mockRejectedValue(new Error("nope"));
    render(<PeopleManagement members={members} />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "niet worden geladen",
    );
  });
  it("searches display, nickname, custom label and relationship display text", async () => {
    renderPeople([
      {
        ...people[0],
        customRelationshipLabel: "Pianoles",
        relationshipType: "other",
      },
    ]);
    await screen.findByText("Oma Els");
    const search = screen.getByPlaceholderText(
      "Zoek op naam, bijnaam of relatie",
    );
    await userEvent.type(search, "piano");
    expect(screen.getByText("Oma Els")).not.toBeNull();
    await userEvent.clear(search);
    await userEvent.type(search, "teacher");
    expect(
      screen.getByText("Geen bekenden gevonden voor deze zoekopdracht."),
    ).not.toBeNull();
  });
  it("creates, edits, deletes, switches scope and toggles FamilyMember selector visibility", async () => {
    const user = userEvent.setup();
    renderPeople();
    await screen.findByText("Oma Els");
    await user.click(screen.getByRole("button", { name: "Bekende toevoegen" }));
    const createDialog = screen.getByRole("dialog", {
      name: "Bekende toevoegen",
    });
    expect(
      within(createDialog).getByTestId("known-person-form"),
    ).not.toBeNull();
    expect(document.activeElement).toBe(
      within(createDialog).getByRole("button", { name: "Sluiten" }),
    );
    expect(screen.queryByText("Gezinslid")).toBeNull();
    await user.click(screen.getByLabelText("Bij gezinslid"));
    expect(screen.getByText("Gezinslid")).not.toBeNull();
    await user.click(screen.getByLabelText("Gedeeld"));
    expect(screen.queryByText("Gezinslid")).toBeNull();
    expect(
      screen.queryByTestId("known-person-form")?.getAttribute("role"),
    ).toBeNull();
    await user.type(screen.getByLabelText("Naam"), "Coach Bas");
    await user.selectOptions(screen.getByLabelText("Relatie"), "coach");
    await user.click(screen.getByRole("button", { name: "Opslaan" }));
    await waitFor(() =>
      expect(createKnownPerson).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: "Coach Bas",
          scope: "shared",
          familyMemberId: null,
        }),
      ),
    );
    await user.click(screen.getByRole("button", { name: /Oma Els/ }));
    await user.clear(screen.getByLabelText("Bijnaam"));
    await user.type(screen.getByLabelText("Bijnaam"), "Lieve oma");
    await user.click(screen.getByRole("button", { name: "Opslaan" }));
    await waitFor(() =>
      expect(updateKnownPerson).toHaveBeenCalledWith(
        expect.objectContaining({ id: "shared-1", nickname: "Lieve oma" }),
      ),
    );
    await user.click(screen.getByRole("button", { name: /Oma Els/ }));
    await user.click(screen.getByRole("button", { name: "Verwijderen" }));
    await waitFor(() =>
      expect(deleteKnownPerson).toHaveBeenCalledWith("shared-1"),
    );
  });
  it("reuses KnownPersonAvatarEditor and AvatarSelectionEditor for avatar editing", async () => {
    const user = userEvent.setup();
    renderPeople();
    await user.click(await screen.findByRole("button", { name: /Oma Els/ }));
    await user.click(screen.getByRole("button", { name: "Avatar bewerken" }));
    expect(
      within(
        screen.getByRole("dialog", { name: /Avatar van Oma Els bewerken/ }),
      ).getByTestId("avatar-selection-live-preview").innerHTML,
    ).toContain("<svg");
  });
});
