import { useState, type FormEvent } from 'react';
import { avatarV2DefaultConfiguration } from './avatarV2/avatarConfig';
import { type FamilyMember } from './home/familyMembers';
import { createFamilyMember } from './home/familyMembersApi';
import { completeOnboarding } from './onboardingApi';

type Step = 0 | 1 | 2 | 3 | 4;

export function FirstRunWizard({ initialMembers, onComplete }: { initialMembers: readonly FamilyMember[]; onComplete: (members: readonly FamilyMember[]) => void }) {
  const [step, setStep] = useState<Step>(0);
  const [members, setMembers] = useState<FamilyMember[]>([...initialMembers]);
  const [error, setError] = useState<string | null>(null);
  const adults = members.filter((member) => member.memberKind === 'adult');
  const children = members.filter((member) => member.memberKind === 'child');

  async function add(member: Omit<FamilyMember, 'id'>) {
    setError(null);
    try {
      const created = await createFamilyMember(member);
      setMembers((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setError('Gezinslid toevoegen lukte niet. Probeer het opnieuw.');
    }
  }

  async function finish() {
    if (adults.length === 0) return;
    setError(null);
    try {
      await completeOnboarding();
      onComplete(members);
    } catch {
      setError('Installatie afronden lukte niet. Probeer het opnieuw.');
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
        {step === 0 ? <WelcomeStep onNext={() => setStep(1)} /> : null}
        {step === 1 ? <MemberStep title="Volwassenen toevoegen" intro="Voeg één of meer volwassenen in het gezin toe." kind="adult" members={adults} onAdd={add} onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={adults.length === 0} /> : null}
        {step === 2 ? <MemberStep title="Kinderen toevoegen" intro="Voeg kinderen toe, of sla deze stap over als die er niet zijn." kind="child" members={children} onAdd={add} onBack={() => setStep(1)} onNext={() => setStep(3)} /> : null}
        {step === 3 ? <ReviewStep adults={adults} children={children} onBack={() => setStep(2)} onNext={() => setStep(4)} /> : null}
        {step === 4 ? <FinishStep onBack={() => setStep(3)} onFinish={finish} /> : null}
      </div>
    </section>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return <section><h1>Welkom bij FamilyBoard</h1><p>FamilyBoard helpt het gezin overzicht te houden. Voeg nu je gezinsleden toe; alles kan later worden aangepast.</p><div className="wizard-actions"><button type="button" onClick={onNext}>Installatie starten</button></div></section>;
}

function MemberStep({ title, intro, kind, members, onAdd, onBack, onNext, nextDisabled = false }: { title: string; intro: string; kind: FamilyMember['memberKind']; members: readonly FamilyMember[]; onAdd: (member: Omit<FamilyMember, 'id'>) => Promise<void>; onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return <section><h1>{title}</h1><p>{intro}</p><MemberForm kind={kind} onAdd={onAdd} /> <MemberList members={members} emptyText={kind === 'adult' ? 'Nog geen volwassenen toegevoegd.' : 'Nog geen kinderen toegevoegd.'} /><div className="wizard-actions"><button type="button" onClick={onBack}>Terug</button><button type="button" onClick={onNext} disabled={nextDisabled}>{kind === 'adult' ? 'Doorgaan' : 'Gezin controleren'}</button></div></section>;
}

function MemberForm({ kind, onAdd }: { kind: FamilyMember['memberKind']; onAdd: (member: Omit<FamilyMember, 'id'>) => Promise<void> }) {
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || (kind === 'child' && !dateOfBirth)) return;
    await onAdd({ name: name.trim(), initials: buildInitials(name), memberKind: kind, dateOfBirth: kind === 'child' ? dateOfBirth : null, displayColor: kind === 'adult' ? '#c7d2fe' : '#bbf7d0', avatarV2Config: avatarV2DefaultConfiguration });
    setName(''); setDateOfBirth('');
  }
  return <form className="wizard-form" onSubmit={submit} aria-label={`${kind === 'adult' ? 'Volwassene' : 'Kind'} toevoegen`}><label>Naam<input value={name} onChange={(event) => setName(event.target.value)} required /></label>{kind === 'child' ? <label>Geboortedatum<input aria-label="Geboortedatum" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} required /></label> : null}<button type="submit">{kind === 'adult' ? 'Volwassene toevoegen' : 'Kind toevoegen'}</button></form>;
}

function ReviewStep({ adults, children, onBack, onNext }: { adults: readonly FamilyMember[]; children: readonly FamilyMember[]; onBack: () => void; onNext: () => void }) {
  return <section aria-label="Gezin controleren"><h1>Gezin controleren</h1><p>Controleer de gezinsleden voordat je afrondt.</p><h2>Volwassenen</h2><MemberList members={adults} emptyText="Geen volwassenen toegevoegd." /><h2>Kinderen</h2><MemberList members={children} emptyText="Geen kinderen toegevoegd." /><div className="wizard-actions"><button type="button" onClick={onBack}>Terug</button><button type="button" onClick={onNext}>Doorgaan</button></div></section>;
}

function FinishStep({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
  return <section><h1>Installatie afronden</h1><p>Het gezin staat klaar. Je kunt gezinsleden later aanpassen vanaf Thuis.</p><div className="wizard-actions"><button type="button" onClick={onBack}>Terug</button><button type="button" onClick={onFinish}>Afronden en Thuis openen</button></div></section>;
}

function MemberList({ members, emptyText }: { members: readonly FamilyMember[]; emptyText: string }) {
  return members.length === 0 ? <p>{emptyText}</p> : <ul className="wizard-member-list">{members.map((member) => <li key={member.id}><strong>{member.name}</strong><span>{member.memberKind === 'adult' ? 'Volwassene' : 'Kind'}{member.dateOfBirth ? ` · ${member.dateOfBirth}` : ''}</span></li>)}</ul>;
}

function buildInitials(name: string) { return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'M'; }
