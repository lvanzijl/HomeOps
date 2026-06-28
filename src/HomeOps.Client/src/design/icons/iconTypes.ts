import type { ReactElement, SVGProps } from "react";
import type { FamilyBoardIconSize } from "./iconTokens";

export type FamilyBoardIconSvgProps = SVGProps<SVGSVGElement>;

export type FamilyBoardIconComponent = (props: FamilyBoardIconSvgProps) => ReactElement;

export type FamilyBoardIconProps = {
  name: FamilyBoardIconName;
  size?: FamilyBoardIconSize;
  decorative?: boolean;
  title?: string;
  className?: string;
};

export type FamilyBoardIconName =
  | "core.add"
  | "core.close"
  | "navigation.home"
  | "navigation.settings"
  | "status.ready";
