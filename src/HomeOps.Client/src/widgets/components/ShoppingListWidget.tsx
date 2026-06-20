import { FormEvent, useEffect, useMemo, useState } from 'react';
import { addShoppingListItem, createListsApiClient, createShoppingList, loadShoppingList, removeShoppingListItem, toggleShoppingListItem } from '../../shopping/listsApi';
import type { ShoppingListItem } from '../../shopping/shoppingListModel';
import { getActiveShoppingListItems, getCompletedShoppingListItems, removeShoppingListItemById, upsertShoppingListItem } from '../../shopping/shoppingListState';
import type { WidgetRenderProps } from '../WidgetRenderer';

export function ShoppingListWidget({ instance }: WidgetRenderProps) {
  const apiClient = useMemo(() => createListsApiClient(), []);
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<readonly ShoppingListItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    let ignoreResult = false;

    async function loadItems() {
      try {
        setIsLoading(true);
        setError(null);
        const shoppingList = await loadShoppingList(apiClient);

        if (!ignoreResult) {
          setListId(shoppingList.listId);
          setItems(shoppingList.items);
        }
      } catch {
        if (!ignoreResult) {
          setError('Lists could not be loaded.');
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    void loadItems();

    return () => {
      ignoreResult = true;
    };
  }, [apiClient]);

  const activeItems = getActiveShoppingListItems(items);
  const completedItems = getCompletedShoppingListItems(items);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!listId) {
      return;
    }

    try {
      const createdItem = await addShoppingListItem(apiClient, listId, newItemLabel);
      if (createdItem) {
        setItems((current) => upsertShoppingListItem(current, createdItem));
      }
      setNewItemLabel('');
    } catch {
      setError('Shopping item could not be added.');
    }
  }

  async function toggleItem(itemId: string) {
    if (!listId) {
      return;
    }

    try {
      const updatedItem = await toggleShoppingListItem(apiClient, listId, itemId);
      setItems((current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      setError('Shopping item could not be updated.');
    }
  }

  async function removeItem(itemId: string) {
    if (!listId) {
      return;
    }

    try {
      await removeShoppingListItem(apiClient, listId, itemId);
      setItems((current) => removeShoppingListItemById(current, itemId));
    } catch {
      setError('Shopping item could not be removed.');
    }
  }

  async function createFirstList() {
    try {
      setIsCreatingList(true);
      const created = await createShoppingList(apiClient);
      setListId(created.listId);
      setItems(created.items);
      setError(null);
    } catch {
      setError('List could not be created.');
    } finally {
      setIsCreatingList(false);
    }
  }

  return (
    <article className="widget-card shopping-widget" aria-label={instance.title}>
      <p className="widget-type">Shopping List Widget</p>
      <h3>{instance.title}</h3>
      {isLoading ? <p className="shopping-empty">Loading shopping list…</p> : null}
      {error ? <p className="shopping-empty" role="alert">{error}</p> : null}
      <form className="shopping-add-form" onSubmit={addItem}>
        <label>
          <span className="visually-hidden">New shopping item</span>
          <input
            disabled={isLoading || !listId}
            onChange={(event) => setNewItemLabel(event.target.value)}
            id="shopping-new-item"
            placeholder="Add an item"
            type="text"
            value={newItemLabel}
          />
        </label>
        <button disabled={isLoading || !listId} type="submit">Add</button>
      </form>
      {!isLoading && !error && activeItems.length === 0 && completedItems.length === 0 ? (
        <div className="empty-state-card page-empty-state">
          <strong>Create your first list</strong>
          <p>Lists help remember shopping, packing, and household items.</p>
          {listId ? <a href="#shopping-new-item">Start by adding one item.</a> : <button disabled={isCreatingList} onClick={createFirstList} type="button">Create Shopping list</button>}
        </div>
      ) : null}
      <ShoppingListSection
        emptyLabel="No active items."
        items={activeItems}
        onRemove={removeItem}
        onToggle={toggleItem}
        title="Active"
      />
      <ShoppingListSection
        emptyLabel="No completed items."
        items={completedItems}
        onRemove={removeItem}
        onToggle={toggleItem}
        title="Completed"
      />
    </article>
  );
}

interface ShoppingListSectionProps {
  emptyLabel: string;
  items: readonly ShoppingListItem[];
  onRemove(itemId: string): void;
  onToggle(itemId: string): void;
  title: string;
}

function ShoppingListSection({ emptyLabel, items, onRemove, onToggle, title }: ShoppingListSectionProps) {
  return (
    <section className="shopping-section">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="shopping-empty">{emptyLabel}</p>
      ) : (
        <ul className="shopping-list">
          {items.map((item) => (
            <li className="shopping-item" key={item.id}>
              <label>
                <input checked={item.completed} onChange={() => onToggle(item.id)} type="checkbox" />
                <span>{item.label}</span>
              </label>
              <button onClick={() => onRemove(item.id)} type="button">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
