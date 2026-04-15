# Design System Visual Reference

## Color Palette

### Primary Colors
```
Primary Blue
#2563eb - Main brand color for buttons, links, primary actions
  Dark: #1e40af
  Light: #dbeafe
  
Secondary Green  
#10b981 - Secondary actions, success states
  Dark: #059669
  Light: #d1fae5

Accent Amber
#f59e0b - Attention, highlights, warnings
  Dark: #d97706
  Light: #fef3c7
```

### Status Colors
```
Success: #10b981  ✓ (Green)
Error:   #ef4444  ✗ (Red)
Warning: #f59e0b  ! (Amber)
Info:    #0ea5e9  ℹ (Cyan)
```

### Neutral Gray Scale
```
50:   #f9fafb  (Almost white - backgrounds)
100:  #f3f4f6  (Light - hover states)
200:  #e5e7eb  (Borders, dividers)
300:  #d1d5db  (Disabled states)
400:  #9ca3af  (Secondary text)
500:  #6b7280  (Secondary text darker)
600:  #4b5563  (Input labels)
700:  #374151  (Main text)
800:  #1f2937  (Dark text)
900:  #111827  (Almost black - headings)
950:  #030712  (Pure black)
```

---

## Typography Scale

### Font Families
```
Display:  Outfit (500-800 weight) - Headings, large text
Body:     Inter (300-700 weight) - Content, buttons, forms
Mono:     monospace - Code blocks, technical text
```

### Font Sizes
```
text-xs:    0.75rem  (12px)  - Labels, small text
text-sm:    0.875rem (14px)  - Form labels, help text
text-base:  1rem     (16px)  - Default body text
text-lg:    1.125rem (18px)  - Subheadings
text-xl:    1.25rem  (20px)  - Section titles
text-2xl:   1.5rem   (24px)  - Page section titles
text-3xl:   1.875rem (30px)  - Large section titles
text-4xl:   2.25rem  (36px)  - Page titles
```

### Font Weights
```
Light:   300
Normal:  400
Medium:  500
Semibold: 600
Bold:    700
Extrabold: 800
```

---

## Spacing Scale (8px Base)

```
0:    0px      
1:    2px
2:    4px
3:    8px      (base unit)
4:    16px     (most common)
5:    20px
6:    24px
7:    28px
8:    32px
9:    36px
10:   40px
11:   44px
12:   48px
13:   52px
14:   56px
15:   60px
16:   64px
17:   68px
18:   72px
19:   76px
20:   80px
24:   96px
```

**Usage Pattern**: 
- Padding: `var(--space-4)` (16px)
- Margin: `var(--space-6)` (24px)
- Gap: `var(--space-3)` (8px)

---

## Shadow System (Elevation)

```
Extra Small (xs)
  0 1px 2px 0 rgba(0, 0, 0, 0.05)

Small (sm)
  0 1px 3px 0 rgba(0, 0, 0, 0.1)
  0 1px 2px 0 rgba(0, 0, 0, 0.06)

Medium (md) - Most Common
  0 4px 6px -1px rgba(0, 0, 0, 0.1)
  0 2px 4px -1px rgba(0, 0, 0, 0.06)

Large (lg)
  0 10px 15px -3px rgba(0, 0, 0, 0.1)
  0 4px 6px -2px rgba(0, 0, 0, 0.05)

Extra Large (xl)
  0 20px 25px -5px rgba(0, 0, 0, 0.1)
  0 10px 10px -5px rgba(0, 0, 0, 0.04)

2XL (2xl) - Largest
  0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

**Usage**:
- Cards: `var(--shadow-md)`
- Modals: `var(--shadow-2xl)`
- Elevated cards: `var(--shadow-lg)`

---

## Border Radius Scale

```
sm:    0.125rem  (2px)
md:    0.375rem  (6px)
lg:    0.5rem    (8px)   - Most common
xl:    0.75rem   (12px)
2xl:   1rem      (16px)
3xl:   1.5rem    (24px)
full:  9999px    (Circles/pills)
```

**Usage**:
- Forms: `var(--radius-md)`
- Cards: `var(--radius-lg)`
- Buttons: `var(--radius-md)`
- Badges: `var(--radius-full)` (pills)

---

## Z-Index Scale

```
dropdown:     100   (Dropdown menus)
sticky:       120   (Sticky headers)
fixed:        140   (Fixed navigation)
modal-bg:     150   (Modal backdrop)
modal:        160   (Modal dialog)
popover:      170   (Popovers)
tooltip:      180   (Tooltips)
notification: 200   (Toast notifications)
drawer:       210   (Drawers/sidebars)
```

---

## Component Color Variants

### Cards
```
card              - White background
card--elevated    - Shadow, hover lift
card--bordered    - Border only
card--accent-*    - Colored left border
  --accent-primary   #2563eb (blue)
  --accent-secondary #10b981 (green)
  --accent-success   #10b981 (green)
  --accent-error     #ef4444 (red)
  --accent-warning   #f59e0b (amber)
