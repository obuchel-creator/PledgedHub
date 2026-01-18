# Theming & Design Tokens

PledgeHub uses a professional, accessible, and brand-consistent theming system. All colors, backgrounds, and typography are defined via CSS variables (design tokens) in:
- `src/styles/theme.css` (main theme)
- `src/styles/globals.css` (typography, gradients)
- `src/styles/modern-design-system.css` (modern tokens)
- `src/styles/mtn-theme.css` (MTN/brand theme)

## How to Use
- Reference variables (e.g. `var(--primary)`, `var(--bg)`, `var(--color-primary)`) in all components and screens.
- Never hardcode colors or font sizes in components.
- Use `.light-theme` and `.dark-theme` classes on `<body>` for theme switching.
- All feedback (Toast, alerts) uses semantic colors from tokens.

## Adding/Updating Tokens
- Add new tokens to `theme.css` or `modern-design-system.css`.
- For brand-specific overrides, use `mtn-theme.css`.
- Document new tokens in this file.

## Example
```css
:root {
  --primary: #17223b;
  --secondary: #eab308;
  --bg: #fff;
  --text: #17223b;
  --success: #10b981;
  --error: #dc2626;
  --warning: #f59e0b;
  --info: #3b82f6;
}
```

## Theme Switching
- Use `.light-theme` and `.dark-theme` on `<body>`.
- All variables update automatically for dark/light mode.

## Accessibility
- All color choices meet WCAG AA contrast.
- Font sizes and line heights are responsive and accessible.

---
_Last updated: January 2026_
