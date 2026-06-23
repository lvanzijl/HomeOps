# Avatar V2 Visual Review

## Summary
Avatar V2 is visually successful in the core identity surfaces reviewed. The avatars feel warm, household-oriented, pastel-friendly, and more family-like than the legacy CSS avatar. The rollout did indirectly affect Motivation because Motivation individual goal cards consume `FamilyAvatar`; members with `avatarV2Config` now show Avatar V2 there, while members without Avatar V2 remain on the legacy fallback.

The main visual concern is small-size readability. Avatar V2 still reads as a person at compact chip/card sizes, but details such as accessories, hair shape, and facial expression are reduced to decorative hints. The compact use is acceptable for family recognition when paired with names, but it should not be relied on as the only identifier in dense future rows.

The largest non-avatar issue observed during validation was pre-existing or environment-driven API unavailability noise: Agenda, Tasks, Lists, appreciation, and related dashboard content showed unavailable states because the visual run used mocked Avatar-relevant endpoints while Docker/PostgreSQL was unavailable in the container.

## Screenshots Reviewed
Screenshots were captured outside the repository at `/tmp/homeops-avatar-v2-visual-review` for the following viewports and screens:

- Desktop `1440x1000`
  - Home dashboard
  - Family Member page, adult: Alex
  - Family Member page, child: Riley
  - Motivation page
- Tablet landscape `1024x768`
  - Home dashboard
  - Family Member page, adult: Alex
  - Family Member page, child: Riley
  - Motivation page
- Narrow/mobile `390x844`
  - Home dashboard
  - Family Member page, adult: Alex
  - Family Member page, child: Riley
  - Motivation page

Additional FamilyAvatar appearance reviewed:

- Motivation personal goal cards, including Avatar V2 members Alex and Riley and legacy-fallback member Jordan where visible in the captured flow.

## Findings

### Home dashboard
- Home family strip renders Avatar V2 for configured members and legacy fallback for Jordan, confirming the mixed rollout behavior is visible but not jarring.
- Compact avatars are aligned well within the family chips on desktop and mobile.
- The chips remain touch-friendly and family-member-oriented rather than login/profile oriented.
- The Avatar V2 illustrations do not dominate the Home dashboard; the much larger quick-capture add control remains the dominant visual element.
- On mobile, the family strip wraps cleanly into multiple rows without clipping or horizontal overflow.

### Family Member page, adult
- The adult Family Member hero renders Avatar V2 at large size with good polish and strong household identity.
- The avatar aligns well with the hero text and does not crowd the name, member context copy, or administrative controls.
- No clipping was observed around hair or accessory details at large size.
- The hero feels like a family identity area, not an account/profile login surface.

### Family Member page, child
- The child hero area renders Avatar V2 with a friendlier emotional tone than the legacy fallback.
- The child avatar is recognizable and warm at large size.
- The child page remains content-first: the avatar supports identity but does not overpower tasks, goals, family participation, or appreciation sections in the reviewed layouts.
- The child-facing tone fits HomeOps: household-oriented, encouraging, and not reward-shop-coded.

### Motivation page
- Motivation was indirectly changed. Individual goal cards now show Avatar V2 for members with `avatarV2Config` because the cards use `FamilyAvatar`.
- In Motivation cards, Avatar V2 appears as a small identity marker beside large goal artwork. This is visually acceptable but secondary.
- At compact Motivation-card size, Avatar V2 details are too small for independent recognition; recognition depends on the adjacent member name.
- The avatars do not dominate Motivation content. The large personal-goal illustration remains the visual anchor, which is appropriate.
- Mixed Avatar V2 plus legacy fallback can appear in the same Motivation goal set when some members lack `avatarV2Config`. The mixed rendering is functional but slightly less consistent.

## Problems
1. **Compact Avatar V2 detail is marginal at Motivation-card size.** Small avatars remain pleasant and recognizable as people, but hair/accessory details are not reliably readable.
2. **Mixed V2/legacy rendering is visually noticeable.** Jordan remained on the legacy fallback in the mocked review data, which confirmed fallback behavior but also showed that partially configured households can look uneven.
3. **Mobile Motivation header truncation was observed.** The page header text clipped/truncated horizontally in the narrow viewport. This is not caused by Avatar V2, but it affects the same visual validation pass.
4. **Environment/API unavailable states added visual noise.** Docker was unavailable, so the review used mocked Avatar-relevant endpoints. Other API-backed dashboard surfaces displayed unavailable states and 502 console messages.

## Recommended Fixes
1. Keep Avatar V2 on Family Member hero, child hero, and Home family strip.
2. Keep Avatar V2 on Motivation for now, but treat compact Motivation usage as a secondary identity marker only; do not make small avatars the sole member identifier.
3. Consider a compact Avatar V2 presentation later, such as simplified SVG detail or a slightly larger token, if future dense rows depend on avatar recognition.
4. Add a follow-up visual pass with all household members configured for Avatar V2 to judge consistency without the legacy fallback mixed into the same strip/card set.
5. Review the narrow Motivation page header truncation separately from Avatar V2.
6. If future product direction wants Motivation to feel less visually busy, consider whether Motivation personal-goal cards should use a quieter avatar treatment than the Family Member hero. No change is required for Phase 1.

## Unexpected Findings
- Docker was not installed in the container, so PostgreSQL could not be started with Docker Compose for a full backend-backed run.
- Playwright Chromium initially could not launch because browser shared libraries were missing; required system libraries were installed with apt before screenshots could be captured.
- The app shell made requests to non-mocked API endpoints during the screenshot run, producing expected 502 errors for unrelated surfaces while Avatar-relevant endpoints were mocked.

## Screenshot Handling Verification
- Screenshots were generated outside the repository at `/tmp/homeops-avatar-v2-visual-review`.
- Screenshots were reviewed and then removed before completion with `rm -rf /tmp/homeops-avatar-v2-visual-review`.
- `git status --short` before screenshot removal showed only this markdown report and no image files in the repository change set.
- `git status --short` after screenshot removal showed only this markdown report.
- `git diff --name-only -- '*.png' '*.jpg' '*.jpeg' '*.webp'` returned no files.
- `git diff --cached --name-only -- '*.png' '*.jpg' '*.jpeg' '*.webp'` returned no files.

## Next Prompt Context
Avatar V2 Phase 1 visual validation is complete. The rollout looks visually acceptable on Home dashboard family strip, adult Family Member hero, child Family Member hero, child hero area, and Motivation personal-goal cards across desktop, tablet landscape, and narrow/mobile captures. The largest Avatar-specific issue is small-size detail/readability in compact Motivation usage, not clipping or layout breakage. Motivation was indirectly changed through `FamilyAvatar`; this is acceptable for now but should remain a known global-component impact. Recommended next implementation slice, if desired, is to address compact-avatar readability/consistency or the narrow Motivation header truncation, not to redesign Avatar V2 broadly.
