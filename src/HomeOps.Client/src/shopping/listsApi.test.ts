import { describe, expect, it } from 'vitest';
import { ListDto, ListItemDto, ShoppingStoreSuggestionDto } from '../api/homeOpsApiClient';
import { toShoppingListState } from './listsApi';

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
});
