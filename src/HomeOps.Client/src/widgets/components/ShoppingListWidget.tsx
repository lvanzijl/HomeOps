import { type ReactNode, FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { addShoppingListItem, archiveShoppingList, createListsApiClient, createShoppingList, deleteShoppingList, loadShoppingPageLists, removeShoppingListItem, renameShoppingList, toggleShoppingListItem, undoShoppingListItem, updateShoppingListItemStore } from '../../shopping/listsApi';
import type { ShoppingListItem, ShoppingListState } from '../../shopping/shoppingListModel';
import { groupShoppingItemsByPreferredStore } from '../../shopping/shoppingGrouping';
import { getActiveShoppingListItems, getCompletedShoppingListItems, getDeletedShoppingListItems, upsertShoppingListItem } from '../../shopping/shoppingListState';
import type { WidgetRenderProps } from '../WidgetRenderer';

type ShoppingPanelKind = 'completed' | 'deleted' | 'otherLists' | 'manage';

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
  const [activePanel, setActivePanel] = useState<ShoppingPanelKind | null>(null);
  const [selectedOtherListId, setSelectedOtherListId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!activePanel) {
      return undefined;
    }

    const closePanel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePanel(null);
      }
    };

    window.addEventListener('keydown', closePanel);
    return () => window.removeEventListener('keydown', closePanel);
  }, [activePanel]);

  useEffect(() => {
    if (otherLists.length === 0) {
      if (activePanel === 'otherLists') {
        setActivePanel(null);
      }

      if (selectedOtherListId !== null) {
        setSelectedOtherListId(null);
      }

      return;
    }

    if (!selectedOtherListId || !otherLists.some((list) => list.listId === selectedOtherListId)) {
      setSelectedOtherListId(otherLists[0].listId);
    }
  }, [activePanel, otherLists, selectedOtherListId]);

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
      setActivePanel(null);
      return;
    }

    setOtherLists((current) => current.filter((list) => list.listId !== listId));
  }

  const shoppingActiveItems = getActiveShoppingListItems(shoppingList.items);
  const shoppingCompletedItems = getCompletedShoppingListItems(shoppingList.items);
  const shoppingDeletedItems = getDeletedShoppingListItems(shoppingList.items);
  const recentlyAddedItems = shoppingActiveItems.slice(-3).reverse();
  const hasShoppingActivity = shoppingActiveItems.length > 0 || shoppingCompletedItems.length > 0 || shoppingDeletedItems.length > 0;
  const selectedOtherList = otherLists.find((list) => list.listId === selectedOtherListId) ?? otherLists[0] ?? null;

  const statusMessage = isLoading
    ? 'Boodschappen laden…'
    : error
      ? error
      : recentlyAddedItems[0]
        ? `Laatst toegevoegd: ${recentlyAddedItems[0].label}`
        : shoppingActiveItems.length > 0
          ? `${shoppingActiveItems.length} open ${shoppingActiveItems.length === 1 ? 'boodschap' : 'boodschappen'}`
          : shoppingList.listId
            ? 'Lijst klaar voor nieuwe boodschappen.'
            : 'Maak een boodschappenlijst om te starten.';

  return (
    <article className="widget-card shopping-widget shopping-workspace" aria-label={instance.title}>
      <section className="shopping-command-row">
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
        <p className={`shopping-command-status${error ? ' shopping-command-status-error' : ''}`} role={error ? 'alert' : 'status'}>
          {statusMessage}
        </p>
      </section>

      <section className="shopping-active-region" aria-label="Actieve boodschappenlijst">
        {isLoading ? (
          <div className="shopping-region-state">
            <strong>Boodschappen laden…</strong>
            <p>De actieve lijst wordt in dit vaste vak geladen.</p>
          </div>
        ) : error ? (
          <div className="shopping-region-state shopping-region-state-error" role="alert">
            <strong>Laden lukt nu niet.</strong>
            <p>{error}</p>
          </div>
        ) : hasShoppingActivity ? (
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
        ) : (
          <div className="shopping-region-state shopping-region-state-empty">
            <strong>Begin met je eerste boodschap</strong>
            <p>Deze ruimte blijft gereserveerd voor de actieve lijst per winkel.</p>
            {shoppingList.listId ? (
              <a href="#shopping-new-item">Voeg meteen iets toe.</a>
            ) : (
              <button disabled={isCreatingList} onClick={createFirstList} type="button">
                Maak boodschappenlijst
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="shopping-footer-strip" aria-label="Boodschappenstatus">
        <span className="shopping-footer-pill" title={statusMessage}>{statusMessage}</span>
        <button className="shopping-footer-action" onClick={() => setActivePanel('completed')} type="button">
          Afgevinkt <span>{shoppingCompletedItems.length}</span>
        </button>
        <button className="shopping-footer-action" onClick={() => setActivePanel('deleted')} type="button">
          Herstellen <span>{shoppingDeletedItems.length}</span>
        </button>
        <button className="shopping-footer-action" disabled={otherLists.length === 0} onClick={() => setActivePanel('otherLists')} type="button">
          Andere lijsten <span>{otherLists.length}</span>
        </button>
        <button className="shopping-footer-action" disabled={!shoppingList.listId} onClick={() => setActivePanel('manage')} type="button">
          Beheer
        </button>
      </footer>

      {activePanel ? (
        <ShoppingSurfaceDialog
          description={getPanelDescription(activePanel)}
          onClose={() => setActivePanel(null)}
          title={getPanelTitle(activePanel)}
        >
          {activePanel === 'completed' ? (
            <ListSurface
              apiClient={apiClient}
              list={shoppingList}
              listFallbackName="Boodschappen"
              onClearList={clearList}
              onError={setError}
              onReplaceList={replaceList}
              onUpdateItems={updateListItems}
              primary
              primaryMode="completed"
            />
          ) : null}
          {activePanel === 'deleted' ? (
            <ListSurface
              apiClient={apiClient}
              list={shoppingList}
              listFallbackName="Boodschappen"
              onClearList={clearList}
              onError={setError}
              onReplaceList={replaceList}
              onUpdateItems={updateListItems}
              primary
              primaryMode="deleted"
            />
          ) : null}
          {activePanel === 'manage' ? (
            <ListSurface
              apiClient={apiClient}
              list={shoppingList}
              listFallbackName="Boodschappen"
              onClearList={clearList}
              onError={setError}
              onReplaceList={replaceList}
              onUpdateItems={updateListItems}
              primary
              primaryMode="manage"
            />
          ) : null}
          {activePanel === 'otherLists' ? (
            <div className="shopping-other-lists-panel">
              {otherLists.length === 0 ? (
                <p className="shopping-empty">Geen andere lijsten beschikbaar.</p>
              ) : (
                <>
                  <div className="shopping-other-list-tabs" role="tablist" aria-label="Andere lijsten">
                    {otherLists.map((list) => (
                      <button
                        aria-selected={selectedOtherList?.listId === list.listId}
                        className={selectedOtherList?.listId === list.listId ? 'selected' : undefined}
                        key={list.listId ?? list.name}
                        onClick={() => setSelectedOtherListId(list.listId)}
                        role="tab"
                        type="button"
                      >
                        <span>{list.name ?? 'Naamloze lijst'}</span>
                        <small>{getActiveShoppingListItems(list.items).length} open</small>
                      </button>
                    ))}
                  </div>
                  {selectedOtherList ? (
                    <div className="shopping-other-list-surface">
                      <ListSurface
                        apiClient={apiClient}
                        list={selectedOtherList}
                        listFallbackName="Naamloze lijst"
                        onClearList={clearList}
                        onError={setError}
                        onReplaceList={replaceList}
                        onUpdateItems={updateListItems}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </ShoppingSurfaceDialog>
      ) : null}
    </article>
  );
}

function getPanelTitle(panel: ShoppingPanelKind) {
  switch (panel) {
    case 'completed':
      return 'Afgevinkte boodschappen';
    case 'deleted':
      return 'Herstellen en terugzetten';
    case 'otherLists':
      return 'Andere lijsten';
    case 'manage':
      return 'Boodschappenlijst beheren';
  }
}

function getPanelDescription(panel: ShoppingPanelKind) {
  switch (panel) {
    case 'completed':
      return 'Bekijk wat al is afgehandeld zonder de actieve lijst te verplaatsen.';
    case 'deleted':
      return 'Open recente verwijderingen in een begrensd herstelvak.';
    case 'otherLists':
      return 'Schakel naar ondersteunende lijsten zonder de standaardweergave uit te breiden.';
    case 'manage':
      return 'Hernoem, archiveer of verwijder de huidige boodschappenlijst op aanvraag.';
  }
}

interface ShoppingSurfaceDialogProps {
  children: ReactNode;
  description: string;
  onClose(): void;
  title: string;
}

function ShoppingSurfaceDialog({ children, description, onClose, title }: ShoppingSurfaceDialogProps) {
  const titleId = useId();

  return (
    <div className="shopping-surface-backdrop" onClick={onClose} role="presentation">
      <section aria-labelledby={titleId} aria-modal="true" className="shopping-surface-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
        <header className="shopping-surface-dialog-header">
          <div>
            <h4 id={titleId}>{title}</h4>
            <p>{description}</p>
          </div>
          <button aria-label="Sluit boodschappenpaneel" className="shopping-surface-close" onClick={onClose} type="button">
            Sluiten
          </button>
        </header>
        <div className="shopping-surface-dialog-body">{children}</div>
      </section>
    </div>
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
  primaryMode?: 'all' | 'quickAdd' | 'active' | 'completed' | 'deleted' | 'manage';
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
      if (createdItem) {
        onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, createdItem));
      }
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
          id={inputId}
          onChange={(event) => setNewItemLabel(event.target.value)}
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
        <ShoppingListSection className="shopping-section-primary" emptyLabel="Geen open boodschappen." items={activeItems} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} title="Actieve lijst per winkel" />
      </div>
    );
  }

  if (primary && primaryMode === 'completed') {
    return (
      <div className="shopping-primary-list shopping-context-list" aria-label={`${listLabel} afgevinkt`}>
        <ShoppingListSection emptyLabel="Nog niets afgevinkt." items={completedItems} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} onUndo={undoItem} title="Afgevinkt" />
      </div>
    );
  }

  if (primary && primaryMode === 'deleted') {
    return (
      <div className="shopping-primary-list shopping-context-list" aria-label={`${listLabel} herstel`}>
        <ShoppingListSection emptyLabel="Niets recent verwijderd." items={deletedItems} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} onUndo={undoItem} title="Recent verwijderd" />
      </div>
    );
  }

  if (primary && primaryMode === 'manage') {
    return (
      <div className="shopping-primary-list shopping-context-list shopping-management-panel" aria-label={`${listLabel} beheer`}>
        <section className="shopping-section shopping-management-section">
          <h4>Lijst beheren</h4>
          <div className="shopping-section-body">
            <form className="shopping-add-form shopping-list-name-form" onSubmit={renameList}>
              <label>
                <span>Lijstnaam</span>
                <input disabled={!list.listId} onChange={(event) => setListName(event.target.value)} type="text" value={listName} />
              </label>
              <div className="shopping-management-actions">
                <button disabled={!list.listId} type="submit">Hernoemen</button>
                <button disabled={!list.listId} onClick={archiveList} type="button">Archiveren</button>
                <button className="danger-button" disabled={!list.listId} onClick={deleteList} type="button">Verwijderen</button>
              </div>
            </form>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={primary ? 'shopping-primary-list' : 'other-list-surface'} aria-label={listLabel}>
      {quickAddForm}
      <ShoppingListSection className={primary ? 'shopping-section-primary' : undefined} emptyLabel="Geen open boodschappen." items={activeItems} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} title="Per winkel" />
      <ShoppingListSection emptyLabel="Nog niets afgevinkt." items={completedItems} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} onUndo={undoItem} title="Afgevinkt" />
      <section className="shopping-section shopping-management-section">
        <h4>Lijst beheren</h4>
        <div className="shopping-section-body">
          <form className="shopping-add-form shopping-list-name-form" onSubmit={renameList}>
            <label>
              <span>Lijstnaam</span>
              <input disabled={!list.listId} onChange={(event) => setListName(event.target.value)} type="text" value={listName} />
            </label>
            <div className="shopping-management-actions">
              <button disabled={!list.listId} type="submit">Hernoemen</button>
              <button disabled={!list.listId} onClick={archiveList} type="button">Archiveren</button>
              <button className="danger-button" disabled={!list.listId} onClick={deleteList} type="button">Verwijderen</button>
            </div>
          </form>
        </div>
      </section>
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
      <div className="shopping-section-body">
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
                ) : (
                  <header className="shopping-store-card-header shopping-store-card-header-quiet">
                    <h5>{group.label}</h5>
                    <span>{group.items.length}</span>
                  </header>
                )}
                <ul className="shopping-list">
                  {group.items.map((item) => (
                    <ShoppingListRow item={item} key={item.id} onRemove={onRemove} onStoreChange={onStoreChange} onToggle={onToggle} onUndo={onUndo} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
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
        <span title={item.label}>{item.label}</span>
        {item.deleted ? <small>Verwijderd</small> : null}
      </label>
      <div className="shopping-item-actions">
        {onStoreChange ? (
          <details className="shopping-item-options">
            <summary>Winkel</summary>
            <label className="shopping-store-field">
              <span className="visually-hidden">Winkel</span>
              <input aria-label={`Winkel voor ${item.label}`} defaultValue={item.preferredStore ?? ''} list={`store-suggestions-${item.id}`} onBlur={(event) => onStoreChange(item.id, event.target.value || null)} placeholder="Winkel" type="text" />
              <datalist id={`store-suggestions-${item.id}`}>
                {(item.storeSuggestions ?? []).map((suggestion) => (
                  <option key={suggestion.store} value={suggestion.store}>{suggestion.store} ({suggestion.purchaseCount})</option>
                ))}
              </datalist>
            </label>
          </details>
        ) : null}
        {onUndo ? <button onClick={() => onUndo(item.id)} type="button">Terugzetten</button> : null}
        {!item.deleted ? <button className="secondary-action" onClick={() => onRemove(item.id)} type="button">Weg</button> : null}
      </div>
    </li>
  );
}
