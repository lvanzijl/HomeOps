import { buildAvatarTilePreviewSelection, getAvatarCatalogCategories, getAvatarCatalogEditorItems, localizeAvatarCatalogText, updateAvatarSelection, type AvatarCatalogCategory, type AvatarCatalogItem, type AvatarCatalogSelection } from './avatarCatalog';

interface AvatarCatalogControlsProps {
  selection: AvatarCatalogSelection;
  controlsLabel: string;
  onSelectionChange: (selection: AvatarCatalogSelection) => void;
  renderSelectionPreview: (selection: AvatarCatalogSelection) => string;
}

export function AvatarCatalogControls({ selection, controlsLabel, onSelectionChange, renderSelectionPreview }: AvatarCatalogControlsProps) {
  const categories = getAvatarCatalogCategories();

  return (
    <div className="avatar-v2-controls" aria-label={controlsLabel}>
      {categories.map((category) => {
        const items = getAvatarCatalogEditorItems(category.id, selection.selections[category.slot]);
        if (category.presentation.control === 'swatch') {
          return (
            <SwatchSection
              category={category}
              items={items}
              key={category.id}
              onSelect={(itemId) => onSelectionChange(updateAvatarSelection(selection, category.slot, itemId))}
              selectedItemId={selection.selections[category.slot]}
            />
          );
        }

        return (
          <TileSection
            category={category}
            items={items}
            key={category.id}
            onSelect={(itemId) => onSelectionChange(updateAvatarSelection(selection, category.slot, itemId))}
            renderSelectionPreview={renderSelectionPreview}
            selectedItemId={selection.selections[category.slot]}
            selection={selection}
          />
        );
      })}
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
  return (
    <section className="avatar-v2-choice-section" aria-labelledby={`${category.id}-title`}>
      <div>
        <h3 id={`${category.id}-title`}>{localizeAvatarCatalogText(category.labels, category.id)}</h3>
        <p>{localizeAvatarCatalogText(category.descriptions, '')}</p>
      </div>
      <div className="avatar-v2-asset-grid">
        {items.map((item) => (
          <button
            aria-label={localizeAvatarCatalogText(item.accessibilityLabels, localizeAvatarCatalogText(item.labels, item.id))}
            aria-pressed={item.id === selectedItemId}
            className="avatar-v2-asset-tile"
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <span
              dangerouslySetInnerHTML={{
                __html: renderSelectionPreview(buildAvatarTilePreviewSelection(selection, category, item.id)),
              }}
            />
            <strong>{localizeAvatarCatalogText(item.labels, item.id)}</strong>
          </button>
        ))}
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
  return (
    <section className="avatar-v2-swatch-section" aria-labelledby={`${category.id}-title`}>
      <h3 id={`${category.id}-title`}>{localizeAvatarCatalogText(category.labels, category.id)}</h3>
      <div className="avatar-v2-swatch-row">
        {items.map((item) => (
          <button
            aria-label={localizeAvatarCatalogText(item.accessibilityLabels, localizeAvatarCatalogText(item.labels, item.id))}
            aria-pressed={item.id === selectedItemId}
            className="avatar-v2-swatch"
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{ background: item.color?.base }}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
