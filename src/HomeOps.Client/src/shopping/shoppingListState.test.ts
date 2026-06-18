import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoShoppingListItems } from '../demo/demoShoppingListData';
import { addShoppingListItem, getActiveShoppingListItems, getCompletedShoppingListItems, removeShoppingListItem, toggleShoppingListItem } from './shoppingListState';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('demo shopping list dataset', () => {
  it('contains representative active and completed items', () => {
    expect(demoShoppingListItems.map((item) => item.label)).toEqual([
      'Bread',
      'Milk',
      'Bananas',
      'Coffee',
      'Dishwasher tablets',
    ]);
    expect(getActiveShoppingListItems(demoShoppingListItems).length).toBeGreaterThan(0);
    expect(getCompletedShoppingListItems(demoShoppingListItems).length).toBeGreaterThan(0);
  });
});

describe('shopping list state helpers', () => {
  it('creates and adds an active item', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_234_567);

    const items = addShoppingListItem([], ' Apples ');

    expect(items).toEqual([{ id: 'apples-qglj', label: 'Apples', completed: false }]);
  });

  it('does not add blank items', () => {
    expect(addShoppingListItem(demoShoppingListItems, '   ')).toBe(demoShoppingListItems);
  });

  it('toggles item completion', () => {
    const items = toggleShoppingListItem(demoShoppingListItems, 'bread');

    expect(items.find((item) => item.id === 'bread')?.completed).toBe(true);
  });

  it('removes an item', () => {
    const items = removeShoppingListItem(demoShoppingListItems, 'milk');

    expect(items.some((item) => item.id === 'milk')).toBe(false);
  });
});
