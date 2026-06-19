import { describe, expect, it, vi } from 'vitest';
import { ListDto, ListItemDto, ListSummaryDto } from '../api/homeOpsApiClient';
import { loadListSummaries } from './listsSummaryApi';

describe('lists summary API mapping', () => {
  it('loads list details so Home can render active items and counts', async () => {
    const client = {
      getLists: vi.fn().mockResolvedValue([
        new ListSummaryDto({ id: 'shopping-list-id', name: 'Shopping', itemCount: 2 }),
        new ListSummaryDto({ id: 'empty-list-id', name: 'Empty', itemCount: 0 }),
      ]),
      getListById: vi.fn().mockResolvedValue(new ListDto({
        id: 'shopping-list-id',
        name: 'Shopping',
        items: [
          new ListItemDto({ id: 'milk', listId: 'shopping-list-id', text: 'Milk', isCompleted: false }),
          new ListItemDto({ id: 'coffee', listId: 'shopping-list-id', text: 'Coffee', isCompleted: true }),
        ],
      })),
    };

    await expect(loadListSummaries(client as never)).resolves.toEqual([
      { id: 'shopping-list-id', name: 'Shopping', activeItems: [{ id: 'milk', text: 'Milk' }] },
    ]);
    expect(client.getListById).toHaveBeenCalledTimes(1);
    expect(client.getListById).toHaveBeenCalledWith('shopping-list-id');
  });
});
