import { useEffect, useMemo, useRef, useState } from 'react';
import { AvatarCatalogControls } from '../avatarCatalog/AvatarCatalogControls';
import { avatarSelectionsEqual, normalizeAvatarSelection, type AvatarCatalogSelection } from '../avatarCatalog/avatarCatalog';
import { avatarSelectionToAvatarV2RenderConfig, defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import { renderAvatarV2Svg } from '../avatarV2/avatarV2';
import { HomeOpsIcon } from '../icons/homeOpsIcons';

interface AvatarSelectionEditorProps {
  title: string;
  dialogLabel?: string;
  previewLabel: string;
  controlsLabel: string;
  currentSelection: AvatarCatalogSelection;
  onSave: (selection: AvatarCatalogSelection) => void | Promise<void>;
  onCancel: () => void;
  saveErrorMessage?: string;
}

export function AvatarSelectionEditor({ title, dialogLabel, previewLabel, controlsLabel, currentSelection, onSave, onCancel, saveErrorMessage = 'Avatar kon niet worden opgeslagen. Probeer opnieuw.' }: AvatarSelectionEditorProps) {
  const persistedSelection = useMemo(() => normalizeAvatarSelection(currentSelection), [currentSelection]);
  const [draftSelection, setDraftSelection] = useState(persistedSelection);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const hasUnsavedChanges = !avatarSelectionsEqual(persistedSelection, draftSelection);
  const previewSvg = useMemo(() => renderAvatarV2Svg(avatarSelectionToAvatarV2RenderConfig(draftSelection)), [draftSelection]);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setDraftSelection(persistedSelection);
    setSaveState('idle');
  }, [persistedSelection]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (saveState !== 'saving') onCancel();
      }
    };

    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onCancel, saveState]);

  async function save() {
    if (saveState === 'saving' || !hasUnsavedChanges) return;
    setSaveState('saving');
    try {
      await onSave(draftSelection);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  function changeSelection(selection: AvatarCatalogSelection) {
    setDraftSelection(selection);
    setSaveState('idle');
  }

  return (
    <div className="avatar-editor-backdrop" role="presentation">
      <section className="avatar-editor avatar-v2-family-editor" role="dialog" aria-modal="true" aria-label={dialogLabel ?? title}>
        <header>
          <div>
            <h3>{title}</h3>
          </div>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={onCancel} disabled={saveState === 'saving'} aria-label="Avatarbewerker sluiten"><HomeOpsIcon name="close" /></button>
        </header>
        <div className="avatar-v2-editor-layout">
          <aside className="avatar-v2-preview-card" aria-label={previewLabel}>
            <div className="avatar-v2-preview-status-row">
              {saveState === 'error' ? (
                <p className="avatar-v2-status avatar-v2-status-unsaved" role="alert">{saveErrorMessage}</p>
              ) : (
                <p className={hasUnsavedChanges ? 'avatar-v2-status avatar-v2-status-unsaved' : 'avatar-v2-status'} aria-live="polite">{saveState === 'saving' ? 'Wijzigingen opslaan…' : hasUnsavedChanges ? 'Niet-opgeslagen wijzigingen' : 'Opgeslagen'}</p>
              )}
            </div>
            <div className="avatar-v2-preview" data-testid="avatar-selection-live-preview" dangerouslySetInnerHTML={{ __html: previewSvg }} />
            <div className="avatar-v2-actions">
              <div className="avatar-v2-primary-actions">
                <button type="button" className="avatar-v2-action-primary" onClick={() => void save()} disabled={!hasUnsavedChanges || saveState === 'saving'}>{saveState === 'saving' ? 'Opslaan…' : saveState === 'error' ? 'Opnieuw opslaan' : 'Opslaan'}</button>
                <button type="button" className="avatar-v2-action-secondary" onClick={() => changeSelection(persistedSelection)} disabled={!hasUnsavedChanges || saveState === 'saving'}>Annuleren</button>
              </div>
              <button type="button" className="avatar-v2-action-reset" onClick={() => changeSelection(defaultAvatarSelection)} disabled={saveState === 'saving'}>Avatar resetten</button>
            </div>
          </aside>
          <AvatarCatalogControls
            controlsLabel={controlsLabel}
            onSelectionChange={changeSelection}
            renderSelectionPreview={(selection) => renderAvatarV2Svg(avatarSelectionToAvatarV2RenderConfig(selection))}
            selection={draftSelection}
          />
        </div>
      </section>
    </div>
  );
}
