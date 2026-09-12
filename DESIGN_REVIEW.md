# Commerce Coach design review — 2026-09-06

Applied the local design-taste-frontend skill to the working assistant redesign.
Design dials: variance 6, motion 3, density 5.

## Audit and approach
The prior layout overemphasized the dark sidebar, bot symbols, repeated cards, and metadata badges. The revised hierarchy starts with a practical question and a multiline composer. Suggested questions are plain rows; learning resources use an asymmetric layout with an actual documentation screenshot. The sidebar is lighter and contains one New chat action. Outfit and Noto Sans Bengali are self-hosted through pinned Fontsource dependencies.

## Verification
- Reviewed the desktop welcome screen in light and dark appearances.
- Reviewed the mobile dark layout and exercised the navigation drawer and New chat. No horizontal overflow was detected at the browser's effective 433 CSS-pixel viewport (390 viewport override with existing browser zoom).
- Verified Bengali input and Shift+Enter newline behavior without submitting a test conversation.
- Reviewed the production sign-in screen after correcting its missing layout styles.
- TypeScript check, 58 unit tests, and production build passed.
- Reduced-motion rules, visible focus styles, accessible input labels, and theme tokens are present.
- No Lighthouse audit or full accessibility conformance audit was run.

## Scope and exceptions
This is an authenticated working application: marketing sections, decorative animation, SEO, and generated hero artwork are not applicable. Existing navigation, authentication fields, history persistence, and permission boundaries are retained. Runtime AI credentials and Google OAuth configuration are outside this visual change.

Automatic approval review rejected creation of temporary test accounts, including an administrator. Verification instead used existing session navigation and local unsent input; no new accounts were created.

## Rollback
Restore the changed source files and package manifests from /tmp/commerce-coach-before-taste.zip, reinstall dependencies, then rebuild. No database migration is part of this redesign. TASTE_REDESIGN.patch records the source changes.
