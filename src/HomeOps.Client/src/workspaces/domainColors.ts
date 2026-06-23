import type { WorkspaceId } from './workspaceModel';

export type DomainColorId = WorkspaceId | 'family';

export const domainColorClassByWorkspace: Record<WorkspaceId, string> = {
  home: 'domain-home',
  agenda: 'domain-agenda',
  lists: 'domain-lists',
  tasks: 'domain-tasks',
  motivation: 'domain-motivation',
  house: 'domain-house',
  media: 'domain-media',
  gamification: 'domain-gamification',
  weeklyReset: 'domain-home',
  avatarEditor: 'domain-home',
  settings: 'domain-settings',
};

export function getDomainColorClass(workspaceId: WorkspaceId): string {
  return domainColorClassByWorkspace[workspaceId];
}
