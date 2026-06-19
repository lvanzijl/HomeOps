export interface FamilyMember {
  id: string;
  name: string;
  displayColor: string;
  initials: string;
}

export const familyMembers: readonly FamilyMember[] = [
  { id: 'alex', name: 'Alex', displayColor: '#f8c8dc', initials: 'A' },
  { id: 'sam', name: 'Sam', displayColor: '#c7d2fe', initials: 'S' },
  { id: 'riley', name: 'Riley', displayColor: '#bbf7d0', initials: 'R' },
  { id: 'jordan', name: 'Jordan', displayColor: '#fde68a', initials: 'J' },
] as const;
