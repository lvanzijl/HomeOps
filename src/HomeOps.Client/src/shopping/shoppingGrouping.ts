export const noStoreGroupLabel = 'Zonder winkel';

export interface ShoppingGroupableItem {
  id: string;
  text?: string;
  label?: string;
  preferredStore?: string | null;
  isCompleted?: boolean;
  completed?: boolean;
  isDeleted?: boolean;
  deleted?: boolean;
}

export interface ShoppingItemGroup<TItem extends ShoppingGroupableItem> {
  store: string | null;
  label: string;
  items: readonly TItem[];
}

export function getShoppingItemText(item: ShoppingGroupableItem): string {
  return item.text ?? item.label ?? '';
}

export function isActiveShoppingItem(item: ShoppingGroupableItem): boolean {
  return item.isCompleted !== true && item.completed !== true && item.isDeleted !== true && item.deleted !== true;
}

export function groupShoppingItemsByPreferredStore<TItem extends ShoppingGroupableItem>(
  items: readonly TItem[],
  options: { activeOnly?: boolean } = {},
): ShoppingItemGroup<TItem>[] {
  const groupedItems = options.activeOnly === false ? items : items.filter(isActiveShoppingItem);
  const namedStores = Array.from(new Set(groupedItems.map((item) => item.preferredStore).filter((store): store is string => Boolean(store))))
    .sort((a, b) => a.localeCompare(b));

  const groups = namedStores.map((store) => ({
    store,
    label: store,
    items: groupedItems.filter((item) => item.preferredStore === store),
  }));

  const ungroupedItems = groupedItems.filter((item) => !item.preferredStore);
  return ungroupedItems.length > 0 ? [...groups, { store: null, label: noStoreGroupLabel, items: ungroupedItems }] : groups;
}
