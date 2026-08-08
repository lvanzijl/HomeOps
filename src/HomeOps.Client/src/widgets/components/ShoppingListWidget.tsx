import { type ReactNode, FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { addShoppingListItem, archiveShoppingList, createListsApiClient, createNamedShoppingList, createShoppingList, isDedicatedShoppingListName, loadShoppingPageLists, permanentlyDeleteShoppingList, removeShoppingListItem, renameShoppingList, restoreShoppingList, toggleShoppingListItem, undoShoppingListItem, updateShoppingListItemDecorativeAvatar, updateShoppingListItemStore } from '../../shopping/listsApi';
import type { ShoppingDecorativeAvatarReference, ShoppingListItem, ShoppingListLifecycleSummary, ShoppingListState } from '../../shopping/shoppingListModel';
import { groupShoppingItemsByPreferredStore } from '../../shopping/shoppingGrouping';
import { getActiveShoppingListItems, getCompletedShoppingListItems, getDeletedShoppingListItems, upsertShoppingListItem } from '../../shopping/shoppingListState';
import type { WidgetRenderProps } from '../WidgetRenderer';
import { DecorativeAvatarBadge } from '../../avatarContacts/DecorativeAvatar';
import { DecorativeAvatarPicker, resolveDecorativeAvatar } from '../../avatarContacts/DecorativeAvatarPicker';
import { loadFamilyMembers } from '../../home/familyMembersApi';
import type { FamilyMember } from '../../home/familyMembers';
import { listKnownPeople } from '../../knownPeople/knownPeopleApi';
import type { KnownPerson } from '../../knownPeople/knownPeople';

type ShoppingPanelKind = 'completed' | 'deleted' | 'lists' | 'manage';

function getDisplayListName(name: string) {
  return name === 'Shopping' ? 'Boodschappen' : name;
}

export function ShoppingListWidget({ instance }: WidgetRenderProps) {
  const apiClient = useMemo(() => createListsApiClient(), []);
  const [shoppingList, setShoppingList] = useState<ShoppingListState>({ listId: null, name: 'Shopping', items: [] });
  const [otherLists, setOtherLists] = useState<ShoppingListState[]>([]);
  const [archivedLists, setArchivedLists] = useState<ShoppingListLifecycleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [activePanel, setActivePanel] = useState<ShoppingPanelKind | null>(null);
  const [selectedOtherListId, setSelectedOtherListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [isCreatingNamedList, setIsCreatingNamedList] = useState(false);
  const [listDirectoryStatus, setListDirectoryStatus] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [knownPeople, setKnownPeople] = useState<KnownPerson[]>([]);

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
          setArchivedLists([...(loaded.archivedLists ?? [])]);
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
    let ignoreResult = false;
    Promise.all([loadFamilyMembers(), listKnownPeople()])
      .then(([members, people]) => {
        if (!ignoreResult) {
          setFamilyMembers([...members]);
          setKnownPeople([...people]);
        }
      })
      .catch(() => {
        if (!ignoreResult) {
          setFamilyMembers([]);
          setKnownPeople([]);
        }
      });
    return () => { ignoreResult = true; };
  }, []);

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
      if (selectedOtherListId !== null) {
        setSelectedOtherListId(null);
      }

      return;
    }

    if (!selectedOtherListId || !otherLists.some((list) => list.listId === selectedOtherListId)) {
      setSelectedOtherListId(otherLists[0].listId);
    }
  }, [activePanel, otherLists, selectedOtherListId]);

  async function createAdditionalList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newListName.trim()) return;
    try {
      setIsCreatingNamedList(true);
      setListDirectoryStatus(null);
      const created = await createNamedShoppingList(apiClient, newListName);
      if (isDedicatedShoppingListName(created.name) && !shoppingList.listId) {
        setShoppingList(created);
      } else {
        setOtherLists((current) => [...current, created].sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '')));
        setSelectedOtherListId(created.listId);
      }
      setNewListName('');
      setListDirectoryStatus(`${getDisplayListName(created.name ?? 'Nieuwe lijst')} is gemaakt en geopend.`);
    } catch {
      setListDirectoryStatus('Lijst kon niet worden gemaakt. Kies een andere unieke naam en probeer opnieuw.');
    } finally {
      setIsCreatingNamedList(false);
    }
  }

  function handleArchivedList(summary: ShoppingListLifecycleSummary) {
    if (summary.listId === shoppingList.listId) {
      setShoppingList({ listId: null, name: 'Shopping', items: [] });
      setActivePanel('lists');
    } else {
      setOtherLists((current) => current.filter((list) => list.listId !== summary.listId));
    }
    setArchivedLists((current) => [...current.filter((list) => list.listId !== summary.listId), summary]);
    setSelectedOtherListId(null);
    setListDirectoryStatus(`${getDisplayListName(summary.name)} is gearchiveerd.`);
  }

  function handlePermanentlyDeletedList(listId: string) {
    if (listId === shoppingList.listId) {
      setShoppingList({ listId: null, name: 'Shopping', items: [] });
      setActivePanel('lists');
    }
    setOtherLists((current) => current.filter((list) => list.listId !== listId));
    setArchivedLists((current) => current.filter((list) => list.listId !== listId));
    setSelectedOtherListId(null);
    setListDirectoryStatus('De lijst en alle bijbehorende items zijn permanent verwijderd.');
  }

  async function handleRestoreList(summary: ShoppingListLifecycleSummary) {
    try {
      setListDirectoryStatus(null);
      const restored = await restoreShoppingList(apiClient, summary);
      setArchivedLists((current) => current.filter((list) => list.listId !== summary.listId));
      if (isDedicatedShoppingListName(restored.name) && !shoppingList.listId) {
        setShoppingList(restored);
      } else {
        setOtherLists((current) => [...current, restored].sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '')));
        setSelectedOtherListId(restored.listId);
      }
      setListDirectoryStatus(`${getDisplayListName(summary.name)} is hersteld en geopend.`);
    } catch {
      setListDirectoryStatus('Herstellen lukt niet. Controleer of er al een actieve lijst met deze naam bestaat.');
    }
  }

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
      setShoppingList((current) => ({ ...current, ...updated }));
      return;
    }

    setOtherLists((current) => current.map((list) => list.listId === updated.listId ? { ...list, ...updated } : list));
  }

  function updateListItems(listId: string | null, updater: (items: readonly ShoppingListItem[]) => readonly ShoppingListItem[]) {
    if (listId === shoppingList.listId) {
      setShoppingList((current) => updateListStateItems(current, updater));
      return;
    }

    setOtherLists((current) => current.map((list) => list.listId === listId ? updateListStateItems(list, updater) : list));
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
          onArchived={handleArchivedList}
          onPermanentlyDeleted={handlePermanentlyDeletedList}
          onError={setError}
          onReplaceList={replaceList}
          familyMembers={familyMembers}
          knownPeople={knownPeople}
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
            onArchived={handleArchivedList}
            onPermanentlyDeleted={handlePermanentlyDeletedList}
            onError={setError}
            onReplaceList={replaceList}
            familyMembers={familyMembers}
            knownPeople={knownPeople}
            onUpdateItems={updateListItems}
            primary
            primaryMode="active"
          />
        ) : (
          <div className="shopping-region-state shopping-region-state-empty">
            <strong>Begin met je eerste boodschap</strong>
            <p>Voeg iets toe om je lijst te starten.</p>
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

      <footer className="shopping-footer-strip" aria-label="Boodschappenacties">
        <button className="shopping-footer-action" onClick={() => setActivePanel('completed')} type="button">
          Afgevinkt <span>{shoppingCompletedItems.length}</span>
        </button>
        <button className="shopping-footer-action" onClick={() => setActivePanel('deleted')} type="button">
          Herstellen <span>{shoppingDeletedItems.length}</span>
        </button>
        <button className="shopping-footer-action" onClick={() => setActivePanel('lists')} type="button">
          Lijsten <span>{otherLists.length + archivedLists.length}</span>
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
              onArchived={handleArchivedList}
              onPermanentlyDeleted={handlePermanentlyDeletedList}
              onError={setError}
              onReplaceList={replaceList}
              familyMembers={familyMembers}
              knownPeople={knownPeople}
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
              onArchived={handleArchivedList}
              onPermanentlyDeleted={handlePermanentlyDeletedList}
              onError={setError}
              onReplaceList={replaceList}
              familyMembers={familyMembers}
              knownPeople={knownPeople}
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
              onArchived={handleArchivedList}
              onPermanentlyDeleted={handlePermanentlyDeletedList}
              onError={setError}
              onReplaceList={replaceList}
              familyMembers={familyMembers}
              knownPeople={knownPeople}
              onUpdateItems={updateListItems}
              primary
              primaryMode="manage"
            />
          ) : null}
          {activePanel === 'lists' ? (
            <div className="shopping-other-lists-panel">
              <form className="shopping-list-create-form" onSubmit={createAdditionalList}>
                <label>
                  <span>Nieuwe lijst</span>
                  <input maxLength={160} onChange={(event) => setNewListName(event.target.value)} placeholder="Bijvoorbeeld Weekend" value={newListName} />
                </label>
                <button disabled={isCreatingNamedList || !newListName.trim()} type="submit">{isCreatingNamedList ? 'Maken…' : 'Lijst maken'}</button>
              </form>
              {listDirectoryStatus ? <p className="shopping-directory-status" role="status">{listDirectoryStatus}</p> : null}
              <div className="shopping-list-directory-body">
                <section className="shopping-list-directory-section" aria-label="Actieve lijsten">
                  <h5>Actieve lijsten</h5>
                  {otherLists.length === 0 ? <p className="shopping-empty">Geen andere actieve lijsten.</p> : <>
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
                        onArchived={handleArchivedList}
                        onPermanentlyDeleted={handlePermanentlyDeletedList}
                        onError={setError}
                        onReplaceList={replaceList}
                        familyMembers={familyMembers}
                        knownPeople={knownPeople}
                        onUpdateItems={updateListItems}
                      />
                    </div>
                  ) : null}
                  </>}
                </section>
                <ArchivedShoppingLists lists={archivedLists} onDeleted={handlePermanentlyDeletedList} onRestore={handleRestoreList} apiClient={apiClient} onStatus={setListDirectoryStatus} />
              </div>
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
    case 'lists':
      return 'Lijsten';
    case 'manage':
      return 'Boodschappenlijst beheren';
  }
}

