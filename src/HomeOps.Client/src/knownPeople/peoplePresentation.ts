import type { KnownPerson, KnownPersonRelationshipType } from "./knownPeople";

export const relationshipLabels: Record<KnownPersonRelationshipType, string> = {
  friend: "Vriend(in)",
  familyFriend: "Gezinsvriend(in)",
  grandparent: "Opa/oma",
  uncle: "Oom",
  aunt: "Tante",
  cousin: "Neef/nicht",
  teacher: "Leerkracht",
  coach: "Coach",
  babysitter: "Oppas",
  classmate: "Klasgenoot",
  neighbour: "Buur",
  other: "Anders",
};

export const relationshipOptions = Object.keys(
  relationshipLabels,
) as KnownPersonRelationshipType[];

export function relationshipDisplayText(
  person: Pick<KnownPerson, "relationshipType" | "customRelationshipLabel">,
): string {
  return person.relationshipType === "other" &&
    person.customRelationshipLabel?.trim()
    ? person.customRelationshipLabel.trim()
    : relationshipLabels[person.relationshipType];
}

export const relationshipGroupOrder = [
  "Vrienden",
  "Familie",
  "School",
  "Leerkrachten",
  "Helpers",
  "Buren",
  "Overig",
] as const;

export function relationshipGroup(type: KnownPersonRelationshipType): string {
  switch (type) {
    case "grandparent":
    case "uncle":
    case "aunt":
    case "cousin":
    case "familyFriend":
      return "Familie";
    case "teacher":
      return "Leerkrachten";
    case "classmate":
      return "School";
    case "coach":
    case "babysitter":
      return "Helpers";
    case "friend":
      return "Vrienden";
    case "neighbour":
      return "Buren";
    default:
      return "Overig";
  }
}

export function filterKnownPeople(
  people: readonly KnownPerson[],
  query: string,
): readonly KnownPerson[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return people;

  return people.filter((person) =>
    [
      person.displayName,
      person.nickname ?? "",
      person.customRelationshipLabel ?? "",
      relationshipDisplayText(person),
    ].some((value) => value.toLocaleLowerCase().includes(normalized)),
  );
}

export function groupedKnownPeople(
  people: readonly KnownPerson[],
): ReadonlyArray<{ group: string; people: readonly KnownPerson[] }> {
  const groups = new Map<string, KnownPerson[]>();
  people.forEach((person) => {
    const group = relationshipGroup(person.relationshipType);
    groups.set(group, [...(groups.get(group) ?? []), person]);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => {
      const leftIndex = relationshipGroupOrder.indexOf(
        left as (typeof relationshipGroupOrder)[number],
      );
      const rightIndex = relationshipGroupOrder.indexOf(
        right as (typeof relationshipGroupOrder)[number],
      );
      return (
        (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
        (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
      );
    })
    .map(([group, items]) => ({ group, people: items }));
}
