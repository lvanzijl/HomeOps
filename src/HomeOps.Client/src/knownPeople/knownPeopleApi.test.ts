import { afterEach, describe, expect, it, vi } from 'vitest';
import { KnownPersonRelationshipType, KnownPersonScope } from '../api/homeOpsApiClient';
import { createAvatarSelectionFixture } from '../avatarCatalog/avatarCatalogFixtures';
import { createKnownPerson, deleteKnownPerson, getKnownPerson, listKnownPeople, updateKnownPerson } from './knownPeopleApi';
import type { KnownPerson } from './knownPeople';

const avatarSelection = createAvatarSelectionFixture({ hairStyle: 'hair.style.long-soft' });

function knownPersonResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'known-1',
    displayName: 'Oma Joke',
    nickname: null,
    relationshipType: KnownPersonRelationshipType.Grandparent,
    customRelationshipLabel: 'Oma',
    scope: KnownPersonScope.Shared,
    familyMemberId: null,
    initials: 'OJ',
    avatarSelection,
    createdUtc: '2026-07-10T20:00:00Z',
    updatedUtc: '2026-07-10T20:05:00Z',
    ...overrides,
  };
}

const person: KnownPerson = {
  id: 'known-1',
  displayName: 'Oma Joke',
  nickname: null,
  relationshipType: 'grandparent',
  customRelationshipLabel: 'Oma',
  scope: 'shared',
  familyMemberId: null,
  initials: 'OJ',
  avatarSelection,
};

afterEach(() => vi.unstubAllGlobals());

describe('knownPeopleApi', () => {
  it('maps list responses and filters', async () => {
    const fetch = vi.fn(async (url: string) => {
      expect(url).toContain('/api/known-people?');
      expect(url).toContain('scope=1');
      expect(url).toContain('familyMemberId=member-1');
      return new Response(JSON.stringify([knownPersonResponse({ scope: KnownPersonScope.PrivateToMember, familyMemberId: 'member-1', relationshipType: KnownPersonRelationshipType.Teacher })]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetch);

    await expect(listKnownPeople({ scope: 'privateToMember', familyMemberId: 'member-1' })).resolves.toEqual([expect.objectContaining({
      relationshipType: 'teacher',
      scope: 'privateToMember',
      familyMemberId: 'member-1',
      avatarSelection: expect.objectContaining({ selections: expect.objectContaining({ hairStyle: 'hair.style.long-soft' }) }),
    })]);
  });

  it('maps get responses including optional fields', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(knownPersonResponse({ nickname: undefined, customRelationshipLabel: undefined })), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    await expect(getKnownPerson('known-1')).resolves.toEqual(expect.objectContaining({
      id: 'known-1',
      displayName: 'Oma Joke',
      nickname: null,
      customRelationshipLabel: null,
      relationshipType: 'grandparent',
      scope: 'shared',
      initials: 'OJ',
    }));
  });

  it('maps create requests and responses', async () => {
    const fetch = vi.fn(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      expect(body).toEqual(expect.objectContaining({
        displayName: 'Oma Joke',
        relationshipType: KnownPersonRelationshipType.Grandparent,
        scope: KnownPersonScope.Shared,
        initials: 'OJ',
        avatarSelection,
      }));
      expect(body.nickname).toBeUndefined();
      return new Response(JSON.stringify(knownPersonResponse()), { status: 201, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetch);

    await expect(createKnownPerson(person)).resolves.toEqual(expect.objectContaining({ id: 'known-1', relationshipType: 'grandparent' }));
  });

  it('maps update requests and enum values', async () => {
    const fetch = vi.fn(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      expect(body.relationshipType).toBe(KnownPersonRelationshipType.Classmate);
      expect(body.scope).toBe(KnownPersonScope.PrivateToMember);
      expect(body.familyMemberId).toBe('member-1');
      return new Response(JSON.stringify(knownPersonResponse({ relationshipType: KnownPersonRelationshipType.Classmate, scope: KnownPersonScope.PrivateToMember, familyMemberId: 'member-1' })), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetch);

    await expect(updateKnownPerson({ ...person, relationshipType: 'classmate', scope: 'privateToMember', familyMemberId: 'member-1' })).resolves.toEqual(expect.objectContaining({
      relationshipType: 'classmate',
      scope: 'privateToMember',
      familyMemberId: 'member-1',
    }));
  });

  it('calls delete', async () => {
    const fetch = vi.fn(async (_url: string, options: RequestInit) => {
      expect(options.method).toBe('DELETE');
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal('fetch', fetch);

    await deleteKnownPerson('known-1');
    expect(fetch).toHaveBeenCalled();
  });
});
