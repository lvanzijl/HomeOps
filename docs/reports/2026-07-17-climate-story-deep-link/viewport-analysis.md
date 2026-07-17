# Climate Story Deep-Link Viewport Analysis

## Current page composition
`Woning` is a compact Story-first page with a climate entry card. `Klimaat in huis` is a bounded workspace with a header, floor tabs, floor summary, and a three-column grid: floor plan, room list, and selected-room detail.

## Why overflow could occur
The existing climate grid is viewport-bounded, but adding Story context as a persistent full-width section could reduce the grid height and cause page overflow on laptop viewports. The risk is highest when the Story explanation, status, and actions are allowed to grow without an internal bound.

## Primary versus secondary sections
Primary sections are floor selection, room list/overlay selection, and selected-room climate detail. Story context is secondary: it explains why the user arrived but does not replace live climate facts.

## Always visible content
The workspace header, selected floor controls, selected room heading/detail facts, and the Story-context heading/dismiss control when entered from a Story should remain reachable without browser scrolling.

## Compactable content
The Story explanation, missing-target notice, resolved notice, and settings action can be compacted into a small bounded panel. Room lists and detail content already scroll internally.

## Proposed composition
Keep the existing fixed workspace structure. Add a compact `climate-story-context` panel between the floor summary and the grid only when a Story context is active. The panel is flex-shrink: 0, concise, and dismissible/collapsible. The grid remains `min-height: 0` and absorbs the remaining space. On phone/tablet the panel stays above the detail/list area while the grid remains internally bounded.

## Fit justification
The added panel is designed as a short two-column/compact region with small padding and no unbounded lists. The existing grid continues to own overflow with internal scrolling. Desktop/laptop viewports retain the same number of major regions and avoid browser-level vertical scrolling.

## Risks and alternatives
A side panel inside the detail column was considered, but it would compete with selected-room facts and heating controls. A modal was rejected because the Story context is secondary and should not block climate use. A persistent dashboard card was rejected because the main Woning page must remain Story-first and the climate workspace already owns details.
