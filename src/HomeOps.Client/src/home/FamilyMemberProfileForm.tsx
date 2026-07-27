import { useState, type FormEvent } from "react";
import type { FamilyMember } from "./familyMembers";

interface FamilyMemberProfileFormProps {
  errorMessage?: string;
  initialMember: FamilyMember;
  isNew: boolean;
  onBusyChange?(isBusy: boolean): void;
  onCancel(): void;
  onSave(member: FamilyMember): Promise<void>;
}

export function FamilyMemberProfileForm({
  errorMessage = "Gezinslid kon niet worden opgeslagen. Controleer de gegevens en probeer opnieuw.",
  initialMember,
  isNew,
  onBusyChange,
  onCancel,
  onSave,
}: FamilyMemberProfileFormProps) {
  const [draft, setDraft] = useState(initialMember);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");

  function change(next: FamilyMember) {
    setDraft(next);
    if (saveState === "error") setSaveState("idle");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saveState === "saving" || !draft.name.trim() || (draft.memberKind === "child" && !draft.dateOfBirth)) return;

    setSaveState("saving");
    onBusyChange?.(true);
    try {
      await onSave({
        ...draft,
        name: draft.name.trim(),
        initials: buildInitials(draft.name),
        dateOfBirth: draft.memberKind === "adult" ? draft.dateOfBirth || null : draft.dateOfBirth,
      });
    } catch {
      setSaveState("error");
    } finally {
      onBusyChange?.(false);
    }
  }

  return (
    <form className="family-administration-form" onSubmit={(event) => void submit(event)}>
      <label>
        Naam
        <input
          disabled={saveState === "saving"}
          onChange={(event) => change({ ...draft, name: event.target.value })}
          required
          value={draft.name}
        />
      </label>
      <label>
        Gezinslidtype
        <select
          disabled={saveState === "saving"}
          onChange={(event) => change({
            ...draft,
            memberKind: event.target.value as FamilyMember["memberKind"],
            dateOfBirth: event.target.value === "adult" ? draft.dateOfBirth || null : draft.dateOfBirth,
          })}
          value={draft.memberKind}
        >
          <option value="adult">Volwassene</option>
          <option value="child">Kind</option>
        </select>
      </label>
      <label>
        Geboortedatum
        <input
          aria-required={draft.memberKind === "child"}
          disabled={saveState === "saving"}
          onChange={(event) => change({ ...draft, dateOfBirth: event.target.value || null })}
          required={draft.memberKind === "child"}
          type="date"
          value={draft.dateOfBirth ?? ""}
        />
      </label>
      <label>
        Weergavekleur
        <input
          disabled={saveState === "saving"}
          onChange={(event) => change({ ...draft, displayColor: event.target.value })}
          type="color"
          value={draft.displayColor}
        />
      </label>
      {saveState === "error" ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="family-member-actions">
        <button disabled={saveState === "saving"} type="submit">
          {saveState === "saving" ? "Opslaan…" : isNew ? "Gezinslid toevoegen" : "Gegevens opslaan"}
        </button>
        <button disabled={saveState === "saving"} onClick={onCancel} type="button">
          Annuleren
        </button>
      </div>
    </form>
  );
}

function buildInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "M";
}
