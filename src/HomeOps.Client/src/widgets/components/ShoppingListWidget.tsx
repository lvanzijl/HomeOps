import { FormEvent, useEffect, useMemo, useState } from 'react';
import { addShoppingListItem, archiveShoppingList, createListsApiClient, createShoppingList, deleteShoppingList, loadShoppingPageLists, removeShoppingListItem, renameShoppingList, toggleShoppingListItem, undoShoppingListItem, updateShoppingListItemStore } from '../../shopping/listsApi';
import type { ShoppingListItem, ShoppingListState } from '../../shopping/shoppingListModel';
import { groupShoppingItemsByPreferredStore } from '../../shopping/shoppingGrouping';
import { getActiveShoppingListItems, getCompletedShoppingListItems, getDeletedShoppingListItems, upsertShoppingListItem } from '../../shopping/shoppingListState';
import type { WidgetRenderProps } from '../WidgetRenderer';

export function ShoppingListWidget({ instance }: WidgetRenderProps) {
  const apiClient = useMemo(() => createListsApiClient(), []);
  const [shoppingList, setShoppingList] = useState<ShoppingListState>({ listId: null, name: 'Shopping', items: [] });
  const [otherLists, setOtherLists] = useState<ShoppingListState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    let ignoreResult = false;

    async function loadItems() {
      try {
        setIsLoading(true);
        setError(null);
        const loaded = await loadShoppingPageLists(apiClient);

        if (!ignoreResult) {
          setShoppingList(loaded.shoppingList);
          setOtherLists([...loaded.otherLists]);
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

  async function createFirstList() {
    try {
      setIsCreatingList(true);
      const created = await createShoppingList(apiClient);
      setShoppingList(created);
      setError(null);
    } catch {
      setError('List could not be created.');
    } finally {
      setIsCreatingList(false);
    }
  }

  function replaceList(updated: ShoppingListState) {
    if (updated.listId === shoppingList.listId) {
      setShoppingList(updated);
      return;
    }

    setOtherLists((current) => current.map((list) => list.listId === updated.listId ? updated : list));
  }

  function updateListItems(listId: string | null, updater: (items: readonly ShoppingListItem[]) => readonly ShoppingListItem[]) {
    if (listId === shoppingList.listId) {
      setShoppingList((current) => ({ ...current, items: updater(current.items) }));
      return;
    }

    setOtherLists((current) => current.map((list) => list.listId === listId ? { ...list, items: updater(list.items) } : list));
  }

  function clearList(listId: string | null) {
    if (listId === shoppingList.listId) {
      setShoppingList({ listId: null, name: 'Shopping', items: [] });
      return;
    }

    setOtherLists((current) => current.filter((list) => list.listId !== listId));
  }

  const shoppingActiveItems = getActiveShoppingListItems(shoppingList.items);
  const shoppingCompletedItems = getCompletedShoppingListItems(shoppingList.items);
  const shoppingDeletedItems = getDeletedShoppingListItems(shoppingList.items);

  return (
    <article className="widget-card shopping-widget" aria-label={instance.title}>
      <header className="shopping-header">
        <div>
          <p className="widget-type">Shopping</p>
          <h3>Shopping</h3>
        </div>
        <p>{shoppingActiveItems.length} active · {shoppingCompletedItems.length} completed</p>
      </header>
      {isLoading ? <p className="shopping-empty">Loading shopping list…</p> : null}
      {error ? <p className="shopping-empty" role="alert">{error}</p> : null}
      {!isLoading && !error ? (
        <ListSurface
          apiClient={apiClient}
          list={shoppingList}
          listFallbackName="Shopping"
          onClearList={clearList}
          onError={setError}
          onReplaceList={replaceList}
          onUpdateItems={updateListItems}
          primary
        />
      ) : null}
      {!isLoading && !error && shoppingActiveItems.length === 0 && shoppingCompletedItems.length === 0 && shoppingDeletedItems.length === 0 ? (
        <div className="empty-state-card page-empty-state">
          <strong>Create your first list</strong>
          <p>Lists help remember shopping, packing, and household items.</p>
          {shoppingList.listId ? <a href="#shopping-new-item">Start by adding one item.</a> : <button disabled={isCreatingList} onClick={createFirstList} type="button">Create Shopping list</button>}
        </div>
      ) : null}
      <section className="other-lists-section" aria-labelledby="other-lists-title">
        <header>
          <p className="widget-type">Other Lists</p>
          <h3 id="other-lists-title">Other Lists</h3>
          <p className="shopping-empty">Packing, holidays, projects, and other household lists stay here under Shopping.</p>
        </header>
        {otherLists.length === 0 ? <p className="shopping-empty">No other lists yet.</p> : null}
        <div className="other-lists-grid">
          {otherLists.map((list) => (
            <details className="other-list-card" key={list.listId ?? list.name}>
              <summary>{list.name ?? 'Untitled list'}</summary>
              <ListSurface
                apiClient={apiClient}
                list={list}
                listFallbackName="Untitled list"
                onClearList={clearList}
                onError={setError}
                onReplaceList={replaceList}
                onUpdateItems={updateListItems}
              />
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}

interface ListSurfaceProps {
  apiClient: Parameters<typeof addShoppingListItem>[0];
  list: ShoppingListState;
  listFallbackName: string;
  onClearList(listId: string | null): void;
  onError(message: string): void;
  onReplaceList(list: ShoppingListState): void;
  onUpdateItems(listId: string | null, updater: (items: readonly ShoppingListItem[]) => readonly ShoppingListItem[]): void;
  primary?: boolean;
}

function ListSurface({ apiClient, list, listFallbackName, onClearList, onError, onReplaceList, onUpdateItems, primary = false }: ListSurfaceProps) {
  const [newItemLabel, setNewItemLabel] = useState('');
  const [listName, setListName] = useState(list.name ?? listFallbackName);

  useEffect(() => setListName(list.name ?? listFallbackName), [list.name, listFallbackName]);

  const activeItems = getActiveShoppingListItems(list.items);
  const completedItems = getCompletedShoppingListItems(list.items);
  const deletedItems = getDeletedShoppingListItems(list.items);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!list.listId) return;

    try {
      const createdItem = await addShoppingListItem(apiClient, list.listId, newItemLabel);
      if (createdItem) onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, createdItem));
      setNewItemLabel('');
    } catch {
      onError('Shopping item could not be added.');
    }
  }

  async function toggleItem(itemId: string) {
    if (!list.listId) return;
    try {
      const updatedItem = await toggleShoppingListItem(apiClient, list.listId, itemId);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Shopping item could not be updated.');
    }
  }

  async function updateItemStore(itemId: string, preferredStore: string | null) {
    if (!list.listId) return;
    try {
      const updatedItem = await updateShoppingListItemStore(apiClient, list.listId, itemId, preferredStore);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Shopping store could not be updated.');
    }
  }

  async function renameList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!list.listId) return;
    try {
      onReplaceList(await renameShoppingList(apiClient, list.listId, listName));
      onError('');
    } catch {
      onError('Shopping list could not be renamed.');
    }
  }

  async function archiveList() {
    if (!list.listId) return;
    try {
      await archiveShoppingList(apiClient, list.listId);
      onClearList(list.listId);
      onError('');
    } catch {
      onError('Shopping list could not be archived.');
    }
  }

  async function deleteList() {
    if (!list.listId) return;
    try {
      await deleteShoppingList(apiClient, list.listId);
      onClearList(list.listId);
      onError('');
    } catch {
      onError('Shopping list could not be deleted.');
    }
  }

  async function removeItem(itemId: string) {
    if (!list.listId) return;
    try {
      const updatedItem = await removeShoppingListItem(apiClient, list.listId, itemId);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Shopping item could not be removed.');
    }
  }

  async function undoItem(itemId: string) {
    if (!list.listId) return;
    try {
      const updatedItem = await undoShoppingListItem(apiClient, list.listId, itemId);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Shopping item could not be restored.');
    }
  }

  const inputId = primary ? 'shopping-new-item' : `list-new-item-${list.listId}`;
  const listLabel = list.name ?? listFallbackName;

  return (
    <div className={primary ? 'shopping-primary-list' : 'other-list-surface'} aria-label={listLabel}>
      <form className="shopping-add-form shopping-execution-form" aria-label={`Add item to ${listLabel}`} onSubmit={addItem}>
        <label>
          <span className="visually-hidden">New item for {listLabel}</span>
          <input
            disabled={!list.listId}
            onChange={(event) => setNewItemLabel(event.target.value)}
            id={inputId}
            placeholder="Add an item"
            type="text"
            value={newItemLabel}
          />
        </label>
        <button disabled={!list.listId} type="submit">Add</button>
      </form>
      <ShoppingListSection className={primary ? 'shopping-section-primary' : undefined} emptyLabel="No active items." items={activeItems} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} title="Active" />
      <ShoppingListSection emptyLabel="No completed items." items={completedItems} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} onUndo={undoItem} title="Completed" />
      <details className="shopping-list-management">
        <summary>List settings</summary>
        <form className="shopping-add-form shopping-list-name-form" onSubmit={renameList}>
          <label>
            <span>List name</span>
            <input disabled={!list.listId} onChange={(event) => setListName(event.target.value)} type="text" value={listName} />
          </label>
          <button disabled={!list.listId} type="submit">Rename</button>
          <button disabled={!list.listId} onClick={archiveList} type="button">Archive</button>
          <button disabled={!list.listId} onClick={deleteList} type="button">Delete</button>
        </form>
      </details>
      <ShoppingListSection emptyLabel="No recently deleted items." items={deletedItems} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} onUndo={undoItem} title="Recently deleted" />
    </div>
  );
}

