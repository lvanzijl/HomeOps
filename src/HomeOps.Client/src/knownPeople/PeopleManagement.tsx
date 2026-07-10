import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import type { FamilyMember } from '../home/familyMembers';
import { KnownPersonAvatarEditor } from './KnownPersonAvatarEditor';
import { createKnownPerson, deleteKnownPerson, listKnownPeople, updateKnownPerson } from './knownPeopleApi';
import type { KnownPerson, KnownPersonInput, KnownPersonRelationshipType, KnownPersonScope } from './knownPeople';
import { KnownPersonAvatar } from './KnownPersonAvatar';
import { filterKnownPeople, relationshipDisplayText, relationshipGroup, relationshipLabels, relationshipOptions } from './peoplePresentation';

const emptyDraft = (members: readonly FamilyMember[]): KnownPersonInput => ({
  displayName: '',
  nickname: '',
  relationshipType: 'friend',
  customRelationshipLabel: '',
  scope: 'shared',
  familyMemberId: members[0]?.id ?? null,
  initials: '',
  avatarSelection: defaultAvatarSelection,
});

type Draft = KnownPersonInput & { id?: string };

type SaveState = 'idle' | 'saving' | 'deleting';

export function PeopleManagement({ members }: { members: readonly FamilyMember[] }) {
  const [people, setPeople] = useState<readonly KnownPerson[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);

  async function reload() {
    setIsLoading(true);
    setError(null);
    try {
      setPeople(await listKnownPeople());
    } catch {
      setError('People konden niet worden geladen. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  const visiblePeople = useMemo(() => filterKnownPeople(people, query), [people, query]);
  const sharedPeople = visiblePeople.filter((person) => person.scope === 'shared');
  const privatePeopleByMember = members.map((member) => ({
    member,
    people: visiblePeople.filter((person) => person.scope === 'privateToMember' && person.familyMemberId === member.id),
  }));

  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaveState('saving');
    setError(null);
    try {
      const normalized = normalizeDraft(draft);
      const saved = draft.id ? await updateKnownPerson({ ...normalized, id: draft.id }) : await createKnownPerson(normalized);
      setPeople((current) => draft.id ? current.map((person) => person.id === saved.id ? saved : person) : [...current, saved]);
      setDraft(null);
    } catch {
      setError('Deze persoon kon niet worden opgeslagen. Controleer de velden.');
    } finally {
      setSaveState('idle');
    }
  }

  async function removePerson(person: KnownPerson) {
    setSaveState('deleting');
    setError(null);
    try {
      await deleteKnownPerson(person.id);
      setPeople((current) => current.filter((item) => item.id !== person.id));
      setDraft(null);
    } catch {
      setError('Deze persoon kon niet worden verwijderd.');
    } finally {
      setSaveState('idle');
    }
  }

  return (
    <section className="people-management" aria-label="People management">
      <header className="people-management-header">
        <div>
          <p className="widget-type">People</p>
          <h3>People beheren</h3>
          <p>Beheer gedeelde People en privépersonen per gezinslid, zonder koppeling met taken, boodschappen of agenda.</p>
        </div>
        <button onClick={() => setDraft(emptyDraft(members))} type="button">Add person</button>
      </header>

      <section className="people-family-summary" aria-label="Family Members">
        <h4>Family Members</h4>
        <div className="people-family-list">
          {members.map((member) => <span key={member.id}>{member.name}</span>)}
        </div>
      </section>

      <label className="people-search-field">
        <span>Search</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op naam, bijnaam of relatie" />
      </label>

      {error ? <p className="people-error" role="alert">{error}</p> : null}
      {isLoading ? <p className="people-state">People laden…</p> : people.length === 0 ? <p className="people-state">Nog geen People toegevoegd.</p> : visiblePeople.length === 0 ? <p className="people-state">Geen People gevonden voor deze zoekopdracht.</p> : (
        <div className="people-sections">
          <PeopleScopeSection title="Shared People" people={sharedPeople} onEdit={(person) => setDraft(person)} />
          {privatePeopleByMember.map(({ member, people }) => (
            <PeopleScopeSection key={member.id} title={member.name} people={people} onEdit={(person) => setDraft(person)} />
          ))}
        </div>
      )}

      {draft ? (
        <div className="people-dialog-backdrop" role="presentation">
          <form aria-label={draft.id ? 'Edit person' : 'Create person'} className="people-dialog" onSubmit={saveDraft}>
            <header>
              <h3>{draft.id ? 'Edit person' : 'Create person'}</h3>
              <button onClick={() => { setDraft(null); setIsAvatarEditorOpen(false); }} type="button">Sluiten</button>
            </header>
            <label><span>DisplayName</span><input required maxLength={160} value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value, initials: initialsFor(event.target.value) })} /></label>
            <label><span>Nickname</span><input maxLength={80} value={draft.nickname ?? ''} onChange={(event) => setDraft({ ...draft, nickname: event.target.value })} /></label>
            <label><span>RelationshipType</span><select value={draft.relationshipType} onChange={(event) => setDraft({ ...draft, relationshipType: event.target.value as KnownPersonRelationshipType })}>{relationshipOptions.map((option) => <option key={option} value={option}>{relationshipLabels[option]}</option>)}</select></label>
            <label><span>CustomRelationshipLabel</span><input maxLength={80} value={draft.customRelationshipLabel ?? ''} onChange={(event) => setDraft({ ...draft, customRelationshipLabel: event.target.value })} /></label>
            <fieldset>
              <legend>Scope</legend>
              <label><input checked={draft.scope === 'shared'} name="known-person-scope" onChange={() => setDraft({ ...draft, scope: 'shared', familyMemberId: null })} type="radio" /> Shared</label>
              <label><input checked={draft.scope === 'privateToMember'} name="known-person-scope" onChange={() => setDraft({ ...draft, scope: 'privateToMember', familyMemberId: draft.familyMemberId ?? members[0]?.id ?? null })} type="radio" /> PrivateToMember</label>
            </fieldset>
            {draft.scope === 'privateToMember' ? <label><span>FamilyMember</span><select required value={draft.familyMemberId ?? ''} onChange={(event) => setDraft({ ...draft, familyMemberId: event.target.value })}><option value="" disabled>Kies gezinslid</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label> : null}
            <section className="people-avatar-field">
              <KnownPersonAvatar person={draftToPerson(draft)} />
              <button onClick={() => setIsAvatarEditorOpen(true)} type="button">Avatar edit</button>
            </section>
            <div className="people-dialog-actions">
              {draft.id ? <button disabled={saveState !== 'idle'} onClick={() => void removePerson(draftToPerson(draft))} type="button">Delete</button> : null}
              <button disabled={saveState !== 'idle'} type="submit">{saveState === 'saving' ? 'Opslaan…' : 'Save'}</button>
            </div>
            {isAvatarEditorOpen ? <KnownPersonAvatarEditor person={draftToPerson(draft)} onChange={(person) => setDraft({ ...draft, avatarSelection: person.avatarSelection })} onClose={() => setIsAvatarEditorOpen(false)} /> : null}
          </form>
        </div>
      ) : null}
    </section>
  );
}

