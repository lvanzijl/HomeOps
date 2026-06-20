import { HomeOpsApiClient, UpsertMotivationFamilyGoalRequest, type MotivationFamilyGoalDto, type MotivationIndividualGoalDto, type MotivationSnapshotDto } from './api/homeOpsApiClient';
import type { FamilyMember } from './home/familyMembers';

export interface MotivationFamilyGoal {
  id: string;
  title: string;
  targetCount: number;
  currentProgress: number;
  unitLabel: string;
  rewardLabel?: string;
}

export interface MotivationIndividualGoal {
  id: string;
  familyMemberId: string;
  familyMemberName: string;
  title: string;
  targetCount: number;
  currentProgress: number;
  unitLabel: string;
  visualKind: string;
}

export interface MotivationSnapshot {
  familyGoal?: MotivationFamilyGoal;
  individualGoals: readonly MotivationIndividualGoal[];
}

export interface UpsertMotivationFamilyGoalInput {
  title: string;
  targetCount: number;
  unitLabel: string;
  rewardLabel?: string;
}

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';
const client = new HomeOpsApiClient(apiBaseUrl);

export function clampProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

function familyGoalFromApi(goal?: MotivationFamilyGoalDto): MotivationFamilyGoal | undefined {
  if (!goal) return undefined;
  return {
    id: goal.id ?? '',
    title: goal.title ?? '',
    targetCount: goal.targetCount ?? 0,
    currentProgress: goal.currentProgress ?? 0,
    unitLabel: goal.unitLabel ?? 'steps',
    rewardLabel: goal.rewardLabel,
  };
}

function individualGoalFromApi(goal: MotivationIndividualGoalDto): MotivationIndividualGoal {
  return {
    id: goal.id ?? '',
    familyMemberId: goal.familyMemberId ?? '',
    familyMemberName: goal.familyMemberName ?? '',
    title: goal.title ?? '',
    targetCount: goal.targetCount ?? 0,
    currentProgress: goal.currentProgress ?? 0,
    unitLabel: goal.unitLabel ?? 'steps',
    visualKind: goal.visualKind ?? 'stars',
  };
}

export function motivationSnapshotFromApi(snapshot: MotivationSnapshotDto): MotivationSnapshot {
  return {
    familyGoal: familyGoalFromApi(snapshot.familyGoal),
    individualGoals: (snapshot.individualGoals ?? []).map(individualGoalFromApi),
  };
}

export async function loadMotivationSnapshot(): Promise<MotivationSnapshot> {
  return motivationSnapshotFromApi(await client.getMotivationSnapshot());
}

export async function createFamilyGoal(input: UpsertMotivationFamilyGoalInput): Promise<MotivationFamilyGoal> {
  return familyGoalFromApi(await client.createMotivationFamilyGoal(UpsertMotivationFamilyGoalRequest.fromJS(input)))!;
}

export async function updateFamilyGoal(id: string, input: UpsertMotivationFamilyGoalInput): Promise<MotivationFamilyGoal> {
  return familyGoalFromApi(await client.updateMotivationFamilyGoal(id, UpsertMotivationFamilyGoalRequest.fromJS(input)))!;
}

export function goalsForMembers(snapshot: MotivationSnapshot, members: readonly FamilyMember[]) {
  const memberIds = new Set(members.map((member) => member.id));
  return snapshot.individualGoals.filter((goal) => memberIds.has(goal.familyMemberId));
}
