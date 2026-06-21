import type { HTMLAttributes } from "react";

export const homeOpsIconRegistry = {
  add: "＋",
  arrowBack: "←",
  celebration: "🎉",
  checkmark: "✓",
  close: "×",
  completed: "✓",
  initiative: "💛",
  kindness: "💛",
  memory: "💛",
  progress: "★",
  sparkle: "✨",
  teamwork: "🎉",
} as const;

export type HomeOpsIconName = keyof typeof homeOpsIconRegistry;

export function getHomeOpsIconSymbol(name: HomeOpsIconName) {
  return homeOpsIconRegistry[name];
}

type HomeOpsIconProps = {
  name: HomeOpsIconName;
  label?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "aria-label">;

export function HomeOpsIcon({ name, label, ...props }: HomeOpsIconProps) {
  return (
    <span
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      role={label ? "img" : undefined}
      {...props}
    >
      {getHomeOpsIconSymbol(name)}
    </span>
  );
}