function getPanelDescription(panel: ShoppingPanelKind) {
  switch (panel) {
    case 'completed':
      return 'Bekijk wat al is afgehandeld.';
    case 'deleted':
      return 'Zet recent verwijderde boodschappen terug.';
    case 'lists':
      return 'Maak, open, archiveer of herstel een lijst.';
    case 'manage':
      return 'Hernoem, archiveer of verwijder deze lijst.';
  }
}

function updateListStateItems(list: ShoppingListState, updater: (items: readonly ShoppingListItem[]) => readonly ShoppingListItem[]): ShoppingListState {
  const nextItems = updater(list.items);
  const previousActiveCount = getActiveShoppingListItems(list.items).length;
  const previousCompletedCount = getCompletedShoppingListItems(list.items).length;
  const previousDeletedCount = getDeletedShoppingListItems(list.items).length;

  return {
    ...list,
    items: nextItems,
    activeItemCount: (list.activeItemCount ?? previousActiveCount) + getActiveShoppingListItems(nextItems).length - previousActiveCount,
    completedItemCount: (list.completedItemCount ?? previousCompletedCount) + getCompletedShoppingListItems(nextItems).length - previousCompletedCount,
    deletedItemCount: (list.deletedItemCount ?? previousDeletedCount) + getDeletedShoppingListItems(nextItems).length - previousDeletedCount,
    totalItemCount: (list.totalItemCount ?? list.items.length) + nextItems.length - list.items.length,
  };
}

