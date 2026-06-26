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
    expect(await screen.findByText('Bread')).not.toBeNull();
    expect(screen.getByText('Coffee')).not.toBeNull();
    expect(listsApi.loadShoppingPageLists).toHaveBeenCalledWith(apiClient);
  });

  it('adds an item through the API-backed list service', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findByText('Bread');
    await user.type(within(screen.getByLabelText('Shopping')).getByPlaceholderText('Add an item'), 'Apples');
    await user.click(within(screen.getByLabelText('Shopping')).getByRole('button', { name: 'Add' }));
    expect(listsApi.addShoppingListItem).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'Apples');
    expect(await screen.findByText('Apples')).not.toBeNull();
  });

  it('toggles and removes items through the API-backed list service', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    const bread = await screen.findByText('Bread');
    await user.click(within(bread.closest('label')!).getByRole('checkbox'));
    await waitFor(() => expect(listsApi.toggleShoppingListItem).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'bread'));
    const breadAfterToggle = await screen.findByText('Bread');
    await user.click(within(breadAfterToggle.closest('li')!).getByRole('button', { name: 'Remove' }));
    expect(listsApi.removeShoppingListItem).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'bread');
    expect(await screen.findByText('Deleted')).not.toBeNull();
  });


  it('groups items by store and allows store overrides', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);

    expect(await screen.findByRole('heading', { name: 'Supermarket' })).not.toBeNull();
    expect(screen.getAllByRole('heading', { name: 'Zonder winkel' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Batteries')).not.toBeNull();
    expect(document.querySelector('option[value=\"Corner Shop\"]')).not.toBeNull();

    await user.click(within(screen.getByText('Coffee').closest('li')!).getAllByText('Store')[0]);
    const coffeeStore = screen.getByLabelText('Store for Coffee');
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

    expect(await screen.findByRole('heading', { name: 'Shopping' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Other Lists' })).not.toBeNull();
    await user.click(screen.getByText('Vacation Packing'));
    expect(screen.getByText('Sunscreen')).not.toBeNull();
    expect(screen.getByText('Camping')).not.toBeNull();

    await user.type(within(screen.getByLabelText('Vacation Packing')).getByPlaceholderText('Add an item'), 'Passport');
    await user.click(within(screen.getByLabelText('Vacation Packing')).getByRole('button', { name: 'Add' }));
    expect(listsApi.addShoppingListItem).toHaveBeenCalledWith(apiClient, 'packing-list-id', 'Passport');
    expect(await screen.findByText('Passport')).not.toBeNull();

    await user.click(within(screen.getByText('Sunscreen').closest('label')!).getByRole('checkbox'));
    expect(listsApi.toggleShoppingListItem).toHaveBeenCalledWith(apiClient, 'packing-list-id', 'sunscreen');
  });

  it('keeps list management available without leading the first scan', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);

    const bread = await screen.findByText('Bread');
    const shoppingSurface = screen.getByLabelText('Shopping');
    const listSettings = within(shoppingSurface).getByText('List settings');
    expect(within(shoppingSurface).getByRole('form', { name: 'Add item to Shopping' })).not.toBeNull();
    expect(bread.compareDocumentPosition(listSettings) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(listSettings);
    await user.clear(within(shoppingSurface).getByLabelText('List name'));
    await user.type(within(shoppingSurface).getByLabelText('List name'), 'Groceries');
    await user.click(within(shoppingSurface).getByRole('button', { name: 'Rename' }));

    expect(listsApi.renameShoppingList).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'Groceries');
    expect(within(shoppingSurface).getByRole('button', { name: 'Archive' })).not.toBeNull();
    expect(within(shoppingSurface).getByRole('button', { name: 'Delete' })).not.toBeNull();
  });

  it('guides households when the first list has no items yet', async () => {
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({ shoppingList: { listId: 'shopping-list-id', name: 'Shopping', items: [] }, otherLists: [] });
    render(<ShoppingListWidget {...widgetProps} />);
    expect(await screen.findByText('Create your first list')).not.toBeNull();
    expect(screen.getByText('Lists help remember shopping, packing, and household items.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Start by adding one item.' })).not.toBeNull();
  });

  it('can create the first Shopping list when no lists exist', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingPageLists).mockResolvedValueOnce({ shoppingList: { listId: null, name: 'Shopping', items: [] }, otherLists: [] });
    render(<ShoppingListWidget {...widgetProps} />);

    await user.click(await screen.findByRole('button', { name: 'Create Shopping list' }));

    expect(listsApi.createShoppingList).toHaveBeenCalledWith(apiClient);
    expect(await screen.findByRole('link', { name: 'Start by adding one item.' })).not.toBeNull();
  });
});
