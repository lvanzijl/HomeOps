import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAvatarSelection } from "../avatarCatalog/avatarCatalogAdapter";
import type { FamilyMember } from "../home/familyMembers";
import { FamilyAdministration } from "./FamilyAdministration";

const api = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  dependencies: vi.fn(),
  removed: vi.fn(),
  restore: vi.fn(),
}));

vi.mock("./familyAdministrationApi", () => ({
  familyAdministrationApi: api,
}));

const alex: FamilyMember = {
  id: "alex",
  name: "Alex",
  initials: "A",
  memberKind: "adult",
  dateOfBirth: null,
  displayColor: "#c7d2fe",
  avatarSelection: defaultAvatarSelection,
};

const removedAlex = {
  member: alex,
  deletedUtc: "2026-07-27T12:00:00.000Z",
  dependencies: { tasks: 2, rooms: 1, goals: 1, privateKnownPeople: 3 },
};

afterEach(() => cleanup());

describe("FamilyAdministration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.create.mockResolvedValue(alex);
    api.update.mockResolvedValue(alex);
    api.remove.mockResolvedValue(undefined);
    api.dependencies.mockResolvedValue(removedAlex.dependencies);
    api.removed.mockResolvedValue([]);
    api.restore.mockResolvedValue(alex);
  });

  it("keeps Add available for an empty roster and uses the shared profile form", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(<FamilyAdministration members={[]} onChanged={onChanged} />);

    expect(screen.getByText("Er zijn nog geen actieve gezinsleden. Voeg iemand toe om te beginnen.")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Gezinslid toevoegen" }));

    const form = screen.getByLabelText("Gezinslid toevoegen");
    await user.type(within(form).getByLabelText("Naam"), "Taylor");
    await user.click(within(form).getByRole("button", { name: "Gezinslid toevoegen" }));

    await waitFor(() => expect(api.create).toHaveBeenCalledWith(expect.objectContaining({
      name: "Taylor",
      initials: "T",
      memberKind: "adult",
    })));
    expect(onChanged).toHaveBeenCalledOnce();
    expect((await screen.findByRole("status")).textContent).toContain("Taylor is opgeslagen.");
  });

  it("edits through the same form and retains the existing avatar selection", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(<FamilyAdministration members={[alex]} onChanged={onChanged} />);

    await user.click(within(screen.getByRole("list", { name: "Actieve gezinsleden" })).getByRole("button", { name: "Bewerken" }));
    const form = screen.getByLabelText("Gezinslid bewerken");
    const name = within(form).getByLabelText("Naam");
    await user.clear(name);
    await user.type(name, "Alexandra");
    await user.click(within(form).getByRole("button", { name: "Gegevens opslaan" }));

    await waitFor(() => expect(api.update).toHaveBeenCalledWith(expect.objectContaining({
      id: "alex",
      name: "Alexandra",
      initials: "A",
      avatarSelection: defaultAvatarSelection,
    })));
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it("shows dependencies before soft deletion and restores the removed member", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn().mockResolvedValue(undefined);
    api.removed.mockResolvedValueOnce([]).mockResolvedValue([removedAlex]);
    render(<FamilyAdministration members={[alex]} onChanged={onChanged} />);

    await user.click(within(screen.getByRole("list", { name: "Actieve gezinsleden" })).getByRole("button", { name: "Verwijderen" }));
    const confirmation = await screen.findByLabelText("Gezinslid verwijderen");
    expect(within(confirmation).getByText(/2 taken, 1 kamers, 1 doelen en 3 privécontacten/)).not.toBeNull();

    await user.click(within(confirmation).getByRole("button", { name: "Verwijderen bevestigen" }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("alex"));

    const removedList = await screen.findByRole("list", { name: "Verwijderde gezinsleden" });
    await user.click(within(removedList).getByRole("button", { name: "Herstellen" }));
    await waitFor(() => expect(api.restore).toHaveBeenCalledWith("alex"));
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  it("keeps a removed member visible when restore reports a conflict", async () => {
    const user = userEvent.setup();
    api.removed.mockResolvedValue([removedAlex]);
    api.restore.mockRejectedValue(new Error("Er is al een actief gezinslid met deze naam."));
    render(<FamilyAdministration members={[]} onChanged={vi.fn()} />);

    const removedList = await screen.findByRole("list", { name: "Verwijderde gezinsleden" });
    await user.click(within(removedList).getByRole("button", { name: "Herstellen" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Er is al een actief gezinslid met deze naam.");
    expect(within(removedList).getByText("Alex")).not.toBeNull();
  });
});
