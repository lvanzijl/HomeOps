import type { ShoppingListItem } from '../shopping/shoppingListModel';

export const demoShoppingListItems: readonly ShoppingListItem[] = [
  { id: 'bread', label: 'Bread', completed: false },
  { id: 'milk', label: 'Milk', completed: false },
  { id: 'bananas', label: 'Bananas', completed: false },
  { id: 'coffee', label: 'Coffee', completed: true },
  { id: 'dishwasher-tablets', label: 'Dishwasher tablets', completed: true },
] as const;
