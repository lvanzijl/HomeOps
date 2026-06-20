import { CreateHelpfulMomentRequest, HomeOpsApiClient, type HelpfulMomentDto } from './api/homeOpsApiClient';

export const recognitionTags = ['Kindness', 'Initiative', 'Teamwork', 'Responsibility', 'Routine'] as const;
export type RecognitionTag = typeof recognitionTags[number];

export interface HelpfulMoment {
  id: string;
  householdId: string;
  familyMemberId: string;
  familyMemberName: string;
  familyMemberDisplayColor: string;
  familyMemberInitials: string;
  title: string;
  description?: string;
  recognitionTag: RecognitionTag;
  createdUtc: string;
}

export interface CreateHelpfulMomentInput {
  familyMemberId: string;
  title: string;
  description?: string;
  recognitionTag?: RecognitionTag;
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
    title: moment.title ?? '',
    description: moment.description,
    recognitionTag: (recognitionTags as readonly string[]).includes(moment.recognitionTag ?? '') ? moment.recognitionTag as RecognitionTag : 'Kindness',
    createdUtc: moment.createdUtc ? moment.createdUtc.toISOString() : '',
  };
}

export async function loadHelpfulMoments(familyMemberId?: string, limit = 12): Promise<HelpfulMoment[]> {
  return (await client.getHelpfulMoments(familyMemberId, limit)).map(helpfulMomentFromApi);
}

export async function createHelpfulMoment(input: CreateHelpfulMomentInput): Promise<HelpfulMoment> {
  return helpfulMomentFromApi(await client.createHelpfulMoment(CreateHelpfulMomentRequest.fromJS(input)));
}
