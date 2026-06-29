import { HomeOpsApiClient, ListDto } from '../api/homeOpsApiClient';
import { isDedicatedShoppingListName } from './listsApi';

export interface ListSummaryItem { id: string; text: string; preferredStore?: string | null; isCompleted?: boolean; isDeleted?: boolean; }
export interface ListSummary { id: string; name: string; activeItems: ListSummaryItem[]; }

export function createListsSummaryApiClient(): HomeOpsApiClient {
  return new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '');
}


export async function loadShoppingListSummary(client = createListsSummaryApiClient()): Promise<ListSummary | null> {
  const lists = await client.getLists();
  const shoppingList = lists.find((list) => isDedicatedShoppingListName(list.name));

  if (!shoppingList?.id) {
    return null;
  }

  const list = await client.getListById(requireValue(shoppingList.id, 'list id'));
  const summary = toListSummary(list);
  return summary.activeItems.length > 0 ? summary : null;
}

export async function loadListSummaries(client = createListsSummaryApiClient()): Promise<ListSummary[]> {
  const lists = await client.getLists();
  const listDetails = await Promise.all(
    lists
      .filter((list) => (list.itemCount ?? 0) > 0)
      .map((list) => client.getListById(requireValue(list.id, 'list id'))),
  );

  return listDetails.map(toListSummary).filter((list) => list.activeItems.length > 0);
}

function toListSummary(list: ListDto): ListSummary {
  return {
    id: requireValue(list.id, 'list id'),
    name: list.name ?? 'Untitled list',
    activeItems: (list.items ?? [])
      .filter((item) => item.isCompleted === false && item.isDeleted !== true)
      .map((item) => ({
        id: requireValue(item.id, 'list item id'),
        text: item.text ?? 'Untitled item',
        preferredStore: item.preferredStore ?? null,
        isCompleted: item.isCompleted ?? false,
        isDeleted: item.isDeleted ?? false,
      })),
  };
}

function requireValue(value: string | undefined, label: string): string {
  if (!value) throw new Error(`Missing ${label}.`);
  return value;
}
