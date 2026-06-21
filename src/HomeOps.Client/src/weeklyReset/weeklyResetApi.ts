import type { HouseholdTask } from '../tasks/tasksModel';
import type { MotivationFamilyGoal, MotivationIndividualGoal, MotivationCelebrationMemory } from '../motivationData';

export interface ShoppingReviewCandidate { id: string; name: string; reason: string; updatedUtc: string; itemCount: number }
export interface HelpfulMomentRecap { id: string; familyMemberName: string; title: string; description?: string; recognitionTag: string; createdUtc: string }
export interface WeeklyContributionRecap { completedTaskCount: number; helpfulMomentCount: number; familyGoal?: MotivationFamilyGoal; individualGoals: MotivationIndividualGoal[]; helpfulMoments: HelpfulMomentRecap[]; celebrationMemories: MotivationCelebrationMemory[] }
export interface WeeklyReset { reviewCandidates: HouseholdTask[]; familyGoal?: MotivationFamilyGoal; individualGoals: MotivationIndividualGoal[]; shoppingReviewCandidates: ShoppingReviewCandidate[]; contributionRecap: WeeklyContributionRecap }

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';

export async function loadWeeklyReset(): Promise<WeeklyReset> {
  const response = await fetch(`${apiBaseUrl}/api/weekly-reset`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Weekly reset could not be loaded.');
  return response.json() as Promise<WeeklyReset>;
}

export async function archiveFamilyGoalForReset(goalId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/weekly-reset/family-goal/${goalId}/archive`, { method: 'POST', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Family goal could not be archived.');
}
