# Family Goal Celebration Foundation

## Summary
- Replaced the loose family-goal reward label in API and frontend contracts with a structured family celebration: title, optional description, and status.
- Added celebration states: `Planned`, `ReadyToCelebrate`, and `Celebrated`.
- Family goal completion now moves an attached celebration to `ReadyToCelebrate`; parents can confirm it as `Celebrated` with a lightweight action.
- Motivation shows celebration context as secondary encouragement copy: `When we finish`, `Ready to celebrate`, or `Celebrated`.
- Home shows only compact celebration context in the Motivation tile when a celebration exists.

## Boundaries Preserved
- No Reward Economy, Gems, Tokens, Coins, Shop, Purchases, Avatar unlocks, Badges, Leaderboards, Notifications, individual rewards, or goal templates were introduced.
- Helpful Moments remain recognition-only and do not unlock celebrations.
- Existing Motivation progress remains task-derived and encouragement-first.

## Validation
- Added backend coverage for celebration creation, progress-driven status transition, parent celebration confirmation, and ignoring economy-shaped unknown fields.
- Added frontend coverage for Motivation celebration rendering/status action, Home tile rendering, and absence of economy language.
