import type { FamilyBoardIconSvgProps } from "./iconTypes";

export function ReadyIcon({ children, ...props }: FamilyBoardIconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      {children}
      <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
      <path d="m8.75 12.25 2.15 2.15 4.35-4.8" />
    </svg>
  );
}
