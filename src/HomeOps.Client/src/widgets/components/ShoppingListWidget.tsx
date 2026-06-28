import { FormEvent, useEffect, useMemo, useState } from 'react';
import { addShoppingListItem, archiveShoppingList, createListsApiClient, createShoppingList, deleteShoppingList, loadShoppingPageLists, removeShoppingListItem, renameShoppingList, toggleShoppingListItem, undoShoppingListItem, updateShoppingListItemStore } from '../../shopping/listsApi';
import type { ShoppingListItem, ShoppingListState } from '../../shopping/shoppingListModel';
import { groupShoppingItemsByPreferredStore } from '../../shopping/shoppingGrouping';
import { getActiveShoppingListItems, getCompletedShoppingListItems, getDeletedShoppingListItems, upsertShoppingListItem } from '../../shopping/shoppingListState';
import { FamilyBoardIcon } from '../../design';
import type { WidgetRenderProps } from '../WidgetRenderer';

function getDisplayListName(name: string) {
  return name === 'Shopping' ? 'Boodschappen' : name;
}

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
          setError('Lijsten konden niet worden geladen.');
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
      setError('Lijst kon niet worden gemaakt.');
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

  const recentlyAddedItems = shoppingActiveItems.slice(-4).reverse();

  return (
    <article className="widget-card shopping-widget shopping-workspace" aria-label={instance.title}>
      <header className="shopping-workspace-hero">
        <div className="shopping-hero-copy">
          <p className="widget-type">Boodschappen</p>
          <h3>Boodschappen</h3>
          <p>Schrijf het meteen op, winkel per winkel en vink af terwijl je onderweg bent.</p>
        </div>
        <div className="shopping-hero-illustration" aria-hidden="true">
          <span className="shopping-illustration-sun" />
          <span className="shopping-illustration-family shopping-illustration-grownup" />
          <span className="shopping-illustration-family shopping-illustration-child" />
          <span className="shopping-illustration-bag"><FamilyBoardIcon name="shopping.bag" size={32} /></span>
        </div>
      </header>
      <section className="shopping-quick-add-panel" aria-labelledby="shopping-quick-add-title">
        <div>
          <p className="widget-type">Snel toevoegen</p>
          <h4 id="shopping-quick-add-title">Wat moeten we kopen?</h4>
          <p>Typ iets zodra je eraan denkt. De bestaande boodschappenlijst wordt direct gebruikt.</p>
        </div>
        {isLoading ? <p className="shopping-empty">Boodschappen laden…</p> : null}
        {error ? <p className="shopping-empty" role="alert">{error}</p> : null}
        {!isLoading && !error ? (
          <ListSurface
            apiClient={apiClient}
            list={shoppingList}
            listFallbackName="Boodschappen"
            onClearList={clearList}
            onError={setError}
            onReplaceList={replaceList}
            onUpdateItems={updateListItems}
            primary
            primaryMode="quickAdd"
          />
        ) : null}
      </section>

      {!isLoading && !error ? (
        <ListSurface
          apiClient={apiClient}
          list={shoppingList}
          listFallbackName="Boodschappen"
          onClearList={clearList}
          onError={setError}
          onReplaceList={replaceList}
          onUpdateItems={updateListItems}
          primary
          primaryMode="active"
        />
      ) : null}
      {!isLoading && !error && shoppingActiveItems.length === 0 && shoppingCompletedItems.length === 0 && shoppingDeletedItems.length === 0 ? (
        <div className="empty-state-card page-empty-state shopping-start-card">
          <strong>Begin met je eerste boodschap</strong>
          <p>Deze werkruimte is bedoeld voor één snelle familielijst: bedenken, toevoegen, kopen en afvinken.</p>
          {shoppingList.listId ? <a href="#shopping-new-item">Voeg meteen iets toe.</a> : <button disabled={isCreatingList} onClick={createFirstList} type="button">Maak boodschappenlijst</button>}
        </div>
      ) : null}
      {!isLoading && !error ? (
        <section className="shopping-recent-panel" aria-labelledby="shopping-recent-title">
          <div>
            <p className="widget-type">Laatst toegevoegd</p>
            <h4 id="shopping-recent-title">Staat het er al op?</h4>
          </div>
          {recentlyAddedItems.length === 0 ? <p className="shopping-empty">Nog geen open boodschappen.</p> : (
            <ul className="shopping-recent-list">
              {recentlyAddedItems.map((item) => <li key={item.id}>{item.label}</li>)}
            </ul>
          )}
        </section>
      ) : null}
      <section className="other-lists-section" aria-labelledby="other-lists-title">
        <header>
          <div>
            <p className="widget-type">Andere lijsten</p>
            <h3 id="other-lists-title">Ondersteunende lijsten</h3>
          </div>
          <p className="shopping-empty">Inpakken, projecten en tijdelijke gezinslijsten blijven bereikbaar, maar de boodschappenlijst blijft leidend.</p>
        </header>
        {otherLists.length === 0 ? <p className="shopping-empty">Geen andere lijsten.</p> : null}
        <div className="other-lists-grid">
          {otherLists.map((list) => {
            const activeCount = getActiveShoppingListItems(list.items).length;
            return (
              <details className="other-list-card" key={list.listId ?? list.name}>
                <summary><span>{list.name ?? 'Naamloze lijst'}</span><small>{activeCount} open</small></summary>
                <ListSurface
                  apiClient={apiClient}
                  list={list}
                  listFallbackName="Naamloze lijst"
                  onClearList={clearList}
                  onError={setError}
                  onReplaceList={replaceList}
                  onUpdateItems={updateListItems}
                />
              </details>
            );
          })}
        </div>
      </section>
      {!isLoading && !error ? (
        <ListSurface
          apiClient={apiClient}
          list={shoppingList}
          listFallbackName="Boodschappen"
          onClearList={clearList}
          onError={setError}
          onReplaceList={replaceList}
          onUpdateItems={updateListItems}
          primary
          primaryMode="lifecycle"
        />
      ) : null}
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
  primaryMode?: 'all' | 'quickAdd' | 'active' | 'lifecycle';
}

