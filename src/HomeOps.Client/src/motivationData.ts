import type { FamilyMember } from './home/familyMembers';

export interface MotivationFamilyGoal {
  title: string;
  targetCount: number;
  currentProgress: number;
  unitLabel: string;
  rewardLabel?: string;
}

export interface MotivationIndividualGoal {
  familyMemberId: string;
  title: string;
  targetCount: number;
  currentProgress: number;
  unitLabel: string;
}

export interface MotivationSnapshot {
  familyGoal: MotivationFamilyGoal;
  individualGoals: readonly MotivationIndividualGoal[];
}

export const motivationSnapshot: MotivationSnapshot = {
  familyGoal: {
    title: 'Fill the family helper path',
    targetCount: 20,
    currentProgress: 13,
    unitLabel: 'helpful actions',
    rewardLabel: 'Board game night together',
  },
  individualGoals: [
    { familyMemberId: 'alex', title: 'Finish morning routine', targetCount: 5, currentProgress: 3, unitLabel: 'checkmarks' },
    { familyMemberId: 'sam', title: 'Help with dinner', targetCount: 3, currentProgress: 2, unitLabel: 'stars' },
    { familyMemberId: 'riley', title: 'Tidy bedroom corner', targetCount: 4, currentProgress: 2, unitLabel: 'steps' },
    { familyMemberId: 'jordan', title: 'Notice one helpful thing', targetCount: 3, currentProgress: 1, unitLabel: 'stars' },
  ],
};

export function clampProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export function goalsForMembers(members: readonly FamilyMember[]) {
  const memberIds = new Set(members.map((member) => member.id));
  return motivationSnapshot.individualGoals.filter((goal) => memberIds.has(goal.familyMemberId));
}
