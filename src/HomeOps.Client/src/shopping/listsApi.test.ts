import { describe, expect, it, vi } from 'vitest';
import { ListDto, ListItemDto, ShoppingHistorySuggestionDto, ShoppingStoreSuggestionDto } from '../api/homeOpsApiClient';
import { importLegacyShoppingHistory, isDedicatedShoppingListName, loadShoppingHistorySuggestions, loadShoppingPageLists, toShoppingListState, updateShoppingListItem } from './listsApi';

describe('lists API mapping', () => {

  it('recognizes both canonical and localized shopping list names', () => {
    expect(isDedicatedShoppingListName('Shopping')).toBe(true);
    expect(isDedicatedShoppingListName('Boodschappen')).toBe(true);
    expect(isDedicatedShoppingListName(' boodschappen ')).toBe(true);
    expect(isDedicatedShoppingListName('Vacation Packing')).toBe(false);
    expect(isDedicatedShoppingListName(undefined)).toBe(false);
  });

  it('maps the generated Lists DTO into shopping widget state', () => {
    const state = toShoppingListState(new ListDto({
      id: 'shopping-list-id',
      name: 'Shopping',
      items: [
        new ListItemDto({ id: 'bread', listId: 'shopping-list-id', text: 'Bread', isCompleted: false, preferredStore: 'Bakery', storeSuggestions: [new ShoppingStoreSuggestionDto({ store: 'Bakery', purchaseCount: 3 })] }),
        new ListItemDto({ id: 'coffee', listId: 'shopping-list-id', text: 'Coffee', isCompleted: true }),
      ],
    }));

    expect(state).toEqual({
      listId: 'shopping-list-id',
      name: 'Shopping',
      items: [
        { id: 'bread', label: 'Bread', completed: false, completedUtc: null, deleted: false, deletedUtc: null, preferredStore: 'Bakery', storeSuggestions: [{ store: 'Bakery', purchaseCount: 3 }] },
        { id: 'coffee', label: 'Coffee', completed: true, completedUtc: null, deleted: false, deletedUtc: null, preferredStore: null, storeSuggestions: [] },
      ],
    });
  });


  it('treats the localized Boodschappen list as the dedicated Shopping page list', async () => {
    const client = {
      getLists: vi.fn().mockResolvedValue([
        { id: 'marketing-shopping-id', name: 'Boodschappen' },
      ]),
      getListById: vi.fn().mockResolvedValueOnce(new ListDto({
        id: 'marketing-shopping-id',
        name: 'Boodschappen',
        items: [
          new ListItemDto({ id: 'bloem', listId: 'marketing-shopping-id', text: 'Bloem', isCompleted: false, preferredStore: 'Jumbo' }),
          new ListItemDto({ id: 'roomboter', listId: 'marketing-shopping-id', text: 'Roomboter', isCompleted: false, preferredStore: 'Jumbo' }),
        ],
      })),
    };

    await expect(loadShoppingPageLists(client as never)).resolves.toEqual({
      shoppingList: {
        listId: 'marketing-shopping-id',
        name: 'Boodschappen',
        items: [
          { id: 'bloem', label: 'Bloem', completed: false, completedUtc: null, deleted: false, deletedUtc: null, preferredStore: 'Jumbo', storeSuggestions: [] },
          { id: 'roomboter', label: 'Roomboter', completed: false, completedUtc: null, deleted: false, deletedUtc: null, preferredStore: 'Jumbo', storeSuggestions: [] },
        ],
      },
      otherLists: [],
      archivedLists: [],
    });
  });

  it('returns the dedicated Shopping list separately from other lists', async () => {
    const client = {
      getLists: vi.fn().mockResolvedValue([
        { id: 'packing-list-id', name: 'Vacation Packing' },
        { id: 'shopping-list-id', name: 'Shopping' },
      ]),
      getListById: vi.fn()
        .mockResolvedValueOnce(new ListDto({ id: 'packing-list-id', name: 'Vacation Packing', items: [new ListItemDto({ id: 'sunscreen', listId: 'packing-list-id', text: 'Sunscreen', isCompleted: false })] }))
        .mockResolvedValueOnce(new ListDto({ id: 'shopping-list-id', name: 'Shopping', items: [new ListItemDto({ id: 'milk', listId: 'shopping-list-id', text: 'Milk', isCompleted: false })] })),
    };

    await expect(loadShoppingPageLists(client as never)).resolves.toEqual({
      shoppingList: { listId: 'shopping-list-id', name: 'Shopping', items: [{ id: 'milk', label: 'Milk', completed: false, completedUtc: null, deleted: false, deletedUtc: null, preferredStore: null, storeSuggestions: [] }] },
      otherLists: [{ listId: 'packing-list-id', name: 'Vacation Packing', items: [{ id: 'sunscreen', label: 'Sunscreen', completed: false, completedUtc: null, deleted: false, deletedUtc: null, preferredStore: null, storeSuggestions: [] }] }],
      archivedLists: [],
    });
  });

  it('sends one atomic item edit with concurrency and history intent', async () => {
    const updatedUtc = new Date('2026-08-08T10:00:00Z');
    const client = { updateListItem: vi.fn().mockResolvedValue(new ListItemDto({ id: 'bread', listId: 'shopping', text: 'Wholegrain bread', quantity: '2', isCompleted: false, updatedUtc })) };
    await updateShoppingListItem(client as never, 'shopping', { id: 'bread', label: 'Bread', completed: false, updatedUtc }, {
      label: 'Wholegrain bread', quantity: '2', preferredStore: 'Bakery', decorativeAvatar: null, preservePurchaseHistory: true,
    });

    expect(client.updateListItem).toHaveBeenCalledWith('shopping', 'bread', expect.objectContaining({
      text: 'Wholegrain bread', quantity: '2', preferredStore: 'Bakery', expectedUpdatedUtc: updatedUtc, preservePurchaseHistory: true,
    }));
  });

  it('uses the same server history contract for reads and confirmed legacy import', async () => {
    const updatedUtc = new Date('2026-08-08T10:00:00Z');
    const payload = [new ShoppingHistorySuggestionDto({ text: 'Milk', useCount: 4, updatedUtc, storeSuggestions: [new ShoppingStoreSuggestionDto({ store: 'Market', purchaseCount: 3 })] })];
    const client = { getShoppingHistorySuggestions: vi.fn().mockResolvedValue(payload), importShoppingHistory: vi.fn().mockResolvedValue(payload) };

    await expect(loadShoppingHistorySuggestions(client as never)).resolves.toEqual([{ text: 'Milk', useCount: 4, updatedUtc, storeSuggestions: [{ store: 'Market', purchaseCount: 3 }] }]);
    await importLegacyShoppingHistory(client as never, ['Milk']);
    expect(client.importShoppingHistory).toHaveBeenCalledWith(expect.objectContaining({ items: ['Milk'], confirmed: true }));
  });
});
