import { useEffect, useMemo, useRef, useState } from 'react';
import { AvatarCatalogControls } from '../avatarCatalog/AvatarCatalogControls';
import { avatarSelectionsEqual, normalizeAvatarSelection } from '../avatarCatalog/avatarCatalog';
import { avatarSelectionToAvatarV2Configuration, avatarSelectionToAvatarV2RenderConfig, avatarV2ConfigurationToAvatarSelection, defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import { renderAvatarV2Svg } from '../avatarV2/avatarV2';
import { HomeOpsIcon } from '../icons/homeOpsIcons';
import type { FamilyMember } from './familyMembers';

interface FamilyAvatarEditorProps {
  member: FamilyMember;
  onChange: (member: FamilyMember) => void;
  onClose: () => void;
}

export function FamilyAvatarEditor({ member, onChange, onClose }: FamilyAvatarEditorProps) {
  const persistedSelection = normalizeAvatarSelection(member.avatarSelection ?? avatarV2ConfigurationToAvatarSelection(member.avatarV2Config));
  const [draftSelection, setDraftSelection] = useState(persistedSelection);
  const hasUnsavedChanges = !avatarSelectionsEqual(persistedSelection, draftSelection);
  const previewSvg = useMemo(() => renderAvatarV2Svg(avatarSelectionToAvatarV2RenderConfig(draftSelection)), [draftSelection]);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  function save() {
    onChange({
      ...member,
      avatarSelection: draftSelection,
      avatarV2Config: avatarSelectionToAvatarV2Configuration(draftSelection),
    });
    onClose();
  }

  return (
    <div className="avatar-editor-backdrop" role="presentation">
      <section className="avatar-editor avatar-v2-family-editor" role="dialog" aria-modal="true" aria-label={`Avatarbewerker voor ${member.name}`}>
        <header>
          <div>
            <h3>Avatar van {member.name} bewerken</h3>
          </div>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="Avatarbewerker sluiten"><HomeOpsIcon name="close" /></button>
        </header>
        <div className="avatar-v2-editor-layout">
          <aside className="avatar-v2-preview-card" aria-label={`Live avatarvoorbeeld voor ${member.name}`}>
            <div className="avatar-v2-preview-status-row">
              <p className={hasUnsavedChanges ? 'avatar-v2-status avatar-v2-status-unsaved' : 'avatar-v2-status'} aria-live="polite">{hasUnsavedChanges ? 'Niet-opgeslagen wijzigingen' : 'Opgeslagen'}</p>
            </div>
            <div className="avatar-v2-preview" data-testid="family-avatar-v2-live-preview" dangerouslySetInnerHTML={{ __html: previewSvg }} />
            <div className="avatar-v2-actions">
              <div className="avatar-v2-primary-actions">
                <button type="button" className="avatar-v2-action-primary" onClick={save} disabled={!hasUnsavedChanges}>Opslaan</button>
                <button type="button" className="avatar-v2-action-secondary" onClick={() => setDraftSelection(persistedSelection)} disabled={!hasUnsavedChanges}>Annuleren</button>
              </div>
              <button type="button" className="avatar-v2-action-reset" onClick={() => setDraftSelection(defaultAvatarSelection)}>Avatar resetten</button>
            </div>
          </aside>
          <AvatarCatalogControls
            controlsLabel={`Avatarkeuzes voor ${member.name}`}
            onSelectionChange={setDraftSelection}
            renderSelectionPreview={(selection) => renderAvatarV2Svg(avatarSelectionToAvatarV2RenderConfig(selection))}
            selection={draftSelection}
          />
        </div>
      </section>
    </div>
  );
}
