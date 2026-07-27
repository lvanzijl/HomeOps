# Slice 2.6 viewport analysis — First-run setup checklist

## Current composition

After onboarding, `WorkspaceShell` occupies the fixed application viewport: a wrapping navigation row and one `minmax(0, 1fr)` workspace panel. The app shell and workspace shell both hide outer overflow. Home is the primary initial workspace.

## Overflow risk and content priority

Adding four setup cards to the Home dashboard would make the dashboard’s data-dependent content compete for its reserved height and could push the page beyond common laptop viewports. The currently selected workspace and its navigation are primary. The setup checklist is secondary orientation content: it must be visible immediately after onboarding, but it must not reserve permanent page space or prevent everyday work.

## Approved composition

Render the checklist as a modal dialog layered over the existing shell. The dialog has a bounded maximum height (`min(34rem, calc(100dvh - 2rem))`) and an internal scrolling body for its four compact rows. The backdrop and dialog use fixed positioning, so they do not participate in either the shell grid or document flow. Dismissal removes the dialog and returns the unchanged workspace to full visibility.

## Viewport fit

At 1366×768 and 1440×900 the dialog’s height cap leaves a one-rem edge on both sides; the four-row content normally fits without internal scrolling. At shorter desktop heights, only the dialog body scrolls. The document body and workspace grid retain their existing fixed heights and cannot grow from checklist content.

## Trade-offs and alternatives

A persistent Home card would keep the optional work discoverable but violates the stable dashboard composition as data and cards grow. A toast is viewport-safe but cannot explain four optional areas clearly. A bounded modal is selected because it offers first-run orientation, explicit dismissal, keyboard-accessible actions, and no page-level overflow. The dialog does not implement the deferred weather, calendar, or Home Assistant configuration flows; it labels them accurately as optional and points to existing areas only where they exist.
