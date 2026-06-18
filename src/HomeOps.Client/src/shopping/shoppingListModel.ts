export interface ShoppingListItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface ShoppingListState {
  items: readonly ShoppingListItem[];
}
