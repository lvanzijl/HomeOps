# FamilyBoard Marketing Storyboard Report

## Summary

Polished the canonical FamilyBoard marketing preview storyboard at `docs/design/marketing-storyboard-v1.md` to strengthen continuity, pacing, and emotional storytelling before the first preview recording.

This slice is direction-only. It created no production code, no recording infrastructure, no Marketing Director changes, no Recording Framework changes, no Audio Framework changes, no Playwright changes, no screenshots, no videos, and no binary artifacts.

## Story overview

The storyboard remains a short film about one ordinary week with the Van Zijl family. The revised narrative moves through:

1. Morning calm.
2. Today's planning.
3. Family recognition through a brief Thomas Avatar moment.
4. Month, week, and list agenda confidence with one added `Filmavond` event.
5. Helpful task planning with `Koekjes bakken` and completion of `Zwemtas klaarzetten`, carrying forward the swimming-lesson thread.
6. Practical shopping with one quick `Bananen` addition that supports the upcoming week.
7. Appreciation by adding `Bedankt voor het helpen met opruimen.` as a natural result of earlier helping moments.
8. Sunday Weekly Reset as the emotional climax reflecting the same week.
9. A quiet Home return and subtle FamilyBoard brand card.

The Settings scene was removed because it interrupted the emotional narrative and did not support the central story question.

## Emotional curve

The storyboard now documents the intended emotional progression:

Calm → Curiosity → Recognition → Confidence → Warmth → Reflection → Calm.

This curve is intended to guide future Marketing Director pacing, transitions, chapter overlays, touch restraint, and audio decisions. The polished storyboard also ties Home, Family, Agenda, Tasks, Shopping, Motivation, Weekly Reset, and Outro into the same ordinary week.

## Scene overview

| Scene | Fixture | Chapter | Preferred duration | Role |
| --- | --- | --- | ---: | --- |
| Intro | `visual-marketing-home` | Home | 5s | Establish a quiet morning. |
| Home | `visual-marketing-home` | Today | 7s | Make the day readable. |
| Family | `visual-marketing-family` | Family | 10s | Say “This is our family,” save Thomas, pause on the updated avatar, then return. |
| Agenda | `visual-marketing-agenda` | Agenda | 14s | Show Month, Week, List, add `Filmavond`, notice it, then return to overview. |
| Tasks | `visual-marketing-tasks` | Tasks | 10s | Add `Koekjes bakken` and complete `Zwemtas klaarzetten`. |
| Shopping | `visual-marketing-shopping` | Shopping | 7s | Add `Bananen` as week preparation while grouped shopping stays central. |
| Motivation | `visual-marketing-motivation` | Motivation | 10s | Add appreciation as a consequence of earlier help and pause for readability. |
| Weekly Reset | `visual-marketing-weekly-reset` | Weekly Reset | 14s | Slowest, longest, most reflective scene, closing the same week. |
| Outro | `visual-marketing-home` | FamilyBoard | 7s | Hold Home briefly, fade to brand card, then fade to black. |

## Timing overview

- Minimum total duration: 68 seconds.
- Preferred total duration: 84 seconds.
- Maximum total duration: 90 seconds.

The storyboard therefore remains within the requested 60-to-90-second target range.

## Validation

- Coherent narrative: Yes.
- No feature dumping: Yes.
- Every interaction has purpose: Yes.
- Stronger continuity between scenes: Yes; swimming, Thomas, Filmavond, cookies, bananas, appreciation, and Weekly Reset now carry through one family week.
- Weekly Reset remains the emotional high point: Yes; it has the longest transition, slowest movement, slowest touch, and longest pauses.
- Settings removed: Yes.
- Emotional curve documented: Yes.
- Home and Weekly Reset feel connected: Yes; Home introduces the practical week and Weekly Reset gently closes it.
- Every interaction supports the same family story: Yes.
- Pacing remains calm: Yes.
- Duration remains between 60 and 90 seconds: Yes.
- No production or framework changes were made: Yes.

## Required answers

- **Is this still the canonical storyboard?** Yes. `docs/design/marketing-storyboard-v1.md` remains the canonical V1 storyboard for the first FamilyBoard marketing preview; no V2 was created.
- **Was Settings removed?** Yes. The Settings scene was removed from the storyboard, timing, sequence justification, and report.
- **Does it use the existing marketing fixtures?** Yes. It uses only existing `visual-marketing-*` fixtures and does not require new fixture work.
- **Is it compatible with the Marketing Director?** Yes. Scenes retain fixture, chapter copy, purpose, emotional tone, visual focus, min/preferred/max durations, transition, and semantic action direction.
- **Is it compatible with the Recording Framework?** Yes. Camera, transition, touch, and scene directions align with the existing framework concepts and do not require new infrastructure.
- **Is it compatible with the Audio Framework?** Yes. Audio cues reference existing recording, chapter, transition, touch, gesture, action, save, task completion, appreciation, and weekly reset event concepts only.
- **Was no movie intentionally produced?** Yes. No movie or media artifact was produced by this slice.

## Modified files

- `docs/design/marketing-storyboard-v1.md`
- `docs/reports/2026-06-28-marketing-storyboard/marketing-storyboard.md`
