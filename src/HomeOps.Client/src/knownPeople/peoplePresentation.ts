import type { KnownPerson, KnownPersonRelationshipType } from './knownPeople';

export const relationshipLabels: Record<KnownPersonRelationshipType, string> = {
  friend: 'Vriend(in)',
  familyFriend: 'Gezinsvriend(in)',
  grandparent: 'Opa/oma',
  uncle: 'Oom',
  aunt: 'Tante',
  cousin: 'Neef/nicht',
  teacher: 'Leerkracht',
  coach: 'Coach',
  babysitter: 'Oppas',
  classmate: 'Klasgenoot',
  neighbour: 'Buur',
  other: 'Anders',
};

export const relationshipOptions = Object.keys(relationshipLabels) as KnownPersonRelationshipType[];

export function relationshipDisplayText(person: Pick<KnownPerson, 'relationshipType' | 'customRelationshipLabel'>): string {
  return person.relationshipType === 'other' && person.customRelationshipLabel?.trim()
    ? person.customRelationshipLabel.trim()
    : relationshipLabels[person.relationshipType];
}

export function relationshipGroup(type: KnownPersonRelationshipType): string {
  switch (type) {
    case 'grandparent':
    case 'uncle':
    case 'aunt':
    case 'cousin':
    case 'familyFriend':
      return 'Family';
    case 'teacher':
      return 'Teachers';
    case 'classmate':
      return 'School';
    case 'coach':
    case 'babysitter':
      return 'Helpers';
    case 'friend':
      return 'Friends';
    case 'neighbour':
      return 'Neighbours';
    default:
      return 'Other';
  }
}

export function filterKnownPeople(people: readonly KnownPerson[], query: string): readonly KnownPerson[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return people;

  return people.filter((person) => [
    person.displayName,
    person.nickname ?? '',
    person.customRelationshipLabel ?? '',
    relationshipDisplayText(person),
  ].some((value) => value.toLocaleLowerCase().includes(normalized)));
}
