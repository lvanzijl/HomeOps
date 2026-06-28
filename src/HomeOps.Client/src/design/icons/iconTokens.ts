export const familyBoardIconSizeTokens = {
  small: 16,
  normal: 20,
  large: 24,
} as const;

export type FamilyBoardIconSize = keyof typeof familyBoardIconSizeTokens | number;

export function resolveFamilyBoardIconSize(size: FamilyBoardIconSize = "normal") {
  return typeof size === "number" ? size : familyBoardIconSizeTokens[size];
}
