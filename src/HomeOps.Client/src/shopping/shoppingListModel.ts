export interface ShoppingListItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface ShoppingListState {
  listId: string | null;
  items: readonly ShoppingListItem[];
}