interface ShoppingListSectionProps {
  className?: string;
  emptyLabel: string;
  items: readonly ShoppingListItem[];
  onRemove(itemId: string): void;
  onStoreChange?(itemId: string, preferredStore: string | null): void;
  onToggle(itemId: string): void;
  onUndo?(itemId: string): void;
  title: string;
}

function ShoppingListSection({ className, emptyLabel, items, onRemove, onStoreChange, onToggle, onUndo, title }: ShoppingListSectionProps) {
  return (
    <section className={`shopping-section${className ? ` ${className}` : ''}`}>
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p className="shopping-empty">{emptyLabel}</p>
      ) : (
        <div className="shopping-store-groups">
          {groupShoppingItemsByPreferredStore(items, { activeOnly: false }).map((group) => (
            <div className="shopping-store-group" key={group.store ?? 'zonder-winkel'}>
              {onStoreChange ? <h5>{group.label}</h5> : null}
              <ul className="shopping-list">
                {group.items.map((item) => (
                  <li className={`shopping-item${item.deleted ? ' shopping-item-deleted' : ''}`} key={item.id}>
                    <label>
                      <input checked={item.completed} onChange={() => onToggle(item.id)} type="checkbox" />
                      <span>{item.label}</span>
                      {item.deleted ? <small>Deleted</small> : null}
                      {onStoreChange && item.preferredStore ? <small>({item.preferredStore})</small> : null}
                    </label>
                    {onStoreChange ? (
                      <details className="shopping-item-options">
                        <summary>Store</summary>
                        <label className="shopping-store-field">
                          <span className="visually-hidden">Store</span>
                          <input aria-label={`Store for ${item.label}`} list={`store-suggestions-${item.id}`} onBlur={(event) => onStoreChange(item.id, event.target.value || null)} placeholder="Optional" type="text" defaultValue={item.preferredStore ?? ''} />
                          <datalist id={`store-suggestions-${item.id}`}>
                            {(item.storeSuggestions ?? []).map((suggestion) => (
                              <option key={suggestion.store} value={suggestion.store}>{suggestion.store} ({suggestion.purchaseCount})</option>
                            ))}
                          </datalist>
                        </label>
                      </details>
                    ) : null}
                    {onUndo ? <button onClick={() => onUndo(item.id)} type="button">Undo</button> : null}
                    {!item.deleted ? <button onClick={() => onRemove(item.id)} type="button">Remove</button> : null}
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
