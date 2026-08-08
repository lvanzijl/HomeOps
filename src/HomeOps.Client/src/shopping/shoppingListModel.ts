import type { DecorativeAvatarReference } from '../avatarContacts/DecorativeAvatarPicker';

export type ShoppingDecorativeAvatarReference = DecorativeAvatarReference;

export interface ShoppingListItem {
  id: string;
  label: string;
  quantity?: string | null;
  completed: boolean;
  completedUtc?: Date | null;
  deleted?: boolean;
  deletedUtc?: Date | null;
  preferredStore?: string | null;
  decorativeAvatar?: ShoppingDecorativeAvatarReference | null;
  storeSuggestions?: readonly ShoppingStoreSuggestion[];
  updatedUtc?: Date | null;
}

export interface ShoppingStoreSuggestion {
  store: string;
  purchaseCount: number;
}

export interface ShoppingListState {
  listId: string | null;
  name?: string;
  updatedUtc?: Date | null;
  activeItemCount?: number;
  completedItemCount?: number;
  deletedItemCount?: number;
  totalItemCount?: number;
  items: readonly ShoppingListItem[];
}

export interface ShoppingHistorySuggestion {
  text: string;
  useCount: number;
  updatedUtc: Date;
  storeSuggestions: readonly ShoppingStoreSuggestion[];
}

export interface ShoppingListLifecycleSummary {
  listId: string;
  name: string;
  archivedUtc?: Date | null;
  updatedUtc: Date;
  activeItemCount: number;
  completedItemCount: number;
  deletedItemCount: number;
  totalItemCount: number;
}
