# PledgeHub Modern Design System Integration Guide

## Overview

This guide explains how to use the new modern design system to update existing screens and components. The new system provides:

- **200+ CSS Variables** for consistent theming
- **60+ Pre-built Components** with variants
- **Responsive Layout Patterns** for all screen sizes
- **Professional Color Palette** with 50-point gray scale
- **Accessible by Default** with proper ARIA labels and focus states

## Quick Start

### 1. Stylesheet Setup

Include the modern design files in your main App.jsx:

```jsx
import './styles/modern-design-system.css';  // Design tokens (MUST LOAD FIRST)
import './styles/components.css';             // Component library
import './styles/layout.modern.css';           // Layout patterns
import './styles/auth.modern.css';             // Auth screens
import './components/Navbar.modern.css';       // Navbar styles
```

**IMPORTANT**: Load `modern-design-system.css` FIRST, as other files depend on its CSS variables.

### 2. Replace the Navigation Bar

In `src/App.jsx`:

```jsx
// OLD
import NavBar from './NavBar';

// NEW
import Navbar from './components/Navbar.modern';

function App() {
  return (
    <>
      <Navbar />  {/* New modern navbar */}
      {/* ... rest of app ... */}
    </>
  );
}
```

### 3. Using Design Tokens (CSS Variables)

All design tokens are available as CSS variables. Use them in your components:

```css
/* Colors */
background-color: var(--color-primary);      /* #2563eb */
color: var(--color-text-primary);            /* #111827 */
border-color: var(--color-border);           /* #e5e7eb */

/* Spacing (8px base grid) */
padding: var(--space-4);                     /* 1rem / 16px */
margin-bottom: var(--space-6);               /* 1.5rem / 24px */
gap: var(--space-4);

/* Shadows (6 elevation levels) */
box-shadow: var(--shadow-md);                /* Medium elevation */

/* Border Radius */
border-radius: var(--radius-lg);             /* 0.5rem / 8px */

/* Typography */
font-family: var(--font-display);            /* Outfit (headings) */
font-family: var(--font-body);               /* Inter (body text) */
font-size: var(--text-lg);                   /* 1.125rem / 18px */
```

## Component Classes Reference

### Cards

```html
<!-- Basic elevated card -->
<div class="card card--elevated">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

<!-- Card with colored left border -->
<div class="card card--bordered card--accent-success">
  Success card
</div>

<!-- Error card -->
<div class="card card--accent-error">
  Error message
</div>
```

### Buttons

```html
<!-- Primary button -->
<button class="btn btn--primary">Save</button>

<!-- Secondary button -->
<button class="btn btn--secondary">Cancel</button>

<!-- Outline button -->
<button class="btn btn--outline">Edit</button>

<!-- Ghost button (transparent) -->
<button class="btn btn--ghost">More Options</button>

<!-- Sizes -->
<button class="btn btn--primary btn--sm">Small</button>
<button class="btn btn--primary btn--lg">Large</button>

<!-- Full width -->
<button class="btn btn--primary btn--block">Full Width</button>

<!-- Disabled state -->
<button class="btn btn--primary" disabled>Disabled</button>

<!-- Success/Danger variants -->
<button class="btn btn--success">Confirm</button>
<button class="btn btn--danger">Delete</button>
```

### Form Elements

```html
<!-- Text input -->
<div class="form-group">
  <label for="name" class="form-label">Name</label>
  <input 
    type="text" 
    id="name" 
    class="form-input" 
    placeholder="Enter your name"
  >
  <span class="form-help">This is helper text</span>
</div>

<!-- Input with error -->
<div class="form-group">
  <label for="email" class="form-label">Email</label>
  <input 
    type="email" 
    id="email" 
    class="form-input form-input--error" 
    value="invalid@"
  >
  <span class="form-error">Please enter a valid email</span>
</div>

<!-- Input with success -->
<input type="text" class="form-input form-input--success" value="Valid input">

<!-- Select dropdown -->
<select class="form-input">
  <option>Choose an option</option>
  <option>Option 1</option>
</select>

<!-- Textarea -->
<textarea class="form-input" placeholder="Enter description" rows="4"></textarea>

<!-- Checkbox -->
<div class="form-group">
  <label class="form-checkbox">
    <input type="checkbox">
    <span>Remember me</span>
  </label>
</div>

<!-- Radio -->
<div class="form-group">
  <label class="form-radio">
    <input type="radio" name="option">
    <span>Option 1</span>
  </label>
</div>

<!-- Toggle Switch -->
<label class="form-toggle">
  <input type="checkbox">
  <span class="toggle-switch"></span>
  <span>Enable feature</span>
</label>
```

