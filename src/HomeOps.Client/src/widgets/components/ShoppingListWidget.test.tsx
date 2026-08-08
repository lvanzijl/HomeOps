import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShoppingListWidget } from "./ShoppingListWidget";

const apiClient = {} as never;

vi.mock("../../shopping/listsApi", () => ({
  isDedicatedShoppingListName: (name: string | undefined) => ["shopping", "boodschappen"].includes(name?.trim().toLowerCase() ?? ""),
  createListsApiClient: () => apiClient,
  loadShoppingPageLists: vi.fn(),
  createShoppingList: vi.fn(),
  createNamedShoppingList: vi.fn(),
  addShoppingListItem: vi.fn(),
  loadShoppingHistorySuggestions: vi.fn(),
  importLegacyShoppingHistory: vi.fn(),
  toggleShoppingListItem: vi.fn(),
  updateShoppingListItem: vi.fn(),
  removeShoppingListItem: vi.fn(),
  undoShoppingListItem: vi.fn(),
  renameShoppingList: vi.fn(),
  archiveShoppingList: vi.fn(),
  restoreShoppingList: vi.fn(),
  permanentlyDeleteShoppingList: vi.fn(),
}));

vi.mock("../../home/familyMembersApi", () => ({
  loadFamilyMembers: vi.fn(async () => [
    {
      id: "riley",
      name: "Riley",
      displayColor: "#bbf7d0",
      initials: "R",
      memberKind: "child",
      avatarSelection: undefined,
    },
  ]),
}));

vi.mock("../../knownPeople/knownPeopleApi", () => ({
  listKnownPeople: vi.fn(async () => [
    {
      id: "known-1",
      displayName: "Grandma",
      relationshipType: "grandparent",
      scope: "shared",
      initials: "G",
      avatarSelection: { schemaVersion: "avatar-catalog-v1", selections: {} },
    },
  ]),
}));

async function mockedListsApi() {
  return await import("../../shopping/listsApi");
}

const widgetProps = {
  definition: {
    id: "shopping-list-mvp",
    type: "shoppingList" as const,
    title: "Shopping List",
    settings: {},
  },
  instance: {
    id: "home-shopping-list-widget",
    widgetDefinitionId: "shopping-list-mvp",
    title: "Shopping List",
    settings: {},
  },
};

afterEach(() => cleanup());

