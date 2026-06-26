import { describe, expect, it } from 'vitest';
import { groupShoppingItemsByPreferredStore, isActiveShoppingItem, noStoreGroupLabel } from './shoppingGrouping';

const items = [
  { id: 'milk', text: 'Milk', preferredStore: 'Supermarket' },
  { id: 'toothpaste', text: 'Toothpaste', preferredStore: 'Drugstore' },
  { id: 'bread', text: 'Bread', preferredStore: 'Supermarket' },
  { id: 'batteries', text: 'Batteries', preferredStore: null },
  { id: 'coffee', text: 'Coffee', preferredStore: 'Supermarket', isCompleted: true },
  { id: 'tea', text: 'Tea', preferredStore: 'Drugstore', isDeleted: true },
];

describe('shopping grouping', () => {
  it('groups active items by preferred store with named groups sorted and no-store items last', () => {
    const groups = groupShoppingItemsByPreferredStore(items);

    expect(groups.map((group) => group.label)).toEqual(['Drugstore', 'Supermarket', noStoreGroupLabel]);
    expect(groups.map((group) => group.items.map((item) => item.id))).toEqual([
      ['toothpaste'],
      ['milk', 'bread'],
      ['batteries'],
    ]);
  });

  it('preserves item order within each preferred-store group', () => {
    const groups = groupShoppingItemsByPreferredStore([
      { id: 'second', text: 'Second', preferredStore: 'Market' },
      { id: 'first', text: 'First', preferredStore: 'Market' },
    ]);

    expect(groups[0].items.map((item) => item.id)).toEqual(['second', 'first']);
  });

  it('excludes completed and deleted items by either backend or frontend lifecycle field names', () => {
    const groups = groupShoppingItemsByPreferredStore([
      { id: 'active', text: 'Active', preferredStore: 'Market' },
      { id: 'completed-api', text: 'Completed API', preferredStore: 'Market', isCompleted: true },
      { id: 'completed-ui', label: 'Completed UI', preferredStore: 'Market', completed: true },
      { id: 'deleted-api', text: 'Deleted API', preferredStore: 'Market', isDeleted: true },
      { id: 'deleted-ui', label: 'Deleted UI', preferredStore: 'Market', deleted: true },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((item) => item.id)).toEqual(['active']);
    expect(isActiveShoppingItem({ id: 'deleted-ui', label: 'Deleted UI', deleted: true })).toBe(false);
  });

  it('can include inactive items when lifecycle sections are pre-filtered by the caller', () => {
    const groups = groupShoppingItemsByPreferredStore([
      { id: 'done', label: 'Done', completed: true, preferredStore: null },
    ], { activeOnly: false });

    expect(groups).toEqual([{ store: null, label: noStoreGroupLabel, items: [{ id: 'done', label: 'Done', completed: true, preferredStore: null }] }]);
  });
});
