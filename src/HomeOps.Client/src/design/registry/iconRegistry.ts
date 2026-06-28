import { AddIcon, CloseIcon, OpenIcon } from "../icons/coreIcons";
import type { FamilyBoardIconComponent, FamilyBoardIconName } from "../icons/iconTypes";
import { HomeIcon, SettingsIcon } from "../icons/navigationIcons";
import { AgendaBirthdayIcon, AgendaDefaultIcon, AgendaHealthIcon, AgendaHolidayIcon, AgendaHomeIcon, AgendaMediaIcon, AgendaSchoolIcon, AgendaShoppingIcon, AgendaSportIcon, AgendaWorkIcon } from "../icons/agendaIcons";
import { ShoppingBagIcon } from "../icons/shoppingIcons";
import { ReadyIcon, PendingIcon } from "../icons/statusIcons";

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
  "core.open": { component: OpenIcon, category: "core", description: "Opens a linked workspace or panel." },
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
  "status.pending": { component: PendingIcon, category: "status", description: "Indicates a pending or not-yet-ready state." },
  "shopping.bag": { component: ShoppingBagIcon, category: "shopping", description: "Represents a warm family shopping bag." },
  "agenda.birthday": { component: AgendaBirthdayIcon, category: "agenda", description: "Represents birthday events." },
  "agenda.holiday": { component: AgendaHolidayIcon, category: "agenda", description: "Represents holiday and vacation events." },
  "agenda.school": { component: AgendaSchoolIcon, category: "agenda", description: "Represents school events." },
  "agenda.sport": { component: AgendaSportIcon, category: "agenda", description: "Represents sport events." },
  "agenda.health": { component: AgendaHealthIcon, category: "agenda", description: "Represents health events." },
  "agenda.shopping": { component: AgendaShoppingIcon, category: "agenda", description: "Represents shopping and errand events." },
  "agenda.home": { component: AgendaHomeIcon, category: "agenda", description: "Represents home and family events." },
  "agenda.work": { component: AgendaWorkIcon, category: "agenda", description: "Represents work events." },
  "agenda.media": { component: AgendaMediaIcon, category: "agenda", description: "Represents media events." },
  "agenda.default": { component: AgendaDefaultIcon, category: "agenda", description: "Represents generic agenda events." },
} as const satisfies Record<FamilyBoardIconName, FamilyBoardIconRegistryEntry>;

export function getFamilyBoardIcon(name: FamilyBoardIconName) {
  return familyBoardIconRegistry[name].component;
}
