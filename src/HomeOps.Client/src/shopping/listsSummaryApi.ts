import { HomeOpsApiClient, ListDto } from '../api/homeOpsApiClient';

export interface ListSummaryItem { id: string; text: string; }
export interface ListSummary { id: string; name: string; activeItems: ListSummaryItem[]; }

export function createListsSummaryApiClient(): HomeOpsApiClient {
  return new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '');
}

export async function loadListSummaries(client = createListsSummaryApiClient()): Promise<ListSummary[]> {
  const lists = await client.getLists();
  return lists.map(toListSummary).filter((list) => list.activeItems.length > 0);
}

function toListSummary(list: ListDto): ListSummary {
  return {
    id: requireValue(list.id, 'list id'),
    name: list.name ?? 'Untitled list',
    activeItems: (list.items ?? [])
      .filter((item) => item.isCompleted === false)
      .map((item) => ({ id: requireValue(item.id, 'list item id'), text: item.text ?? 'Untitled item' })),
  };
}

function requireValue(value: string | undefined, label: string): string {
  if (!value) throw new Error(`Missing ${label}.`);
  return value;
}
