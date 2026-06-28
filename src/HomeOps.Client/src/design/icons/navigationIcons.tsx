import type { FamilyBoardIconSvgProps } from "./iconTypes";

export function HomeIcon({ children, ...props }: FamilyBoardIconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      {children}
      <path d="M4.75 11.25 12 5.5l7.25 5.75" />
      <path d="M6.75 10.5v7.25c0 .41.34.75.75.75h9c.41 0 .75-.34.75-.75V10.5" />
      <path d="M10 18.5v-4.25h4v4.25" />
    </svg>
  );
}

export function SettingsIcon({ children, ...props }: FamilyBoardIconSvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      {children}
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M12 3.75v2" />
      <path d="M12 18.25v2" />
      <path d="m5.17 5.17 1.41 1.41" />
      <path d="m17.42 17.42 1.41 1.41" />
      <path d="M3.75 12h2" />
      <path d="M18.25 12h2" />
      <path d="m5.17 18.83 1.41-1.41" />
      <path d="m17.42 6.58 1.41-1.41" />
    </svg>
  );
}
