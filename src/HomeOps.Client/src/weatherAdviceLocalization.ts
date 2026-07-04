import { DepartureAdviceCategory } from "./api/homeOpsApiClient";

const departureAdviceHeaderCopy: Partial<Record<DepartureAdviceCategory, string>> = {
  [DepartureAdviceCategory.NoJacketNeeded]: "Geen jas nodig",
  [DepartureAdviceCategory.LightJacket]: "Dunne jas aanbevolen",
  [DepartureAdviceCategory.WarmJacket]: "Warme jas aan",
  [DepartureAdviceCategory.RainProtection]: "Regenjas mee",
  [DepartureAdviceCategory.SunProtection]: "Zonnebrand mee",
  [DepartureAdviceCategory.FillDrinkBottle]: "Drinkfles vullen",
  [DepartureAdviceCategory.Windy]: "Veel wind",
  [DepartureAdviceCategory.Slippery]: "Voorzichtig op pad",
  [DepartureAdviceCategory.ExtraTravelTime]: "Vertrek iets eerder",
};

export function getDepartureAdviceHeaderText(
  category: DepartureAdviceCategory,
): string | undefined {
  return departureAdviceHeaderCopy[category];
}
