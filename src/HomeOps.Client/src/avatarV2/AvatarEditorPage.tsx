import { useMemo, useState } from 'react';
import { AvatarCatalogControls } from '../avatarCatalog/AvatarCatalogControls';
import { avatarSelectionsEqual, getAvatarCatalogEditorPanels, getAvatarCatalogPanelSummary, localizeAvatarCatalogText } from '../avatarCatalog/avatarCatalog';
import { avatarSelectionToAvatarV2RenderConfig, defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import { renderAvatarV2Svg } from './avatarV2';

export function AvatarEditorPage() {
  const [savedSelection, setSavedSelection] = useState(defaultAvatarSelection);
  const [draftSelection, setDraftSelection] = useState(savedSelection);
  const hasUnsavedChanges = !avatarSelectionsEqual(savedSelection, draftSelection);
  const previewSvg = useMemo(() => renderAvatarV2Svg(avatarSelectionToAvatarV2RenderConfig(draftSelection)), [draftSelection]);
  const summaryEntries = useMemo(() => getAvatarCatalogEditorPanels().map((panel) => ({
    id: panel.id,
    label: localizeAvatarCatalogText(panel.labels, panel.id),
    value: getAvatarCatalogPanelSummary(panel, draftSelection),
  })), [draftSelection]);

  function save() {
    setSavedSelection(draftSelection);
  }

  return (
    <section className="avatar-v2-editor-page" aria-labelledby="avatar-v2-editor-title">
      <header className="avatar-v2-editor-hero">
        <div>
          <p className="eyebrow">Avatarbewerker</p>
          <h2 id="avatar-v2-editor-title">Gezinsavatar maken</h2>
          <p>Probeer stijlen direct. Sla echte avatars op via gezinslidbeheer.</p>
        </div>
      </header>

      <div className="avatar-v2-editor-layout">
        <aside className="avatar-v2-preview-card" aria-label="Live voorbeeld avatar">
          <div className="avatar-v2-preview-card-header">
            <div>
              <p className="eyebrow">Live voorbeeld</p>
              <h3>Zo ziet de avatar er nu uit</h3>
            </div>
            <p className={hasUnsavedChanges ? 'avatar-v2-status avatar-v2-status-unsaved' : 'avatar-v2-status'} aria-live="polite">
              {hasUnsavedChanges ? 'Niet-opgeslagen wijzigingen' : 'Opgeslagen'}
            </p>
          </div>
          <div className="avatar-v2-preview" data-testid="avatar-v2-live-preview" dangerouslySetInnerHTML={{ __html: previewSvg }} />
          <dl className="avatar-v2-summary-list" aria-label="Huidige avatarkeuzes">
            {summaryEntries.map((entry) => (
              <div key={entry.id}>
                <dt>{entry.label}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
          <div className="avatar-v2-actions">
            <button type="button" onClick={save} disabled={!hasUnsavedChanges}>Opslaan</button>
            <button type="button" onClick={() => setDraftSelection(savedSelection)} disabled={!hasUnsavedChanges}>Annuleren</button>
            <button type="button" onClick={() => setDraftSelection(defaultAvatarSelection)}>Resetten</button>
          </div>
        </aside>

        <AvatarCatalogControls
          controlsLabel="Avatarkeuzes"
          onSelectionChange={setDraftSelection}
          renderSelectionPreview={(selection) => renderAvatarV2Svg(avatarSelectionToAvatarV2RenderConfig(selection))}
          selection={draftSelection}
        />
      </div>
    </section>
  );
}
