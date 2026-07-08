import { avatarV2ConfigurationToAvatarSelection, defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import { avatarV2DefaultConfiguration } from '../avatarV2/avatarConfig';

export type FamilyMemberKind = 'child' | 'adult';

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
  avatarV2Config?: AvatarV2Config;
  avatarSelection?: import('../avatarCatalog/avatarCatalog').AvatarCatalogSelection;
}

export const familyMembers: readonly FamilyMember[] = [
  { id: 'alex', name: 'Alex', displayColor: '#f8c8dc', initials: 'A', memberKind: 'adult', dateOfBirth: null, avatarV2Config: avatarV2DefaultConfiguration, avatarSelection: defaultAvatarSelection },
  { id: 'sam', name: 'Sam', displayColor: '#c7d2fe', initials: 'S', memberKind: 'adult', dateOfBirth: null, avatarV2Config: { ...avatarV2DefaultConfiguration, hairStyle: 'softCrop', clothingColor: 'shirtSky' }, avatarSelection: avatarV2ConfigurationToAvatarSelection({ ...avatarV2DefaultConfiguration, hairStyle: 'softCrop', clothingColor: 'shirtSky' }) },
  { id: 'riley', name: 'Riley', displayColor: '#bbf7d0', initials: 'R', memberKind: 'child', dateOfBirth: '2018-04-12', avatarV2Config: { ...avatarV2DefaultConfiguration, headVariant: 'oval', hairStyle: 'curlyPlayful', hairColor: 'hairPlum', clothingColor: 'shirtMint' }, avatarSelection: avatarV2ConfigurationToAvatarSelection({ ...avatarV2DefaultConfiguration, headVariant: 'oval', hairStyle: 'curlyPlayful', hairColor: 'hairPlum', clothingColor: 'shirtMint' }) },
  { id: 'jordan', name: 'Jordan', displayColor: '#fde68a', initials: 'J', memberKind: 'child', dateOfBirth: '2020-09-03', avatarV2Config: { ...avatarV2DefaultConfiguration, headVariant: 'wide', hairStyle: 'curlyCloud', hairColor: 'hairChestnut', clothingColor: 'shirtSun', accessory: 'star' }, avatarSelection: avatarV2ConfigurationToAvatarSelection({ ...avatarV2DefaultConfiguration, headVariant: 'wide', hairStyle: 'curlyCloud', hairColor: 'hairChestnut', clothingColor: 'shirtSun', accessory: 'star' }) },
] as const;
