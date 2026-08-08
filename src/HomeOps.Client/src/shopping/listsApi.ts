import { AddListItemRequest, ArchiveListRequest, CreateListRequest, DecorativeAvatarReferenceDto, DecorativeAvatarReferenceType, HomeOpsApiClient, ListDto, ListItemDto, ListSummaryDto, PermanentDeleteListRequest, RenameListRequest, RestoreListRequest, UpdateListItemDecorativeAvatarRequest, UpdateListItemStoreRequest } from '../api/homeOpsApiClient';
import type { ShoppingDecorativeAvatarReference, ShoppingListItem, ShoppingListLifecycleSummary, ShoppingListState } from './shoppingListModel';

export const shoppingListName = 'Shopping';
const localizedShoppingListNames = new Set(['shopping', 'boodschappen']);

export function isDedicatedShoppingListName(name: string | undefined): boolean {
  return name ? localizedShoppingListNames.has(name.trim().toLowerCase()) : false;
}

export function createListsApiClient(): HomeOpsApiClient {
  return new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '');
}

export interface ShoppingPageLists {
  shoppingList: ShoppingListState;
  otherLists: readonly ShoppingListState[];
  archivedLists?: readonly ShoppingListLifecycleSummary[];
}

export async function loadShoppingList(client = createListsApiClient()): Promise<ShoppingListState> {
  return (await loadShoppingPageLists(client)).shoppingList;
}

export async function loadShoppingPageLists(client = createListsApiClient()): Promise<ShoppingPageLists> {
  const lists = await client.getLists(true);
  const activeLists = lists.filter((list) => list.isArchived !== true);
  const listDetails = await Promise.all(
    activeLists
      .filter((list) => Boolean(list.id))
      .map((list) => client.getListById(requireValue(list.id, 'list id'))),
  );
  const mappedLists = listDetails.map((list) => toShoppingListState(
    list,
    activeLists.find((summary) => summary.id === list.id),
  ));
  const shoppingList = mappedLists.find((list) => isDedicatedShoppingListName(list.name));

  return {
    shoppingList: shoppingList ?? { listId: null, name: shoppingListName, items: [] },
    otherLists: mappedLists.filter((list) => !isDedicatedShoppingListName(list.name)),
    archivedLists: lists.filter((list) => list.isArchived === true).map(toLifecycleSummary),
  };
}

export async function createShoppingList(client: HomeOpsApiClient): Promise<ShoppingListState> {
  const created = await client.createList(new CreateListRequest({ name: shoppingListName }));
  return toShoppingListState(created);
}

export async function createNamedShoppingList(client: HomeOpsApiClient, name: string): Promise<ShoppingListState> {
  const created = await client.createList(new CreateListRequest({ name: name.trim() }));
  return toShoppingListState(created);
}

export async function addShoppingListItem(client: HomeOpsApiClient, listId: string, label: string, decorativeAvatar: ShoppingDecorativeAvatarReference | null = null): Promise<ShoppingListItem | null> {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return null;
  }

  const item = await client.addListItem(listId, new AddListItemRequest({ text: trimmedLabel, decorativeAvatar: toApiDecorativeAvatar(decorativeAvatar) }));
  return toShoppingListItem(item);
}

export async function toggleShoppingListItem(client: HomeOpsApiClient, listId: string, itemId: string): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.toggleListItemCompletion(listId, itemId));
}

export async function undoShoppingListItem(client: HomeOpsApiClient, listId: string, itemId: string): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.undoListItemLifecycle(listId, itemId));
}

export async function renameShoppingList(client: HomeOpsApiClient, listId: string, name: string): Promise<ShoppingListState> {
  const renamed = await client.renameList(listId, new RenameListRequest({ name }));
  const summaries = await client.getLists(true);
  return toShoppingListState(renamed, summaries.find((summary) => summary.id === listId));
}

export async function archiveShoppingList(client: HomeOpsApiClient, listId: string, expectedUpdatedUtc: Date): Promise<ShoppingListLifecycleSummary> {
  return toLifecycleSummary(await client.archiveList(listId, new ArchiveListRequest({ expectedUpdatedUtc, confirmed: true })));
}

