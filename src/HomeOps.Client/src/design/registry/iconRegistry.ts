import { AddIcon, CloseIcon } from "../icons/coreIcons";
import type { FamilyBoardIconComponent, FamilyBoardIconName } from "../icons/iconTypes";
import { HomeIcon, SettingsIcon } from "../icons/navigationIcons";
import { ReadyIcon } from "../icons/statusIcons";

export type FamilyBoardIconRegistryEntry = {
  component: FamilyBoardIconComponent;
  category: "core" | "navigation" | "agenda" | "status" | "shopping";
  description: string;
};

export const familyBoardIconRegistry = {
  "core.add": {
    component: AddIcon,
    category: "core",
    description: "Adds a new item in the current context.",
  },
  "core.close": {
    component: CloseIcon,
    category: "core",
    description: "Closes a dialog, panel, or transient surface.",
  },
  "navigation.home": {
    component: HomeIcon,
    category: "navigation",
    description: "Navigates to the FamilyBoard home dashboard.",
  },
  "navigation.settings": {
    component: SettingsIcon,
    category: "navigation",
    description: "Navigates to administrative settings.",
  },
  "status.ready": {
    component: ReadyIcon,
    category: "status",
    description: "Indicates that an item or ritual is ready or complete.",
  },
} as const satisfies Record<FamilyBoardIconName, FamilyBoardIconRegistryEntry>;

export function getFamilyBoardIcon(name: FamilyBoardIconName) {
  return familyBoardIconRegistry[name].component;
}
