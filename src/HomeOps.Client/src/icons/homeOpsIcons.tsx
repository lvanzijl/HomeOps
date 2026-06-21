import type { HTMLAttributes } from "react";

import childFamilyParticipationGroup from "../assets/homeops/child-ownership/child-family-participation-group.svg";
import childFamilyParticipationIcon from "../assets/homeops/child-ownership/child-family-participation-icon.svg";
import childFamilyParticipationSpot from "../assets/homeops/child-ownership/child-family-participation-spot.svg";
import childMyHelpMatteredHero from "../assets/homeops/child-ownership/child-my-help-mattered-hero.svg";
import childMyHelpMatteredIcon from "../assets/homeops/child-ownership/child-my-help-mattered-icon.svg";
import childMyHelpMatteredSpot from "../assets/homeops/child-ownership/child-my-help-mattered-spot.svg";
import childMyProgressIcon from "../assets/homeops/child-ownership/child-my-progress-icon.svg";
import childMyProgressSpot from "../assets/homeops/child-ownership/child-my-progress-spot.svg";
import childThisWeekIcon from "../assets/homeops/child-ownership/child-this-week-icon.svg";
import childThisWeekSection from "../assets/homeops/child-ownership/child-this-week-section.svg";
import childTodayIcon from "../assets/homeops/child-ownership/child-today-icon.svg";
import childTodaySection from "../assets/homeops/child-ownership/child-today-section.svg";
import celebrationCelebratedIcon from "../assets/homeops/celebration/celebration-celebrated-icon.svg";
import celebrationCelebratedSpot from "../assets/homeops/celebration/celebration-celebrated-spot.svg";
import celebrationMemoryIcon from "../assets/homeops/celebration/celebration-memory-icon.svg";
import celebrationMemoryKeepsake from "../assets/homeops/celebration/celebration-memory-keepsake.svg";
import celebrationMemorySpot from "../assets/homeops/celebration/celebration-memory-spot.svg";
import celebrationReadyHero from "../assets/homeops/celebration/celebration-ready-hero.svg";
import celebrationReadyIcon from "../assets/homeops/celebration/celebration-ready-icon.svg";
import celebrationReadySpot from "../assets/homeops/celebration/celebration-ready-spot.svg";
import celebrationUpcomingHero from "../assets/homeops/celebration/celebration-upcoming-hero.svg";
import celebrationUpcomingIcon from "../assets/homeops/celebration/celebration-upcoming-icon.svg";
import celebrationUpcomingSpot from "../assets/homeops/celebration/celebration-upcoming-spot.svg";
import helpfulInitiativeIcon from "../assets/homeops/helpful-moments/helpful-initiative-icon.svg";
import helpfulInitiativeSpot from "../assets/homeops/helpful-moments/helpful-initiative-spot.svg";
import helpfulKindnessIcon from "../assets/homeops/helpful-moments/helpful-kindness-icon.svg";
import helpfulKindnessSpot from "../assets/homeops/helpful-moments/helpful-kindness-spot.svg";
import helpfulResponsibilityIcon from "../assets/homeops/helpful-moments/helpful-responsibility-icon.svg";
import helpfulResponsibilitySpot from "../assets/homeops/helpful-moments/helpful-responsibility-spot.svg";
import helpfulRoutineIcon from "../assets/homeops/helpful-moments/helpful-routine-icon.svg";
import helpfulRoutineSpot from "../assets/homeops/helpful-moments/helpful-routine-spot.svg";
import helpfulTeamworkIcon from "../assets/homeops/helpful-moments/helpful-teamwork-icon.svg";
import helpfulTeamworkSpot from "../assets/homeops/helpful-moments/helpful-teamwork-spot.svg";
import uiAddIcon from "../assets/homeops/core-ui/ui-add-icon.svg";
import uiBackIcon from "../assets/homeops/core-ui/ui-back-icon.svg";
import uiCloseIcon from "../assets/homeops/core-ui/ui-close-icon.svg";

export type HomeOpsIconVariant =
  | "icon"
  | "spot"
  | "hero"
  | "keepsake"
  | "section"
  | "group";

type HomeOpsIconRegistryEntry = {
  fallback: string;
  assets?: Partial<Record<HomeOpsIconVariant, string>>;
};

