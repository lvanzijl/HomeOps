import { HomeOpsApiClient, WorkspaceLayoutDto } from '../api/homeOpsApiClient';
import { getWidgetDefinition } from '../widgets/widgetCatalog';
import type { WidgetInstance } from '../widgets/widgetModel';
import type { WorkspaceId } from './workspaceModel';

export interface WorkspaceLayoutState {
  widgetInstances: readonly WidgetInstance[];
  source: 'api' | 'default';
}

export const defaultWorkspaceLayouts: Record<WorkspaceId, readonly WidgetInstance[]> = {
  home: [
    {
      id: 'home-agenda-widget',
      widgetDefinitionId: 'agenda-mvp',
      title: 'Agenda',
      settings: {},
    },
    {
      id: 'home-shopping-list-widget',
      widgetDefinitionId: 'shopping-list-mvp',
      title: 'Shopping List',
      settings: {},
    },
    {
      id: 'home-welcome-widget',
      widgetDefinitionId: 'welcome-text',
      title: 'Welcome widget',
      settings: {},
    },
  ],
  agenda: [
    {
      id: 'agenda-page-widget',
      widgetDefinitionId: 'agenda-mvp',
      title: 'Agenda',
      settings: {},
    },
  ],
  lists: [
    {
      id: 'lists-page-widget',
      widgetDefinitionId: 'shopping-list-mvp',
      title: 'Lists',
      settings: {},
    },
  ],
  house: [
    {
      id: 'house-placeholder-widget',
      widgetDefinitionId: 'house-placeholder',
      title: 'House placeholder widget',
      settings: {},
    },
  ],
  media: [
    {
      id: 'media-placeholder-widget',
      widgetDefinitionId: 'media-placeholder',
      title: 'Media placeholder widget',
      settings: {},
    },
  ],
  settings: [
    {
      id: 'settings-placeholder-widget',
      widgetDefinitionId: 'settings-placeholder',
      title: 'Settings placeholder widget',
      settings: {},
    },
  ],
};

export function createWorkspaceLayoutApiClient(): HomeOpsApiClient {
  return new HomeOpsApiClient(import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '');
}

export async function loadWorkspaceLayout(workspaceId: WorkspaceId, client = createWorkspaceLayoutApiClient()): Promise<WorkspaceLayoutState> {
  try {
    const layout = await client.getWorkspaceLayout(workspaceId);
    const widgetInstances = toWidgetInstances(workspaceId, layout);

    if (widgetInstances.length === 0) {
      return getDefaultWorkspaceLayout(workspaceId);
    }

    return { widgetInstances, source: 'api' };
  } catch {
    return getDefaultWorkspaceLayout(workspaceId);
  }
}

export function getDefaultWorkspaceLayout(workspaceId: WorkspaceId): WorkspaceLayoutState {
  return {
    widgetInstances: defaultWorkspaceLayouts[workspaceId],
    source: 'default',
  };
}

export function toWidgetInstances(workspaceId: WorkspaceId, layout: WorkspaceLayoutDto): readonly WidgetInstance[] {
  return (layout.placements ?? [])
    .slice()
    .sort((first, second) => (first.position ?? 0) - (second.position ?? 0))
    .flatMap((placement) => {
      const widgetDefinitionId = placement.widgetType;
      if (!widgetDefinitionId || !getWidgetDefinition(widgetDefinitionId)) {
        return [];
      }

      const definition = getWidgetDefinition(widgetDefinitionId)!;
      return [
        {
          id: `${workspaceId}-${placement.id ?? widgetDefinitionId}`,
          widgetDefinitionId,
          title: definition.title,
          settings: parseConfiguration(placement.configurationJson),
        },
      ];
    });
}

function parseConfiguration(configurationJson: string | undefined): WidgetInstance['settings'] {
  if (!configurationJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(configurationJson) as WidgetInstance['settings'];
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
