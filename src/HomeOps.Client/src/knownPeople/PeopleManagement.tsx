import { useEffect, useMemo, useState } from "react";
import type { FamilyMember } from "../home/familyMembers";
import {
  createKnownPerson,
  deleteKnownPerson,
  listKnownPeople,
  updateKnownPerson,
} from "./knownPeopleApi";
import type { KnownPerson } from "./knownPeople";
import {
  KnownPersonForm,
  createEmptyKnownPersonDraft,
  type KnownPersonDraft,
  type KnownPersonFormSaveState,
} from "./KnownPersonForm";
import { KnownPersonAvatar } from "./KnownPersonAvatar";
import {
  filterKnownPeople,
  groupedKnownPeople,
  relationshipDisplayText,
} from "./peoplePresentation";

type Draft = KnownPersonDraft;

type SaveState = KnownPersonFormSaveState;

export function PeopleManagement({
  members,
}: {
  members: readonly FamilyMember[];
}) {
  const [people, setPeople] = useState<readonly KnownPerson[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function reload() {
    setIsLoading(true);
    setError(null);
    try {
      setPeople(await listKnownPeople());
    } catch {
      setError("People konden niet worden geladen. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const visiblePeople = useMemo(
    () => filterKnownPeople(people, query),
    [people, query],
  );
  const sharedPeople = visiblePeople.filter(
    (person) => person.scope === "shared",
  );
  const privatePeopleByMember = members.map((member) => ({
    member,
    people: visiblePeople.filter(
      (person) =>
        person.scope === "privateToMember" &&
        person.familyMemberId === member.id,
    ),
  }));

  async function saveDraft(
    person: Parameters<typeof createKnownPerson>[0],
    id?: string,
  ) {
    setSaveState("saving");
    setError(null);
    try {
      const saved = id
        ? await updateKnownPerson({ ...person, id })
        : await createKnownPerson(person);
      setPeople((current) =>
        id
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved],
      );
      setDraft(null);
    } catch {
      setError(
        "Deze persoon kon niet worden opgeslagen. Controleer de velden.",
      );
    } finally {
      setSaveState("idle");
    }
  }

  async function removePerson(id: string) {
    setSaveState("deleting");
    setError(null);
    try {
      await deleteKnownPerson(id);
      setPeople((current) => current.filter((item) => item.id !== id));
      setDraft(null);
    } catch {
      setError("Deze persoon kon niet worden verwijderd.");
    } finally {
      setSaveState("idle");
    }
  }

  return (
    <section className="people-management" aria-label="People management">
      <header className="people-management-header">
        <div>
          <p className="widget-type">People</p>
          <h3>People beheren</h3>
          <p>
            Beheer gedeelde People en privépersonen per gezinslid, zonder
            koppeling met taken, boodschappen of agenda.
          </p>
        </div>
        <button
          onClick={() =>
            setDraft(
              createEmptyKnownPersonDraft("shared", members[0]?.id ?? null),
            )
          }
          type="button"
        >
          Add person
        </button>
      </header>

      <section className="people-family-summary" aria-label="Family Members">
        <h4>Family Members</h4>
        <div className="people-family-list">
          {members.map((member) => (
            <span key={member.id}>{member.name}</span>
          ))}
        </div>
      </section>

      <label className="people-search-field">
        <span>Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Zoek op naam, bijnaam of relatie"
        />
      </label>

      {error ? (
        <p className="people-error" role="alert">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <p className="people-state">People laden…</p>
      ) : people.length === 0 ? (
        <p className="people-state">Nog geen People toegevoegd.</p>
      ) : visiblePeople.length === 0 ? (
        <p className="people-state">
          Geen People gevonden voor deze zoekopdracht.
        </p>
      ) : (
        <div className="people-sections">
          <PeopleScopeSection
            title="Shared People"
            people={sharedPeople}
            onEdit={(person) => setDraft(person)}
          />
          {privatePeopleByMember.map(({ member, people }) => (
            <PeopleScopeSection
              key={member.id}
              title={member.name}
              people={people}
              onEdit={(person) => setDraft(person)}
            />
          ))}
        </div>
      )}

      {draft ? (
        <div className="people-dialog-backdrop" role="presentation">
          <KnownPersonForm
            draft={draft}
            members={members}
            scopeMode={{ kind: "editable" }}
            saveState={saveState}
            error={error}
            onChange={setDraft}
            onCancel={() => setDraft(null)}
            onSubmit={(person, id) => void saveDraft(person, id)}
            onDelete={(id) => void removePerson(id)}
          />
        </div>
      ) : null}
    </section>
  );
}

function PeopleScopeSection({
  title,
  people,
  onEdit,
}: {
  title: string;
  people: readonly KnownPerson[];
  onEdit: (person: KnownPerson) => void;
}) {
  if (people.length === 0) return null;
  return (
    <section className="people-scope-section">
      <h4>{title}</h4>
      {groupedKnownPeople(people).map(({ group, people: items }) => (
        <section key={group}>
          <h5>{group}</h5>
          <div className="people-card-grid">
            {items.map((person) => (
              <button
                className="people-card"
                key={person.id}
                onClick={() => onEdit(person)}
                type="button"
              >
                <KnownPersonAvatar person={person} />
                <span>
                  <strong>{person.displayName}</strong>
                  {person.nickname ? <small>{person.nickname}</small> : null}
                  <small>{relationshipDisplayText(person)}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
