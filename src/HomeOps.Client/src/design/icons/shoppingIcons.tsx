import type { FamilyBoardIconSvgProps } from "./iconTypes";

export function ShoppingBagIcon({ children, ...props }: FamilyBoardIconSvgProps) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}>{children}<path d="M6.5 9.25h11l.85 9.25c.08.82-.57 1.5-1.4 1.5H7.05c-.83 0-1.48-.68-1.4-1.5l.85-9.25Z"/><path d="M9.25 9.25V8a2.75 2.75 0 0 1 5.5 0v1.25"/><path d="M10 14.25c.7.85 1.3 1.25 2 1.25s1.3-.4 2-1.25"/></svg>;
}
