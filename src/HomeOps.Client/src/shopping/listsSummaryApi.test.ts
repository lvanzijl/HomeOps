import { describe, expect, it, vi } from 'vitest';
import { ListDto, ListItemDto, ListSummaryDto } from '../api/homeOpsApiClient';
import { loadListSummaries, loadShoppingListSummary } from './listsSummaryApi';

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
          new ListItemDto({ id: 'tea', listId: 'shopping-list-id', text: 'Tea', isCompleted: false, isDeleted: true }),
        ],
      })),
    };

    await expect(loadListSummaries(client as never)).resolves.toEqual([
      { id: 'shopping-list-id', name: 'Shopping', activeItems: [{ id: 'milk', text: 'Milk', preferredStore: null, isCompleted: false, isDeleted: false }] },
    ]);
    expect(client.getListById).toHaveBeenCalledTimes(1);
    expect(client.getListById).toHaveBeenCalledWith('shopping-list-id');
  });

  it('loads only the dedicated Shopping list for Home summaries', async () => {
    const client = {
      getLists: vi.fn().mockResolvedValue([
        new ListSummaryDto({ id: 'packing-list-id', name: 'Vacation Packing', itemCount: 2 }),
        new ListSummaryDto({ id: 'camping-list-id', name: 'Camping', itemCount: 2 }),
        new ListSummaryDto({ id: 'shopping-list-id', name: 'Shopping', itemCount: 2 }),
      ]),
      getListById: vi.fn().mockResolvedValue(new ListDto({
        id: 'shopping-list-id',
        name: 'Shopping',
        items: [
          new ListItemDto({ id: 'milk', listId: 'shopping-list-id', text: 'Milk', isCompleted: false }),
          new ListItemDto({ id: 'bread', listId: 'shopping-list-id', text: 'Bread', isCompleted: false }),
        ],
      })),
    };

    await expect(loadShoppingListSummary(client as never)).resolves.toEqual({
      id: 'shopping-list-id',
      name: 'Shopping',
      activeItems: [
        { id: 'milk', text: 'Milk', preferredStore: null, isCompleted: false, isDeleted: false },
        { id: 'bread', text: 'Bread', preferredStore: null, isCompleted: false, isDeleted: false },
      ],
    });
    expect(client.getListById).toHaveBeenCalledTimes(1);
    expect(client.getListById).toHaveBeenCalledWith('shopping-list-id');
  });

  it('does not fall back to another list when Shopping does not exist', async () => {
    const client = {
      getLists: vi.fn().mockResolvedValue([
        new ListSummaryDto({ id: 'camping-list-id', name: 'Camping', itemCount: 2 }),
        new ListSummaryDto({ id: 'christmas-list-id', name: 'Christmas', itemCount: 2 }),
      ]),
      getListById: vi.fn(),
    };

    await expect(loadShoppingListSummary(client as never)).resolves.toBeNull();
    expect(client.getListById).not.toHaveBeenCalled();
  });

});
