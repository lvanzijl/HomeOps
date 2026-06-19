import type { ShoppingListItem } from './shoppingListModel';

export function upsertShoppingListItem(items: readonly ShoppingListItem[], updatedItem: ShoppingListItem): readonly ShoppingListItem[] {
  const itemExists = items.some((item) => item.id === updatedItem.id);

  if (!itemExists) {
    return [...items, updatedItem];
  }

  return items.map((item) => (item.id === updatedItem.id ? updatedItem : item));
}

export function removeShoppingListItemById(items: readonly ShoppingListItem[], itemId: string): readonly ShoppingListItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function getActiveShoppingListItems(items: readonly ShoppingListItem[]): readonly ShoppingListItem[] {
  return items.filter((item) => !item.completed);
}

export function getCompletedShoppingListItems(items: readonly ShoppingListItem[]): readonly ShoppingListItem[] {
  return items.filter((item) => item.completed);
}
