import { HomeOpsIcon } from '../icons/homeOpsIcons';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { avatarV2DefaultConfiguration } from '../avatarV2/avatarConfig';
import { FamilyMemberPage } from '../home/FamilyMemberPage';
import { HomeDashboard } from '../home/HomeDashboard';
import { MotivationPage } from '../MotivationPage';
import { familyMembers, type FamilyMember } from '../home/familyMembers';
import { createFamilyMember, loadFamilyMembers, removeFamilyMember, saveFamilyMember } from '../home/familyMembersApi';
import { TasksPage } from '../tasks/TasksPage';
import { WeeklyResetPage } from '../weeklyReset/WeeklyResetPage';
import { FirstRunWizard } from '../FirstRunWizard';
import { loadOnboardingStatus } from '../onboardingApi';
import { DomainPlaceholderPage } from './DomainPlaceholderPage';
import { getDomainColorClass } from './domainColors';
import { getWidgetDefinition } from '../widgets/widgetCatalog';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import type { WidgetInstance } from '../widgets/widgetModel';
import { loadWorkspaceLayout } from './workspaceLayout';
import {
  administrationWorkspaceDefinitions,
  primaryWorkspaceDefinitions,
  WorkspaceDefinition,
  WorkspaceId,
  workspaceDefinitions,
} from './workspaceModel';

function getInitialWorkspace(): WorkspaceDefinition {
  return workspaceDefinitions[0];
}

