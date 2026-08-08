import { CreateHelpfulMomentRequest, HomeOpsApiClient, UpdateHelpfulMomentRequest, type HelpfulMomentDto } from './api/homeOpsApiClient';

export const recognitionTags = ['Kindness', 'Initiative', 'Teamwork', 'Responsibility', 'Routine'] as const;
export type RecognitionTag = typeof recognitionTags[number];
const recognitionTagLabels: Record<RecognitionTag, string> = {
  Kindness: 'Lief',
  Initiative: 'Initiatief',
  Teamwork: 'Samen',
  Responsibility: 'Verantwoordelijk',
  Routine: 'Routine',
};

export interface HelpfulMoment {
  id: string;
  householdId: string;
  familyMemberId: string;
  familyMemberName: string;
  familyMemberDisplayColor: string;
  familyMemberInitials: string;
  familyMemberIsRemoved?: boolean;
  title: string;
  description?: string;
  recognitionTag: RecognitionTag;
  createdUtc: string;
  updatedUtc?: string;
}

export interface CreateHelpfulMomentInput {
  familyMemberId: string;
  title: string;
  description?: string;
  recognitionTag?: RecognitionTag;
}

export interface UpdateHelpfulMomentInput extends CreateHelpfulMomentInput {
  expectedUpdatedUtc: string;
}

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';
const client = new HomeOpsApiClient(apiBaseUrl);

function helpfulMomentFromApi(moment: HelpfulMomentDto): HelpfulMoment {
  return {
    id: moment.id ?? '',
    householdId: moment.householdId ?? '',
    familyMemberId: moment.familyMemberId ?? '',
    familyMemberName: moment.familyMemberName ?? '',
    familyMemberDisplayColor: moment.familyMemberDisplayColor ?? '#f8c8dc',
    familyMemberInitials: moment.familyMemberInitials ?? '?',
    familyMemberIsRemoved: moment.familyMemberIsRemoved ?? false,
    title: moment.title ?? '',
    description: moment.description,
    recognitionTag: (recognitionTags as readonly string[]).includes(moment.recognitionTag ?? '') ? moment.recognitionTag as RecognitionTag : 'Kindness',
    createdUtc: moment.createdUtc ? moment.createdUtc.toISOString() : '',
    updatedUtc: moment.updatedUtc ? moment.updatedUtc.toISOString() : '',
  };
}

export function getRecognitionTagLabel(tag: string | undefined): string {
  return recognitionTagLabels[(tag ?? 'Kindness') as RecognitionTag] ?? recognitionTagLabels.Kindness;
}

export async function loadHelpfulMoments(familyMemberId?: string, limit = 12): Promise<HelpfulMoment[]> {
  return (await client.getHelpfulMoments(familyMemberId, limit)).map(helpfulMomentFromApi);
}

export async function createHelpfulMoment(input: CreateHelpfulMomentInput): Promise<HelpfulMoment> {
  return helpfulMomentFromApi(await client.createHelpfulMoment(CreateHelpfulMomentRequest.fromJS(input)));
}

export async function updateHelpfulMoment(id: string, input: UpdateHelpfulMomentInput): Promise<HelpfulMoment> {
  return helpfulMomentFromApi(await client.updateHelpfulMoment(id, UpdateHelpfulMomentRequest.fromJS(input)));
}

export async function deleteHelpfulMoment(id: string): Promise<void> {
  await client.deleteHelpfulMoment(id);
}