export async function restoreShoppingList(client: HomeOpsApiClient, summary: ShoppingListLifecycleSummary): Promise<ShoppingListState> {
  const restored = await client.restoreList(summary.listId, new RestoreListRequest({ expectedUpdatedUtc: summary.updatedUtc }));
  return toShoppingListState(await client.getListById(summary.listId), restored);
}

export async function permanentlyDeleteShoppingList(client: HomeOpsApiClient, listId: string, expectedUpdatedUtc: Date): Promise<void> {
  await client.permanentlyDeleteList(listId, new PermanentDeleteListRequest({ expectedUpdatedUtc, confirmed: true }));
}

export async function updateShoppingListItemStore(client: HomeOpsApiClient, listId: string, itemId: string, preferredStore: string | null): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.updateListItemStore(listId, itemId, new UpdateListItemStoreRequest({ preferredStore: preferredStore ?? undefined })));
}

export async function updateShoppingListItemDecorativeAvatar(client: HomeOpsApiClient, listId: string, itemId: string, decorativeAvatar: ShoppingDecorativeAvatarReference | null): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.updateListItemDecorativeAvatar(listId, itemId, new UpdateListItemDecorativeAvatarRequest({ decorativeAvatar: toApiDecorativeAvatar(decorativeAvatar) })));
}

export async function removeShoppingListItem(client: HomeOpsApiClient, listId: string, itemId: string): Promise<ShoppingListItem> {
  return toShoppingListItem(await client.removeListItem(listId, itemId));
}

export function toShoppingListState(list: ListDto, summary?: ListSummaryDto): ShoppingListState {
  if (!list.id) {
    throw new Error('List id is required.');
  }

  return {
    listId: list.id,
    name: list.name,
    ...(summary?.updatedUtc ? {
      updatedUtc: summary.updatedUtc,
      activeItemCount: summary.activeItemCount ?? 0,
      completedItemCount: summary.completedItemCount ?? 0,
      deletedItemCount: summary.deletedItemCount ?? 0,
      totalItemCount: summary.totalItemCount ?? 0,
    } : list.updatedUtc ? { updatedUtc: list.updatedUtc } : {}),
    items: (list.items ?? []).map(toShoppingListItem),
  };
}

export function toLifecycleSummary(list: ListSummaryDto): ShoppingListLifecycleSummary {
  if (!list.id || !list.name || !list.updatedUtc) {
    throw new Error('List lifecycle summary is incomplete.');
  }
  return {
    listId: list.id,
    name: list.name,
    archivedUtc: list.archivedUtc ?? null,
    updatedUtc: list.updatedUtc,
    activeItemCount: list.activeItemCount ?? 0,
    completedItemCount: list.completedItemCount ?? 0,
    deletedItemCount: list.deletedItemCount ?? 0,
    totalItemCount: list.totalItemCount ?? 0,
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
    ...(fromApiDecorativeAvatar(item.decorativeAvatar) ? { decorativeAvatar: fromApiDecorativeAvatar(item.decorativeAvatar) } : {}),
    storeSuggestions: (item.storeSuggestions ?? [])
      .filter((suggestion) => Boolean(suggestion.store))
      .map((suggestion) => ({ store: suggestion.store!, purchaseCount: suggestion.purchaseCount ?? 0 })),
  };
}

function fromApiDecorativeAvatar(reference: DecorativeAvatarReferenceDto | undefined): ShoppingDecorativeAvatarReference | null {
  if (!reference?.referenceId || reference.referenceType === undefined) return null;
  return {
    referenceType: reference.referenceType === DecorativeAvatarReferenceType.KnownPerson ? 'knownPerson' : 'familyMember',
    referenceId: reference.referenceId,
  };
}

function toApiDecorativeAvatar(reference: ShoppingDecorativeAvatarReference | null): DecorativeAvatarReferenceDto | undefined {
  if (!reference) return undefined;
  return new DecorativeAvatarReferenceDto({
    referenceType: reference.referenceType === 'knownPerson' ? DecorativeAvatarReferenceType.KnownPerson : DecorativeAvatarReferenceType.FamilyMember,
    referenceId: reference.referenceId,
  });
}

function requireValue(value: string | undefined, label: string): string {
  if (!value) throw new Error(`Missing ${label}.`);
  return value;
}