### Alerts

```html
<!-- Success alert -->
<div class="alert alert--success">
  <svg class="alert-icon"><!-- checkmark icon --></svg>
  <div>
    <strong>Success!</strong>
    <p>Your changes have been saved.</p>
  </div>
  <button class="alert-close">&times;</button>
</div>

<!-- Error alert -->
<div class="alert alert--error">
  <strong>Error</strong>
  <p>Something went wrong</p>
</div>

<!-- Warning alert -->
<div class="alert alert--warning">
  Please review before continuing
</div>

<!-- Info alert -->
<div class="alert alert--info">
  New feature available
</div>
```

### Badges

```html
<span class="badge">Default</span>
<span class="badge badge--primary">Primary</span>
<span class="badge badge--secondary">Secondary</span>
<span class="badge badge--success">Success</span>
<span class="badge badge--error">Error</span>
<span class="badge badge--warning">Warning</span>
<span class="badge badge--outline">Outline</span>
```

### Tables

```html
<table class="table">
  <thead class="table-header">
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody class="table-body">
    <tr class="table-row">
      <td>Data 1</td>
      <td>Data 2</td>
      <td>
        <button class="btn btn--ghost btn--sm">Edit</button>
      </td>
    </tr>
  </tbody>
</table>
```

## Layout Patterns

### Page Container

```jsx
function MyScreen() {
  return (
    <div class="page-container">
      <div class="page-header">
        <h1>Page Title</h1>
        <p>Page description goes here</p>
        <button class="btn btn--primary">Action</button>
      </div>

      {/* Page content */}
    </div>
  );
}
```

### Responsive Grid

```html
<!-- 4 columns on desktop, 2 on tablet, 1 on mobile -->
<div class="grid grid-cols-4">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
  <div class="card">Item 4</div>
</div>

<!-- 2 columns -->
<div class="grid grid-cols-2">
  <div class="card">Left</div>
  <div class="card">Right</div>
</div>

<!-- 3 columns -->
<div class="grid grid-cols-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Stat Cards (Key Metrics)

```html
<div class="grid grid-cols-4">
  <div class="stat-card">
    <div class="stat-icon" style="background-color: var(--color-primary);">
      📊
    </div>
    <div class="stat-content">
      <span class="stat-label">Total Pledges</span>
      <span class="stat-value">1,234</span>
      <span class="stat-change positive">+12% from last month</span>
    </div>
  </div>

  <div class="stat-card">
    <div class="stat-icon" style="background-color: var(--color-success);">
      ✓
    </div>
    <div class="stat-content">
      <span class="stat-label">Completed</span>
      <span class="stat-value">856</span>
      <span class="stat-change negative">-5% from last month</span>
    </div>
  </div>
</div>
```

### Empty State

```html
<div class="empty-state">
  <div class="empty-state-icon">📦</div>
  <h3 class="empty-state-title">No pledges yet</h3>
  <p class="empty-state-description">Start by creating your first pledge</p>
  <button class="btn btn--primary">Create Pledge</button>
</div>
```

### Sidebar Layout

```html
<div class="sidebar-layout">
  <aside class="sidebar">
    <!-- Navigation menu -->
  </aside>
  
  <main class="sidebar-content">
    <!-- Main content -->
  </main>
</div>
```

### Two Column Layout

```html
<div class="two-column-layout">
  <div class="two-column-left">
    <!-- Left content -->
  </div>
  <div class="two-column-right">
    <!-- Right content (sidebar) -->
  </div>