export const homeOpsIconRegistry = {
  add: { fallback: "＋", assets: { icon: uiAddIcon } },
  arrowBack: { fallback: "←", assets: { icon: uiBackIcon } },
  celebration: {
    fallback: "🎉",
    assets: {
      icon: celebrationReadyIcon,
      spot: celebrationReadySpot,
      hero: celebrationReadyHero,
    },
  },
  celebrationCelebrated: {
    fallback: "🎉",
    assets: {
      icon: celebrationCelebratedIcon,
      spot: celebrationCelebratedSpot,
    },
  },
  celebrationMemory: {
    fallback: "💛",
    assets: {
      icon: celebrationMemoryIcon,
      spot: celebrationMemorySpot,
      keepsake: celebrationMemoryKeepsake,
    },
  },
  celebrationReady: {
    fallback: "🎉",
    assets: {
      icon: celebrationReadyIcon,
      spot: celebrationReadySpot,
      hero: celebrationReadyHero,
    },
  },
  celebrationUpcoming: {
    fallback: "🎉",
    assets: {
      icon: celebrationUpcomingIcon,
      spot: celebrationUpcomingSpot,
      hero: celebrationUpcomingHero,
    },
  },
  checkmark: { fallback: "✓" },
  close: { fallback: "×", assets: { icon: uiCloseIcon } },
  childFamilyParticipation: {
    fallback: "🤝",
    assets: {
      icon: childFamilyParticipationIcon,
      spot: childFamilyParticipationSpot,
      group: childFamilyParticipationGroup,
    },
  },
  childMyHelpMattered: {
    fallback: "💛",
    assets: {
      icon: childMyHelpMatteredIcon,
      spot: childMyHelpMatteredSpot,
      hero: childMyHelpMatteredHero,
    },
  },
  childMyProgress: {
    fallback: "★",
    assets: { icon: childMyProgressIcon, spot: childMyProgressSpot },
  },
  childThisWeek: {
    fallback: "↗",
    assets: {
      icon: childThisWeekIcon,
      section: childThisWeekSection,
      spot: childThisWeekSection,
    },
  },
  childToday: {
    fallback: "☀",
    assets: {
      icon: childTodayIcon,
      section: childTodaySection,
      spot: childTodaySection,
    },
  },
  completed: { fallback: "✓" },
  initiative: {
    fallback: "💛",
    assets: { icon: helpfulInitiativeIcon, spot: helpfulInitiativeSpot },
  },
  kindness: {
    fallback: "💛",
    assets: { icon: helpfulKindnessIcon, spot: helpfulKindnessSpot },
  },
  memory: {
    fallback: "💛",
    assets: {
      icon: celebrationMemoryIcon,
      spot: celebrationMemorySpot,
      keepsake: celebrationMemoryKeepsake,
    },
  },
  progress: {
    fallback: "★",
    assets: { icon: childMyProgressIcon, spot: childMyProgressSpot },
  },
  responsibility: {
    fallback: "✓",
    assets: {
      icon: helpfulResponsibilityIcon,
      spot: helpfulResponsibilitySpot,
    },
  },
  routine: {
    fallback: "↻",
    assets: { icon: helpfulRoutineIcon, spot: helpfulRoutineSpot },
  },
  sparkle: {
    fallback: "✨",
    assets: {
      icon: celebrationCelebratedIcon,
      spot: celebrationCelebratedSpot,
    },
  },
  teamwork: {
    fallback: "🤝",
    assets: { icon: helpfulTeamworkIcon, spot: helpfulTeamworkSpot },
  },
} as const satisfies Record<string, HomeOpsIconRegistryEntry>;

export type HomeOpsIconName = keyof typeof homeOpsIconRegistry;

export function getHomeOpsIconSymbol(name: HomeOpsIconName) {
  return homeOpsIconRegistry[name].fallback;
}

export function getHomeOpsIconAsset(
  name: HomeOpsIconName,
  variant: HomeOpsIconVariant = "icon",
) {
  const assets = (homeOpsIconRegistry[name] as HomeOpsIconRegistryEntry).assets;
  return assets?.[variant] ?? assets?.icon;
}

type HomeOpsIconProps = {
  name: HomeOpsIconName;
  label?: string;
  variant?: HomeOpsIconVariant;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "aria-label">;

export function HomeOpsIcon({
  name,
  label,
  variant = "icon",
  className,
  ...props
}: HomeOpsIconProps) {
  const asset = getHomeOpsIconAsset(name, variant);
  const fallback = getHomeOpsIconSymbol(name);

  return (
    <span
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      role={label ? "img" : undefined}
      className={["homeops-icon-asset", className].filter(Boolean).join(" ")}
      {...props}
    >
      {asset ? <img alt="" draggable="false" src={asset} /> : fallback}
    </span>
  );
}

const helpfulMomentIconNames = {
  initiative: "initiative",
  kindness: "kindness",
  responsibility: "responsibility",
  routine: "routine",
  teamwork: "teamwork",
} as const satisfies Record<string, HomeOpsIconName>;

export function getHelpfulMomentIconName(
  recognitionTag?: string,
): HomeOpsIconName {
  const normalized = recognitionTag?.trim().toLowerCase();
  return normalized && normalized in helpfulMomentIconNames
    ? helpfulMomentIconNames[normalized as keyof typeof helpfulMomentIconNames]
    : "kindness";
}
