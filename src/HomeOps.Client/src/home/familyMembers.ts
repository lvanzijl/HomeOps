export type FamilyMemberAgeGroup = 'child' | 'adult';
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

export interface FamilyMember {
  id: string;
  name: string;
  displayColor: string;
  initials: string;
  avatar?: FamilyMemberAvatarConfig;
}

export const familyMembers: readonly FamilyMember[] = [
  { id: 'alex', name: 'Alex', displayColor: '#f8c8dc', initials: 'A', avatar: { ageGroup: 'adult', presentation: 'feminine', skinTone: '#c68642', hairColor: '#3b2416', hairStyle: 'long', glasses: false, shirtColor: '#f472b6' } },
  { id: 'sam', name: 'Sam', displayColor: '#c7d2fe', initials: 'S', avatar: { ageGroup: 'adult', presentation: 'masculine', skinTone: '#f1c27d', hairColor: '#4b5563', hairStyle: 'short', glasses: true, shirtColor: '#60a5fa' } },
  { id: 'riley', name: 'Riley', displayColor: '#bbf7d0', initials: 'R', avatar: { ageGroup: 'child', presentation: 'neutral', skinTone: '#8d5524', hairColor: '#111827', hairStyle: 'curly', glasses: false, shirtColor: '#34d399' } },
  { id: 'jordan', name: 'Jordan', displayColor: '#fde68a', initials: 'J', avatar: { ageGroup: 'child', presentation: 'neutral', skinTone: '#ffdbac', hairColor: '#92400e', hairStyle: 'top', glasses: true, shirtColor: '#fbbf24' } },
] as const;
