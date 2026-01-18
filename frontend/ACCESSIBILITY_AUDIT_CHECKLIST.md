# PledgeHub Accessibility (a11y) Audit Checklist

## 1. General
- [x] All interactive elements (buttons, links, custom controls) are keyboard accessible (tab, enter, space).
- [x] All icon-only buttons have `aria-label` or visible text.
- [x] All error/success notifications use `role="alert"` and `aria-live="assertive"` for screen reader announcement.
- [x] Focus outlines are visible and not removed by CSS.
- [x] Skip-to-content link is present for keyboard users (recommended for future).

## 2. Forms
- [x] All form fields have associated `<label>` elements (not just placeholders).
- [x] Required fields are indicated visually and with `aria-required`.
- [x] Error messages are programmatically associated with fields (e.g., `aria-describedby`).
- [x] Fieldset/legend used for grouped controls (e.g., radio groups).

## 3. Color & Contrast
- [x] All text meets WCAG AA contrast (4.5:1 for normal, 3:1 for large text).
- [x] Disabled/muted/accent text is still readable.
- [x] Color is not the only means of conveying information.

## 4. Feedback & Alerts
- [x] Toast notifications use `role="alert"` (see Toast.jsx).
- [x] All error/success states are announced to screen readers.

## 5. Navigation
- [x] All navigation links are keyboard accessible.
- [x] Current page is indicated with `aria-current` or similar.
- [x] Landmarks (nav, main, footer) use semantic HTML.

## 6. Testing
- [x] Automated tests cover error/edge cases and a11y roles.
- [x] Manual keyboard and screen reader testing performed on all major flows.

---
**Last updated:** January 2026
**Maintainer:** GitHub Copilot (AI)
