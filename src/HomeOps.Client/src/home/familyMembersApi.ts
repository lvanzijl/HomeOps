import { CreateFamilyMemberRequest, FamilyMemberAgeGroup, FamilyMemberAvatarDto, FamilyMemberDto, FamilyMemberHairStyle, FamilyMemberKind, FamilyMemberPresentation, HomeOpsApiClient, UpdateFamilyMemberRequest } from '../api/homeOpsApiClient';
import { familyMembers as fallbackFamilyMembers, type FamilyMember, type FamilyMemberAvatarConfig } from './familyMembers';

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';
const client = new HomeOpsApiClient(apiBaseUrl);

const ageGroups = ['child', 'adult'] as const;
const memberKinds = ['child', 'adult'] as const;
const presentations = ['neutral', 'masculine', 'feminine'] as const;
const hairStyles = ['short', 'curly', 'bob', 'long', 'top'] as const;

function fromApi(member: FamilyMemberDto): FamilyMember {
  const avatar = member.avatar!;
  return {
    id: member.id!,
    name: member.name!,
    displayColor: member.displayColor!,
    initials: member.initials!,
    memberKind: memberKinds[member.memberKind ?? FamilyMemberKind.Child],
    dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString().slice(0, 10) : null,
    avatar: {
      ageGroup: ageGroups[avatar.ageGroup ?? FamilyMemberAgeGroup.Child],
      presentation: presentations[avatar.presentation ?? FamilyMemberPresentation.Neutral],
      skinTone: avatar.skinTone!,
      hairColor: avatar.hairColor!,
      hairStyle: hairStyles[avatar.hairStyle ?? FamilyMemberHairStyle.Short],
      glasses: avatar.glasses ?? false,
      shirtColor: avatar.shirtColor!,
    },
  };
}

function avatarToApi(avatar: FamilyMemberAvatarConfig): FamilyMemberAvatarDto {
  return new FamilyMemberAvatarDto({
    ageGroup: ageGroups.indexOf(avatar.ageGroup) as FamilyMemberAgeGroup,
    presentation: presentations.indexOf(avatar.presentation) as FamilyMemberPresentation,
    skinTone: avatar.skinTone,
    hairColor: avatar.hairColor,
    hairStyle: hairStyles.indexOf(avatar.hairStyle) as FamilyMemberHairStyle,
    glasses: avatar.glasses,
    shirtColor: avatar.shirtColor,
  });
}

function toApi(member: FamilyMember): UpdateFamilyMemberRequest {
  const avatar = member.avatar ?? fallbackFamilyMembers.find((fallback) => fallback.id === member.id)?.avatar ?? fallbackFamilyMembers[0].avatar!;
  return new UpdateFamilyMemberRequest({
    name: member.name,
    displayColor: member.displayColor,
    initials: member.initials,
    memberKind: memberKinds.indexOf(member.memberKind) as FamilyMemberKind,
    dateOfBirth: member.dateOfBirth ? new Date(`${member.dateOfBirth}T00:00:00`) : undefined,
    avatar: avatarToApi(avatar),
  });
}

export async function loadFamilyMembers(): Promise<readonly FamilyMember[]> {
  return (await client.getFamilyMembers()).map(fromApi);
}

export async function saveFamilyMember(member: FamilyMember): Promise<FamilyMember> {
  return fromApi(await client.updateFamilyMember(member.id, toApi(member)));
}

export async function createFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> {
  return fromApi(await client.createFamilyMember(new CreateFamilyMemberRequest({
    name: member.name,
    memberKind: memberKinds.indexOf(member.memberKind) as FamilyMemberKind,
    dateOfBirth: member.dateOfBirth ? new Date(`${member.dateOfBirth}T00:00:00`) : undefined,
    displayColor: member.displayColor,
    initials: member.initials,
    avatar: member.avatar ? avatarToApi(member.avatar) : undefined,
  })));
}

export async function removeFamilyMember(memberId: string): Promise<void> {
  await client.deleteFamilyMember(memberId);
}