</div>
```

## Color System

### Primary Colors
```css
--color-primary: #2563eb;              /* Blue */
--color-primary-dark: #1e40af;
--color-primary-light: #dbeafe;
```

### Semantic Colors
```css
--color-success: #10b981;              /* Green */
--color-error: #ef4444;                /* Red */
--color-warning: #f59e0b;              /* Amber */
--color-info: #0ea5e9;                 /* Cyan */
```

### Neutral Scale (50 shades)
```css
--color-gray-50: #f9fafb;              /* Near white */
--color-gray-950: #030712;             /* Near black */
/* Use --color-gray-100 through --color-gray-900 for intermediate values */
```

### Text Colors
```css
--color-text-primary: #111827;         /* Main text */
--color-text-secondary: #6b7280;       /* Secondary text */
--color-text-tertiary: #9ca3af;        /* Tertiary text */
--color-text-inverted: #ffffff;        /* White text */
```

## Spacing System

All spacing uses 8px base unit:

```css
--space-0: 0;                          /* 0px */
--space-1: 0.125rem;                   /* 2px */
--space-2: 0.25rem;                    /* 4px */
--space-3: 0.5rem;                     /* 8px */
--space-4: 1rem;                       /* 16px */
--space-5: 1.25rem;                    /* 20px */
--space-6: 1.5rem;                     /* 24px */
--space-7: 1.75rem;                    /* 28px */
--space-8: 2rem;                       /* 32px */
/* ... up to --space-24: 6rem (96px) */
```

**Usage Pattern**:
```css
padding: var(--space-4);               /* 16px padding */
margin-bottom: var(--space-6);         /* 24px margin */
gap: var(--space-3);                   /* 8px gap */
```

## Shadow System

Six elevation levels for depth:

```css
--shadow-xs: 0 1px 2px ...;            /* Subtle */
--shadow-sm: 0 1px 3px ...;
--shadow-md: 0 4px 6px ...;            /* Medium (most common) */
--shadow-lg: 0 10px 15px ...;
--shadow-xl: 0 20px 25px ...;
--shadow-2xl: 0 25px 50px ...;         /* Large */
```

**Usage Pattern**:
```css
box-shadow: var(--shadow-md);          /* Standard card shadow */
box-shadow: var(--shadow-lg);          /* Elevated card/modal */
```

## Responsive Breakpoints

The design system uses mobile-first responsive design:

```css
/* Mobile (default) */
.grid { grid-template-columns: 1fr; }

/* Tablet (640px and up) */
@media (min-width: 640px) {
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
  .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}

/* Large screens (1280px and up) */
@media (min-width: 1280px) {
  /* Extra large layouts */
}
```

**Key Breakpoints**:
- **640px**: Mobile landscape / small tablet
- **768px**: Tablet portrait
- **1024px**: Tablet landscape / small desktop
- **1280px**: Large desktop

## Converting Legacy Screens

### Example: LoginScreen.jsx

**Before (old styling)**:
```jsx
import './authOutlook.css';

