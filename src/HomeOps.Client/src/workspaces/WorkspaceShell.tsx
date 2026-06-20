import { useEffect, useMemo, useState } from 'react';
import { FamilyMemberPage } from '../home/FamilyMemberPage';
import { HomeDashboard } from '../home/HomeDashboard';
import { familyMembers, type FamilyMember } from '../home/familyMembers';
import { loadFamilyMembers, saveFamilyMember } from '../home/familyMembersApi';
import { TasksPage } from '../tasks/TasksPage';
import { DomainPlaceholderPage } from './DomainPlaceholderPage';
import { getDomainColorClass } from './domainColors';
import { getWidgetDefinition } from '../widgets/widgetCatalog';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import type { WidgetInstance } from '../widgets/widgetModel';
import { loadWorkspaceLayout } from './workspaceLayout';
import { WorkspaceDefinition, WorkspaceId, workspaceDefinitions } from './workspaceModel';

function getInitialWorkspace(): WorkspaceDefinition {
  return workspaceDefinitions[0];
}

export function WorkspaceShell() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId>(getInitialWorkspace().id);
  const [activeFamilyMemberId, setActiveFamilyMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>(() => [...familyMembers]);
  const [widgetInstancesByWorkspace, setWidgetInstancesByWorkspace] = useState<Partial<Record<WorkspaceId, readonly WidgetInstance[]>>>({});

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

  const activeWorkspaceIndex = workspaceDefinitions.findIndex((workspace) => workspace.id === activeWorkspace.id);
  useEffect(() => {
    let ignore = false;
    loadFamilyMembers().then((loaded) => { if (!ignore) setMembers([...loaded]); }).catch(() => { if (!ignore) setMembers([...familyMembers]); });
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
  const widgetInstances = activeWorkspace.id === 'agenda'
    ? [{ id: 'agenda-page', widgetDefinitionId: 'agenda-mvp', title: 'Agenda', settings: {} }]
    : activeWorkspace.id === 'lists'
      ? [{ id: 'lists-page', widgetDefinitionId: 'shopping-list-mvp', title: 'Lists', settings: {} }]
      : widgetInstancesByWorkspace[activeWorkspace.id] ?? [];

  return (
    <section className={`workspace-shell ${activeDomainClass}`} aria-label="Workspace shell">
      <nav className="workspace-nav" aria-label="Workspace navigation">
        {workspaceDefinitions.map((workspace) => (
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
      </nav>

      <section className="workspace-panel" aria-labelledby="active-workspace-title">
        {activeWorkspace.id === 'home' && !activeFamilyMember ? <h2 className="visually-hidden" id="active-workspace-title">Home</h2> : activeFamilyMember ? <h2 className="visually-hidden" id="active-workspace-title">{activeFamilyMember.name}</h2> : (
          <>
            <p className="workspace-position">
              Page {activeWorkspaceIndex + 1} of {workspaceDefinitions.length}
            </p>
            <h2 id="active-workspace-title">{activeWorkspace.label}</h2>
            <p>{activeWorkspace.description}</p>
          </>
        )}
        {activeFamilyMember ? (
          <FamilyMemberPage member={activeFamilyMember} onBack={() => setActiveFamilyMemberId(null)} onChange={updateFamilyMember} />
        ) : activeWorkspace.id === 'home' ? (
          <HomeDashboard members={members} onNavigate={navigateWorkspace} onSelectFamilyMember={setActiveFamilyMemberId} />
        ) : activeWorkspace.id === 'tasks' ? (
          <TasksPage members={members} />
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
                  <p>Widget definition not found.</p>
                </article>
              );
            }

            return <WidgetRenderer definition={definition} instance={instance} key={instance.id} />;
          })}
        </div>
        )}
      </section>
    </section>
  );
}
