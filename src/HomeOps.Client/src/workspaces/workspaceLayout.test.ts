import { describe, expect, it, vi } from 'vitest';
import { WorkspaceLayoutDto, WidgetPlacementDto } from '../api/homeOpsApiClient';
import { loadWorkspaceLayout, toWidgetInstances } from './workspaceLayout';

describe('workspace layout loading', () => {
  it('maps persisted placements to widget instances through the widget catalog', () => {
    const instances = toWidgetInstances('home', new WorkspaceLayoutDto({
      id: 'layout-id',
      workspaceKey: 'home',
      placements: [
        new WidgetPlacementDto({ id: 'shopping-placement', widgetType: 'shopping-list-mvp', position: 1, size: 'medium', configurationJson: '{}' }),
        new WidgetPlacementDto({ id: 'agenda-placement', widgetType: 'agenda-mvp', position: 0, size: 'large', configurationJson: '{"defaultView":"week"}' }),
      ],
    }));

    expect(instances.map((instance) => instance.widgetDefinitionId)).toEqual(['agenda-mvp', 'shopping-list-mvp']);
    expect(instances[0].settings).toEqual({ defaultView: 'week' });
  });

  it('filters placements that are not in the application-owned widget catalog', () => {
    const instances = toWidgetInstances('home', new WorkspaceLayoutDto({
      id: 'layout-id',
      workspaceKey: 'home',
      placements: [new WidgetPlacementDto({ id: 'unknown', widgetType: 'unknown-widget', position: 0, size: 'medium', configurationJson: '{}' })],
    }));

    expect(instances).toEqual([]);
  });

  it('falls back to the default layout when the API request fails', async () => {
    const client = { getWorkspaceLayout: vi.fn().mockRejectedValue(new Error('not found')) };

    const layout = await loadWorkspaceLayout('home', client as never);

    expect(layout.source).toBe('default');
    expect(layout.widgetInstances.map((instance) => instance.widgetDefinitionId)).toEqual(['agenda-mvp', 'shopping-list-mvp', 'welcome-text']);
  });
});
