import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShoppingListWidget } from './ShoppingListWidget';

const apiClient = {} as never;

vi.mock('../../shopping/listsApi', () => ({
  createListsApiClient: () => apiClient,
  loadShoppingPageLists: vi.fn(),
  createShoppingList: vi.fn(),
  addShoppingListItem: vi.fn(),
  toggleShoppingListItem: vi.fn(),
  updateShoppingListItemStore: vi.fn(),
  removeShoppingListItem: vi.fn(),
  undoShoppingListItem: vi.fn(),
  renameShoppingList: vi.fn(),
  archiveShoppingList: vi.fn(),
  deleteShoppingList: vi.fn(),
}));

async function mockedListsApi() {
  return await import('../../shopping/listsApi');
}

const widgetProps = {
  definition: { id: 'shopping-list-mvp', type: 'shoppingList' as const, title: 'Shopping List', settings: {} },
  instance: { id: 'home-shopping-list-widget', widgetDefinitionId: 'shopping-list-mvp', title: 'Shopping List', settings: {} },
};

afterEach(() => cleanup());

describe('ShoppingListWidget API-backed behavior', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValue({
      shoppingList: {
        listId: 'shopping-list-id',
        name: 'Shopping',
        items: [
          { id: 'bread', label: 'Bread', completed: false, deleted: false, preferredStore: 'Supermarket', storeSuggestions: [{ store: 'Supermarket', purchaseCount: 4 }, { store: 'Corner Shop', purchaseCount: 1 }] },
          { id: 'coffee', label: 'Coffee', completed: true, deleted: false, preferredStore: null },
          { id: 'batteries', label: 'Batteries', completed: false, deleted: false, preferredStore: null, storeSuggestions: [{ store: 'Hardware Store', purchaseCount: 3 }] },
        ],
      },
      otherLists: [
        { listId: 'packing-list-id', name: 'Vacation Packing', items: [{ id: 'sunscreen', label: 'Sunscreen', completed: false, deleted: false, preferredStore: null }] },
        { listId: 'camping-list-id', name: 'Camping', items: [{ id: 'tent', label: 'Tent', completed: false, deleted: false, preferredStore: null }] },
      ],
    });
    vi.mocked(listsApi.createShoppingList).mockResolvedValue({ listId: 'shopping-list-id', items: [] });
    vi.mocked(listsApi.addShoppingListItem).mockResolvedValue({ id: 'apples', label: 'Apples', completed: false, deleted: false, preferredStore: null });
    vi.mocked(listsApi.toggleShoppingListItem).mockResolvedValue({ id: 'bread', label: 'Bread', completed: true, deleted: false, preferredStore: 'Supermarket' });
    vi.mocked(listsApi.updateShoppingListItemStore).mockResolvedValue({ id: 'coffee', label: 'Coffee', completed: true, deleted: false, preferredStore: 'Drugstore' });
    vi.mocked(listsApi.removeShoppingListItem).mockResolvedValue({ id: 'bread', label: 'Bread', completed: true, deleted: true, preferredStore: 'Supermarket' });
    vi.mocked(listsApi.undoShoppingListItem).mockResolvedValue({ id: 'bread', label: 'Bread', completed: false, deleted: false, preferredStore: 'Supermarket', storeSuggestions: [{ store: 'Supermarket', purchaseCount: 4 }, { store: 'Corner Shop', purchaseCount: 1 }] });
  });

  it('loads shopping list items from the API-backed list service', async () => {
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    expect(await screen.findAllByText('Bread')).not.toBeNull();
    expect(screen.getAllByText('Coffee')[0]).not.toBeNull();
    expect(listsApi.loadShoppingPageLists).toHaveBeenCalledWith(apiClient);
  });

  it('adds an item through the API-backed list service', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findAllByText('Bread');
    const quickAddForm = screen.getByRole('form', { name: 'Voeg item toe aan Boodschappen' });
    await user.type(within(quickAddForm).getByPlaceholderText('Voeg toe, bijvoorbeeld melk'), 'Apples');
    await user.click(within(quickAddForm).getByRole('button', { name: 'Toevoegen' }));
    expect(listsApi.addShoppingListItem).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'Apples');
    expect((await screen.findAllByText('Apples')).length).toBeGreaterThan(0);
  });

  it('toggles and removes items through the API-backed list service', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    const bread = (await screen.findAllByText('Bread'))[0];
    await user.click(within(bread.closest('label')!).getByRole('checkbox'));
    await waitFor(() => expect(listsApi.toggleShoppingListItem).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'bread'));
    const breadAfterToggle = (await screen.findAllByText('Bread'))[0];
    await user.click(within(breadAfterToggle.closest('li')!).getByRole('button', { name: 'Weg' }));
    expect(listsApi.removeShoppingListItem).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'bread');
    expect(await screen.findByText('Verwijderd')).not.toBeNull();
  });


  it('groups items by store and allows store overrides', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);

    expect(await screen.findByRole('heading', { name: 'Supermarket' })).not.toBeNull();
    expect(screen.getAllByRole('heading', { name: 'Zonder winkel' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Batteries')[0]).not.toBeNull();
    expect(document.querySelector('option[value=\"Corner Shop\"]')).not.toBeNull();

    await user.click(within(screen.getAllByText('Coffee')[0].closest('li')!).getAllByText('Winkel')[0]);
    const coffeeStore = screen.getByLabelText('Winkel voor Coffee');
    await user.clear(coffeeStore);
    await user.type(coffeeStore, 'Drugstore');
    await user.tab();

    expect(listsApi.updateShoppingListItemStore).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'coffee', 'Drugstore');
    expect(await screen.findByRole('heading', { name: 'Drugstore' })).not.toBeNull();
    expect(await screen.findByText('(Drugstore)')).not.toBeNull();
  });



  it('shows other lists and allows managing a non-Shopping list from the Shopping page', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.addShoppingListItem).mockResolvedValueOnce({ id: 'passport', label: 'Passport', completed: false, deleted: false, preferredStore: null });
    vi.mocked(listsApi.toggleShoppingListItem).mockResolvedValueOnce({ id: 'sunscreen', label: 'Sunscreen', completed: true, deleted: false, preferredStore: null });

    render(<ShoppingListWidget {...widgetProps} />);

    expect(await screen.findByRole('heading', { name: 'Boodschappen' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Ondersteunende lijsten' })).not.toBeNull();
    await user.click(screen.getByText('Vacation Packing'));
    expect(screen.getByText('Sunscreen')).not.toBeNull();
    expect(screen.getByText('Camping')).not.toBeNull();

    await user.type(within(screen.getByLabelText('Vacation Packing')).getByPlaceholderText('Voeg toe, bijvoorbeeld melk'), 'Passport');
    await user.click(within(screen.getByLabelText('Vacation Packing')).getByRole('button', { name: 'Toevoegen' }));
    expect(listsApi.addShoppingListItem).toHaveBeenCalledWith(apiClient, 'packing-list-id', 'Passport');
    expect(await screen.findByText('Passport')).not.toBeNull();

    await user.click(within(screen.getByText('Sunscreen').closest('label')!).getByRole('checkbox'));
    expect(listsApi.toggleShoppingListItem).toHaveBeenCalledWith(apiClient, 'packing-list-id', 'sunscreen');
  });

  it('keeps list management available without leading the first scan', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);

    const bread = (await screen.findAllByText('Bread'))[0];
    const quickAddForm = screen.getByRole('form', { name: 'Voeg item toe aan Boodschappen' });
    const shoppingSurface = screen.getByLabelText('Boodschappen beheer');
    const listSettings = within(shoppingSurface).getByText('Lijst beheren');
    expect(quickAddForm).not.toBeNull();
    expect(bread.compareDocumentPosition(listSettings) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(listSettings);
    await user.clear(within(shoppingSurface).getByLabelText('Lijstnaam'));
    await user.type(within(shoppingSurface).getByLabelText('Lijstnaam'), 'Groceries');
    await user.click(within(shoppingSurface).getByRole('button', { name: 'Hernoemen' }));

    expect(listsApi.renameShoppingList).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'Groceries');
    expect(within(shoppingSurface).getByRole('button', { name: 'Archiveren' })).not.toBeNull();
    expect(within(shoppingSurface).getByRole('button', { name: 'Verwijderen' })).not.toBeNull();
  });

  it('guides households when the first list has no items yet', async () => {
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({ shoppingList: { listId: 'shopping-list-id', name: 'Shopping', items: [] }, otherLists: [] });
    render(<ShoppingListWidget {...widgetProps} />);
    expect(await screen.findByText('Begin met je eerste boodschap')).not.toBeNull();
    expect(screen.getByText('Deze werkruimte is bedoeld voor één snelle familielijst: bedenken, toevoegen, kopen en afvinken.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Voeg meteen iets toe.' })).not.toBeNull();
  });

  it('can create the first Shopping list when no lists exist', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({ shoppingList: { listId: null, name: 'Shopping', items: [] }, otherLists: [] });
    render(<ShoppingListWidget {...widgetProps} />);

    await user.click(await screen.findByRole('button', { name: 'Maak boodschappenlijst' }));

    expect(listsApi.createShoppingList).toHaveBeenCalledWith(apiClient);
    expect(await screen.findByRole('link', { name: 'Voeg meteen iets toe.' })).not.toBeNull();
  });
});