export default function LoginScreen() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sign In</h1>
        <input type="email" placeholder="Email" />
        <button>Sign In</button>
      </div>
    </div>
  );
}
```

**After (modern design system)**:
```jsx
export default function LoginScreen() {
  return (
    <div className="page-container">
      <div className="card card--elevated" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 className="heading heading--xl">Welcome Back</h1>
          <p className="text--secondary">Sign in to your account</p>
        </div>

        <form className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" placeholder="name@example.com" />

          <label className="form-label" style={{ marginTop: 'var(--space-6)' }}>
            Password
          </label>
          <input type="password" className="form-input" placeholder="••••••••" />

          <button type="submit" className="btn btn--primary btn--block">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Example: DashboardScreen.jsx

**Modern implementation**:
```jsx
export default function DashboardScreen() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your pledge summary.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">Total Pledges</span>
            <span className="stat-value">1,234</span>
          </div>
        </div>
        {/* More stat cards */}
      </div>

      {/* Content Section */}
      <div className="card card--elevated">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2>Recent Pledges</h2>
          <button className="btn btn--primary btn--sm">View All</button>
        </div>

        <table className="table">
          {/* Table content */}
        </table>
      </div>
    </div>
  );
}
```

## Utility Classes

Common utility classes for quick styling:

```html
<!-- Text utilities -->
<p class="text--primary">Primary text</p>
<p class="text--secondary">Secondary text</p>
<p class="text--tertiary">Tertiary text</p>

<!-- Text alignment -->
<div class="text-center">Centered text</div>
<div class="text-right">Right aligned</div>
<div class="text-left">Left aligned</div>

<!-- Display utilities -->
<div class="flex">Flex container</div>
<div class="flex flex-col">Flex column</div>
<div class="flex justify-between">Space between items</div>
<div class="flex items-center">Vertically centered</div>
<div class="flex gap-4">Items with spacing</div>

<!-- Margin/Padding -->
<div class="mt-4">Margin top</div>
<div class="mb-6">Margin bottom</div>
<div class="p-4">Padding all sides</div>
<div class="px-6">Padding horizontal</div>
<div class="py-4">Padding vertical</div>

<!-- Width/Height -->
<div class="w-full">Full width</div>
<div class="h-full">Full height</div>

<!-- Display -->
<div class="hidden">Hidden</div>
<div class="block">Block element</div>
<div class="inline-block">Inline block</div>

<!-- Border/Shadow -->
<div class="border border-gray-200">With border</div>
<div class="rounded-lg">Rounded corners</div>
<div class="shadow-md">With shadow</div>

<!-- Opacity -->
<div class="opacity-50">Semi-transparent</div>
```

## Accessibility Features

All components include accessibility features:

```html
<!-- Form labels (required for screen readers) -->
<label for="email" class="form-label">Email Address</label>
<input type="email" id="email" class="form-input">

<!-- ARIA labels for icon buttons -->
<button aria-label="Close menu" class="btn btn--ghost">
  <svg><!-- Icon --></svg>
</button>

<!-- Error messages (linked to form fields) -->
<input 
  type="email" 
  class="form-input form-input--error"
  aria-describedby="email-error"
>
<span id="email-error" class="form-error">Invalid email format</span>

<!-- Semantic HTML -->
<nav><!-- Navigation --></nav>
<main><!-- Main content --></main>
<aside><!-- Sidebar --></aside>
<section><!-- Content section --></section>
<article><!-- Article content --></article>
<footer><!-- Footer --></footer>
```

## Customization

### Changing Theme Colors

Edit `modern-design-system.css`:

```css
:root {
  /* Change primary color */
  --color-primary: #7c3aed;            /* Purple instead of blue */
  --color-primary-dark: #6d28d9;
  --color-primary-light: #ede9fe;
  
  /* Change accent color */
  --color-secondary: #06b6d4;          /* Cyan instead of green */
}
```

### Changing Fonts

Edit the Google Fonts link in `index.html` and update in `modern-design-system.css`:

```css
:root {
  --font-display: 'Poppins', sans-serif;   /* Change from Outfit */
  --font-body: 'Nunito', sans-serif;       /* Change from Inter */
}
```

### Changing Spacing Scale

Modify the spacing variables in `modern-design-system.css`:

```css
:root {
  --space-4: 1.125rem;  /* 18px instead of 16px */
  --space-6: 1.75rem;   /* 28px instead of 24px */
}
```

## Common Patterns

### Form with Validation

```jsx
export function FormWithValidation() {
  const [errors, setErrors] = useState({});

  return (
    <form>
      <div className="form-group">
        <label className="form-label">Name *</label>
        <input
          type="text"
          className={`form-input ${errors.name ? 'form-input--error' : ''}`}
          placeholder="Enter your name"
        />
        {errors.name && (
          <span className="form-error">{errors.name}</span>
        )}
      </div>

      <button type="submit" className="btn btn--primary btn--block">
        Submit
      </button>
    </form>
  );
}
```

### Card Grid with Loading

```jsx
export function CardGrid({ items, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card card--elevated">
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <div className="empty-state">No items found</div>;
  }

  return (
    <div className="grid grid-cols-3">
      {items.map(item => (
        <div key={item.id} className="card card--elevated">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Modal

```jsx
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
```

## Troubleshooting

### Styles not applying?
1. Ensure `modern-design-system.css` is imported FIRST
2. Check class names match exactly (case-sensitive)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check browser DevTools for CSS errors

### Colors look different than expected?
1. Verify CSS variable names (use `--color-primary`, not `--primary`)
2. Check that you're using the variable syntax: `var(--color-primary)`
3. Ensure no inline styles override the CSS variables

### Responsive layout breaking?
1. Check breakpoint order (640px → 768px → 1024px → 1280px)
2. Use mobile-first approach (styles for mobile by default)
3. Test in browser DevTools device emulation

### Components look misaligned?
1. Check parent container has `display: flex` or `display: grid`
2. Verify spacing variables are used (not hardcoded px values)
3. Check z-index values if overlapping elements

## Support

For questions about the design system:
- Review the CSS files directly (well-commented)
- Check this guide's Component Classes section
- Test components in browser DevTools
- Refer to layout.modern.css for layout patterns

---

**Last Updated**: January 2025
**Design System Version**: 2.0 (Modern)
