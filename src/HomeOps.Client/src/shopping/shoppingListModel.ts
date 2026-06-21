export interface ShoppingListItem {
  id: string;
  label: string;
  completed: boolean;
  completedUtc?: Date | null;
  deleted?: boolean;
  deletedUtc?: Date | null;
  preferredStore?: string | null;
}

export interface ShoppingListState {
  listId: string | null;
  name?: string;
  items: readonly ShoppingListItem[];
}