```

### Buttons
```
btn--primary      - Blue background, white text
btn--secondary    - Gray background, dark text
btn--outline      - Border only
btn--ghost        - No background
btn--success      - Green background
btn--danger       - Red background

Sizes:
btn--sm          - Small (32px height)
btn--lg          - Large (40px height)

Full Width:
btn--block       - 100% width
```

### Alerts
```
alert--success   - Green (#10b981)
alert--error     - Red (#ef4444)
alert--warning   - Amber (#f59e0b)
alert--info      - Cyan (#0ea5e9)

All include: icon, title, content, close button
```

### Badges
```
badge              - Gray
badge--primary     - Blue
badge--secondary   - Green
badge--success     - Green
badge--error       - Red
badge--warning     - Amber
badge--outline     - Border only
```

---

## Responsive Breakpoints

```
Mobile (default)
  Up to 640px

Mobile Landscape
  640px and up

Tablet
  768px and up

Desktop
  1024px and up

Large Desktop
  1280px and up

XL Desktop
  1536px and up
```

**Usage Pattern**:
```css
/* Mobile first */
.grid {
  grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## Button Component Guide

### Variants
```
Primary (default action)
├── Regular     btn--primary
├── Small       btn--primary btn--sm
├── Large       btn--primary btn--lg
└── Full Width  btn--primary btn--block

Secondary (alternative action)
├── Regular     btn--secondary
└── Outline     btn--outline

Ghost (minimal)
├── Regular     btn--ghost

Semantic
├── Success     btn--success
├── Danger      btn--danger

States
├── Hover       (auto with :hover)
├── Active      (auto with :active)
└── Disabled    [disabled] attribute
```

### Sizes
```
Small (32px)     btn--sm
Regular (36px)   default
Large (40px)     btn--lg
```

---

## Form Component Guide

### Inputs
```
Default          .form-input
Error            .form-input--error
Success          .form-input--success
Disabled         .form-input:disabled
With Helper      .form-help below input
With Error       .form-error below input
```

### Form Groups
```
Layout
├── Label
├── Input
├── Helper text (optional)
└── Error text (if invalid)

Usage
<div class="form-group">
  <label class="form-label">...</label>
  <input class="form-input" ...>
  <span class="form-help">...</span>
</div>
```

### Custom Controls
```
Checkbox      .form-checkbox
Radio         .form-radio
Toggle        .form-toggle
Select        .form-input (same as input)
Textarea      .form-input (same as input)
```

---

## Layout Components

### Page Structure
```
<div class="page-container">
  
  <!-- Page header with title and actions -->
  <div class="page-header">
    <h1>Page Title</h1>
    <p>Optional description</p>
    <button class="btn btn--primary">Action</button>
  </div>

  <!-- Main content area -->
  <div class="grid grid-cols-3">
    <!-- Content -->
  </div>

</div>
```

### Grid System
```
Single column      <div class="grid">
2 columns          <div class="grid grid-cols-2">
3 columns          <div class="grid grid-cols-3">
4 columns          <div class="grid grid-cols-4">

All responsive with mobile fallback (1 column)
Gap is 24px (var(--space-6))
```

### Stat Cards
```
<div class="stat-card">
  <div class="stat-icon">📊</div>
  <div class="stat-content">
    <span class="stat-label">Label</span>
    <span class="stat-value">1,234</span>
    <span class="stat-change positive">+12%</span>
  </div>
</div>

Positive change: green
Negative change: red
```

---

## Animation & Transitions

### Default Transitions
```
Fast:     100ms (interactive elements)
Normal:   150ms (buttons, forms)
Smooth:   200ms (modal/drawer open)
Slow:     300ms (complex animations)

Easing: ease-out (default)
```

### Common Animations
```
fadeIn            - Opacity 0 → 1 (150ms)
slideUp           - Transform Y 16px → 0 (200ms)
slideDown         - Transform Y -16px → 0 (150ms)
slideInRight      - Transform X 100% → 0 (250ms)
slideInLeft       - Transform X -100% → 0 (250ms)
scaleIn           - Transform scale(0.95) → 1 (150ms)
```

---

## Accessibility Features

### ARIA Labels
```html
<!-- Buttons with icons -->
<button aria-label="Close menu">×</button>

<!-- Form errors -->
<input aria-describedby="error-id">
<span id="error-id" role="alert">Error</span>

<!-- Required fields -->
<input aria-required="true">

<!-- Loading states -->
<div role="status" aria-live="polite">Loading...</div>
```

### Focus States
```css
Focus ring:
  outline: 2px solid #2563eb
  outline-offset: 2px

Applied automatically to:
  - Links and buttons
  - Form inputs
  - Interactive elements
```

### Semantic HTML
```html
<nav>          Navigation
<main>         Main content
<aside>        Sidebar/secondary content
<section>      Content section
<article>      Article content
<header>       Page/section header
<footer>       Page/section footer
<figure>       Image with caption
<time>         Date/time values
```

---

## Usage Examples

### Button Variations
```html
<!-- Primary buttons -->
<button class="btn btn--primary">Save</button>
<button class="btn btn--primary btn--sm">Save</button>
<button class="btn btn--primary btn--lg">Save</button>
<button class="btn btn--primary btn--block">Full Width</button>

<!-- Secondary buttons -->
<button class="btn btn--secondary">Cancel</button>
<button class="btn btn--outline">Edit</button>
<button class="btn btn--ghost">More</button>

<!-- Semantic buttons -->
<button class="btn btn--success">Confirm</button>
<button class="btn btn--danger">Delete</button>

<!-- Disabled -->
<button class="btn btn--primary" disabled>Loading...</button>
```

### Card Variations
```html
<!-- Basic card -->
<div class="card">Content</div>

<!-- Elevated card -->
<div class="card card--elevated">Content</div>

<!-- Success card -->
<div class="card card--accent-success">Content</div>

<!-- Error card -->
<div class="card card--accent-error">Content</div>
```

### Form Examples
```html
<!-- Form group -->
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-input">
</div>

<!-- With error -->
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-input form-input--error">
  <span class="form-error">Invalid email</span>
</div>

<!-- With helper -->
<div class="form-group">
  <label class="form-label">Password</label>
  <input type="password" class="form-input">
  <span class="form-help">At least 8 characters</span>
</div>
```

---

## Common Patterns

### Empty State
```html
<div class="empty-state">
  <div class="empty-state-icon">📦</div>
  <h3 class="empty-state-title">No items found</h3>
  <p class="empty-state-description">Create your first item</p>
  <button class="btn btn--primary">Create</button>
</div>
```

### Loading State
```html
<div class="loading-state">
  <div class="spinner"></div>
  <p>Loading...</p>
</div>
```

### Alert
```html
<div class="alert alert--success">
  <svg class="alert-icon"><!-- checkmark --></svg>
  <div>
    <strong>Success!</strong>
    <p>Your changes were saved.</p>
  </div>
  <button class="alert-close">&times;</button>
</div>
```

---

## CSS Variable Reference

```css
/* Colors */
--color-primary
--color-secondary
--color-success
--color-error
--color-warning
--color-info
--color-gray-50 through --color-gray-950
--color-text-primary
--color-text-secondary
--color-border
--color-white

/* Spacing */
--space-0 through --space-24

/* Shadows */
--shadow-xs, sm, md, lg, xl, 2xl

/* Border Radius */
--radius-sm, md, lg, xl, 2xl, 3xl, full

/* Typography */
--font-display (Outfit)
--font-body (Inter)
--text-xs through --text-4xl

/* Z-Index */
--z-dropdown through --z-notification

/* Transitions */
--transition-fast (100ms)
--transition-normal (150ms)
--transition-smooth (200ms)
--transition-slow (300ms)
```

---

This visual reference provides quick lookup for all design tokens!

---

*Created: January 2025*
*Design System Version: 2.0*