describe("ShoppingListWidget API-backed behavior", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.localStorage.clear();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingHistorySuggestions).mockResolvedValue([]);
    vi.mocked(listsApi.importLegacyShoppingHistory).mockResolvedValue([]);
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValue({
      shoppingList: {
        listId: "shopping-list-id",
        name: "Shopping",
        updatedUtc: new Date("2026-08-08T10:00:00Z"),
        activeItemCount: 2,
        completedItemCount: 1,
        deletedItemCount: 0,
        totalItemCount: 3,
        items: [
          {
            id: "bread",
            label: "Bread",
            completed: false,
            deleted: false,
            preferredStore: "Supermarket",
            quantity: null,
            updatedUtc: new Date("2026-08-08T10:00:00Z"),
            storeSuggestions: [
              { store: "Supermarket", purchaseCount: 4 },
              { store: "Corner Shop", purchaseCount: 1 },
            ],
          },
          {
            id: "coffee",
            label: "Coffee",
            completed: true,
            deleted: false,
            preferredStore: null,
          },
          {
            id: "batteries",
            label: "Batteries",
            completed: false,
            deleted: false,
            preferredStore: null,
            storeSuggestions: [{ store: "Hardware Store", purchaseCount: 3 }],
          },
        ],
      },
      otherLists: [
        {
          listId: "packing-list-id",
          name: "Vacation Packing",
          updatedUtc: new Date("2026-08-08T10:00:00Z"),
          activeItemCount: 1,
          completedItemCount: 0,
          deletedItemCount: 0,
          totalItemCount: 1,
          items: [
            {
              id: "sunscreen",
              label: "Sunscreen",
              completed: false,
              deleted: false,
              preferredStore: null,
              updatedUtc: new Date("2026-08-08T10:00:00Z"),
            },
          ],
        },
        {
          listId: "camping-list-id",
          name: "Camping",
          updatedUtc: new Date("2026-08-08T10:00:00Z"),
          activeItemCount: 1,
          completedItemCount: 0,
          deletedItemCount: 0,
          totalItemCount: 1,
          items: [
            {
              id: "tent",
              label: "Tent",
              completed: false,
              deleted: false,
              preferredStore: null,
            },
          ],
        },
      ],
      archivedLists: [],
    });
    vi.mocked(listsApi.createShoppingList).mockResolvedValue({
      listId: "shopping-list-id",
      items: [],
    });
    vi.mocked(listsApi.addShoppingListItem).mockResolvedValue({
      id: "apples",
      label: "Apples",
      completed: false,
      deleted: false,
      preferredStore: null,
    });
    vi.mocked(listsApi.toggleShoppingListItem).mockResolvedValue({
      id: "bread",
      label: "Bread",
      completed: true,
      deleted: false,
      preferredStore: "Supermarket",
    });
    vi.mocked(listsApi.updateShoppingListItem).mockResolvedValue({
      id: "bread",
      label: "Wholegrain bread",
      quantity: "2 loaves",
      completed: false,
      deleted: false,
      preferredStore: "Supermarket",
      decorativeAvatar: {
        referenceType: "knownPerson",
        referenceId: "known-1",
      },
      updatedUtc: new Date("2026-08-08T11:00:00Z"),
    });
    vi.mocked(listsApi.removeShoppingListItem).mockResolvedValue({
      id: "bread",
      label: "Bread",
      completed: true,
      deleted: true,
      preferredStore: "Supermarket",
    });
    vi.mocked(listsApi.undoShoppingListItem).mockResolvedValue({
      id: "bread",
      label: "Bread",
      completed: false,
      deleted: false,
      preferredStore: "Supermarket",
      storeSuggestions: [
        { store: "Supermarket", purchaseCount: 4 },
        { store: "Corner Shop", purchaseCount: 1 },
      ],
    });
    vi.mocked(listsApi.createNamedShoppingList).mockResolvedValue({
      listId: "weekend-list-id",
      name: "Weekend",
      updatedUtc: new Date("2026-08-08T11:00:00Z"),
      activeItemCount: 0,
      completedItemCount: 0,
      deletedItemCount: 0,
      totalItemCount: 0,
      items: [],
    });
    vi.mocked(listsApi.archiveShoppingList).mockResolvedValue({
      listId: "shopping-list-id",
      name: "Shopping",
      archivedUtc: new Date("2026-08-08T11:00:00Z"),
      updatedUtc: new Date("2026-08-08T11:00:00Z"),
      activeItemCount: 2,
      completedItemCount: 1,
      deletedItemCount: 0,
      totalItemCount: 3,
    });
    vi.mocked(listsApi.restoreShoppingList).mockResolvedValue({
      listId: "archived-list-id",
      name: "Feest",
      updatedUtc: new Date("2026-08-08T12:00:00Z"),
      activeItemCount: 1,
      completedItemCount: 1,
      deletedItemCount: 0,
      totalItemCount: 2,
      items: [],
    });
    vi.mocked(listsApi.permanentlyDeleteShoppingList).mockResolvedValue();
  });

  it("loads shopping list items from the API-backed list service", async () => {
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    expect(await screen.findAllByText("Bread")).not.toBeNull();
    expect(screen.queryByText("Coffee")).toBeNull();
    expect(screen.queryByText("Ondersteunende lijsten")).toBeNull();
    expect(screen.getAllByText("Laatst toegevoegd: Batteries")).toHaveLength(1);
    expect(listsApi.loadShoppingPageLists).toHaveBeenCalledWith(apiClient);
  });

  it("adds an item through the API-backed list service", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText("Bread");
    const quickAddForm = screen.getByRole("form", {
      name: "Voeg item toe aan Boodschappen",
    });
    await user.type(
      within(quickAddForm).getByPlaceholderText("Voeg toe, bijvoorbeeld melk"),
      "Apples",
    );
    await user.click(
      within(quickAddForm).getByRole("button", { name: "Toevoegen" }),
    );
    expect(listsApi.addShoppingListItem).toHaveBeenCalledWith(
      apiClient,
      "shopping-list-id",
      "Apples",
    );
    expect((await screen.findAllByText("Apples")).length).toBeGreaterThan(0);
  });

  it("edits label, quantity, store, avatar, and history attribution in the bounded editor", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText("Bread");
    await user.click(within(screen.getAllByText("Bread")[0].closest("li")!).getByRole("button", { name: "Aanpassen" }));
    const dialog = screen.getByRole("dialog", { name: "Boodschap aanpassen" });
    const name = within(dialog).getByLabelText("Naam");
    await user.clear(name);
    await user.type(name, "Wholegrain bread");
    await user.type(within(dialog).getByLabelText("Hoeveelheid"), "2 loaves");
    await user.selectOptions(within(dialog).getByLabelText("Decoratieve avatar voor Wholegrain bread"), "knownPerson:known-1");
    await user.click(within(dialog).getByRole("button", { name: "Wijzigingen opslaan" }));

    expect(listsApi.updateShoppingListItem).toHaveBeenCalledWith(
      apiClient,
      "shopping-list-id",
      expect.objectContaining({ id: "bread" }),
      expect.objectContaining({ label: "Wholegrain bread", quantity: "2 loaves", preservePurchaseHistory: true }),
    );
    expect(await screen.findByText("Boodschap is bijgewerkt.")).not.toBeNull();
    expect((await screen.findAllByText("Wholegrain bread")).length).toBeGreaterThan(0);
  });

  it("toggles and removes items through the API-backed list service", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    const bread = (await screen.findAllByText("Bread"))[0];
    await user.click(within(bread.closest("label")!).getByRole("checkbox"));
    await waitFor(() =>
      expect(listsApi.toggleShoppingListItem).toHaveBeenCalledWith(
        apiClient,
        "shopping-list-id",
        "bread",
      ),
    );

    await user.click(screen.getByRole("button", { name: /Afgevinkt/i }));
    const completedBread = (await screen.findAllByText("Bread"))[0];
    await user.click(
      within(completedBread.closest("li")!).getByRole("button", {
        name: "Weg",
      }),
    );
    expect(listsApi.removeShoppingListItem).toHaveBeenCalledWith(
      apiClient,
      "shopping-list-id",
      "bread",
    );
    expect(screen.queryByText("Verwijderd")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Herstellen/i }));
    expect(await screen.findByText("Verwijderd")).not.toBeNull();
  });

  it("groups items by store while keeping row actions compact", async () => {
    render(<ShoppingListWidget {...widgetProps} />);

    expect(
      await screen.findByRole("heading", { name: "Supermarket" }),
    ).not.toBeNull();
    expect(
      screen.getAllByRole("heading", { name: "Zonder winkel" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Batteries")[0]).not.toBeNull();
    expect(screen.queryByText("Snel toevoegen")).toBeNull();
    expect(
      screen.queryByText("Altijd zichtbaar tijdens het boodschappenrondje."),
    ).toBeNull();

    expect(within(screen.getAllByText("Bread")[0].closest("li")!).getByRole("button", { name: "Aanpassen" })).not.toBeNull();
    expect(screen.queryByText("Avatar")).toBeNull();
    expect(screen.queryByText("Winkel")).toBeNull();
  });

  it("shows other lists and allows managing a non-Shopping list from the Shopping page", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.addShoppingListItem).mockResolvedValueOnce({
      id: "passport",
      label: "Passport",
      completed: false,
      deleted: false,
      preferredStore: null,
    });
    vi.mocked(listsApi.toggleShoppingListItem).mockResolvedValueOnce({
      id: "sunscreen",
      label: "Sunscreen",
      completed: true,
      deleted: false,
      preferredStore: null,
    });

    render(<ShoppingListWidget {...widgetProps} />);

    expect(
      await screen.findByRole("heading", { name: "Actieve lijst per winkel" }),
    ).not.toBeNull();
    expect(screen.queryByText("Vacation Packing")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Lijsten/i }));
    expect(await screen.findByText("Vacation Packing")).not.toBeNull();
    expect(screen.getByText("Camping")).not.toBeNull();
    expect(screen.getByText("Sunscreen")).not.toBeNull();

    await user.type(
      within(screen.getByLabelText("Vacation Packing")).getByPlaceholderText(
        "Voeg toe, bijvoorbeeld melk",
      ),
      "Passport",
    );
    await user.click(
      within(screen.getByLabelText("Vacation Packing")).getByRole("button", {
        name: "Toevoegen",
      }),
    );
    expect(listsApi.addShoppingListItem).toHaveBeenCalledWith(
      apiClient,
      "packing-list-id",
      "Passport",
    );
    expect(await screen.findByText("Passport")).not.toBeNull();

    await user.click(
      within(screen.getByText("Sunscreen").closest("label")!).getByRole(
        "checkbox",
      ),
    );
    expect(listsApi.toggleShoppingListItem).toHaveBeenCalledWith(
      apiClient,
      "packing-list-id",
      "sunscreen",
    );
  });

  it("keeps list management available without leading the first scan", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);

    const bread = (await screen.findAllByText("Bread"))[0];
    const quickAddForm = screen.getByRole("form", {
      name: "Voeg item toe aan Boodschappen",
    });
    expect(screen.queryByLabelText("Boodschappen beheer")).toBeNull();
    expect(quickAddForm).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Actieve lijst per winkel" }),
    ).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Beheer" }));
    const shoppingSurface = await screen.findByLabelText("Boodschappen beheer");
    await user.clear(within(shoppingSurface).getByLabelText("Lijstnaam"));
    await user.type(
      within(shoppingSurface).getByLabelText("Lijstnaam"),
      "Groceries",
    );
    await user.click(
      within(shoppingSurface).getByRole("button", { name: "Hernoemen" }),
    );

    expect(listsApi.renameShoppingList).toHaveBeenCalledWith(
      apiClient,
      "shopping-list-id",
      "Groceries",
    );
    expect(
      within(shoppingSurface).getByRole("button", { name: "Archiveren" }),
    ).not.toBeNull();
    expect(
      within(shoppingSurface).getByRole("button", { name: "Permanent verwijderen" }),
    ).not.toBeNull();
  });

  it("edits an item in an additional list using that list's identity", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.updateShoppingListItem).mockResolvedValueOnce({
      id: "sunscreen", label: "SPF 50", completed: false, deleted: false, preferredStore: null, updatedUtc: new Date("2026-08-08T11:00:00Z"),
    });
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText("Bread");
    await user.click(screen.getByRole("button", { name: /Lijsten/i }));
    const sunscreenRow = screen.getByText("Sunscreen").closest("li")!;
    await user.click(within(sunscreenRow).getByRole("button", { name: "Aanpassen" }));
    const editor = screen.getByRole("dialog", { name: "Boodschap aanpassen" });
    await user.clear(within(editor).getByLabelText("Naam"));
    await user.type(within(editor).getByLabelText("Naam"), "SPF 50");
    await user.click(within(editor).getByRole("button", { name: "Wijzigingen opslaan" }));

    expect(listsApi.updateShoppingListItem).toHaveBeenCalledWith(
      apiClient, "packing-list-id", expect.objectContaining({ id: "sunscreen" }), expect.objectContaining({ label: "SPF 50" }),
    );
  });

  it("never uploads legacy browser history until the household explicitly chooses to import it", async () => {
    window.localStorage.setItem("homeops.shopping.history.v1", JSON.stringify(["Old milk", "Bread"]));
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.importLegacyShoppingHistory).mockResolvedValue([]);
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText("Bread");
    expect(listsApi.importLegacyShoppingHistory).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Beheer" }));
    expect(screen.getByText("Oude suggesties op dit apparaat")).not.toBeNull();
    expect(listsApi.importLegacyShoppingHistory).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Overnemen" }));

    expect(listsApi.importLegacyShoppingHistory).toHaveBeenCalledWith(apiClient, ["Old milk", "Bread"]);
    expect(window.localStorage.getItem("homeops.shopping.history.v1")).toBeNull();
  });

  it("creates an additional named list from the always-available bounded directory", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText("Bread");

    await user.click(screen.getByRole("button", { name: /Lijsten/i }));
    await user.type(screen.getByLabelText("Nieuwe lijst"), "Weekend");
    await user.click(screen.getByRole("button", { name: "Lijst maken" }));

    expect(listsApi.createNamedShoppingList).toHaveBeenCalledWith(apiClient, "Weekend");
    expect(await screen.findByText("Weekend is gemaakt en geopend.")).not.toBeNull();
    expect(screen.getByRole("tab", { name: /Weekend/i })).not.toBeNull();
  });

  it("requires an in-dialog confirmation before archiving the current list", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText("Bread");

    await user.click(screen.getByRole("checkbox", { name: "Bread" }));
    await user.click(screen.getByRole("button", { name: "Beheer" }));
    await user.click(screen.getByRole("button", { name: "Archiveren" }));
    const confirmation = screen.getByRole("alertdialog", { name: "Archiveren bevestigen" });
    expect(within(confirmation).getByText(/1 open, 2 afgevinkte/)).not.toBeNull();
    expect(listsApi.archiveShoppingList).not.toHaveBeenCalled();

    await user.click(within(confirmation).getByRole("button", { name: "Ja, archiveren" }));
    expect(listsApi.archiveShoppingList).toHaveBeenCalledWith(apiClient, "shopping-list-id", new Date("2026-08-08T10:00:00Z"));
    expect(await screen.findByText("Boodschappen is gearchiveerd.")).not.toBeNull();
  });

  it("restores or permanently deletes archived lists from the same directory surface", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    const archivedSummary = {
      listId: "archived-list-id",
      name: "Feest",
      archivedUtc: new Date("2026-08-07T10:00:00Z"),
      updatedUtc: new Date("2026-08-07T10:00:00Z"),
      activeItemCount: 1,
      completedItemCount: 1,
      deletedItemCount: 0,
      totalItemCount: 2,
    };
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({
      shoppingList: { listId: "shopping-list-id", name: "Shopping", updatedUtc: new Date("2026-08-08T10:00:00Z"), items: [] },
      otherLists: [],
      archivedLists: [archivedSummary],
    });

    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findByText("Begin met je eerste boodschap");
    await user.click(screen.getByRole("button", { name: /Lijsten/i }));
    expect(await screen.findByText("Feest")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Herstellen" }));
    expect(listsApi.restoreShoppingList).toHaveBeenCalledWith(apiClient, archivedSummary);
    expect(await screen.findByText("Feest is hersteld en geopend.")).not.toBeNull();

    cleanup();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({
      shoppingList: { listId: "shopping-list-id", name: "Shopping", updatedUtc: new Date("2026-08-08T10:00:00Z"), items: [] },
      otherLists: [],
      archivedLists: [archivedSummary],
    });
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findByText("Begin met je eerste boodschap");
    await user.click(screen.getByRole("button", { name: /Lijsten/i }));
    await user.click(screen.getByRole("button", { name: "Permanent verwijderen" }));
    const confirmation = screen.getByRole("alertdialog", { name: "Gearchiveerde lijst permanent verwijderen bevestigen" });
    expect(within(confirmation).getByText(/2 items/)).not.toBeNull();
    await user.click(within(confirmation).getByRole("button", { name: "Ja, permanent verwijderen" }));
    expect(listsApi.permanentlyDeleteShoppingList).toHaveBeenCalledWith(apiClient, "archived-list-id", archivedSummary.updatedUtc);
  });

  it("guides households when the first list has no items yet", async () => {
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({
      shoppingList: { listId: "shopping-list-id", name: "Shopping", items: [] },
      otherLists: [],
    });
    render(<ShoppingListWidget {...widgetProps} />);
    expect(
      await screen.findByText("Begin met je eerste boodschap"),
    ).not.toBeNull();
    expect(
      screen.getByText("Voeg iets toe om je lijst te starten."),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Voeg meteen iets toe." }),
    ).not.toBeNull();
  });

  it("uses concise helper copy in the shopping dialogs", async () => {
    const user = userEvent.setup();
    render(<ShoppingListWidget {...widgetProps} />);

    await screen.findAllByText("Bread");

    await user.click(screen.getByRole("button", { name: /Afgevinkt/i }));
    expect(
      await screen.findByText("Bekijk wat al is afgehandeld."),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "Bekijk wat al is afgehandeld zonder de actieve lijst te verplaatsen.",
      ),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Sluit boodschappenpaneel" }),
    );

    await user.click(screen.getByRole("button", { name: /Herstellen/i }));
    expect(
      await screen.findByText("Zet recent verwijderde boodschappen terug."),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "Open recente verwijderingen in een begrensd herstelvak.",
      ),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Sluit boodschappenpaneel" }),
    );

    await user.click(screen.getByRole("button", { name: /Lijsten/i }));
    expect(await screen.findByText("Maak, open, archiveer of herstel een lijst.")).not.toBeNull();
    expect(
      screen.queryByText(
        "Schakel naar ondersteunende lijsten zonder de standaardweergave uit te breiden.",
      ),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Sluit boodschappenpaneel" }),
    );

    await user.click(screen.getByRole("button", { name: "Beheer" }));
    expect(
      await screen.findByText("Hernoem, archiveer of verwijder deze lijst."),
    ).not.toBeNull();
    expect(
      screen.queryByText(
        "Hernoem, archiveer of verwijder de huidige boodschappenlijst op aanvraag.",
      ),
    ).toBeNull();
  });

  it("can create the first Shopping list when no lists exist", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({
      shoppingList: { listId: null, name: "Shopping", items: [] },
      otherLists: [],
    });
    render(<ShoppingListWidget {...widgetProps} />);

    await user.click(
      await screen.findByRole("button", { name: "Maak boodschappenlijst" }),
    );

    expect(listsApi.createShoppingList).toHaveBeenCalledWith(apiClient);
    expect(
      await screen.findByRole("link", { name: "Voeg meteen iets toe." }),
    ).not.toBeNull();
  });
});
