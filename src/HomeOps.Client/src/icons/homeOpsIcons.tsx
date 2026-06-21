import type { HTMLAttributes } from "react";

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
import uiAddIcon from "../assets/homeops/core-ui/ui-add-icon.svg";
import uiBackIcon from "../assets/homeops/core-ui/ui-back-icon.svg";
import uiCloseIcon from "../assets/homeops/core-ui/ui-close-icon.svg";

export type HomeOpsIconVariant = "icon" | "spot" | "hero" | "keepsake";

type HomeOpsIconRegistryEntry = {
  fallback: string;
  assets?: Partial<Record<HomeOpsIconVariant, string>>;
};

export const homeOpsIconRegistry = {
  add: { fallback: "＋", assets: { icon: uiAddIcon } },
  arrowBack: { fallback: "←", assets: { icon: uiBackIcon } },
  celebration: {
    fallback: "🎉",
    assets: { icon: celebrationReadyIcon, spot: celebrationReadySpot, hero: celebrationReadyHero },
  },
  celebrationCelebrated: {
    fallback: "🎉",
    assets: { icon: celebrationCelebratedIcon, spot: celebrationCelebratedSpot },
  },
  celebrationMemory: {
    fallback: "💛",
    assets: { icon: celebrationMemoryIcon, spot: celebrationMemorySpot, keepsake: celebrationMemoryKeepsake },
  },
  celebrationReady: {
    fallback: "🎉",
    assets: { icon: celebrationReadyIcon, spot: celebrationReadySpot, hero: celebrationReadyHero },
  },
  celebrationUpcoming: {
    fallback: "🎉",
    assets: { icon: celebrationUpcomingIcon, spot: celebrationUpcomingSpot, hero: celebrationUpcomingHero },
  },
  checkmark: { fallback: "✓" },
  close: { fallback: "×", assets: { icon: uiCloseIcon } },
  completed: { fallback: "✓" },
  initiative: { fallback: "💛" },
  kindness: { fallback: "💛" },
  memory: {
    fallback: "💛",
    assets: { icon: celebrationMemoryIcon, spot: celebrationMemorySpot, keepsake: celebrationMemoryKeepsake },
  },
  progress: { fallback: "★" },
  sparkle: {
    fallback: "✨",
    assets: { icon: celebrationCelebratedIcon, spot: celebrationCelebratedSpot },
  },
  teamwork: {
    fallback: "🎉",
    assets: { icon: celebrationReadyIcon, spot: celebrationReadySpot },
  },
} as const satisfies Record<string, HomeOpsIconRegistryEntry>;

export type HomeOpsIconName = keyof typeof homeOpsIconRegistry;

export function getHomeOpsIconSymbol(name: HomeOpsIconName) {
  return homeOpsIconRegistry[name].fallback;
}

export function getHomeOpsIconAsset(name: HomeOpsIconName, variant: HomeOpsIconVariant = "icon") {
  const assets = (homeOpsIconRegistry[name] as HomeOpsIconRegistryEntry).assets;
  return assets?.[variant] ?? assets?.icon;
}

type HomeOpsIconProps = {
  name: HomeOpsIconName;
  label?: string;
  variant?: HomeOpsIconVariant;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "aria-label">;

export function HomeOpsIcon({ name, label, variant = "icon", className, ...props }: HomeOpsIconProps) {
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
