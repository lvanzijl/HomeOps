import { describe, expect, it } from 'vitest';
import { getActiveShoppingListItems, getCompletedShoppingListItems, removeShoppingListItemById, upsertShoppingListItem } from './shoppingListState';

const shoppingItems = [
  { id: 'bread', label: 'Bread', completed: false },
  { id: 'milk', label: 'Milk', completed: false },
  { id: 'coffee', label: 'Coffee', completed: true },
];

describe('shopping list state helpers', () => {
  it('groups active and completed items', () => {
    expect(getActiveShoppingListItems(shoppingItems).map((item) => item.label)).toEqual(['Bread', 'Milk']);
    expect(getCompletedShoppingListItems(shoppingItems).map((item) => item.label)).toEqual(['Coffee']);
  });

  it('upserts a created item', () => {
    const items = upsertShoppingListItem(shoppingItems, { id: 'apples', label: 'Apples', completed: false });

    expect(items.map((item) => item.label)).toEqual(['Bread', 'Milk', 'Coffee', 'Apples']);
  });

  it('upserts an updated item', () => {
    const items = upsertShoppingListItem(shoppingItems, { id: 'milk', label: 'Milk', completed: true });

    expect(items.find((item) => item.id === 'milk')?.completed).toBe(true);
  });

  it('removes an item', () => {
    const items = removeShoppingListItemById(shoppingItems, 'milk');

    expect(items.some((item) => item.id === 'milk')).toBe(false);
  });
});
