import { createAvatarSelection, type AvatarCatalogSelection, type AvatarSelectionSlot } from './avatarCatalog';

export function createAvatarSelectionFixture(overrides: Partial<Record<AvatarSelectionSlot, string>> = {}): AvatarCatalogSelection {
  return createAvatarSelection(overrides);
}
