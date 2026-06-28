import { useId } from "react";
import { getFamilyBoardIcon } from "../registry/iconRegistry";
import { resolveFamilyBoardIconSize } from "./iconTokens";
import type { FamilyBoardIconProps } from "./iconTypes";

export function FamilyBoardIcon({
  name,
  size = "normal",
  decorative = true,
  title,
  className,
}: FamilyBoardIconProps) {
  const Icon = getFamilyBoardIcon(name);
  const resolvedSize = resolveFamilyBoardIconSize(size);
  const generatedTitleId = useId();
  const titleId = title && !decorative ? generatedTitleId : undefined;

  return (
    <Icon
      aria-hidden={decorative ? "true" : undefined}
      aria-labelledby={titleId}
      className={className}
      focusable="false"
      height={resolvedSize}
      role={decorative ? undefined : "img"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      width={resolvedSize}
    >
      {titleId ? <title id={titleId}>{title}</title> : null}
    </Icon>
  );
}
