export interface ShoppingListItem {
  id: string;
  label: string;
  completed: boolean;
  completedUtc?: Date | null;
  deleted?: boolean;
  deletedUtc?: Date | null;
  preferredStore?: string | null;
  storeSuggestions?: readonly ShoppingStoreSuggestion[];
}

export interface ShoppingStoreSuggestion {
  store: string;
  purchaseCount: number;
}

export interface ShoppingListState {
  listId: string | null;
  name?: string;
  items: readonly ShoppingListItem[];
}
