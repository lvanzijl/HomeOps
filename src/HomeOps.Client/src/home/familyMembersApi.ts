import { FamilyMemberAgeGroup, FamilyMemberAvatarDto, FamilyMemberDto, FamilyMemberHairStyle, FamilyMemberPresentation, HomeOpsApiClient, UpdateFamilyMemberRequest } from '../api/homeOpsApiClient';
import { familyMembers as fallbackFamilyMembers, type FamilyMember, type FamilyMemberAvatarConfig } from './familyMembers';

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';
const client = new HomeOpsApiClient(apiBaseUrl);

const ageGroups = ['child', 'adult'] as const;
const presentations = ['neutral', 'masculine', 'feminine'] as const;
const hairStyles = ['short', 'curly', 'bob', 'long', 'top'] as const;

function fromApi(member: FamilyMemberDto): FamilyMember {
  const avatar = member.avatar!;
  return {
    id: member.id!,
    name: member.name!,
    displayColor: member.displayColor!,
    initials: member.initials!,
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

function toApi(member: FamilyMember): UpdateFamilyMemberRequest {
  const avatar = member.avatar ?? fallbackFamilyMembers.find((fallback) => fallback.id === member.id)?.avatar ?? fallbackFamilyMembers[0].avatar!;
  return new UpdateFamilyMemberRequest({
    name: member.name,
    displayColor: member.displayColor,
    initials: member.initials,
    avatar: new FamilyMemberAvatarDto({
      ageGroup: ageGroups.indexOf(avatar.ageGroup) as FamilyMemberAgeGroup,
      presentation: presentations.indexOf(avatar.presentation) as FamilyMemberPresentation,
      skinTone: avatar.skinTone,
      hairColor: avatar.hairColor,
      hairStyle: hairStyles.indexOf(avatar.hairStyle) as FamilyMemberHairStyle,
      glasses: avatar.glasses,
      shirtColor: avatar.shirtColor,
    }),
  });
}

export async function loadFamilyMembers(): Promise<readonly FamilyMember[]> {
  return (await client.getFamilyMembers()).map(fromApi);
}

export async function saveFamilyMember(member: FamilyMember): Promise<FamilyMember> {
  return fromApi(await client.updateFamilyMember(member.id, toApi(member)));
}