interface ArchivedShoppingListsProps {
  apiClient: Parameters<typeof permanentlyDeleteShoppingList>[0];
  lists: readonly ShoppingListLifecycleSummary[];
  onDeleted(listId: string): void;
  onRestore(summary: ShoppingListLifecycleSummary): Promise<void>;
  onStatus(message: string): void;
}

function ArchivedShoppingLists({ apiClient, lists, onDeleted, onRestore, onStatus }: ArchivedShoppingListsProps) {
  const [deleteCandidate, setDeleteCandidate] = useState<ShoppingListLifecycleSummary | null>(null);
  const [pendingListId, setPendingListId] = useState<string | null>(null);

  async function restore(summary: ShoppingListLifecycleSummary) {
    setPendingListId(summary.listId);
    await onRestore(summary);
    setPendingListId(null);
  }

  async function permanentlyDelete(summary: ShoppingListLifecycleSummary) {
    try {
      setPendingListId(summary.listId);
      await permanentlyDeleteShoppingList(apiClient, summary.listId, summary.updatedUtc);
      onDeleted(summary.listId);
      setDeleteCandidate(null);
    } catch {
      onStatus('Permanent verwijderen lukt niet. Vernieuw de lijst en probeer opnieuw.');
    } finally {
      setPendingListId(null);
    }
  }

  return (
    <section className="shopping-list-directory-section" aria-label="Gearchiveerde lijsten">
      <h5>Gearchiveerd</h5>
      {deleteCandidate ? (
        <div className="shopping-lifecycle-confirmation" role="alertdialog" aria-label="Gearchiveerde lijst permanent verwijderen bevestigen">
          <div>
            <p className="eyebrow">Definitieve actie</p>
            <h5>{getDisplayListName(deleteCandidate.name)} permanent verwijderen?</h5>
            <p>Deze lijst bevat {deleteCandidate.totalItemCount} items. De lijst en items verdwijnen definitief; gedeelde suggestie- en aankoophistorie blijft bewaard.</p>
          </div>
          <div className="shopping-management-actions">
            <button disabled={pendingListId !== null} onClick={() => setDeleteCandidate(null)} type="button">Annuleren</button>
            <button className="danger-button" disabled={pendingListId !== null} onClick={() => void permanentlyDelete(deleteCandidate)} type="button">
              {pendingListId ? 'Verwijderen…' : 'Ja, permanent verwijderen'}
            </button>
          </div>
        </div>
      ) : lists.length === 0 ? (
        <p className="shopping-empty">Nog geen gearchiveerde lijsten.</p>
      ) : (
        <div className="shopping-archived-list-rows">
          {lists.map((summary) => (
            <article className="shopping-archived-list-row" key={summary.listId}>
              <div>
                <strong>{getDisplayListName(summary.name)}</strong>
                <small>{summary.activeItemCount} open · {summary.completedItemCount} afgevinkt · {summary.totalItemCount} totaal</small>
              </div>
              <div className="shopping-management-actions">
                <button disabled={pendingListId !== null} onClick={() => void restore(summary)} type="button">Herstellen</button>
                <button className="danger-button" disabled={pendingListId !== null} onClick={() => setDeleteCandidate(summary)} type="button">Permanent verwijderen</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
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
  onArchived(summary: ShoppingListLifecycleSummary): void;
  onError(message: string): void;
  onPermanentlyDeleted(listId: string): void;
  onReplaceList(list: ShoppingListState): void;
  familyMembers: readonly FamilyMember[];
  knownPeople: readonly KnownPerson[];
  onUpdateItems(listId: string | null, updater: (items: readonly ShoppingListItem[]) => readonly ShoppingListItem[]): void;
  primary?: boolean;
  primaryMode?: 'all' | 'quickAdd' | 'active' | 'completed' | 'deleted' | 'manage';
}

function ListSurface({ apiClient, familyMembers, knownPeople, list, listFallbackName, onArchived, onError, onPermanentlyDeleted, onReplaceList, onUpdateItems, primary = false, primaryMode = 'all' }: ListSurfaceProps) {
  const [newItemLabel, setNewItemLabel] = useState('');
  const [listName, setListName] = useState(list.name ?? listFallbackName);
  const [newItemAvatar, setNewItemAvatar] = useState<ShoppingDecorativeAvatarReference | null>(null);
  const [lifecycleAction, setLifecycleAction] = useState<'archive' | 'delete' | null>(null);
  const [isLifecyclePending, setIsLifecyclePending] = useState(false);

  useEffect(() => setListName(list.name ?? listFallbackName), [list.name, listFallbackName]);

  const activeItems = getActiveShoppingListItems(list.items);
  const completedItems = getCompletedShoppingListItems(list.items);
  const deletedItems = getDeletedShoppingListItems(list.items);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!list.listId) return;

    try {
      const createdItem = newItemAvatar
        ? await addShoppingListItem(apiClient, list.listId, newItemLabel, newItemAvatar)
        : await addShoppingListItem(apiClient, list.listId, newItemLabel);
      if (createdItem) {
        onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, createdItem));
      }
      setNewItemLabel('');
      setNewItemAvatar(null);
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

  async function updateItemAvatar(itemId: string, decorativeAvatar: ShoppingDecorativeAvatarReference | null) {
    if (!list.listId) return;
    try {
      const updatedItem = await updateShoppingListItemDecorativeAvatar(apiClient, list.listId, itemId, decorativeAvatar);
      onUpdateItems(list.listId, (current) => upsertShoppingListItem(current, updatedItem));
    } catch {
      onError('Avatar kon niet worden bijgewerkt.');
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

  async function confirmArchiveList() {
    if (!list.listId || !list.updatedUtc) return;
    try {
      setIsLifecyclePending(true);
      onArchived(await archiveShoppingList(apiClient, list.listId, list.updatedUtc));
      onError('');
    } catch {
      onError('Lijst kon niet worden gearchiveerd. Vernieuw de lijst en probeer opnieuw.');
    } finally {
      setIsLifecyclePending(false);
    }
  }

  async function confirmPermanentDeleteList() {
    if (!list.listId || !list.updatedUtc) return;
    try {
      setIsLifecyclePending(true);
      await permanentlyDeleteShoppingList(apiClient, list.listId, list.updatedUtc);
      onPermanentlyDeleted(list.listId);
      onError('');
    } catch {
      onError('Lijst kon niet permanent worden verwijderd. Vernieuw de lijst en probeer opnieuw.');
    } finally {
      setIsLifecyclePending(false);
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
      <DecorativeAvatarPicker familyMembers={familyMembers} knownPeople={knownPeople} suggestionText={newItemLabel} onChange={setNewItemAvatar} value={newItemAvatar} label="Decoratieve avatar voor nieuwe boodschap" />
      <button disabled={!list.listId} type="submit">Toevoegen</button>
    </form>
  );

  const activeItemCount = list.activeItemCount ?? activeItems.length;
  const completedItemCount = list.completedItemCount ?? completedItems.length;
  const deletedItemCount = list.deletedItemCount ?? deletedItems.length;
  const totalItemCount = list.totalItemCount ?? activeItemCount + completedItemCount + deletedItemCount;
  const managementContent = lifecycleAction ? (
    <div className="shopping-lifecycle-confirmation" role="alertdialog" aria-label={lifecycleAction === 'archive' ? 'Archiveren bevestigen' : 'Permanent verwijderen bevestigen'}>
      <div>
        <p className="eyebrow">{lifecycleAction === 'archive' ? 'Omkeerbare actie' : 'Definitieve actie'}</p>
        <h5>{lifecycleAction === 'archive' ? `${listLabel} archiveren?` : `${listLabel} permanent verwijderen?`}</h5>
        <p>
          Deze lijst bevat {activeItemCount} open, {completedItemCount} afgevinkte en {deletedItemCount} verwijderde items ({totalItemCount} totaal).
        </p>
        <p>
          {lifecycleAction === 'archive'
            ? 'De lijst verdwijnt uit de actieve lijsten, maar blijft met alle items beschikbaar om te herstellen.'
            : 'De lijst en alle items worden definitief verwijderd. Gedeelde suggestie- en aankoophistorie blijft als huishoudgeschiedenis bewaard.'}
        </p>
      </div>
      <div className="shopping-management-actions">
        <button disabled={isLifecyclePending} onClick={() => setLifecycleAction(null)} type="button">Annuleren</button>
        <button
          className={lifecycleAction === 'delete' ? 'danger-button' : undefined}
          disabled={isLifecyclePending}
          onClick={() => void (lifecycleAction === 'archive' ? confirmArchiveList() : confirmPermanentDeleteList())}
          type="button"
        >
          {isLifecyclePending ? 'Bezig…' : lifecycleAction === 'archive' ? 'Ja, archiveren' : 'Ja, permanent verwijderen'}
        </button>
      </div>
    </div>
  ) : (
    <form className="shopping-add-form shopping-list-name-form" onSubmit={renameList}>
      <label>
        <span>Lijstnaam</span>
        <input disabled={!list.listId} maxLength={160} onChange={(event) => setListName(event.target.value)} type="text" value={listName} />
      </label>
      <div className="shopping-management-actions">
        <button disabled={!list.listId} type="submit">Hernoemen</button>
        <button disabled={!list.listId || !list.updatedUtc} onClick={() => setLifecycleAction('archive')} type="button">Archiveren</button>
        <button className="danger-button" disabled={!list.listId || !list.updatedUtc} onClick={() => setLifecycleAction('delete')} type="button">Permanent verwijderen</button>
      </div>
    </form>
  );

  if (primary && primaryMode === 'quickAdd') {
    return <div className="shopping-quick-add-surface" aria-label={listLabel}>{quickAddForm}</div>;
  }

  if (primary && primaryMode === 'active') {
    return (
      <div className="shopping-primary-list shopping-active-store-workspace" aria-label={`${listLabel} per winkel`}>
        <ShoppingListSection className="shopping-section-primary" emptyLabel="Geen open boodschappen." items={activeItems} familyMembers={familyMembers} knownPeople={knownPeople} onAvatarChange={updateItemAvatar} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} title="Actieve lijst per winkel" />
      </div>
    );
  }

  if (primary && primaryMode === 'completed') {
    return (
      <div className="shopping-primary-list shopping-context-list" aria-label={`${listLabel} afgevinkt`}>
        <ShoppingListSection emptyLabel="Nog niets afgevinkt." items={completedItems} familyMembers={familyMembers} knownPeople={knownPeople} onAvatarChange={updateItemAvatar} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} onUndo={undoItem} title="Afgevinkt" />
      </div>
    );
  }

  if (primary && primaryMode === 'deleted') {
    return (
      <div className="shopping-primary-list shopping-context-list" aria-label={`${listLabel} herstel`}>
        <ShoppingListSection emptyLabel="Niets recent verwijderd." items={deletedItems} familyMembers={familyMembers} knownPeople={knownPeople} onAvatarChange={updateItemAvatar} onRemove={removeItem} onStoreChange={updateItemStore} onToggle={toggleItem} onUndo={undoItem} title="Recent verwijderd" />
      </div>
    );
  }

  if (primary && primaryMode === 'manage') {
    return (
      <div className="shopping-primary-list shopping-context-list shopping-management-panel" aria-label={`${listLabel} beheer`}>
        <section className="shopping-section shopping-management-section">
          <h4>Lijst beheren</h4>
          <div className="shopping-section-body">
            {managementContent}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={primary ? 'shopping-primary-list' : 'other-list-surface'} aria-label={listLabel}>
      {quickAddForm}
      <ShoppingListSection className={primary ? 'shopping-section-primary' : undefined} emptyLabel="Geen open boodschappen." items={activeItems} familyMembers={familyMembers} knownPeople={knownPeople} onAvatarChange={primary ? updateItemAvatar : undefined} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} title="Per winkel" />
      <ShoppingListSection emptyLabel="Nog niets afgevinkt." items={completedItems} familyMembers={familyMembers} knownPeople={knownPeople} onAvatarChange={primary ? updateItemAvatar : undefined} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} onUndo={undoItem} title="Afgevinkt" />
      <section className="shopping-section shopping-management-section">
        <h4>Lijst beheren</h4>
        <div className="shopping-section-body">
          {managementContent}
        </div>
      </section>
      <ShoppingListSection emptyLabel="Niets recent verwijderd." items={deletedItems} familyMembers={familyMembers} knownPeople={knownPeople} onAvatarChange={primary ? updateItemAvatar : undefined} onRemove={removeItem} onStoreChange={primary ? updateItemStore : undefined} onToggle={toggleItem} onUndo={undoItem} title="Recent verwijderd" />
    </div>
  );
}

interface ShoppingListSectionProps {
  className?: string;
  emptyLabel: string;
  items: readonly ShoppingListItem[];
  familyMembers: readonly FamilyMember[];
  knownPeople: readonly KnownPerson[];
  onAvatarChange?(itemId: string, decorativeAvatar: ShoppingDecorativeAvatarReference | null): void;
  onRemove(itemId: string): void;
  onStoreChange?(itemId: string, preferredStore: string | null): void;
  onToggle(itemId: string): void;
  onUndo?(itemId: string): void;
  title: string;
}

function ShoppingListSection({ className, emptyLabel, familyMembers, items, knownPeople, onAvatarChange, onRemove, onStoreChange, onToggle, onUndo, title }: ShoppingListSectionProps) {
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
                    <ShoppingListRow familyMembers={familyMembers} item={item} key={item.id} knownPeople={knownPeople} onAvatarChange={onAvatarChange} onRemove={onRemove} onStoreChange={onStoreChange} onToggle={onToggle} onUndo={onUndo} />
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
  familyMembers: readonly FamilyMember[];
  item: ShoppingListItem;
  knownPeople: readonly KnownPerson[];
  onAvatarChange?(itemId: string, decorativeAvatar: ShoppingDecorativeAvatarReference | null): void;
  onRemove(itemId: string): void;
  onStoreChange?(itemId: string, preferredStore: string | null): void;
  onToggle(itemId: string): void;
  onUndo?(itemId: string): void;
}

function ShoppingListRow({ familyMembers, item, knownPeople, onAvatarChange, onRemove, onStoreChange, onToggle, onUndo }: ShoppingListRowProps) {
  return (
    <li className={`shopping-item${item.deleted ? ' shopping-item-deleted' : ''}`}>
      <label>
        <input checked={item.completed} onChange={() => onToggle(item.id)} type="checkbox" />
        <DecorativeAvatarBadge identity={resolveDecorativeAvatar(item.decorativeAvatar, familyMembers, knownPeople)} label={`Decoratieve avatar voor ${item.label}`} />
        <span title={item.label}>{item.label}</span>
        {item.deleted ? <small>Verwijderd</small> : null}
      </label>
      <div className="shopping-item-actions">
        {onAvatarChange ? (
          <details className="shopping-item-options">
            <summary>Avatar</summary>
            <DecorativeAvatarPicker familyMembers={familyMembers} knownPeople={knownPeople} suggestionText={item.label} onChange={(value) => onAvatarChange(item.id, value)} value={item.decorativeAvatar ?? null} label={`Decoratieve avatar voor ${item.label}`} />
          </details>
        ) : null}
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
