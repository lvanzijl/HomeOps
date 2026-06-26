import { describe, expect, it, vi } from 'vitest';
import { ListDto, ListItemDto, ShoppingStoreSuggestionDto } from '../api/homeOpsApiClient';
import { loadShoppingPageLists, toShoppingListState } from './listsApi';

describe('lists API mapping', () => {
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
