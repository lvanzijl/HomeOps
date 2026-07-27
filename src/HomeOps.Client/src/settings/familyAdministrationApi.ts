import type { FamilyMember } from "../home/familyMembers";
import {
  ApiException,
  FamilyMemberDependencyDto,
  HomeOpsApiClient,
  RestoreFamilyMemberResultDto,
} from "../api/homeOpsApiClient";
import {
  createFamilyMember,
  familyMemberFromApi,
  removeFamilyMember,
  saveFamilyMember,
} from "../home/familyMembersApi";

const baseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? "";
const client = new HomeOpsApiClient(baseUrl);

export interface FamilyDependencies { tasks: number; rooms: number; goals: number; privateKnownPeople: number; }
export interface RemovedFamilyMember { member: FamilyMember; deletedUtc: string | null; dependencies: FamilyDependencies; }

function dependenciesFromApi(dependencies?: FamilyMemberDependencyDto): FamilyDependencies {
  return {
    tasks: dependencies?.tasks ?? 0,
    rooms: dependencies?.rooms ?? 0,
    goals: dependencies?.goals ?? 0,
    privateKnownPeople: dependencies?.privateKnownPeople ?? 0,
  };
}

export const familyAdministrationApi = {
  create: createFamilyMember,
  update: saveFamilyMember,
  remove: removeFamilyMember,
  async dependencies(id: string): Promise<FamilyDependencies> {
    return dependenciesFromApi(await client.getFamilyMemberDependencies(id));
  },
  async removed(): Promise<RemovedFamilyMember[]> {
    const removed = await client.getRemovedFamilyMembers();
    return removed.flatMap((entry) => entry.member ? [{
      member: familyMemberFromApi(entry.member),
      deletedUtc: entry.deletedUtc?.toISOString() ?? null,
      dependencies: dependenciesFromApi(entry.dependencies),
    }] : []);
  },
  async restore(id: string): Promise<FamilyMember> {
    let result: RestoreFamilyMemberResultDto;
    try {
      result = await client.restoreFamilyMember(id);
    } catch (error) {
      if (!(error instanceof ApiException) || error.status !== 409) throw error;
      result = RestoreFamilyMemberResultDto.fromJS(JSON.parse(error.response));
    }
    if (!result.member) {
      const conflicts = result.conflicts ?? [];
      throw Object.assign(
        new Error(conflicts.map((conflict) => conflict.message).filter(Boolean).join(" ") || "Gezinslid kon niet worden hersteld."),
        { conflicts },
      );
    }
    return familyMemberFromApi(result.member);
  },
};