export function WorkspaceShell() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId>(getInitialWorkspace().id);
  const [activeFamilyMemberId, setActiveFamilyMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>(() => [...familyMembers]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [widgetInstancesByWorkspace, setWidgetInstancesByWorkspace] = useState<Partial<Record<WorkspaceId, readonly WidgetInstance[]>>>({});
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

  const activeWorkspace = useMemo(
    () => workspaceDefinitions.find((workspace) => workspace.id === activeWorkspaceId) ?? getInitialWorkspace(),
    [activeWorkspaceId],
  );

  useEffect(() => {
    let ignoreResult = false;

    async function loadLayout() {
      const layout = await loadWorkspaceLayout(activeWorkspaceId);
      if (!ignoreResult) {
        setWidgetInstancesByWorkspace((current) => ({ ...current, [activeWorkspaceId]: layout.widgetInstances }));
      }
    }

    void loadLayout();

    return () => {
      ignoreResult = true;
    };
  }, [activeWorkspaceId]);

  const activeWorkspaceIsPrimary = primaryWorkspaceDefinitions.some((workspace) => workspace.id === activeWorkspace.id);
  const activeWorkspaceIsAdministration = administrationWorkspaceDefinitions.some((workspace) => workspace.id === activeWorkspace.id);
  useEffect(() => {
    let ignore = false;
    loadFamilyMembers().then((loaded) => { if (!ignore) setMembers([...loaded]); }).catch(() => { if (!ignore) setMembers([]); });
    return () => { ignore = true; };
  }, []);

  const activeFamilyMember = members.find((member) => member.id === activeFamilyMemberId) ?? null;
  const activeDomainClass = activeFamilyMember ? 'domain-home' : getDomainColorClass(activeWorkspace.id);

  function navigateWorkspace(workspaceId: WorkspaceId) {
    setActiveFamilyMemberId(null);
    setActiveWorkspaceId(workspaceId);
  }

  function updateFamilyMember(updated: FamilyMember) {
    setMembers((current) => current.map((member) => member.id === updated.id ? updated : member));
    void saveFamilyMember(updated).then((saved) => {
      setMembers((current) => current.map((member) => member.id === saved.id ? saved : member));
    }).catch(() => undefined);
  }

  function addFamilyMember(member: Omit<FamilyMember, 'id'>) {
    void createFamilyMember(member).then((created) => {
      setMembers((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setActiveFamilyMemberId(created.id);
      setIsAddingMember(false);
    }).catch(() => undefined);
  }

  function deleteFamilyMember(member: FamilyMember) {
    void removeFamilyMember(member.id).then(() => {
      setMembers((current) => current.filter((item) => item.id !== member.id));
      setActiveFamilyMemberId(null);
    }).catch(() => undefined);
  }

  useEffect(() => {
    let ignore = false;
    loadOnboardingStatus().then((status) => {
      if (!ignore) {
        setRequiresOnboarding(status.requiresOnboarding);
        setCheckedOnboarding(true);
      }
    }).catch(() => {
      if (!ignore) {
        setRequiresOnboarding(false);
        setCheckedOnboarding(true);
      }
    });
    return () => { ignore = true; };
  }, []);

  if (!checkedOnboarding) {
    return <section className="workspace-shell domain-home" aria-label="Workspace shell"><section className="workspace-panel"><p>Loading household setup…</p></section></section>;
  }

  if (requiresOnboarding) {
    return <FirstRunWizard initialMembers={members} onComplete={(updatedMembers) => { setMembers([...updatedMembers]); setRequiresOnboarding(false); setActiveWorkspaceId('home'); setActiveFamilyMemberId(null); }} />;
  }

  const widgetInstances = activeWorkspace.id === 'agenda'
    ? [{ id: 'agenda-page', widgetDefinitionId: 'agenda-mvp', title: 'Agenda', settings: {} }]
    : activeWorkspace.id === 'lists'
      ? [{ id: 'lists-page', widgetDefinitionId: 'shopping-list-mvp', title: 'Shopping', settings: {} }]
      : widgetInstancesByWorkspace[activeWorkspace.id] ?? [];

  return (
    <section className={`workspace-shell ${activeDomainClass}`} aria-label="Workspace shell">
      <nav className="workspace-nav" aria-label="Workspace navigation">
        <div className="workspace-primary-nav" aria-label="Everyday family places">
          {primaryWorkspaceDefinitions.map((workspace) => (
          <button
            aria-current={workspace.id === activeWorkspace.id ? 'page' : undefined}
            className={`workspace-nav-button ${getDomainColorClass(workspace.id)}`}
            key={workspace.id}
            onClick={() => navigateWorkspace(workspace.id)}
            type="button"
          >
            {workspace.label}
          </button>
          ))}
        </div>
        <div className="workspace-admin-nav" aria-label="Household settings">
          {administrationWorkspaceDefinitions.map((workspace) => (
            <button
              aria-current={workspace.id === activeWorkspace.id ? 'page' : undefined}
              aria-label={`${workspace.label} for household setup`}
              className={`workspace-nav-button workspace-admin-button ${getDomainColorClass(workspace.id)}`}
              key={workspace.id}
              onClick={() => navigateWorkspace(workspace.id)}
              title={workspace.label}
              type="button"
            >
              <span aria-hidden="true">⚙</span>
              <span>{workspace.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <section className="workspace-panel" aria-labelledby="active-workspace-title">
        {activeWorkspace.id === 'home' && !activeFamilyMember ? <h2 className="visually-hidden" id="active-workspace-title">Home</h2> : activeFamilyMember ? <h2 className="visually-hidden" id="active-workspace-title">{activeFamilyMember.name}</h2> : (
          <header className="workspace-page-header">
            <p className="workspace-position">
              {activeWorkspaceIsPrimary ? 'Everyday family spot' : activeWorkspaceIsAdministration ? 'Household setup' : 'Family check-in'}
            </p>
            <h2 id="active-workspace-title">{activeWorkspace.label}</h2>
            <p>{activeWorkspace.description}</p>
          </header>
        )}
        {activeFamilyMember ? (
          <FamilyMemberPage member={activeFamilyMember} onAddFamilyMember={() => setIsAddingMember(true)} onBack={() => setActiveFamilyMemberId(null)} onChange={updateFamilyMember} onRemove={deleteFamilyMember} />
        ) : activeWorkspace.id === 'home' ? (
          <HomeDashboard members={members} onNavigate={navigateWorkspace} onSelectFamilyMember={setActiveFamilyMemberId} />
        ) : activeWorkspace.id === 'tasks' ? (
          <TasksPage members={members} onOpenWeeklyReset={() => navigateWorkspace('weeklyReset')} />
        ) : activeWorkspace.id === 'motivation' ? (
          <MotivationPage members={members} />
        ) : activeWorkspace.id === 'weeklyReset' ? (
          <WeeklyResetPage />
        ) : activeWorkspace.id === 'house' ? (
          <DomainPlaceholderPage title="House Status" purpose="For home alerts, sensors, and device state." />
        ) : activeWorkspace.id === 'media' ? (
          <DomainPlaceholderPage title="Media" purpose="For media reminders and future household media context." />
        ) : activeWorkspace.id === 'gamification' ? (
          <DomainPlaceholderPage title="Gamification" purpose="For points, rewards, and family progress after Tasks mature." />
        ) : (
        <div className="widget-host" aria-label={`${activeWorkspace.label} widgets`}>
          {activeWorkspace.id === 'settings' && (
            <WidgetRenderer
              definition={getWidgetDefinition('calendar-portability-admin')!}
              instance={{ id: 'calendar-portability-admin-instance', widgetDefinitionId: 'calendar-portability-admin', title: 'Calendar Export / Restore', settings: {} }}
            />
          )}
          {widgetInstances.map((instance) => {
            const definition = getWidgetDefinition(instance.widgetDefinitionId);

            if (!definition) {
              return (
                <article className="widget-card" key={instance.id}>
                  <h3>{instance.title}</h3>
                  <p>This family space is not ready yet.</p>
                </article>
              );
            }

            return <WidgetRenderer definition={definition} instance={instance} key={instance.id} />;
          })}
        </div>
        )}
      </section>
      {isAddingMember ? <AddFamilyMemberDialog onCancel={() => setIsAddingMember(false)} onCreate={addFamilyMember} /> : null}
    </section>
  );
}


function AddFamilyMemberDialog({ onCancel, onCreate }: { onCancel: () => void; onCreate: (member: Omit<FamilyMember, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [memberKind, setMemberKind] = useState<FamilyMember['memberKind']>('adult');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [displayColor, setDisplayColor] = useState('#c7d2fe');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || (memberKind === 'child' && !dateOfBirth)) return;
    onCreate({ name: name.trim(), initials: buildInitials(name), memberKind, dateOfBirth: dateOfBirth || null, displayColor, avatarV2Config: avatarV2DefaultConfiguration });
  }
  return <div className="avatar-editor-backdrop" role="presentation"><section className="avatar-editor" role="dialog" aria-modal="true" aria-label="Add family member"><header><div><p className="eyebrow">Family member management</p><h3>Add Family Member</h3><p>Add a household member without creating an account or login.</p></div><button type="button" className="icon-button" onClick={onCancel} aria-label="Close add family member"><HomeOpsIcon name="close" /></button></header><form className="avatar-editor-grid" onSubmit={submit}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Member type<select value={memberKind} onChange={(event) => setMemberKind(event.target.value as FamilyMember['memberKind'])}><option value="adult">Adult</option><option value="child">Child</option></select></label><label>Date of birth<input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} aria-required={memberKind === 'child'} /></label><label>Display color<input type="color" value={displayColor} onChange={(event) => setDisplayColor(event.target.value)} /></label><div className="family-member-actions"><button type="submit">Add member</button><button type="button" onClick={onCancel}>Cancel</button></div></form></section></div>;
}

function buildInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'M';
}
