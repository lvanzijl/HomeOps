import type { FamilyMember } from '../home/familyMembers';
import type { KnownPerson, KnownPersonRelationshipType } from '../knownPeople/knownPeople';

export const knownPersonRelationshipAliases: Readonly<Record<KnownPersonRelationshipType, readonly string[]>> = {
  friend: ['friend', 'vriend', 'vriendin'],
  familyFriend: ['family friend', 'familievriend'],
  grandparent: ['grandma', 'grandpa', 'oma', 'opa'],
  uncle: ['uncle', 'oom'],
  aunt: ['aunt', 'tante'],
  cousin: ['cousin', 'neef', 'nicht'],
  teacher: ['teacher', 'juf', 'meester'],
  coach: ['coach', 'trainer'],
  babysitter: ['babysitter', 'oppas'],
  classmate: ['classmate', 'klasgenoot'],
  neighbour: ['neighbor', 'neighbour', 'buur', 'buurvrouw', 'buurman'],
  other: [],
};

export type DecorativeAvatarSuggestionReference =
  | { referenceType: 'familyMember'; referenceId: string }
  | { referenceType: 'knownPerson'; referenceId: string };

export interface DecorativeAvatarSuggestionCandidate {
  reference: DecorativeAvatarSuggestionReference;
  displayName: string;
  identityKind: 'familyMember' | 'knownPerson';
  scope: 'familyMember' | 'shared' | 'privateToMember';
  familyMemberId?: string | null;
  searchFields: {
    displayName: string;
    nickname?: string | null;
    relationshipType?: KnownPersonRelationshipType;
    customRelationshipLabel?: string | null;
  };
}

export interface DecorativeAvatarSuggestionScore {
  candidate: DecorativeAvatarSuggestionCandidate;
  score: number;
  reasons: readonly string[];
}

interface RankOptions {
  currentFamilyMemberId?: string | null;
  minimumScore?: number;
  limit?: number;
}

const defaultMinimumScore = 54;

export function buildDecorativeAvatarSuggestionCandidates(familyMembers: readonly FamilyMember[], knownPeople: readonly KnownPerson[]): DecorativeAvatarSuggestionCandidate[] {
  return [
    ...familyMembers.map((member) => ({
      reference: { referenceType: 'familyMember' as const, referenceId: member.id },
      displayName: member.name,
      identityKind: 'familyMember' as const,
      scope: 'familyMember' as const,
      familyMemberId: member.id,
      searchFields: { displayName: member.name },
    })),
    ...knownPeople.map((person) => ({
      reference: { referenceType: 'knownPerson' as const, referenceId: person.id },
      displayName: person.displayName,
      identityKind: 'knownPerson' as const,
      scope: person.scope,
      familyMemberId: person.familyMemberId,
      searchFields: {
        displayName: person.displayName,
        nickname: person.nickname,
        relationshipType: person.relationshipType,
        customRelationshipLabel: person.customRelationshipLabel,
      },
    })),
  ];
}

export function rankDecorativeAvatarSuggestions(query: string, candidates: readonly DecorativeAvatarSuggestionCandidate[], options: RankOptions = {}): DecorativeAvatarSuggestionScore[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const minimumScore = options.minimumScore ?? defaultMinimumScore;

  return candidates
    .map((candidate, index) => ({ ...scoreCandidate(tokens, candidate, options.currentFamilyMemberId), index }))
    .filter((result) => result.score >= minimumScore)
    .sort((a, b) => b.score - a.score || scopeRank(b.candidate, options.currentFamilyMemberId) - scopeRank(a.candidate, options.currentFamilyMemberId) || a.candidate.displayName.localeCompare(b.candidate.displayName) || a.index - b.index)
    .slice(0, options.limit ?? 5)
    .map(({ index: _index, ...result }) => result);
}

