import { FamilyBoardIcon } from '../design';
import { HomeOpsIcon } from '../icons/homeOpsIcons';
import { useEffect, useMemo, useState } from 'react';
import { defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import { hasCalendarSourceAttention, loadCalendarSources } from '../calendarSources/calendarSourcesApi';
import { FamilyMemberPage } from '../home/FamilyMemberPage';
import { FamilyMemberProfileForm } from '../home/FamilyMemberProfileForm';
import { HomeDashboard } from '../home/HomeDashboard';
import { MotivationPage } from '../MotivationPage';
import type { FamilyMember } from '../home/familyMembers';
import { createFamilyMember, loadFamilyMembers, removeFamilyMember, saveFamilyMember } from '../home/familyMembersApi';
import { SettingsDashboard } from '../settings/SettingsDashboard';
import { TasksPage } from '../tasks/TasksPage';
import { WeeklyResetPage } from '../weeklyReset/WeeklyResetPage';
import { WoningClimatePage, WoningSummaryPage, type ClimateStoryDeepLink } from '../WoningClimatePage';
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
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [widgetInstancesByWorkspace, setWidgetInstancesByWorkspace] = useState<Partial<Record<WorkspaceId, readonly WidgetInstance[]>>>({});
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);
  const [onboardingStatusError, setOnboardingStatusError] = useState(false);
  const [settingsNeedsAttention, setSettingsNeedsAttention] = useState(false);
  const [houseView, setHouseView] = useState<'summary' | 'climate'>('summary');
  const [climateStoryContext, setClimateStoryContext] = useState<ClimateStoryDeepLink | undefined>();

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
    void refreshFamilyMembers();
  }, []);

  async function refreshFamilyMembers() {
    try { setMembers([...(await loadFamilyMembers())]); } catch { setMembers([]); }
  }

  useEffect(() => {
    let ignore = false;
    loadCalendarSources()
      .then((sources) => {
        if (!ignore) {
          setSettingsNeedsAttention(hasCalendarSourceAttention(sources));
        }
      })
      .catch(() => {
        if (!ignore) {
          setSettingsNeedsAttention(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const activeFamilyMember = members.find((member) => member.id === activeFamilyMemberId) ?? null;
  const activeDomainClass = activeFamilyMember ? 'domain-home' : getDomainColorClass(activeWorkspace.id);

  function navigateWorkspace(workspaceId: WorkspaceId) {
    setActiveFamilyMemberId(null);
    setActiveWorkspaceId(workspaceId);
    if (workspaceId !== 'house') { setHouseView('summary'); setClimateStoryContext(undefined); }
  }

  async function updateFamilyMember(updated: FamilyMember) {
    const saved = await saveFamilyMember(updated);
    setMembers((current) => current.map((member) => member.id === saved.id ? saved : member));
    return saved;
  }

  async function addFamilyMember(member: Omit<FamilyMember, 'id'>) {
    const created = await createFamilyMember(member);
    setMembers((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
    setActiveFamilyMemberId(created.id);
    return created;
  }

  async function deleteFamilyMember(member: FamilyMember) {
    await removeFamilyMember(member.id);
    setMembers((current) => current.filter((item) => item.id !== member.id));
    setActiveFamilyMemberId(null);
  }

  function refreshOnboardingStatus() {
    setCheckedOnboarding(false);
    setOnboardingStatusError(false);
    let ignore = false;
    loadOnboardingStatus().then((status) => {
      if (!ignore) {
        setRequiresOnboarding(status.requiresOnboarding);
        setCheckedOnboarding(true);
      }
    }).catch(() => {
      if (!ignore) {
        setOnboardingStatusError(true);
        setCheckedOnboarding(true);
      }
    });
    return () => { ignore = true; };
  }

  useEffect(() => {
    return refreshOnboardingStatus();
  }, []);

  if (!checkedOnboarding) {
    return <section className="workspace-shell domain-home" aria-label="Gezinsbord"><section className="workspace-panel"><p>Gezinsinstellingen laden…</p></section></section>;
  }

  if (onboardingStatusError) {
    return <section className="workspace-shell domain-home" aria-label="Gezinsbord"><section className="workspace-panel"><p role="alert">Gezinsinstellingen konden niet worden geladen.</p><button type="button" onClick={refreshOnboardingStatus}>Opnieuw proberen</button></section></section>;
  }

  if (requiresOnboarding) {
    return <FirstRunWizard initialMembers={members} onComplete={(updatedMembers) => { setMembers([...updatedMembers]); setRequiresOnboarding(false); setActiveWorkspaceId('home'); setActiveFamilyMemberId(null); }} />;
  }

  const widgetInstances = activeWorkspace.id === 'agenda'
    ? [{ id: 'agenda-page', widgetDefinitionId: 'agenda-mvp', title: 'Agenda', settings: {} }]
    : activeWorkspace.id === 'lists'
      ? [{ id: 'lists-page', widgetDefinitionId: 'shopping-list-mvp', title: 'Boodschappen', settings: {} }]
      : widgetInstancesByWorkspace[activeWorkspace.id] ?? [];

  return (
    <section className={`workspace-shell ${activeDomainClass}`} aria-label="Gezinsbord">
      <nav className="workspace-nav" aria-label="Navigatie gezinsbord">
        <WorkspaceBackSlot isVisible={Boolean(activeFamilyMember)} onBack={() => setActiveFamilyMemberId(null)} />
        <div className="workspace-primary-nav" aria-label="Dagelijkse gezinsplekken">
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
        <div className="workspace-admin-nav" aria-label="Gezinsinstellingen">
          {administrationWorkspaceDefinitions.map((workspace) => (
            <button
              aria-current={workspace.id === activeWorkspace.id ? 'page' : undefined}
              aria-label={`${workspace.label} voor gezinsinstellingen`}
              className={`workspace-nav-button workspace-admin-button ${getDomainColorClass(workspace.id)}`}
              key={workspace.id}
              onClick={() => navigateWorkspace(workspace.id)}
              title={workspace.label}
              type="button"
            >
              <FamilyBoardIcon name="navigation.settings" size="small" />
              <span>{workspace.label}</span>
              {workspace.id === 'settings' && settingsNeedsAttention ? (
                <span aria-label="Kalenderbronnen vragen aandacht" className="workspace-admin-badge">
                  !
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      <section className={`workspace-panel workspace-panel-${activeWorkspace.id}`} aria-labelledby="active-workspace-title">
        {activeWorkspace.id === 'home' && !activeFamilyMember ? <h2 className="visually-hidden" id="active-workspace-title">Thuis</h2> : activeFamilyMember ? <h2 className="visually-hidden" id="active-workspace-title">{activeFamilyMember.name}</h2> : activeWorkspace.id === 'settings' ? <h2 className="visually-hidden" id="active-workspace-title">Instellingen</h2> : (
          <header className="workspace-page-header">
            {activeWorkspace.id === 'agenda' ? (
              <h2 id="active-workspace-title">{activeWorkspace.label}</h2>
            ) : (
              <>
                {activeWorkspace.id !== 'lists' ? (
                  <p className="workspace-position">
                    {activeWorkspaceIsPrimary ? 'Dagelijkse gezinsplek' : activeWorkspaceIsAdministration ? 'Gezinsinstellingen' : 'Familiecheck'}
                  </p>
                ) : null}
                <h2 id="active-workspace-title">{activeWorkspace.label}</h2>
                <p>{activeWorkspace.description}</p>
              </>
            )}
          </header>
        )}
        <div className="workspace-page-body">
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
            houseView === 'climate' ? <WoningClimatePage initialStoryContext={climateStoryContext} onBack={() => { setHouseView('summary'); setClimateStoryContext(undefined); }} onOpenClimateSettings={() => { setActiveWorkspaceId('settings'); setHouseView('summary'); }} /> : <WoningSummaryPage onOpenClimate={(context) => { setClimateStoryContext(context); setHouseView('climate'); }} />
          ) : activeWorkspace.id === 'media' ? (
            <DomainPlaceholderPage title="Media" purpose="Voor toekomstige mediaherinneringen en gezinscontext." />
          ) : activeWorkspace.id === 'gamification' ? (
            <DomainPlaceholderPage title="Beloningen" purpose="Voor toekomstige punten, beloningen en gezinsvoortgang." />
          ) : activeWorkspace.id === 'settings' ? (
            <SettingsDashboard
              members={members}
              onCalendarSourcesChanged={(sources) => setSettingsNeedsAttention(hasCalendarSourceAttention(sources))}
              onFamilyMembersChanged={refreshFamilyMembers}
              widgetInstances={widgetInstances}
            />
          ) : (
            <div className="widget-host" aria-label={`${activeWorkspace.label} widgets`}>
              {widgetInstances.map((instance) => {
                const definition = getWidgetDefinition(instance.widgetDefinitionId);

                if (!definition) {
                  return (
                    <article className="widget-card" key={instance.id}>
                      <h3>{instance.title}</h3>
                      <p>Deze gezinsplek is nog niet klaar.</p>
                    </article>
                  );
                }

                return <WidgetRenderer definition={definition} instance={instance} key={instance.id} />;
              })}
            </div>
          )}
        </div>
      </section>
      {isAddingMember ? <AddFamilyMemberDialog onCancel={() => setIsAddingMember(false)} onCreate={addFamilyMember} /> : null}
    </section>
  );
}

function WorkspaceBackSlot({ isVisible, onBack }: { isVisible: boolean; onBack: () => void }) {
  if (!isVisible) {
    return <span aria-hidden="true" className="workspace-back-slot workspace-back-slot-hidden" />;
  }

  return (
    <button aria-label="Terug naar familieoverzicht" className="workspace-back-slot workspace-back-button" onClick={onBack} type="button">
      <HomeOpsIcon name="arrowBack" />
      <span className="visually-hidden">Terug naar familieoverzicht</span>
    </button>
  );
}

function AddFamilyMemberDialog({ onCancel, onCreate }: { onCancel: () => void; onCreate: (member: Omit<FamilyMember, 'id'>) => Promise<FamilyMember> }) {
  const [isSaving, setIsSaving] = useState(false);
  const newMember: FamilyMember = {
    id: "new",
    name: "",
    initials: "",
    memberKind: "adult",
    dateOfBirth: null,
    displayColor: "#c7d2fe",
    avatarSelection: defaultAvatarSelection,
  };
  return <div className="avatar-editor-backdrop" role="presentation"><section className="avatar-editor" role="dialog" aria-modal="true" aria-label="Gezinslid toevoegen"><header><div><p className="eyebrow">Gezin</p><h3>Gezinslid toevoegen</h3><p>Voeg iemand toe aan het gezinsbord zonder account aan te maken.</p></div><button type="button" className="icon-button" onClick={onCancel} disabled={isSaving} aria-label="Gezinslid toevoegen sluiten"><HomeOpsIcon name="close" /></button></header><FamilyMemberProfileForm errorMessage="Gezinslid kon niet worden toegevoegd. Probeer het opnieuw." initialMember={newMember} isNew onBusyChange={setIsSaving} onCancel={onCancel} onSave={async (member) => { const { id: _id, ...createdMember } = member; await onCreate(createdMember); onCancel(); }} /></section></div>;
}
