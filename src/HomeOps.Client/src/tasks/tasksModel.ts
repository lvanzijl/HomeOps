export type TaskOwnershipKind = 'Unassigned' | 'FamilyMember' | 'SharedHousehold';
export type TaskRecurrenceFrequency = 'None' | 'Daily' | 'Weekly' | 'Monthly';
export type NoDateTaskReviewState = 'Active' | 'NeedsReview' | 'Someday' | 'Completed' | 'Archived';

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
  noDateReviewState?: NoDateTaskReviewState;
  noDateLastReviewedUtc?: string | null;
  archivedUtc?: string | null;
}

export interface CreateTaskInput {
  title: string;
  dueDate?: string | null;
  ownershipKind?: TaskOwnershipKind;
  familyMemberId?: string | null;
  recurrenceFrequency?: TaskRecurrenceFrequency;
  noDateReviewState?: NoDateTaskReviewState;
  noDateLastReviewedUtc?: string | null;
  archivedUtc?: string | null;
}

export type TaskTimeGroupId = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'later' | 'completedRecently';

export interface TaskTimeGroup {
  id: TaskTimeGroupId;
  title: string;
  description: string;
  emptyMessage: string;
  emphasis: 'primary' | 'normal' | 'quiet';
  tasks: readonly HouseholdTask[];
}

export type TaskUrgencyGroupId = TaskTimeGroupId;
export type TaskUrgencyGroup = TaskTimeGroup;


export interface TaskTemplateItem {
  id: string;
  title: string;
  ownershipKind: TaskOwnershipKind;
  familyMemberId: string | null;
  recurrenceFrequency: TaskRecurrenceFrequency;
  dueOffsetDays: number | null;
  position: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdUtc: string;
  updatedUtc: string;
  items: readonly TaskTemplateItem[];
}

export interface TaskTemplateInput {
  name: string;
  description?: string | null;
  items: readonly {
    title: string;
    ownershipKind?: TaskOwnershipKind;
    familyMemberId?: string | null;
    recurrenceFrequency?: TaskRecurrenceFrequency;
    dueOffsetDays?: number | null;
  }[];
}
