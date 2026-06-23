import { avatarV2DefaultConfiguration } from '../avatarV2/avatarConfig';

export type FamilyMemberAgeGroup = 'child' | 'adult';
export type FamilyMemberKind = 'child' | 'adult';
export type FamilyMemberPresentation = 'neutral' | 'masculine' | 'feminine';
export type FamilyMemberHairStyle = 'short' | 'curly' | 'bob' | 'long' | 'top';

export interface FamilyMemberAvatarConfig {
  ageGroup: FamilyMemberAgeGroup;
  presentation: FamilyMemberPresentation;
  skinTone: string;
  hairColor: string;
  hairStyle: FamilyMemberHairStyle;
  glasses: boolean;
  shirtColor: string;
}

export interface AvatarV2Config {
  headVariant: import('../avatarV2/avatarV2').AvatarHeadVariant;
  hairStyle: import('../avatarV2/avatarV2').HairStyle;
  hairColor: import('../avatarV2/avatarV2').PaletteToken;
  clothingStyle: import('../avatarV2/avatarV2').ShirtStyle;
  clothingColor: import('../avatarV2/avatarV2').PaletteToken;
  accessory: import('../avatarV2/avatarV2').AccessoryStyle;
  accessoryColor: import('../avatarV2/avatarV2').PaletteToken;
}

export interface FamilyMember {
  id: string;
  name: string;
  displayColor: string;
  initials: string;
  memberKind: FamilyMemberKind;
  dateOfBirth?: string | null;
  avatar?: FamilyMemberAvatarConfig;
  avatarV2Config?: AvatarV2Config;
}

export const familyMembers: readonly FamilyMember[] = [
  { id: 'alex', name: 'Alex', displayColor: '#f8c8dc', initials: 'A', memberKind: 'adult', dateOfBirth: null, avatar: { ageGroup: 'adult', presentation: 'feminine', skinTone: '#c68642', hairColor: '#3b2416', hairStyle: 'long', glasses: false, shirtColor: '#f472b6' }, avatarV2Config: avatarV2DefaultConfiguration },
  { id: 'sam', name: 'Sam', displayColor: '#c7d2fe', initials: 'S', memberKind: 'adult', dateOfBirth: null, avatar: { ageGroup: 'adult', presentation: 'masculine', skinTone: '#f1c27d', hairColor: '#4b5563', hairStyle: 'short', glasses: true, shirtColor: '#60a5fa' }, avatarV2Config: { ...avatarV2DefaultConfiguration, hairStyle: 'softCrop', clothingColor: 'shirtSky' } },
  { id: 'riley', name: 'Riley', displayColor: '#bbf7d0', initials: 'R', memberKind: 'child', dateOfBirth: '2018-04-12', avatar: { ageGroup: 'child', presentation: 'neutral', skinTone: '#8d5524', hairColor: '#111827', hairStyle: 'curly', glasses: false, shirtColor: '#34d399' }, avatarV2Config: { ...avatarV2DefaultConfiguration, headVariant: 'oval', hairStyle: 'curlyPlayful', hairColor: 'hairPlum', clothingColor: 'shirtMint' } },
  { id: 'jordan', name: 'Jordan', displayColor: '#fde68a', initials: 'J', memberKind: 'child', dateOfBirth: '2020-09-03', avatar: { ageGroup: 'child', presentation: 'neutral', skinTone: '#ffdbac', hairColor: '#92400e', hairStyle: 'top', glasses: true, shirtColor: '#fbbf24' }, avatarV2Config: { ...avatarV2DefaultConfiguration, headVariant: 'wide', hairStyle: 'curlyCloud', hairColor: 'hairChestnut', clothingColor: 'shirtSun', accessory: 'star' } },
] as const;
