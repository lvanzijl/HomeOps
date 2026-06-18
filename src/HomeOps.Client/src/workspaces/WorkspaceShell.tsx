import { useMemo, useState } from 'react';
import { getWidgetDefinition } from '../widgets/widgetCatalog';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { WorkspaceDefinition, WorkspaceId, workspaceDefinitions } from './workspaceModel';

function getInitialWorkspace(): WorkspaceDefinition {
  return workspaceDefinitions[0];
}

export function WorkspaceShell() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceId>(getInitialWorkspace().id);

  const activeWorkspace = useMemo(
    () => workspaceDefinitions.find((workspace) => workspace.id === activeWorkspaceId) ?? getInitialWorkspace(),
    [activeWorkspaceId],
  );

  const activeWorkspaceIndex = workspaceDefinitions.findIndex((workspace) => workspace.id === activeWorkspace.id);

  return (
    <section className="workspace-shell" aria-label="Workspace shell">
      <nav className="workspace-nav" aria-label="Workspace navigation">
        {workspaceDefinitions.map((workspace) => (
          <button
            aria-current={workspace.id === activeWorkspace.id ? 'page' : undefined}
            className="workspace-nav-button"
            key={workspace.id}
            onClick={() => setActiveWorkspaceId(workspace.id)}
            type="button"
          >
            {workspace.label}
          </button>
        ))}
      </nav>

      <section className="workspace-panel" aria-labelledby="active-workspace-title">
        <p className="workspace-position">
          Workspace {activeWorkspaceIndex + 1} of {workspaceDefinitions.length}
        </p>
        <h2 id="active-workspace-title">{activeWorkspace.label}</h2>
        <p>{activeWorkspace.description}</p>
        <div className="widget-host" aria-label={`${activeWorkspace.label} widgets`}>
          {activeWorkspace.widgetInstances.map((instance) => {
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
      </section>
    </section>
  );
}
