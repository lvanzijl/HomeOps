import { FormEvent, useEffect, useMemo, useState } from 'react';
import { addShoppingListItem, archiveShoppingList, createListsApiClient, createShoppingList, deleteShoppingList, loadShoppingList, removeShoppingListItem, renameShoppingList, toggleShoppingListItem, undoShoppingListItem, updateShoppingListItemStore } from '../../shopping/listsApi';
import type { ShoppingListItem } from '../../shopping/shoppingListModel';
import { getActiveShoppingListItems, getCompletedShoppingListItems, getDeletedShoppingListItems, upsertShoppingListItem } from '../../shopping/shoppingListState';
import type { WidgetRenderProps } from '../WidgetRenderer';

export function ShoppingListWidget({ instance }: WidgetRenderProps) {
  const apiClient = useMemo(() => createListsApiClient(), []);
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<readonly ShoppingListItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [listName, setListName] = useState('Shopping');
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
          setListName(shoppingList.name ?? 'Shopping');
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
  const deletedItems = getDeletedShoppingListItems(items);

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

  async function updateItemStore(itemId: string, preferredStore: string | null) {
    if (!listId) {
      return;
    }

    try {
      const updatedItem = await updateShoppingListItemStore(apiClient, listId, itemId, preferredStore);
      setItems((current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      setError('Shopping store could not be updated.');
    }
  }

  async function renameList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listId) {
      return;
    }

    try {
      const updated = await renameShoppingList(apiClient, listId, listName);
      setItems(updated.items);
      setError(null);
    } catch {
      setError('Shopping list could not be renamed.');
    }
  }

  async function archiveList() {
    if (!listId) {
      return;
    }

    try {
      await archiveShoppingList(apiClient, listId);
      setListId(null);
      setItems([]);
      setError(null);
    } catch {
      setError('Shopping list could not be archived.');
    }
  }

  async function deleteList() {
    if (!listId) {
      return;
    }

    try {
      await deleteShoppingList(apiClient, listId);
      setListId(null);
      setItems([]);
      setError(null);
    } catch {
      setError('Shopping list could not be deleted.');
    }
  }

  async function removeItem(itemId: string) {
    if (!listId) {
      return;
    }

    try {
      const updatedItem = await removeShoppingListItem(apiClient, listId, itemId);
      setItems((current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      setError('Shopping item could not be removed.');
    }
  }

  async function undoItem(itemId: string) {
    if (!listId) {
      return;
    }

    try {
      const updatedItem = await undoShoppingListItem(apiClient, listId, itemId);
      setItems((current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      setError('Shopping item could not be restored.');
    }
  }

  async function createFirstList() {
    try {
      setIsCreatingList(true);
      const created = await createShoppingList(apiClient);
      setListId(created.listId);
      setListName(created.name ?? 'Shopping');
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
      <form className="shopping-add-form shopping-list-name-form" onSubmit={renameList}>
        <label>
          <span>List name</span>
          <input disabled={isLoading || !listId} onChange={(event) => setListName(event.target.value)} type="text" value={listName} />
        </label>
        <button disabled={isLoading || !listId} type="submit">Rename</button>
        <button disabled={isLoading || !listId} onClick={archiveList} type="button">Archive</button>
        <button disabled={isLoading || !listId} onClick={deleteList} type="button">Delete</button>
      </form>
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
      {!isLoading && !error && activeItems.length === 0 && completedItems.length === 0 && deletedItems.length === 0 ? (
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
        onStoreChange={updateItemStore}
        onToggle={toggleItem}
        title="Active"
      />
      <ShoppingListSection
        emptyLabel="No completed items."
        items={completedItems}
        onRemove={removeItem}
        onStoreChange={updateItemStore}
        onToggle={toggleItem}
        onUndo={undoItem}
        title="Completed"
      />
      <ShoppingListSection
        emptyLabel="No recently deleted items."
        items={deletedItems}
        onRemove={removeItem}
        onStoreChange={updateItemStore}
        onToggle={toggleItem}
        onUndo={undoItem}
        title="Recently deleted"
      />
    </article>
  );
}

interface ShoppingListSectionProps {
  emptyLabel: string;
  items: readonly ShoppingListItem[];
  onRemove(itemId: string): void;
  onStoreChange(itemId: string, preferredStore: string | null): void;
  onToggle(itemId: string): void;
  onUndo?(itemId: string): void;
  title: string;
}

function ShoppingListSection({ emptyLabel, items, onRemove, onStoreChange, onToggle, onUndo, title }: ShoppingListSectionProps) {
  return (
    <section className="shopping-section">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="shopping-empty">{emptyLabel}</p>
      ) : (
        <div className="shopping-store-groups">
          {groupItemsByStore(items).map((group) => (
            <div className="shopping-store-group" key={group.store ?? 'uncategorized'}>
              <h5>{group.store ?? 'Uncategorized'}</h5>
              <ul className="shopping-list">
                {group.items.map((item) => (
                  <li className={`shopping-item${item.deleted ? ' shopping-item-deleted' : ''}`} key={item.id}>
                    <label>
                      <input checked={item.completed} onChange={() => onToggle(item.id)} type="checkbox" />
                      <span>{item.label}</span>
                      {item.deleted ? <small>Deleted</small> : null}
                      {item.preferredStore ? <small>({item.preferredStore})</small> : null}
                    </label>
                    <label className="shopping-store-field">
                      <span>Store</span>
                      <input
                        aria-label={`Store for ${item.label}`}
                        list={`store-suggestions-${item.id}`}
                        onBlur={(event) => onStoreChange(item.id, event.target.value || null)}
                        placeholder="Optional"
                        type="text"
                        defaultValue={item.preferredStore ?? ''}
                      />
                      <datalist id={`store-suggestions-${item.id}`}>
                        {(item.storeSuggestions ?? []).map((suggestion) => (
                          <option key={suggestion.store} value={suggestion.store}>{suggestion.store} ({suggestion.purchaseCount})</option>
                        ))}
                      </datalist>
                    </label>
                    {onUndo ? <button onClick={() => onUndo(item.id)} type="button">Undo</button> : null}
                    {!item.deleted ? <button onClick={() => onRemove(item.id)} type="button">
                      Remove
                    </button> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


function groupItemsByStore(items: readonly ShoppingListItem[]): { store: string | null; items: readonly ShoppingListItem[] }[] {
  const stores = Array.from(new Set(items.map((item) => item.preferredStore).filter((store): store is string => Boolean(store)))).sort((a, b) => a.localeCompare(b));
  const grouped = stores.map((store) => ({ store, items: items.filter((item) => item.preferredStore === store) }));
  const uncategorized = items.filter((item) => !item.preferredStore);
  return uncategorized.length > 0 ? [...grouped, { store: null, items: uncategorized }] : grouped;
}
