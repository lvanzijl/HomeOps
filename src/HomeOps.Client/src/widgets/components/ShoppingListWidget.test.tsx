import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShoppingListWidget } from './ShoppingListWidget';

const apiClient = {} as never;

vi.mock('../../shopping/listsApi', () => ({
  createListsApiClient: () => apiClient,
  loadShoppingList: vi.fn(),
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
    vi.mocked(listsApi.loadShoppingList).mockResolvedValue({
      listId: 'shopping-list-id',
      items: [
        { id: 'bread', label: 'Bread', completed: false, deleted: false, preferredStore: 'Supermarket' },
        { id: 'coffee', label: 'Coffee', completed: true, deleted: false, preferredStore: null },
      ],
    });
    vi.mocked(listsApi.createShoppingList).mockResolvedValue({ listId: 'shopping-list-id', items: [] });
    vi.mocked(listsApi.addShoppingListItem).mockResolvedValue({ id: 'apples', label: 'Apples', completed: false, deleted: false, preferredStore: null });
    vi.mocked(listsApi.toggleShoppingListItem).mockResolvedValue({ id: 'bread', label: 'Bread', completed: true, deleted: false, preferredStore: 'Supermarket' });
    vi.mocked(listsApi.updateShoppingListItemStore).mockResolvedValue({ id: 'coffee', label: 'Coffee', completed: true, deleted: false, preferredStore: 'Drugstore' });
    vi.mocked(listsApi.removeShoppingListItem).mockResolvedValue({ id: 'bread', label: 'Bread', completed: true, deleted: true, preferredStore: 'Supermarket' });
    vi.mocked(listsApi.undoShoppingListItem).mockResolvedValue({ id: 'bread', label: 'Bread', completed: false, deleted: false, preferredStore: 'Supermarket' });
  });

  it('loads shopping list items from the API-backed list service', async () => {
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    expect(await screen.findByText('Bread')).not.toBeNull();
    expect(screen.getByText('Coffee')).not.toBeNull();
    expect(listsApi.loadShoppingList).toHaveBeenCalledWith(apiClient);
  });

  it('adds an item through the API-backed list service', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    render(<ShoppingListWidget {...widgetProps} />);
    await screen.findByText('Bread');
    await user.type(screen.getByPlaceholderText('Add an item'), 'Apples');
    await user.click(screen.getByRole('button', { name: 'Add' }));
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
    expect(screen.getByRole('heading', { name: 'Uncategorized' })).not.toBeNull();

    const coffeeStore = screen.getByLabelText('Store for Coffee');
    await user.clear(coffeeStore);
    await user.type(coffeeStore, 'Drugstore');
    await user.tab();

    expect(listsApi.updateShoppingListItemStore).toHaveBeenCalledWith(apiClient, 'shopping-list-id', 'coffee', 'Drugstore');
    expect(await screen.findByText('(Drugstore)')).not.toBeNull();
  });

  it('guides households when the first list has no items yet', async () => {
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingList).mockResolvedValueOnce({ listId: 'shopping-list-id', items: [] });
    render(<ShoppingListWidget {...widgetProps} />);
    expect(await screen.findByText('Create your first list')).not.toBeNull();
    expect(screen.getByText('Lists help remember shopping, packing, and household items.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Start by adding one item.' })).not.toBeNull();
  });

  it('can create the first Shopping list when no lists exist', async () => {
    const user = userEvent.setup();
    const listsApi = await mockedListsApi();
    vi.mocked(listsApi.loadShoppingList).mockResolvedValueOnce({ listId: null, items: [] });
    render(<ShoppingListWidget {...widgetProps} />);

    await user.click(await screen.findByRole('button', { name: 'Create Shopping list' }));

    expect(listsApi.createShoppingList).toHaveBeenCalledWith(apiClient);
    expect(await screen.findByRole('link', { name: 'Start by adding one item.' })).not.toBeNull();
  });
});
