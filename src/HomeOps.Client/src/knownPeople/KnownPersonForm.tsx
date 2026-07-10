import { useState, type FormEvent } from "react";
import { defaultAvatarSelection } from "../avatarCatalog/avatarCatalogAdapter";
import type { FamilyMember } from "../home/familyMembers";
import type {
  KnownPerson,
  KnownPersonInput,
  KnownPersonRelationshipType,
  KnownPersonScope,
} from "./knownPeople";
import { KnownPersonAvatar } from "./KnownPersonAvatar";
import { KnownPersonAvatarEditor } from "./KnownPersonAvatarEditor";
import { relationshipLabels, relationshipOptions } from "./peoplePresentation";

export type KnownPersonDraft = KnownPersonInput & { id?: string };
export type KnownPersonFormSaveState = "idle" | "saving" | "deleting";

type KnownPersonFormScopeMode =
  | { kind: "editable" }
  | { kind: "privateToMember"; familyMemberId: string };

interface KnownPersonFormProps {
  draft: KnownPersonDraft;
  members: readonly FamilyMember[];
  scopeMode: KnownPersonFormScopeMode;
  saveState: KnownPersonFormSaveState;
  error?: string | null;
  onChange: (draft: KnownPersonDraft) => void;
  onCancel: () => void;
  onSubmit: (person: KnownPersonInput, id?: string) => void;
  onDelete?: (id: string) => void;
}

export function KnownPersonForm({
  draft,
  members,
  scopeMode,
  saveState,
  error,
  onChange,
  onCancel,
  onSubmit,
  onDelete,
}: KnownPersonFormProps) {
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const normalizedDraft = normalizeDraftForScope(draft, scopeMode);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(normalizeKnownPersonDraft(normalizedDraft), draft.id);
  }

  function close() {
    setIsAvatarEditorOpen(false);
    onCancel();
  }

  return (
    <form
      data-testid="known-person-form"
      aria-label={draft.id ? "Edit person" : "Create person"}
      className="people-dialog"
      onSubmit={submit}
    >
      <header>
        <h3>{draft.id ? "Edit person" : "Create person"}</h3>
        <button onClick={close} type="button">
          Sluiten
        </button>
      </header>
      {error ? (
        <p className="people-error" role="alert">
          {error}
        </p>
      ) : null}
      <label>
        <span>DisplayName</span>
        <input
          required
          maxLength={160}
          value={draft.displayName}
          onChange={(event) =>
            onChange({
              ...draft,
              displayName: event.target.value,
              initials: initialsFor(event.target.value),
            })
          }
        />
      </label>
      <label>
        <span>Nickname</span>
        <input
          maxLength={80}
          value={draft.nickname ?? ""}
          onChange={(event) =>
            onChange({ ...draft, nickname: event.target.value })
          }
        />
      </label>
      <label>
        <span>RelationshipType</span>
        <select
          value={draft.relationshipType}
          onChange={(event) =>
            onChange({
              ...draft,
              relationshipType: event.target
                .value as KnownPersonRelationshipType,
            })
          }
        >
          {relationshipOptions.map((option) => (
            <option key={option} value={option}>
              {relationshipLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>CustomRelationshipLabel</span>
        <input
          maxLength={80}
          value={draft.customRelationshipLabel ?? ""}
          onChange={(event) =>
            onChange({ ...draft, customRelationshipLabel: event.target.value })
          }
        />
      </label>
      {scopeMode.kind === "editable" ? (
        <fieldset>
          <legend>Scope</legend>
          <label>
            <input
              checked={draft.scope === "shared"}
              name="known-person-scope"
              onChange={() =>
                onChange({ ...draft, scope: "shared", familyMemberId: null })
              }
              type="radio"
            />{" "}
            Shared
          </label>
          <label>
            <input
              checked={draft.scope === "privateToMember"}
              name="known-person-scope"
              onChange={() =>
                onChange({
                  ...draft,
                  scope: "privateToMember",
                  familyMemberId:
                    draft.familyMemberId ?? members[0]?.id ?? null,
                })
              }
              type="radio"
            />{" "}
            PrivateToMember
          </label>
        </fieldset>
      ) : null}
      {scopeMode.kind === "editable" && draft.scope === "privateToMember" ? (
        <label>
          <span>FamilyMember</span>
          <select
            required
            value={draft.familyMemberId ?? ""}
            onChange={(event) =>
              onChange({ ...draft, familyMemberId: event.target.value })
            }
          >
            <option value="" disabled>
              Kies gezinslid
            </option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <section className="people-avatar-field">
        <KnownPersonAvatar person={draftToPerson(normalizedDraft)} />
        <button onClick={() => setIsAvatarEditorOpen(true)} type="button">
          Avatar edit
        </button>
      </section>
      <div className="people-dialog-actions">
        {draft.id && onDelete ? (
          <button
            disabled={saveState !== "idle"}
            onClick={() => onDelete(draft.id!)}
            type="button"
          >
            Delete
          </button>
        ) : null}
        <button disabled={saveState !== "idle"} type="submit">
          {saveState === "saving" ? "Opslaan…" : "Save"}
        </button>
      </div>
      {isAvatarEditorOpen ? (
        <KnownPersonAvatarEditor
          person={draftToPerson(normalizedDraft)}
          onChange={(person) =>
            onChange({ ...draft, avatarSelection: person.avatarSelection })
          }
          onClose={() => setIsAvatarEditorOpen(false)}
        />
      ) : null}
    </form>
  );
}

export function createEmptyKnownPersonDraft(
  scope: KnownPersonScope,
  familyMemberId: string | null = null,
): KnownPersonDraft {
  return {
    displayName: "",
    nickname: "",
    relationshipType: "friend",
    customRelationshipLabel: "",
    scope,
    familyMemberId,
    initials: "",
    avatarSelection: defaultAvatarSelection,
  };
}

function normalizeDraftForScope(
  draft: KnownPersonDraft,
  scopeMode: KnownPersonFormScopeMode,
): KnownPersonDraft {
  return scopeMode.kind === "privateToMember"
    ? {
        ...draft,
        scope: "privateToMember",
        familyMemberId: scopeMode.familyMemberId,
      }
    : draft;
}

function normalizeKnownPersonDraft(draft: KnownPersonDraft): KnownPersonInput {
  const displayName = draft.displayName.trim();
  return {
    ...draft,
    displayName,
    nickname: draft.nickname?.trim() || null,
    customRelationshipLabel: draft.customRelationshipLabel?.trim() || null,
    familyMemberId: draft.scope === "shared" ? null : draft.familyMemberId,
    initials: draft.initials || initialsFor(displayName),
  };
}

function draftToPerson(draft: KnownPersonDraft): KnownPerson {
  const normalized = normalizeKnownPersonDraft(draft);
  return {
    ...normalized,
    id: draft.id ?? "draft",
    createdUtc: undefined,
    updatedUtc: undefined,
  };
}

function initialsFor(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}
