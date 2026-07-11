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
  createListsApiClient: () => apiClient,
  loadShoppingPageLists: vi.fn(),
  createShoppingList: vi.fn(),
  addShoppingListItem: vi.fn(),
  toggleShoppingListItem: vi.fn(),
  updateShoppingListItemStore: vi.fn(),
  updateShoppingListItemDecorativeAvatar: vi.fn(),
  removeShoppingListItem: vi.fn(),
  undoShoppingListItem: vi.fn(),
  renameShoppingList: vi.fn(),
  archiveShoppingList: vi.fn(),
  deleteShoppingList: vi.fn(),
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
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValue({
      shoppingList: {
        listId: "shopping-list-id",
        name: "Shopping",
        items: [
          {
            id: "bread",
            label: "Bread",
            completed: false,
            deleted: false,
            preferredStore: "Supermarket",
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
          items: [
            {
              id: "sunscreen",
              label: "Sunscreen",
              completed: false,
              deleted: false,
              preferredStore: null,
            },
          ],
        },
        {
          listId: "camping-list-id",
          name: "Camping",
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
    vi.mocked(listsApi.updateShoppingListItemStore).mockResolvedValue({
      id: "coffee",
      label: "Coffee",
      completed: true,
      deleted: false,
      preferredStore: "Drugstore",
    });
    vi.mocked(
      listsApi.updateShoppingListItemDecorativeAvatar,
    ).mockResolvedValue({
      id: "bread",
      label: "Bread",
      completed: false,
      deleted: false,
      preferredStore: "Supermarket",
      decorativeAvatar: {
        referenceType: "knownPerson",
        referenceId: "known-1",
      },
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

  it("allows manual decorative avatar selection and clearing", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText("Bread");

    await user.click(screen.getAllByText("Avatar")[0]);
    const avatarSelect = screen
      .getAllByLabelText("Decoratieve avatar voor Bread")
      .find((element) => element.tagName === "SELECT")!;
    await user.selectOptions(avatarSelect, "knownPerson:known-1");

    expect(
      listsApi.updateShoppingListItemDecorativeAvatar,
    ).toHaveBeenCalledWith(apiClient, "shopping-list-id", "bread", {
      referenceType: "knownPerson",
      referenceId: "known-1",
    });

    await user.selectOptions(avatarSelect, "");
    expect(
      listsApi.updateShoppingListItemDecorativeAvatar,
    ).toHaveBeenCalledWith(apiClient, "shopping-list-id", "bread", null);
  });

  it("shows deterministic Suggested entries in the manual decorative avatar picker without attaching automatically", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText("Bread");

    await user.click(screen.getAllByText("Avatar")[0]);
    const avatarSelect = screen
      .getAllByLabelText("Decoratieve avatar voor Bread")
      .find((element) => element.tagName === "SELECT")!;
    expect(
      within(avatarSelect).queryByRole("group", { name: "Voorgesteld" }),
    ).toBeNull();
    expect(
      listsApi.updateShoppingListItemDecorativeAvatar,
    ).not.toHaveBeenCalled();

    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({
      shoppingList: {
        listId: "shopping-list-id",
        name: "Shopping",
        items: [
          {
            id: "grandma-gift",
            label: "Grandma gift",
            completed: false,
            deleted: false,
            preferredStore: null,
          },
        ],
      },
      otherLists: [],
    });
    cleanup();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findByText("Grandma gift");
    await user.click(screen.getByText("Avatar"));
    const suggestedSelect = screen
      .getAllByLabelText("Decoratieve avatar voor Grandma gift")
      .find((element) => element.tagName === "SELECT")!;

    expect(
      within(suggestedSelect).getByRole("group", { name: "Voorgesteld" }),
    ).not.toBeNull();
    expect(
      within(suggestedSelect).getAllByRole("option", { name: "Grandma" })
        .length,
    ).toBeGreaterThan(0);
    expect(
      listsApi.updateShoppingListItemDecorativeAvatar,
    ).not.toHaveBeenCalled();
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

  it("groups items by store and allows store overrides", async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);

    expect(
      await screen.findByRole("heading", { name: "Supermarket" }),
    ).not.toBeNull();
    expect(
      screen.getAllByRole("heading", { name: "Zonder winkel" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Batteries")[0]).not.toBeNull();
    expect(
      document.querySelector('option[value=\"Corner Shop\"]'),
    ).not.toBeNull();
    expect(screen.queryByText("Snel toevoegen")).toBeNull();
    expect(
      screen.queryByText("Altijd zichtbaar tijdens het boodschappenrondje."),
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: /Afgevinkt/i }));
    await user.click(
      within(screen.getAllByText("Coffee")[0].closest("li")!).getAllByText(
        "Winkel",
      )[0],
    );
    const coffeeStore = screen.getByLabelText("Winkel voor Coffee");
    await user.clear(coffeeStore);
    await user.type(coffeeStore, "Drugstore");
    await user.tab();

    expect(listsApi.updateShoppingListItemStore).toHaveBeenCalledWith(
      apiClient,
      "shopping-list-id",
      "coffee",
      "Drugstore",
    );
    expect(
      await screen.findByRole("heading", { name: "Drugstore" }),
    ).not.toBeNull();
    expect(screen.queryByText("(Drugstore)")).toBeNull();
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

    await user.click(screen.getByRole("button", { name: /Andere lijsten/i }));
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
      within(shoppingSurface).getByRole("button", { name: "Verwijderen" }),
    ).not.toBeNull();
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

    await user.click(screen.getByRole("button", { name: /Andere lijsten/i }));
    expect(await screen.findByText("Open een andere lijst.")).not.toBeNull();
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
