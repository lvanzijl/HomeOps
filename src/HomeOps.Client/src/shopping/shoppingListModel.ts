export interface ShoppingListItem {
  id: string;
  label: string;
  completed: boolean;
  preferredStore?: string | null;
}

export interface ShoppingListState {
  listId: string | null;
  items: readonly ShoppingListItem[];
}
