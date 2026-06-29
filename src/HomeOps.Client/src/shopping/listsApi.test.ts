import { describe, expect, it, vi } from 'vitest';
import { ListDto, ListItemDto, ShoppingStoreSuggestionDto } from '../api/homeOpsApiClient';
import { isDedicatedShoppingListName, loadShoppingPageLists, toShoppingListState } from './listsApi';

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
    });
  });
});
