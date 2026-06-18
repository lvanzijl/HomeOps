import type { ShoppingListItem } from './shoppingListModel';

export function createShoppingListItem(label: string): ShoppingListItem {
  return {
    id: createItemId(label),
    label: label.trim(),
    completed: false,
  };
}

export function addShoppingListItem(items: readonly ShoppingListItem[], label: string): readonly ShoppingListItem[] {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return items;
  }

  return [...items, createShoppingListItem(trimmedLabel)];
}

export function toggleShoppingListItem(items: readonly ShoppingListItem[], itemId: string): readonly ShoppingListItem[] {
  return items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item));
}

export function removeShoppingListItem(items: readonly ShoppingListItem[], itemId: string): readonly ShoppingListItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function getActiveShoppingListItems(items: readonly ShoppingListItem[]): readonly ShoppingListItem[] {
  return items.filter((item) => !item.completed);
}

export function getCompletedShoppingListItems(items: readonly ShoppingListItem[]): readonly ShoppingListItem[] {
  return items.filter((item) => item.completed);
}

function createItemId(label: string): string {
  const normalizedLabel = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${normalizedLabel || 'item'}-${Date.now().toString(36)}`;
}
