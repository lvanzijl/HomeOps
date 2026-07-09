import { useMemo, useState } from 'react';
import { AvatarCatalogControls } from '../avatarCatalog/AvatarCatalogControls';
import { avatarSelectionsEqual } from '../avatarCatalog/avatarCatalog';
import { avatarSelectionToAvatarV2RenderConfig, defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import { renderAvatarV2Svg } from './avatarV2';

export function AvatarEditorPage() {
  const [savedSelection, setSavedSelection] = useState(defaultAvatarSelection);
  const [draftSelection, setDraftSelection] = useState(savedSelection);
  const hasUnsavedChanges = !avatarSelectionsEqual(savedSelection, draftSelection);
  const previewSvg = useMemo(() => renderAvatarV2Svg(avatarSelectionToAvatarV2RenderConfig(draftSelection)), [draftSelection]);

  function save() {
    setSavedSelection(draftSelection);
  }

  return (
    <section className="avatar-v2-editor-page" aria-labelledby="avatar-v2-editor-title">
      <header className="avatar-v2-editor-hero">
        <div>
          <h2 id="avatar-v2-editor-title">Gezinsavatar maken</h2>
        </div>
      </header>

      <div className="avatar-v2-editor-layout">
        <aside className="avatar-v2-preview-card" aria-label="Live voorbeeld avatar">
          <div className="avatar-v2-preview-status-row">
            <p className={hasUnsavedChanges ? 'avatar-v2-status avatar-v2-status-unsaved' : 'avatar-v2-status'} aria-live="polite">
              {hasUnsavedChanges ? 'Niet-opgeslagen wijzigingen' : 'Opgeslagen'}
            </p>
          </div>
          <div className="avatar-v2-preview" data-testid="avatar-v2-live-preview" dangerouslySetInnerHTML={{ __html: previewSvg }} />
          <div className="avatar-v2-actions">
            <div className="avatar-v2-primary-actions">
              <button type="button" className="avatar-v2-action-primary" onClick={save} disabled={!hasUnsavedChanges}>Opslaan</button>
              <button type="button" className="avatar-v2-action-secondary" onClick={() => setDraftSelection(savedSelection)} disabled={!hasUnsavedChanges}>Annuleren</button>
            </div>
            <button type="button" className="avatar-v2-action-reset" onClick={() => setDraftSelection(defaultAvatarSelection)}>Avatar resetten</button>
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
