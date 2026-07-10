import { AvatarSelectionEditor } from '../avatarContacts/AvatarSelectionEditor';
import type { KnownPerson } from './knownPeople';

interface KnownPersonAvatarEditorProps {
  person: KnownPerson;
  onChange: (person: KnownPerson) => void;
  onClose: () => void;
}

export function KnownPersonAvatarEditor({ person, onChange, onClose }: KnownPersonAvatarEditorProps) {
  return (
    <AvatarSelectionEditor
      title={`Avatar van ${person.displayName} bewerken`}
      previewLabel={`Live avatarvoorbeeld voor ${person.displayName}`}
      controlsLabel={`Avatarkeuzes voor ${person.displayName}`}
      currentSelection={person.avatarSelection}
      onCancel={onClose}
      onSave={(selection) => {
        onChange({ ...person, avatarSelection: selection });
        onClose();
      }}
    />
  );
}