function normalizeDraft(draft: Draft): KnownPersonInput {
  const displayName = draft.displayName.trim();
  return { ...draft, displayName, nickname: draft.nickname?.trim() || null, customRelationshipLabel: draft.customRelationshipLabel?.trim() || null, familyMemberId: draft.scope === 'shared' ? null : draft.familyMemberId, initials: draft.initials || initialsFor(displayName) };
}

function draftToPerson(draft: Draft): KnownPerson {
  const normalized = normalizeDraft(draft);
  return { ...normalized, id: draft.id ?? 'draft', createdUtc: undefined, updatedUtc: undefined };
}

function initialsFor(name: string) { return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'; }

function PeopleScopeSection({ title, people, onEdit }: { title: string; people: readonly KnownPerson[]; onEdit: (person: KnownPerson) => void }) {
  if (people.length === 0) return null;
  const groups = new Map<string, KnownPerson[]>();
  people.forEach((person) => groups.set(relationshipGroup(person.relationshipType), [...(groups.get(relationshipGroup(person.relationshipType)) ?? []), person]));
  return <section className="people-scope-section"><h4>{title}</h4>{[...groups].map(([group, items]) => <section key={group}><h5>{group}</h5><div className="people-card-grid">{items.map((person) => <button className="people-card" key={person.id} onClick={() => onEdit(person)} type="button"><KnownPersonAvatar person={person} /><span><strong>{person.displayName}</strong>{person.nickname ? <small>{person.nickname}</small> : null}<small>{relationshipDisplayText(person)}</small></span></button>)}</div></section>)}</section>;
}
