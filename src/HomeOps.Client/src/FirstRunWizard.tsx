import { useState, type FormEvent } from 'react';
import { defaultAvatarSelection } from './avatarCatalog/avatarCatalogAdapter';
import { type FamilyMember } from './home/familyMembers';
import { loadFamilyMembers } from './home/familyMembersApi';
import { completeOnboarding } from './onboardingApi';

type Step = 0 | 1 | 2 | 3 | 4;
type MemberDraft = Omit<FamilyMember, 'id'> & { draftId: string };

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam';

export function FirstRunWizard({ initialMembers, onComplete }: { initialMembers: readonly FamilyMember[]; onComplete: (members: readonly FamilyMember[]) => void }) {
  const [step, setStep] = useState<Step>(0);
  const [householdName, setHouseholdName] = useState('Thuis');
  const [members, setMembers] = useState<MemberDraft[]>(() => initialMembers.map((member, index) => ({ ...member, draftId: `existing-${index}` })));
  const [error, setError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const adults = members.filter((member) => member.memberKind === 'adult');
  const children = members.filter((member) => member.memberKind === 'child');

  function add(member: Omit<FamilyMember, 'id'>) {
    setError(null);
    setMembers((current) => [...current, { ...member, draftId: `${member.name}-${Date.now()}-${current.length}` }]);
  }

  function remove(draftId: string) {
    setError(null);
    setMembers((current) => current.filter((member) => member.draftId !== draftId));
  }

  async function finish() {
    if (adults.length === 0 || isFinishing) return;
    setError(null);
    setIsFinishing(true);
    try {
      await completeOnboarding({ householdName, timeZoneId: browserTimeZone, members });
      onComplete(await loadFamilyMembers());
    } catch {
      setError('Installatie afronden lukte niet. Probeer het opnieuw.');
      setIsFinishing(false);
    }
  }

  return (
    <section className="first-run-wizard domain-home" aria-label="Eerste installatie">
      <div className="wizard-card">
        <p className="eyebrow">Gezin instellen</p>
        <ol className="wizard-steps" aria-label="Installatiestappen">
          {['Welkom', 'Volwassenen', 'Kinderen', 'Controleren', 'Afronden'].map((label, index) => <li className={index === step ? 'active' : ''} key={label}>{label}</li>)}
        </ol>
        {error ? <p role="alert" className="form-error">{error}</p> : null}
        {step === 0 ? <WelcomeStep householdName={householdName} onHouseholdNameChange={setHouseholdName} onNext={() => setStep(1)} /> : null}
        {step === 1 ? <MemberStep title="Volwassenen toevoegen" intro="Voeg één of meer volwassenen in het gezin toe." kind="adult" members={adults} onAdd={add} onRemove={remove} onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={adults.length === 0} /> : null}
        {step === 2 ? <MemberStep title="Kinderen toevoegen" intro="Voeg kinderen toe, of sla deze stap over als die er niet zijn." kind="child" members={children} onAdd={add} onRemove={remove} onBack={() => setStep(1)} onNext={() => setStep(3)} /> : null}
        {step === 3 ? <ReviewStep adults={adults} children={children} onRemove={remove} onEditAdults={() => setStep(1)} onEditChildren={() => setStep(2)} onBack={() => setStep(2)} onNext={() => setStep(4)} /> : null}
        {step === 4 ? <FinishStep onBack={() => setStep(3)} onFinish={finish} isFinishing={isFinishing} /> : null}
      </div>
    </section>
  );
}

function WelcomeStep({ householdName, onHouseholdNameChange, onNext }: { householdName: string; onHouseholdNameChange: (value: string) => void; onNext: () => void }) {
  return <section><h1>Welkom bij FamilyBoard</h1><p>FamilyBoard helpt het gezin overzicht te houden. Voeg nu je gezinsleden toe; alles kan later worden aangepast.</p><label>Naam van je huishouden<input value={householdName} onChange={(event) => onHouseholdNameChange(event.target.value)} required /></label><div className="wizard-actions"><button type="button" onClick={onNext} disabled={!householdName.trim()}>Installatie starten</button></div></section>;
}

function MemberStep({ title, intro, kind, members, onAdd, onRemove, onBack, onNext, nextDisabled = false }: { title: string; intro: string; kind: FamilyMember['memberKind']; members: readonly MemberDraft[]; onAdd: (member: Omit<FamilyMember, 'id'>) => void; onRemove: (draftId: string) => void; onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return <section><h1>{title}</h1><p>{intro}</p><MemberForm kind={kind} onAdd={onAdd} /> <MemberList members={members} emptyText={kind === 'adult' ? 'Nog geen volwassenen toegevoegd.' : 'Nog geen kinderen toegevoegd.'} onRemove={onRemove} /><div className="wizard-actions"><button type="button" onClick={onBack}>Terug</button><button type="button" onClick={onNext} disabled={nextDisabled}>{kind === 'adult' ? 'Doorgaan' : 'Gezin controleren'}</button></div></section>;
}

function MemberForm({ kind, onAdd }: { kind: FamilyMember['memberKind']; onAdd: (member: Omit<FamilyMember, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || (kind === 'child' && !dateOfBirth)) return;
    onAdd({ name: name.trim(), initials: buildInitials(name), memberKind: kind, dateOfBirth: kind === 'child' ? dateOfBirth : null, displayColor: kind === 'adult' ? '#c7d2fe' : '#bbf7d0', avatarSelection: defaultAvatarSelection });
    setName('');
    setDateOfBirth('');
  }
  return <form className="wizard-form" onSubmit={submit} aria-label={`${kind === 'adult' ? 'Volwassene' : 'Kind'} toevoegen`}><label>Naam<input value={name} onChange={(event) => setName(event.target.value)} required /></label>{kind === 'child' ? <label>Geboortedatum<input aria-label="Geboortedatum" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} required /></label> : null}<button type="submit">{kind === 'adult' ? 'Volwassene toevoegen' : 'Kind toevoegen'}</button></form>;
}

function ReviewStep({ adults, children, onRemove, onEditAdults, onEditChildren, onBack, onNext }: { adults: readonly MemberDraft[]; children: readonly MemberDraft[]; onRemove: (draftId: string) => void; onEditAdults: () => void; onEditChildren: () => void; onBack: () => void; onNext: () => void }) {
  return <section aria-label="Gezin controleren"><h1>Gezin controleren</h1><p>Controleer de gezinsleden voordat je afrondt.</p><h2>Volwassenen</h2><MemberList members={adults} emptyText="Geen volwassenen toegevoegd." onRemove={onRemove} /><button type="button" onClick={onEditAdults}>Volwassenen bewerken</button><h2>Kinderen</h2><MemberList members={children} emptyText="Geen kinderen toegevoegd." onRemove={onRemove} /><button type="button" onClick={onEditChildren}>Kinderen bewerken</button><div className="wizard-actions"><button type="button" onClick={onBack}>Terug</button><button type="button" onClick={onNext} disabled={adults.length === 0}>Doorgaan</button></div></section>;
}

function FinishStep({ onBack, onFinish, isFinishing }: { onBack: () => void; onFinish: () => void; isFinishing: boolean }) {
  return <section><h1>Installatie afronden</h1><p>Het gezin staat klaar. Je kunt gezinsleden later aanpassen vanaf Thuis.</p><div className="wizard-actions"><button type="button" onClick={onBack} disabled={isFinishing}>Terug</button><button type="button" onClick={onFinish} disabled={isFinishing}>{isFinishing ? 'Afronden…' : 'Afronden en Thuis openen'}</button></div></section>;
}

function MemberList({ members, emptyText, onRemove }: { members: readonly MemberDraft[]; emptyText: string; onRemove: (draftId: string) => void }) {
  return members.length === 0 ? <p>{emptyText}</p> : <ul className="wizard-member-list">{members.map((member) => <li key={member.draftId}><strong>{member.name}</strong><span>{member.memberKind === 'adult' ? 'Volwassene' : 'Kind'}{member.dateOfBirth ? ` · ${member.dateOfBirth}` : ''}</span><button type="button" onClick={() => onRemove(member.draftId)} aria-label={`${member.name} verwijderen`}>Verwijderen</button></li>)}</ul>;
}

function buildInitials(name: string) { return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'M'; }
