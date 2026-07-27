import { AvatarSelectionDto, CreateFamilyMemberRequest, FamilyMemberDto, FamilyMemberKind, HomeOpsApiClient, UpdateFamilyMemberRequest } from '../api/homeOpsApiClient';
import { avatarSelectionToAvatarV2Configuration, avatarV2ConfigurationToAvatarSelection, defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import { normalizeAvatarSelection, type AvatarCatalogSelection } from '../avatarCatalog/avatarCatalog';
import { type FamilyMember } from './familyMembers';
import { avatarV2DefaultConfiguration, normalizeAvatarV2Configuration } from '../avatarV2/avatarConfig';

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';
const client = new HomeOpsApiClient(apiBaseUrl);

const memberKinds = ['child', 'adult'] as const;
export function familyMemberFromApi(member: FamilyMemberDto): FamilyMember {
  const avatarSelection = normalizeAvatarSelection(member.avatarSelection ?? avatarV2ConfigurationToAvatarSelection(member.avatarV2Config ?? avatarV2DefaultConfiguration));
  return {
    id: member.id!,
    name: member.name!,
    displayColor: member.displayColor!,
    initials: member.initials!,
    memberKind: memberKinds[member.memberKind ?? FamilyMemberKind.Child],
    dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().slice(0, 10) : null,
    avatarSelection,
    avatarV2Config: normalizeAvatarV2Configuration(member.avatarV2Config ?? avatarSelectionToAvatarV2Configuration(avatarSelection)),
  };
}

function avatarSelectionToApi(selection: AvatarCatalogSelection): AvatarSelectionDto {
  return new AvatarSelectionDto(selection);
}

function toApi(member: FamilyMember): UpdateFamilyMemberRequest {
  const avatarSelection = normalizeAvatarSelection(member.avatarSelection ?? avatarV2ConfigurationToAvatarSelection(member.avatarV2Config ?? avatarV2DefaultConfiguration));
  return new UpdateFamilyMemberRequest({
    name: member.name,
    displayColor: member.displayColor,
    initials: member.initials,
    memberKind: memberKinds.indexOf(member.memberKind) as FamilyMemberKind,
    dateOfBirth: member.dateOfBirth ? new Date(`${member.dateOfBirth}T00:00:00`) : undefined,
    avatarSelection: avatarSelectionToApi(avatarSelection),
  });
}

export async function loadFamilyMembers(): Promise<readonly FamilyMember[]> {
  return (await client.getFamilyMembers()).map(familyMemberFromApi);
}

export async function saveFamilyMember(member: FamilyMember): Promise<FamilyMember> {
  return familyMemberFromApi(await client.updateFamilyMember(member.id, toApi(member)));
}

export async function createFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
  const avatarSelection = normalizeAvatarSelection(member.avatarSelection ?? avatarV2ConfigurationToAvatarSelection(member.avatarV2Config ?? avatarV2DefaultConfiguration));
  return familyMemberFromApi(await client.createFamilyMember(new CreateFamilyMemberRequest({
    name: member.name,
    memberKind: memberKinds.indexOf(member.memberKind) as FamilyMemberKind,
    dateOfBirth: member.dateOfBirth ? new Date(`${member.dateOfBirth}T00:00:00`) : undefined,
    displayColor: member.displayColor,
    initials: member.initials,
    avatarSelection: avatarSelectionToApi(avatarSelection),
  })));
}

export async function removeFamilyMember(memberId: string): Promise<void> {
  await client.deleteFamilyMember(memberId);
}