function ListSurface({ apiClient, list, listFallbackName, onClearList, onError, onReplaceList, onUpdateItems, primary = false, primaryMode = 'all' }: ListSurfaceProps) {
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
      onError('Boodschap kon niet worden toegevoegd.');
    }
  }

  async function toggleItem(itemId: string) {
    if (!list.listId) return;
    try {
      const updatedItem = await toggleShoppingListItem(apiClient, list.listId, itemId);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Boodschap kon niet worden bijgewerkt.');
    }
  }

  async function updateItemStore(itemId: string, preferredStore: string | null) {
    if (!list.listId) return;
    try {
      const updatedItem = await updateShoppingListItemStore(apiClient, list.listId, itemId, preferredStore);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Winkel kon niet worden bijgewerkt.');
    }
  }

  async function renameList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!list.listId) return;
    try {
      onReplaceList(await renameShoppingList(apiClient, list.listId, listName));
      onError('');
    } catch {
      onError('Lijst kon niet worden hernoemd.');
    }
  }

  async function archiveList() {
    if (!list.listId) return;
    try {
      await archiveShoppingList(apiClient, list.listId);
      onClearList(list.listId);
      onError('');
    } catch {
      onError('Lijst kon niet worden gearchiveerd.');
    }
  }

  async function deleteList() {
    if (!list.listId) return;
    try {
      await deleteShoppingList(apiClient, list.listId);
      onClearList(list.listId);
      onError('');
    } catch {
      onError('Lijst kon niet worden verwijderd.');
    }
  }

  async function removeItem(itemId: string) {
    if (!list.listId) return;
    try {
      const updatedItem = await removeShoppingListItem(apiClient, list.listId, itemId);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Boodschap kon niet worden verwijderd.');
    }
  }

  async function undoItem(itemId: string) {
    if (!list.listId) return;
    try {
      const updatedItem = await undoShoppingListItem(apiClient, list.listId, itemId);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Boodschap kon niet worden teruggezet.');
    }
  }

  const inputId = primary ? 'shopping-new-item' : `list-new-item-${list.listId}`;
  const listLabel = getDisplayListName(list.name ?? listFallbackName);

  const quickAddForm = (
    <form className="shopping-add-form shopping-execution-form" aria-label={`Voeg item toe aan ${listLabel}`} onSubmit={addItem}>
      <label>
        <span className="visually-hidden">Nieuw item voor {listLabel}</span>
        <input
          disabled={!list.listId}
          onChange={(event) => setNewItemLabel(event.target.value)}
          id={inputId}
          placeholder="Voeg toe, bijvoorbeeld melk"
          type="text"
          value={newItemLabel}
        />
      </label>
      <button disabled={!list.listId} type="submit">Toevoegen</button>
    </form>
  );

  if (primary && primaryMode === 'quickAdd') {
    return <div className="shopping-quick-add-surface" aria-label={listLabel}>{quickAddForm}</div>;
  }

  if (primary && primaryMode === 'active') {
    return (
      <div className="shopping-primary-list shopping-active-store-workspace" aria-label={`${listLabel} per winkel`}>
        <ShoppingListSection className="shopping-section-primary" emptyLabel="Geen open boodschappen." items={activeItems} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} title="Per winkel" />
      </div>
    );
  }

  if (primary && primaryMode === 'lifecycle') {
    return (
      <div className="shopping-primary-list shopping-lifecycle-workspace" aria-label={`${listLabel} beheer`}>
        <details className="shopping-lifecycle-details">
          <summary>Afgevinkt <span>{completedItems.length}</span></summary>
          <ShoppingListSection emptyLabel="Nog niets afgevinkt." items={completedItems} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} onUndo={undoItem} title="Afgevinkt" />
        </details>
        <details className="shopping-list-management">
          <summary>Lijst beheren</summary>
          <form className="shopping-add-form shopping-list-name-form" onSubmit={renameList}>
            <label>
              <span>Lijstnaam</span>
              <input disabled={!list.listId} onChange={(event) => setListName(event.target.value)} type="text" value={listName} />
            </label>
            <button disabled={!list.listId} type="submit">Hernoemen</button>
            <button disabled={!list.listId} onClick={archiveList} type="button">Archiveren</button>
            <button disabled={!list.listId} onClick={deleteList} type="button" className="danger-button">Verwijderen</button>
          </form>
        </details>
        <details className="shopping-lifecycle-details">
          <summary>Recent verwijderd <span>{deletedItems.length}</span></summary>
          <ShoppingListSection emptyLabel="Niets recent verwijderd." items={deletedItems} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} onUndo={undoItem} title="Recent verwijderd" />
        </details>
      </div>
    );
  }

  return (
    <div className={primary ? 'shopping-primary-list' : 'other-list-surface'} aria-label={listLabel}>
      {quickAddForm}
      <ShoppingListSection className={primary ? 'shopping-section-primary' : undefined} emptyLabel="Geen open boodschappen." items={activeItems} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} title="Per winkel" />
      <ShoppingListSection emptyLabel="Nog niets afgevinkt." items={completedItems} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} onUndo={undoItem} title="Afgevinkt" />
      <details className="shopping-list-management">
        <summary>Lijst beheren</summary>
        <form className="shopping-add-form shopping-list-name-form" onSubmit={renameList}>
          <label>
            <span>Lijstnaam</span>
            <input disabled={!list.listId} onChange={(event) => setListName(event.target.value)} type="text" value={listName} />
          </label>
          <button disabled={!list.listId} type="submit">Hernoemen</button>
          <button disabled={!list.listId} onClick={archiveList} type="button">Archiveren</button>
          <button disabled={!list.listId} onClick={deleteList} type="button" className="danger-button">Verwijderen</button>
        </form>
      </details>
      <ShoppingListSection emptyLabel="Niets recent verwijderd." items={deletedItems} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} onUndo={undoItem} title="Recent verwijderd" />
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
              {onStoreChange ? (
                <header className="shopping-store-card-header">
                  <h5>{group.label}</h5>
                  <span>{group.items.length} open</span>
                </header>
              ) : null}
              <ul className="shopping-list">
                {group.items.slice(0, onStoreChange ? 3 : group.items.length).map((item) => (
                  <ShoppingListRow item={item} key={item.id} onRemove={onRemove} onStoreChange={onStoreChange} onToggle={onToggle} onUndo={onUndo} />
                ))}
              </ul>
              {onStoreChange && group.items.length > 3 ? (
                <details className="shopping-store-complete-list">
                  <summary>Toon alle {group.items.length} boodschappen</summary>
                  <ul className="shopping-list">
                    {group.items.slice(3).map((item) => (
                      <ShoppingListRow item={item} key={item.id} onRemove={onRemove} onStoreChange={onStoreChange} onToggle={onToggle} onUndo={onUndo} />
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface ShoppingListRowProps {
  item: ShoppingListItem;
  onRemove(itemId: string): void;
  onStoreChange?(itemId: string, preferredStore: string | null): void;
  onToggle(itemId: string): void;
  onUndo?(itemId: string): void;
}

function ShoppingListRow({ item, onRemove, onStoreChange, onToggle, onUndo }: ShoppingListRowProps) {
  return (
    <li className={`shopping-item${item.deleted ? ' shopping-item-deleted' : ''}`}>
      <label>
        <input checked={item.completed} onChange={() => onToggle(item.id)} type="checkbox" />
        <span>{item.label}</span>
        {item.deleted ? <small>Verwijderd</small> : null}
        {onStoreChange && item.preferredStore ? <small>({item.preferredStore})</small> : null}
      </label>
      {onStoreChange ? (
        <details className="shopping-item-options">
          <summary>Meer</summary>
          <label className="shopping-store-field">
            <span className="visually-hidden">Winkel</span>
            <input aria-label={`Winkel voor ${item.label}`} list={`store-suggestions-${item.id}`} onBlur={(event) => onStoreChange(item.id, event.target.value || null)} placeholder="Winkel" type="text" defaultValue={item.preferredStore ?? ''} />
            <datalist id={`store-suggestions-${item.id}`}>
              {(item.storeSuggestions ?? []).map((suggestion) => (
                <option key={suggestion.store} value={suggestion.store}>{suggestion.store} ({suggestion.purchaseCount})</option>
              ))}
            </datalist>
          </label>
        </details>
      ) : null}
      {onUndo ? <button onClick={() => onUndo(item.id)} type="button">Terugzetten</button> : null}
      {!item.deleted ? <button onClick={() => onRemove(item.id)} type="button" className="secondary-action">Weg</button> : null}
    </li>
  );
}
