import { normalizeAvatarSelection } from '../avatarCatalog/avatarCatalog';
import { avatarSelectionToAvatarV2Configuration, avatarV2ConfigurationToAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import { AvatarSelectionEditor } from '../avatarContacts/AvatarSelectionEditor';
import type { FamilyMember } from './familyMembers';

interface FamilyAvatarEditorProps {
  member: FamilyMember;
  onChange: (member: FamilyMember) => Promise<FamilyMember>;
  onClose: () => void;
}

export function FamilyAvatarEditor({ member, onChange, onClose }: FamilyAvatarEditorProps) {
  const persistedSelection = normalizeAvatarSelection(member.avatarSelection ?? avatarV2ConfigurationToAvatarSelection(member.avatarV2Config));

  return (
    <AvatarSelectionEditor
      title={`Avatar van ${member.name} bewerken`}
      dialogLabel={`Avatarbewerker voor ${member.name}`}
      previewLabel={`Live avatarvoorbeeld voor ${member.name}`}
      controlsLabel={`Avatarkeuzes voor ${member.name}`}
      currentSelection={persistedSelection}
      onCancel={onClose}
      saveErrorMessage="Avatar kon niet worden opgeslagen. Probeer opnieuw."
      onSave={async (selection) => {
        await onChange({
          ...member,
          avatarSelection: selection,
          avatarV2Config: avatarSelectionToAvatarV2Configuration(selection),
        });
        onClose();
      }}
    />
  );
}
