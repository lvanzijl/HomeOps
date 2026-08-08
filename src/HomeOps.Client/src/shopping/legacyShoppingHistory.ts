export const legacyShoppingHistoryKey = 'homeops.shopping.history.v1';

export function readLegacyShoppingHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(legacyShoppingHistoryKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...new Map(parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => [item.toLocaleLowerCase(), item])).values()].slice(0, 50);
  } catch {
    return [];
  }
}

export function hasLegacyShoppingHistory(): boolean {
  return window.localStorage.getItem(legacyShoppingHistoryKey) !== null;
}

export function discardLegacyShoppingHistory(): void {
  window.localStorage.removeItem(legacyShoppingHistoryKey);
}