function scoreCandidate(queryTokens: readonly string[], candidate: DecorativeAvatarSuggestionCandidate, currentFamilyMemberId?: string | null): DecorativeAvatarSuggestionScore {
  const reasons: string[] = [];
  let score = 0;
  const nameTokens = tokenize(candidate.searchFields.displayName);
  const firstName = nameTokens[0];
  const normalizedName = normalize(candidate.searchFields.displayName);
  const normalizedQuery = normalize(queryTokens.join(' '));

  if (normalizedQuery && normalizedQuery === normalizedName) add(100, 'exact display-name match');
  if (firstName && queryTokens.some((token) => token === firstName)) add(82, 'first-name match');
  if (candidate.searchFields.nickname && queryTokens.some((token) => tokenMatch(token, tokenize(candidate.searchFields.nickname!)))) add(78, 'nickname match');

  const relationshipAliases = candidate.searchFields.relationshipType ? knownPersonRelationshipAliases[candidate.searchFields.relationshipType] : [];
  if (relationshipAliases.some((alias) => queryTokens.some((token) => tokenMatch(token, tokenize(alias))))) add(90, 'relationship alias match');
  if (candidate.searchFields.customRelationshipLabel && queryTokens.some((token) => tokenMatch(token, tokenize(candidate.searchFields.customRelationshipLabel!)))) add(68, 'custom relationship label match');

  if (queryTokens.some((queryToken) => nameTokens.some((nameToken) => fuzzyTokenMatch(queryToken, nameToken)))) add(58, 'lightweight fuzzy name match');
  if (candidate.identityKind === 'familyMember') add(8, 'family member identity');
  if (candidate.scope === 'privateToMember' && currentFamilyMemberId && candidate.familyMemberId === currentFamilyMemberId) add(12, 'current family member private scope');
  if (candidate.scope === 'shared') add(currentFamilyMemberId ? 4 : 10, 'shared scope fallback');
  if (candidate.scope === 'privateToMember' && !currentFamilyMemberId) add(-30, 'private scope without current member context');

  return { candidate, score, reasons };

  function add(points: number, reason: string) {
    score += points;
    reasons.push(reason);
  }
}

function scopeRank(candidate: DecorativeAvatarSuggestionCandidate, currentFamilyMemberId?: string | null): number {
  if (candidate.scope === 'privateToMember' && currentFamilyMemberId && candidate.familyMemberId === currentFamilyMemberId) return 3;
  if (candidate.scope === 'familyMember') return 2;
  if (candidate.scope === 'shared') return 1;
  return 0;
}

function tokenMatch(queryToken: string, candidateTokens: readonly string[]): boolean {
  return candidateTokens.some((candidateToken) => queryToken === candidateToken || fuzzyTokenMatch(queryToken, candidateToken));
}

function fuzzyTokenMatch(queryToken: string, candidateToken: string): boolean {
  if (queryToken.length < 3 || candidateToken.length < 3) return false;
  if (candidateToken.startsWith(queryToken) && candidateToken.length - queryToken.length <= 3) return true;
  if (queryToken.startsWith(candidateToken) && queryToken.length - candidateToken.length <= 2) return true;
  if (Math.abs(queryToken.length - candidateToken.length) > 1 || queryToken.length < 5 || candidateToken.length < 5) return false;
  return damerauLevenshteinAtMost(queryToken, candidateToken, 1);
}

function tokenize(value: string): string[] {
  return normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
}

function normalize(value: string): string {
  return value.toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function damerauLevenshteinAtMost(a: string, b: string, maxDistance: number): boolean {
  const distances = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) distances[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) distances[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    let rowMin = Number.MAX_SAFE_INTEGER;
    for (let j = 1; j <= b.length; j += 1) {
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distances[i][j] = Math.min(distances[i][j], distances[i - 2][j - 2] + 1);
      }
      rowMin = Math.min(rowMin, distances[i][j]);
    }
    if (rowMin > maxDistance) return false;
  }
  return distances[a.length][b.length] <= maxDistance;
}
