import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { HomeOpsIcon } from '../icons/homeOpsIcons';
import { AvatarCategoryGlyph } from './avatarCategoryGlyphs';
import {
  buildAvatarTilePreviewSelection,
  getAvatarCatalogCategory,
  getAvatarCatalogCategoryTabLabel,
  getAvatarCatalogEditorItems,
  getAvatarCatalogEditorPanels,
  getAvatarCatalogOptionGroup,
  getAvatarCatalogPanelSummary,
  localizeAvatarCatalogText,
  updateAvatarSelection,
  type AvatarCatalogCategory,
  type AvatarCatalogItem,
  type AvatarCatalogSelection,
} from './avatarCatalog';

interface AvatarCatalogControlsProps {
  selection: AvatarCatalogSelection;
  controlsLabel: string;
  onSelectionChange: (selection: AvatarCatalogSelection) => void;
  renderSelectionPreview: (selection: AvatarCatalogSelection) => string;
}

interface GroupedItems {
  id: string;
  label: string;
  items: readonly AvatarCatalogItem[];
}

export function AvatarCatalogControls({ selection, controlsLabel, onSelectionChange, renderSelectionPreview }: AvatarCatalogControlsProps) {
  const panels = useMemo(() => getAvatarCatalogEditorPanels(), []);
  const [activePanelId, setActivePanelId] = useState(panels[0]?.id ?? '');

  useEffect(() => {
    if (!panels.some((panel) => panel.id === activePanelId)) {
      setActivePanelId(panels[0]?.id ?? '');
    }
  }, [activePanelId, panels]);

  const activePanel = panels.find((panel) => panel.id === activePanelId) ?? panels[0];
  const activeCategories = useMemo(
    () =>
      activePanel?.categoryIds
        .map((categoryId) => getAvatarCatalogCategory(categoryId))
        .filter((category): category is AvatarCatalogCategory => Boolean(category)) ?? [],
    [activePanel],
  );

  const [activeCategoryId, setActiveCategoryId] = useState(activeCategories[0]?.id ?? '');

  useEffect(() => {
    if (!activeCategories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(activeCategories[0]?.id ?? '');
    }
  }, [activeCategories, activeCategoryId]);

  const activeCategory = activeCategories.find((category) => category.id === activeCategoryId) ?? activeCategories[0];
  const activePanelLabel = activePanel ? localizeAvatarCatalogText(activePanel.labels, activePanel.id) : controlsLabel;

  return (
    <div className="avatar-v2-controls-shell" aria-label={controlsLabel}>
      <nav className="avatar-v2-category-rail" aria-label={`${controlsLabel} navigatie`} data-option-group>
        {panels.map((panel) => {
          const isActive = panel.id === activePanel?.id;
          const summary = getAvatarCatalogPanelSummary(panel, selection);
          return (
            <button
              aria-pressed={isActive}
              className="avatar-v2-category-chip"
              key={panel.id}
              onClick={() => setActivePanelId(panel.id)}
              onKeyDown={handleOptionGroupKeyDown}
              type="button"
            >
              <span className="avatar-v2-category-chip-icon" aria-hidden="true">
                <AvatarCategoryGlyph icon={panel.icon} />
              </span>
              <span className="avatar-v2-category-chip-text">
                <span className="avatar-v2-category-chip-label">{localizeAvatarCatalogText(panel.labels, panel.id)}</span>
                {summary ? <small className="avatar-v2-category-chip-summary">{summary}</small> : null}
              </span>
            </button>
          );
        })}
      </nav>

      {activePanel && activeCategory ? (
        <section className="avatar-v2-category-body" aria-label={activePanelLabel}>
          {activeCategories.length > 1 ? (
            <div className="avatar-v2-attribute-tabs" role="group" aria-label={`${activePanelLabel} onderdelen`} data-option-group>
              {activeCategories.map((category) => (
                <button
                  aria-pressed={category.id === activeCategory.id}
                  className="avatar-v2-attribute-tab"
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                  onKeyDown={handleOptionGroupKeyDown}
                  type="button"
                >
                  {getAvatarCatalogCategoryTabLabel(category)}
                </button>
              ))}
            </div>
          ) : null}

          <div className="avatar-v2-attribute-scroll">
            {activeCategory.presentation.control === 'swatch' ? (
              <SwatchSection
                category={activeCategory}
                items={getAvatarCatalogEditorItems(activeCategory.id, selection.selections[activeCategory.slot])}
                onSelect={(itemId) => onSelectionChange(updateAvatarSelection(selection, activeCategory.slot, itemId))}
                selectedItemId={selection.selections[activeCategory.slot]}
              />
            ) : (
              <TileSection
                category={activeCategory}
                items={getAvatarCatalogEditorItems(activeCategory.id, selection.selections[activeCategory.slot])}
                onSelect={(itemId) => onSelectionChange(updateAvatarSelection(selection, activeCategory.slot, itemId))}
                renderSelectionPreview={renderSelectionPreview}
                selectedItemId={selection.selections[activeCategory.slot]}
                selection={selection}
              />
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TileSection({
  category,
  items,
  onSelect,
  renderSelectionPreview,
  selectedItemId,
  selection,
}: {
  category: AvatarCatalogCategory;
  items: readonly AvatarCatalogItem[];
  onSelect: (itemId: string) => void;
  renderSelectionPreview: (selection: AvatarCatalogSelection) => string;
  selectedItemId: string;
  selection: AvatarCatalogSelection;
}) {
  const showItemLabel = category.presentation.itemLabelVisibility === 'visible';

  return (
    <section className="avatar-v2-choice-section avatar-v2-choice-section-tile" aria-labelledby={`${category.id}-title`}>
      <h4 className="visually-hidden" id={`${category.id}-title`}>{localizeAvatarCatalogText(category.labels, category.id)}</h4>
      <div
        className="avatar-v2-asset-grid"
        data-option-group
        style={{ ['--avatar-option-min-width' as string]: `${getOptionMinWidthRem(category)}rem` }}
      >
        {items.map((item) => {
          const selected = item.id === selectedItemId;
          return (
            <button
              aria-label={localizeAvatarCatalogText(item.accessibilityLabels, localizeAvatarCatalogText(item.labels, item.id))}
              aria-pressed={selected}
              className={`avatar-v2-asset-tile ${showItemLabel ? 'avatar-v2-asset-tile-labelled' : 'avatar-v2-asset-tile-visual'}`}
              key={item.id}
              onClick={() => onSelect(item.id)}
              onKeyDown={handleOptionGroupKeyDown}
              type="button"
            >
              <span
                aria-hidden="true"
                className="avatar-v2-option-preview"
                dangerouslySetInnerHTML={{
                  __html: renderSelectionPreview(buildAvatarTilePreviewSelection(selection, category, item.id)),
                }}
              />
              {showItemLabel ? <strong>{localizeAvatarCatalogText(item.labels, item.id)}</strong> : null}
              {selected ? <SelectionIndicator /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SwatchSection({
  category,
  items,
  onSelect,
  selectedItemId,
}: {
  category: AvatarCatalogCategory;
  items: readonly AvatarCatalogItem[];
  onSelect: (itemId: string) => void;
  selectedItemId: string;
}) {
  const groupedItems = groupItems(category, items);

  return (
    <section className="avatar-v2-choice-section avatar-v2-choice-section-swatch" aria-labelledby={`${category.id}-title`}>
      <h4 className="visually-hidden" id={`${category.id}-title`}>{localizeAvatarCatalogText(category.labels, category.id)}</h4>

      <div className="avatar-v2-swatch-groups">
        {groupedItems.map((group) => (
          <section className="avatar-v2-swatch-group" key={group.id} aria-label={group.label}>
            {groupedItems.length > 1 ? <h5>{group.label}</h5> : null}
            <div
              className="avatar-v2-swatch-grid"
              data-option-group
              style={{ ['--avatar-option-min-width' as string]: `${getOptionMinWidthRem(category)}rem` }}
            >
              {group.items.map((item) => {
                const selected = item.id === selectedItemId;
                const visibleLabel = category.presentation.itemLabelVisibility === 'visible';
                return (
                  <button
                    aria-label={localizeAvatarCatalogText(item.accessibilityLabels, localizeAvatarCatalogText(item.labels, item.id))}
                    aria-pressed={selected}
                    className={`avatar-v2-swatch-option ${visibleLabel ? 'avatar-v2-swatch-option-labelled' : 'avatar-v2-swatch-option-visual'}`}
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    onKeyDown={handleOptionGroupKeyDown}
                    type="button"
                  >
                    <span aria-hidden="true" className="avatar-v2-swatch" style={{ background: item.color?.base }} />
                    {visibleLabel ? (
                      <span className="avatar-v2-swatch-label">{localizeAvatarCatalogText(item.labels, item.id)}</span>
                    ) : null}
                    {selected ? <SelectionIndicator /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function SelectionIndicator() {
  return (
    <span className="avatar-v2-selection-indicator" aria-hidden="true">
      <HomeOpsIcon name="checkmark" />
    </span>
  );
}

function groupItems(category: AvatarCatalogCategory, items: readonly AvatarCatalogItem[]): readonly GroupedItems[] {
  if (category.presentation.groupStrategy !== 'tag') {
    return [{ id: `${category.id}-all`, label: localizeAvatarCatalogText(category.labels, category.id), items }];
  }

  const groups = new Map<string, GroupedItems>();

  for (const item of items) {
    const group = getAvatarCatalogOptionGroup(item);
    const key = group?.id ?? `${category.id}-ungrouped`;
    const existing = groups.get(key);
    if (existing) {
      groups.set(key, { ...existing, items: [...existing.items, item] });
      continue;
    }

    groups.set(key, {
      id: key,
      label: group ? localizeAvatarCatalogText(group.labels, key) : localizeAvatarCatalogText(category.labels, category.id),
      items: [item],
    });
  }

  return [...groups.values()].sort((left, right) => {
    const leftOrder = getAvatarCatalogOptionGroup(left.items[0])?.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = getAvatarCatalogOptionGroup(right.items[0])?.order ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

function getOptionMinWidthRem(category: AvatarCatalogCategory) {
  const configuredWidth = category.presentation.optionMinWidthRem ?? 8.5;

  if (category.presentation.control === 'swatch') {
    return category.presentation.itemLabelVisibility === 'hidden'
      ? configuredWidth
      : Math.min(configuredWidth, 6.75);
  }

  return category.presentation.itemLabelVisibility === 'hidden'
    ? configuredWidth
    : Math.min(configuredWidth, 7.5);
}

function handleOptionGroupKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  const group = event.currentTarget.closest('[data-option-group]');
  if (!group) {
    return;
  }

  const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const currentIndex = buttons.indexOf(event.currentTarget);

  if (currentIndex === -1) {
    return;
  }

  const moveFocus = (nextIndex: number) => {
    event.preventDefault();
    buttons[nextIndex]?.focus();
  };

  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      moveFocus((currentIndex - 1 + buttons.length) % buttons.length);
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      moveFocus((currentIndex + 1) % buttons.length);
      break;
    case 'Home':
      moveFocus(0);
      break;
    case 'End':
      moveFocus(buttons.length - 1);
      break;
    default:
      break;
  }
}
