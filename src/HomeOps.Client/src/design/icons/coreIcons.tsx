import type { FamilyBoardIconSvgProps } from "./iconTypes";

export function AddIcon({ children, ...props }: FamilyBoardIconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      {children}
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ children, ...props }: FamilyBoardIconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      {children}
      <path d="m7 7 10 10" />
      <path d="m17 7-10 10" />
    </svg>
  );
}
