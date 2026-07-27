import { useEffect, useState } from "react";
import { defaultAvatarSelection } from "../avatarCatalog/avatarCatalogAdapter";
import type { FamilyMember } from "../home/familyMembers";
import { FamilyMemberProfileForm } from "../home/FamilyMemberProfileForm";
import {
  familyAdministrationApi,
  type FamilyDependencies,
  type RemovedFamilyMember,
} from "./familyAdministrationApi";

interface FamilyAdministrationProps {
  members: readonly FamilyMember[];
  onChanged(): Promise<void>;
}

type Feedback = { kind: "error" | "success"; text: string };

export function FamilyAdministration({ members, onChanged }: FamilyAdministrationProps) {
  const [removed, setRemoved] = useState<readonly RemovedFamilyMember[]>([]);
  const [removedState, setRemovedState] = useState<"loading" | "ready" | "error">("loading");
  const [draft, setDraft] = useState<FamilyMember | null>(null);
  const [removing, setRemoving] = useState<{ member: FamilyMember; dependencies: FamilyDependencies } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function loadRemoved() {
    setRemovedState("loading");
    try {
      setRemoved(await familyAdministrationApi.removed());
      setRemovedState("ready");
    } catch {
      setRemovedState("error");
    }
  }

  useEffect(() => {
    void loadRemoved();
  }, []);

  async function requestRemove(member: FamilyMember) {
    const action = `dependencies:${member.id}`;
    setBusyAction(action);
    setFeedback(null);
    try {
      const dependencies = await familyAdministrationApi.dependencies(member.id);
      setRemoving({ member, dependencies });
    } catch {
      setFeedback({ kind: "error", text: "Afhankelijkheden konden niet worden geladen. Probeer het opnieuw." });
    } finally {
      setBusyAction(null);
    }
  }

  async function confirmRemove() {
    if (!removing || busyAction) return;
    const action = `remove:${removing.member.id}`;
    setBusyAction(action);
    setFeedback(null);
    try {
      await familyAdministrationApi.remove(removing.member.id);
      await onChanged();
      await loadRemoved();
      setRemoving(null);
      setFeedback({ kind: "success", text: `${removing.member.name} is verwijderd. Verwijzingen zijn behouden.` });
    } catch {
      setFeedback({ kind: "error", text: "Gezinslid kon niet worden verwijderd. Probeer het opnieuw." });
    } finally {
      setBusyAction(null);
    }
  }

  async function restore(entry: RemovedFamilyMember) {
    if (busyAction) return;
    const action = `restore:${entry.member.id}`;
    setBusyAction(action);
    setFeedback(null);
    try {
      await familyAdministrationApi.restore(entry.member.id);
      await onChanged();
      await loadRemoved();
      setFeedback({ kind: "success", text: `${entry.member.name} is hersteld.` });
    } catch (error) {
      setFeedback({
        kind: "error",
        text: error instanceof Error ? error.message : "Gezinslid kon niet worden hersteld.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function save(member: FamilyMember, isNew: boolean) {
    setFeedback(null);
    try {
      if (isNew) {
        const { id: _id, ...newMember } = member;
        await familyAdministrationApi.create(newMember);
      } else {
        await familyAdministrationApi.update(member);
      }
      await onChanged();
      setDraft(null);
      setFeedback({ kind: "success", text: `${member.name} is opgeslagen.` });
    } catch (error) {
      throw error;
    }
  }

  return (
    <section className="family-administration" aria-label="Gezinsledenbeheer">
      <div className="family-administration-toolbar">
        <div>
          <p className="widget-type">Gezin</p>
          <h3>Gezinsleden</h3>
          <p>Beheer wie op het gezinsbord verschijnt.</p>
        </div>
        <button disabled={Boolean(busyAction)} onClick={() => setDraft(newFamilyMemberDraft())} type="button">
          Gezinslid toevoegen
        </button>
      </div>

      {feedback ? <p role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p> : null}

      <div className="family-administration-list" role="list" aria-label="Actieve gezinsleden">
        {members.length === 0 ? (
          <p>Er zijn nog geen actieve gezinsleden. Voeg iemand toe om te beginnen.</p>
        ) : members.map((member) => (
          <article key={member.id} role="listitem">
            <strong>{member.name}</strong>
            <span>{member.memberKind === "adult" ? "Volwassene" : "Kind"}</span>
            <div>
              <button disabled={Boolean(busyAction)} onClick={() => setDraft(member)} type="button">Bewerken</button>
              <button disabled={Boolean(busyAction)} onClick={() => void requestRemove(member)} type="button">
                {busyAction === `dependencies:${member.id}` ? "Controleren…" : "Verwijderen"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <h4>Verwijderde gezinsleden</h4>
      {removedState === "loading" ? <p role="status">Verwijderde gezinsleden laden…</p> : null}
      {removedState === "error" ? (
        <div>
          <p role="alert">Verwijderde gezinsleden konden niet worden geladen.</p>
          <button onClick={() => void loadRemoved()} type="button">Opnieuw proberen</button>
        </div>
      ) : null}
      {removedState === "ready" ? (
        <div className="family-administration-list" role="list" aria-label="Verwijderde gezinsleden">
          {removed.length === 0 ? <p>Geen verwijderde gezinsleden.</p> : removed.map((entry) => (
            <article key={entry.member.id} role="listitem">
              <strong>{entry.member.name}</strong>
              <span>{dependencyText(entry.dependencies)}</span>
              <button disabled={Boolean(busyAction)} onClick={() => void restore(entry)} type="button">
                {busyAction === `restore:${entry.member.id}` ? "Herstellen…" : "Herstellen"}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {draft ? (
        <section className="family-administration-confirm" aria-label={draft.id === "new" ? "Gezinslid toevoegen" : "Gezinslid bewerken"}>
          <h3>{draft.id === "new" ? "Gezinslid toevoegen" : `${draft.name} bewerken`}</h3>
          <FamilyMemberProfileForm
            initialMember={draft}
            isNew={draft.id === "new"}
            key={draft.id}
            onCancel={() => setDraft(null)}
            onSave={(member) => save(member, draft.id === "new")}
          />
        </section>
      ) : null}

      {removing ? (
        <section className="family-administration-confirm" aria-label="Gezinslid verwijderen">
          <h3>{removing.member.name} verwijderen?</h3>
          <p>Deze verwijzingen blijven behouden: {dependencyText(removing.dependencies)}. Er wordt niets herverdeeld; je kunt het gezinslid later herstellen.</p>
          <button disabled={Boolean(busyAction)} onClick={() => void confirmRemove()} type="button">
            {busyAction === `remove:${removing.member.id}` ? "Verwijderen…" : "Verwijderen bevestigen"}
          </button>
          <button disabled={Boolean(busyAction)} onClick={() => setRemoving(null)} type="button">Annuleren</button>
        </section>
      ) : null}
    </section>
  );
}

function newFamilyMemberDraft(): FamilyMember {
  return {
    id: "new",
    name: "",
    initials: "",
    memberKind: "adult",
    dateOfBirth: null,
    displayColor: "#c7d2fe",
    avatarSelection: defaultAvatarSelection,
  };
}

function dependencyText(dependencies: FamilyDependencies) {
  return `${dependencies.tasks} taken, ${dependencies.rooms} kamers, ${dependencies.goals} doelen en ${dependencies.privateKnownPeople} privécontacten`;
}
