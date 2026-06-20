export type TaskOwnershipKind = 'Unassigned' | 'FamilyMember' | 'SharedHousehold';
export type TaskRecurrenceFrequency = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export interface HouseholdTask {
  id: string;
  title: string;
  dueDate: string | null;
  ownershipKind: TaskOwnershipKind;
  familyMemberId: string | null;
  isCompleted: boolean;
  completedUtc: string | null;
  createdUtc: string;
  updatedUtc: string;
  recurringTaskSeriesId?: string | null;
  recurrenceFrequency?: TaskRecurrenceFrequency;
}

export interface CreateTaskInput {
  title: string;
  dueDate?: string | null;
  ownershipKind?: TaskOwnershipKind;
  familyMemberId?: string | null;
  recurrenceFrequency?: TaskRecurrenceFrequency;
}

export type TaskUrgencyGroupId = 'overdue' | 'today' | 'upcoming' | 'noDueDate' | 'completedRecently';

export interface TaskUrgencyGroup {
  id: TaskUrgencyGroupId;
  title: string;
  tasks: readonly HouseholdTask[];
}
