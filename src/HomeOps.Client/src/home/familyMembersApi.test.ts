import { afterEach, describe, expect, it, vi } from 'vitest';
import { FamilyMemberAgeGroup, FamilyMemberHairStyle, FamilyMemberKind, FamilyMemberPresentation } from '../api/homeOpsApiClient';
import { createFamilyMember, saveFamilyMember } from './familyMembersApi';
import type { FamilyMember } from './familyMembers';

const avatar = {
  ageGroup: FamilyMemberAgeGroup.Adult,
  presentation: FamilyMemberPresentation.Neutral,
  skinTone: '#f1c27d',
  hairColor: '#111827',
  hairStyle: FamilyMemberHairStyle.Short,
  glasses: false,
  shirtColor: '#60a5fa',
};

const avatarV2Config = {
  headVariant: 'round',
  hairStyle: 'shortMessy',
  hairColor: 'hairCocoa',
  clothingStyle: 'hoodie',
  clothingColor: 'shirtSky',
  accessory: 'star',
  accessoryColor: 'accessoryCoral',
} as const;

function familyMemberResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'morgan',
    name: 'Morgan',
    displayColor: '#c7d2fe',
    initials: 'M',
    memberKind: FamilyMemberKind.Adult,
    dateOfBirth: null,
    avatar,
    avatarV2Config,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('familyMembersApi avatar compatibility', () => {
  it('adds Avatar V2 defaults for created members while preserving legacy compatibility payloads when provided', async () => {
    const fetch = vi.fn(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      expect(body.avatar).toEqual(avatar);
      expect(body.avatarV2Config).toEqual(avatarV2Config);
      return new Response(JSON.stringify(familyMemberResponse()), { status: 201, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetch);

    await createFamilyMember({
      name: 'Morgan',
      memberKind: 'adult',
      dateOfBirth: null,
      displayColor: '#c7d2fe',
      initials: 'M',
      avatar: {
        ageGroup: 'adult',
        presentation: 'neutral',
        skinTone: '#f1c27d',
        hairColor: '#111827',
        hairStyle: 'short',
        glasses: false,
        shirtColor: '#60a5fa',
      },
    });

    expect(fetch).toHaveBeenCalled();
  });

  it('keeps constructing a legacy avatar payload for updates required by the current API contract', async () => {
    const member: FamilyMember = {
      id: 'morgan',
      name: 'Morgan',
      memberKind: 'adult',
      dateOfBirth: null,
      displayColor: '#c7d2fe',
      initials: 'M',
      avatar: {
        ageGroup: 'adult',
        presentation: 'neutral',
        skinTone: '#f1c27d',
        hairColor: '#111827',
        hairStyle: 'short',
        glasses: false,
        shirtColor: '#60a5fa',
      },
      avatarV2Config,
    };
    const fetch = vi.fn(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(options.body as string);
      expect(body.avatar).toEqual(avatar);
      expect(body.avatarV2Config).toEqual(avatarV2Config);
      return new Response(JSON.stringify(familyMemberResponse()), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetch);

    await saveFamilyMember(member);

    expect(fetch).toHaveBeenCalled();
  });
});
