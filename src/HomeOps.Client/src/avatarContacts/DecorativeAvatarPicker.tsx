import type { FamilyMember } from "../home/familyMembers";
import type { KnownPerson } from "../knownPeople/knownPeople";
import { type DecorativeAvatarIdentity } from "./DecorativeAvatar";
import {
  buildDecorativeAvatarSuggestionCandidates,
  rankDecorativeAvatarSuggestions,
} from "./decorativeAvatarSuggestions";

export type DecorativeAvatarReference =
  | { referenceType: "familyMember"; referenceId: string }
  | { referenceType: "knownPerson"; referenceId: string };

interface DecorativeAvatarPickerProps {
  familyMembers: readonly FamilyMember[];
  knownPeople: readonly KnownPerson[];
  label: string;
  value: DecorativeAvatarReference | null;
  suggestionText: string;
  onChange(value: DecorativeAvatarReference | null): void;
}

export function DecorativeAvatarPicker({
  familyMembers,
  knownPeople,
  label,
  onChange,
  suggestionText,
  value,
}: DecorativeAvatarPickerProps) {
  const selected = value ? `${value.referenceType}:${value.referenceId}` : "";
  const suggestions = rankDecorativeAvatarSuggestions(
    suggestionText,
    buildDecorativeAvatarSuggestionCandidates(familyMembers, knownPeople),
  );
  return (
    <label className="shopping-avatar-picker">
      <span className="visually-hidden">{label}</span>
      <select
        aria-label={label}
        onChange={(event) =>
          onChange(parseDecorativeAvatarPickerValue(event.target.value))
        }
        value={selected}
      >
        <option value="">Geen avatar</option>
        {suggestions.length > 0 ? (
          <optgroup label="Voorgesteld">
            {suggestions.map((suggestion) => (
              <option
                key={`suggested:${suggestion.candidate.reference.referenceType}:${suggestion.candidate.reference.referenceId}`}
                value={`${suggestion.candidate.reference.referenceType}:${suggestion.candidate.reference.referenceId}`}
              >
                {suggestion.candidate.displayName}
              </option>
            ))}
          </optgroup>
        ) : null}
        <optgroup label="Gezinsleden">
          {familyMembers.map((member) => (
            <option key={member.id} value={`familyMember:${member.id}`}>
              {member.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Gedeelde bekenden">
          {knownPeople
            .filter((person) => person.scope === "shared")
            .map((person) => (
              <option key={person.id} value={`knownPerson:${person.id}`}>
                {person.displayName}
              </option>
            ))}
        </optgroup>
        <optgroup label="Bekenden per gezinslid">
          {knownPeople
            .filter((person) => person.scope === "privateToMember")
            .map((person) => (
              <option key={person.id} value={`knownPerson:${person.id}`}>
                {person.displayName}
              </option>
            ))}
        </optgroup>
      </select>
    </label>
  );
}

export function parseDecorativeAvatarPickerValue(
  value: string,
): DecorativeAvatarReference | null {
  if (!value) return null;
  const [referenceType, referenceId] = value.split(":");
  if (
    (referenceType !== "familyMember" && referenceType !== "knownPerson") ||
    !referenceId
  )
    return null;
  return { referenceType, referenceId };
}

export function resolveDecorativeAvatar(
  reference: DecorativeAvatarReference | null | undefined,
  familyMembers: readonly FamilyMember[],
  knownPeople: readonly KnownPerson[],
): DecorativeAvatarIdentity | null {
  if (!reference) return null;
  if (reference.referenceType === "familyMember") {
    const member = familyMembers.find(
      (candidate) => candidate.id === reference.referenceId,
    );
    return member ? { kind: "familyMember", member } : null;
  }
  const person = knownPeople.find(
    (candidate) => candidate.id === reference.referenceId,
  );
  return person ? { kind: "knownPerson", person } : null;
}
