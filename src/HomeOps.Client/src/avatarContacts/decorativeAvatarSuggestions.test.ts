import { describe, expect, it } from 'vitest';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import type { FamilyMember } from '../home/familyMembers';
import type { KnownPerson } from '../knownPeople/knownPeople';
import { buildDecorativeAvatarSuggestionCandidates, knownPersonRelationshipAliases, rankDecorativeAvatarSuggestions } from './decorativeAvatarSuggestions';

const avatarSelection = createAvatarSelectionFixture();
const members: FamilyMember[] = [
  { id: 'riley', name: 'Riley Adams', displayColor: '#bbf7d0', initials: 'R', memberKind: 'child', dateOfBirth: null, avatarSelection },
  { id: 'frank', name: 'Frank', displayColor: '#c7d2fe', initials: 'F', memberKind: 'adult', dateOfBirth: null, avatarSelection },
];
const people: KnownPerson[] = [
  person('grandma', 'Grandma Joke', 'grandparent', { nickname: 'Oma Joke', scope: 'shared' }),
  person('teacher', 'Sophie de Vries', 'teacher', { customRelationshipLabel: 'Juf Sophie', scope: 'privateToMember', familyMemberId: 'riley' }),
  person('friend-private', 'Mila', 'friend', { scope: 'privateToMember', familyMemberId: 'riley' }),
  person('friend-shared', 'Mila Shared', 'friend', { scope: 'shared' }),
  person('frankfurter', 'Frankfurter Stand', 'other', { scope: 'shared' }),
];

function person(id: string, displayName: string, relationshipType: KnownPerson['relationshipType'], overrides: Partial<KnownPerson>): KnownPerson {
  return { id, displayName, relationshipType, scope: 'shared', initials: displayName[0], avatarSelection, ...overrides };
}

function rank(query: string, currentFamilyMemberId?: string | null) {
  return rankDecorativeAvatarSuggestions(query, buildDecorativeAvatarSuggestionCandidates(members, people), { currentFamilyMemberId });
}

describe('decorative avatar suggestions', () => {
  it('keeps relationship aliases centralized', () => {
    expect(knownPersonRelationshipAliases.grandparent).toContain('oma');
    expect(knownPersonRelationshipAliases.teacher).toEqual(expect.arrayContaining(['teacher', 'juf', 'meester']));
    expect(knownPersonRelationshipAliases.neighbour).toEqual(expect.arrayContaining(['buur', 'buurvrouw', 'buurman']));
  });

  it('ranks exact display names, first names, nicknames, and aliases', () => {
    expect(rank('Grandma Joke')[0].candidate.reference.referenceId).toBe('grandma');
    expect(rank('Sophie')[0].candidate.reference.referenceId).toBe('teacher');
    expect(rank('Oma Joke')[0].candidate.reference.referenceId).toBe('grandma');
    expect(rank('juf cadeau')[0].candidate.reference.referenceId).toBe('teacher');
    expect(rank('teacher gift', 'riley')[0].candidate.reference.referenceId).toBe('teacher');
  });

  it('ranks FamilyMember and KnownPerson matches deterministically', () => {
    expect(rank('Riley snack')[0].candidate.reference).toEqual({ referenceType: 'familyMember', referenceId: 'riley' });
    expect(rank('grandpa groceries')[0].candidate.reference).toEqual({ referenceType: 'knownPerson', referenceId: 'grandma' });
  });

  it('prefers current-member PrivateToMember people and falls back to Shared people', () => {
    expect(rank('Mila', 'riley')[0].candidate.reference.referenceId).toBe('friend-private');
    expect(rank('Mila Shared')[0].candidate.reference.referenceId).toBe('friend-shared');
  });

  it('supports minor typos and bounded prefix matches without obvious false positives', () => {
    expect(rank('Sohpie bloemen')[0].candidate.reference.referenceId).toBe('teacher');
    expect(rank('Rile lunch')[0].candidate.reference.referenceId).toBe('riley');
    expect(rank('Frank')[0].candidate.reference.referenceId).toBe('frank');
    expect(rank('Frankfurter')[0].candidate.reference.referenceId).toBe('frankfurter');
  });

  it('returns multiple valid matches but suppresses low-confidence suggestions', () => {
    expect(rank('Mila')).toHaveLength(2);
    expect(rank('bread milk eggs')).toHaveLength(0);
  });
});
