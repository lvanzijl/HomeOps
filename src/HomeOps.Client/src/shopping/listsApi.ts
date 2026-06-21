import { AddListItemRequest, CreateListRequest, HomeOpsApiClient, ListDto, ListItemDto, RenameListRequest, UpdateListItemStoreRequest } from '../api/homeOpsApiClient';
import type { ShoppingListItem, ShoppingListState } from './shoppingListModel';

const shoppingListName = 'Shopping';

export function createListsApiClient(): HomeOpsApiClient {
  return new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '');
}

export async function loadShoppingList(client = createListsApiClient()): Promise<ShoppingListState> {
  const lists = await client.getLists();
  const shoppingList = lists.find((list) => list.name === shoppingListName) ?? lists[0];

  if (!shoppingList?.id) {
    return { listId: null, name: shoppingListName, items: [] };
  }

  const list = await client.getListById(shoppingList.id);
  return toShoppingListState(list);
}

export async function createShoppingList(client: HomeOpsApiClient): Promise<ShoppingListState> {
  const created = await client.createList(new CreateListRequest({ name: shoppingListName }));
  return toShoppingListState(created);
}

export async function addShoppingListItem(client: HomeOpsApiClient, listId: string, label: string): Promise<ShoppingListItem | null> {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return null;
  }

  const item = await client.addListItem(listId, new AddListItemRequest({ text: trimmedLabel }));
  return toShoppingListItem(item);
}

export async function toggleShoppingListItem(client: HomeOpsApiClient, listId: string, itemId: string): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.toggleListItemCompletion(listId, itemId));
}

export async function undoShoppingListItem(client: HomeOpsApiClient, listId: string, itemId: string): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.undoListItemLifecycle(listId, itemId));
}

export async function renameShoppingList(client: HomeOpsApiClient, listId: string, name: string): Promise<ShoppingListState> {
  return toShoppingListState(await client.renameList(listId, new RenameListRequest({ name })));
}

export async function archiveShoppingList(client: HomeOpsApiClient, listId: string): Promise<ShoppingListState> {
  return toShoppingListState(await client.archiveList(listId));
}

export async function deleteShoppingList(client: HomeOpsApiClient, listId: string): Promise<void> {
  await client.deleteList(listId);
}

export async function updateShoppingListItemStore(client: HomeOpsApiClient, listId: string, itemId: string, preferredStore: string | null): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.updateListItemStore(listId, itemId, new UpdateListItemStoreRequest({ preferredStore: preferredStore ?? undefined })));
}

export async function removeShoppingListItem(client: HomeOpsApiClient, listId: string, itemId: string): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.removeListItem(listId, itemId));
}

export function toShoppingListState(list: ListDto): ShoppingListState {
  if (!list.id) {
    throw new Error('List id is required.');
  }

  return {
    listId: list.id,
    name: list.name,
    items: (list.items ?? []).map(toShoppingListItem),
  };
}

function toShoppingListItem(item: ListItemDto): ShoppingListItem {
  if (!item.id || !item.text || item.isCompleted === undefined) {
    throw new Error('List item payload is incomplete.');
  }

  return {
    id: item.id,
    label: item.text,
    completed: item.isCompleted,
    completedUtc: item.completedUtc ?? null,
    deleted: item.isDeleted ?? false,
    deletedUtc: item.deletedUtc ?? null,
    preferredStore: item.preferredStore ?? null,
    storeSuggestions: (item.storeSuggestions ?? [])
      .filter((suggestion) => Boolean(suggestion.store))
      .map((suggestion) => ({ store: suggestion.store!, purchaseCount: suggestion.purchaseCount ?? 0 })),
  };
}
