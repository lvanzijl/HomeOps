import { AvatarSelectionDto, CreateKnownPersonRequest, HomeOpsApiClient, KnownPersonDto, KnownPersonRelationshipType as ApiKnownPersonRelationshipType, KnownPersonScope as ApiKnownPersonScope, UpdateKnownPersonRequest } from '../api/homeOpsApiClient';
import { normalizeAvatarSelection, type AvatarCatalogSelection } from '../avatarCatalog/avatarCatalog';
import { defaultAvatarSelection } from '../avatarCatalog/avatarCatalogAdapter';
import type { KnownPerson, KnownPersonInput, KnownPersonRelationshipType, KnownPersonScope } from './knownPeople';

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';
const client = new HomeOpsApiClient(apiBaseUrl);

const relationshipTypes: readonly KnownPersonRelationshipType[] = ['friend', 'familyFriend', 'grandparent', 'uncle', 'aunt', 'cousin', 'teacher', 'coach', 'babysitter', 'classmate', 'neighbour', 'other'];
const scopes: readonly KnownPersonScope[] = ['shared', 'privateToMember'];

function relationshipFromApi(value: ApiKnownPersonRelationshipType | undefined): KnownPersonRelationshipType {
  return relationshipTypes[value ?? ApiKnownPersonRelationshipType.Friend] ?? 'friend';
}

function relationshipToApi(value: KnownPersonRelationshipType): ApiKnownPersonRelationshipType {
  return relationshipTypes.indexOf(value) as ApiKnownPersonRelationshipType;
}

function scopeFromApi(value: ApiKnownPersonScope | undefined): KnownPersonScope {
  return scopes[value ?? ApiKnownPersonScope.Shared] ?? 'shared';
}

function scopeToApi(value: KnownPersonScope): ApiKnownPersonScope {
  return scopes.indexOf(value) as ApiKnownPersonScope;
}

function avatarSelectionToApi(selection: AvatarCatalogSelection): AvatarSelectionDto {
  return new AvatarSelectionDto(normalizeAvatarSelection(selection));
}

function fromApi(person: KnownPersonDto): KnownPerson {
  return {
    id: person.id!,
    displayName: person.displayName!,
    nickname: person.nickname ?? null,
    relationshipType: relationshipFromApi(person.relationshipType),
    customRelationshipLabel: person.customRelationshipLabel ?? null,
    scope: scopeFromApi(person.scope),
    familyMemberId: person.familyMemberId ?? null,
    initials: person.initials!,
    avatarSelection: normalizeAvatarSelection(person.avatarSelection ?? defaultAvatarSelection),
    createdUtc: person.createdUtc?.toISOString(),
    updatedUtc: person.updatedUtc?.toISOString(),
  };
}

function createRequest(person: KnownPersonInput): CreateKnownPersonRequest {
  return new CreateKnownPersonRequest({
    displayName: person.displayName,
    nickname: person.nickname ?? undefined,
    relationshipType: relationshipToApi(person.relationshipType),
    customRelationshipLabel: person.customRelationshipLabel ?? undefined,
    scope: scopeToApi(person.scope),
    familyMemberId: person.familyMemberId ?? undefined,
    initials: person.initials,
    avatarSelection: avatarSelectionToApi(person.avatarSelection),
  });
}

function updateRequest(person: KnownPersonInput): UpdateKnownPersonRequest {
  return new UpdateKnownPersonRequest(createRequest(person));
}

export async function listKnownPeople(filters: { scope?: KnownPersonScope; familyMemberId?: string } = {}): Promise<readonly KnownPerson[]> {
  return (await client.getKnownPeople(filters.scope ? scopeToApi(filters.scope) : undefined, filters.familyMemberId)).map(fromApi);
}

export async function getKnownPerson(id: string): Promise<KnownPerson> {
  return fromApi(await client.getKnownPerson(id));
}

export async function createKnownPerson(person: KnownPersonInput): Promise<KnownPerson> {
  return fromApi(await client.createKnownPerson(createRequest(person)));
}

export async function updateKnownPerson(person: KnownPerson): Promise<KnownPerson> {
  return fromApi(await client.updateKnownPerson(person.id, updateRequest(person)));
}

export async function deleteKnownPerson(id: string): Promise<void> {
  await client.deleteKnownPerson(id);
}
