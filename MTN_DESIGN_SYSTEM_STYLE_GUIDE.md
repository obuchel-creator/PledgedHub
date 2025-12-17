# PledgeHub MTN Design System - Style Guide

## Brand Identity

### MTN Colors
The MTN MoMo Developer website uses a distinctive color scheme centered around MTN Yellow, which represents energy, innovation, and connectivity across Africa.

```
Primary: #FCD116 (MTN Yellow)
This is the iconic MTN color - vibrant, attention-grabbing, and instantly recognizable.
Used for: CTAs, accent elements, links, active states
```

### Color Psychology in PledgeHub

**Dark Theme Benefits:**
- Reduces eye strain during extended use
- Modern, premium appearance
- Better contrast for accessibility
- Ideal for financial/transaction apps
- Highlights the bright yellow accents

**MTN Yellow (#FCD116):**
- Energy and forward momentum
- Trust and reliability (financial context)
- Visibility in dark interface
- Cultural relevance (African market)

## Typography System

### Font Stack
```
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
"Roboto",
"Helvetica Neue",
Arial,
sans-serif
```

This provides:
- ✅ Native fonts on each platform
- ✅ Zero loading time
- ✅ Best readability
- ✅ Consistent appearance

### Hierarchy

**Headings** - Bold (700), tight line-height (1.2)
```
H1: 40px - Page titles, main headings
H2: 32px - Section headers
H3: 24px - Subsection headers
H4: 20px - Card titles, emphasis
H5: 18px - Minor headings
H6: 16px - Small emphasis text
```

**Body** - Regular (400), relaxed line-height (1.6)
```
16px - Main body text
15px - Form labels, UI text
14px - Secondary text, messages
13px - Small text, captions
```

## Component Examples

### Login Card Layout
```
┌─────────────────────────────────────────┐
│                                         │
│         [PLEDGEHUB LOGO]                │
│                                         │
│         Sign In to PledgeHub            │
│         Enter your credentials          │
│                                         │
│  EMAIL *                                │
│  [______________________________]        │
│                                         │
│  PASSWORD *                             │
│  [______________________________]        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ SIGN IN (MTN Yellow Button)      │   │
│  └─────────────────────────────────┘   │
│                                         │
│    Don't have an account? Register      │
│    [Forgot password?]                   │
│                                         │
│         [Or continue with] ─────        │
│         [Google] [Facebook]             │
│                                         │
└─────────────────────────────────────────┘

Dimensions:
- Max width: 420px
- Padding: 50px 40px
- Border radius: 12px
- Background: Gradient dark (#1a1a1a → #252525)
- Shadow: Heavy drop shadow with yellow glow
```

### Button Progression

**Idle State**
```
Background: Linear gradient (MTN Yellow → Light Yellow)
Text: Dark (#0f0f0f) - strong contrast
Shadow: Yellow glow (0 8px 20px rgba(252, 209, 22, 0.3))
```

**Hover State**
```
Background: Lighter gradient
Transform: translateY(-2px) - lifted effect
Shadow: Enhanced glow (0 12px 30px ...)
```

**Active State**
```
Transform: translateY(0) - pressed effect
Shadow: Reduced (0 4px 12px ...)
```

**Disabled State**
```
Opacity: 50%
Cursor: not-allowed
Transform: None
```

### Input Field States

**Empty/Default**
```
Border: 1px solid #333333
Background: #2a2a2a
Placeholder: #808080 (muted gray)
```

**Focus**
```
Border: 1px solid #FCD116 (yellow)
Background: #333333 (slightly lighter)
Box-shadow: 0 0 0 3px rgba(252, 209, 22, 0.15) (yellow glow)
```

**Error**
```
Border: 1px solid #ff6b6b (red)
Background: rgba(239, 68, 68, 0.1) (red tint)
Message: Red text below field
```

## Spacing Scale

Used throughout the app for consistency:

```
8px   - mt-1, mb-1, p-1
16px  - mt-2, mb-2, p-2 (standard)
24px  - mt-3, mb-3, p-3
32px  - mt-4, mb-4, p-4
```

## Shadow System

Creates depth and hierarchy:

```
Subtle     - 0 4px 12px rgba(0, 0, 0, 0.3)
Medium     - 0 8px 24px rgba(0, 0, 0, 0.4)
Heavy      - 0 20px 60px rgba(0, 0, 0, 0.5)
Yellow     - 0 8px 20px rgba(252, 209, 22, 0.3)
```

## Animation Timings

Consistent, professional transitions:

```
Fast       - 0.2s ease (buttons, hovers)
Normal     - 0.3s ease (standard interactions)
Slow       - 0.5s ease (page transitions, modals)
```

## Responsive Breakpoints

### Desktop (> 1200px)
- Full layout
- Maximum spacing
- H1: 2.5rem

### Tablet (768px - 1200px)
- Adjusted widths
- Reduced heading sizes
- Optimized spacing

### Mobile (< 768px)
- Single column layout
- Full-width elements
- H1: 1.75rem

### Small Mobile (< 480px)
- Minimal spacing
- H1: 1.5rem
- Buttons: Full width
- Input font: 16px (prevents iOS zoom)

## Accessibility Considerations

### Color Contrast
- MTN Yellow (#FCD116) on dark (#1a1a1a): 10.5:1 ratio ✅ WCAG AAA
- White text on dark: 16:1+ ratio ✅ WCAG AAA
- Gray text on dark: 7:1+ ratio ✅ WCAG AA

### Typography
- Minimum 14px for body text (readability)
- Line-height 1.5-1.6 (comfortable reading)
- Proper heading hierarchy maintained

### Interactive Elements
- Minimum 44px touch target (mobile)
- Clear focus states (yellow border + glow)
- Disabled states clearly indicated

### Form Labels
- Always associated with inputs
- Proper `for` attribute usage
- Uppercase styling with proper spacing

## Dark Mode Performance

**Benefits:**
- Reduces blue light emission (better for eyes)
- Extends battery life on OLED screens
- Improves readability in low-light environments
- Professional appearance

**Implementation:**
- No JS required (pure CSS)
- Respects system preference (prefers-color-scheme)
- Manual toggle support
- LocalStorage persistence

## Component Library

### Buttons
```css
.btn              /* Base styles */
.btn-primary      /* Default yellow button */
.btn-secondary    /* Dark alternate */
.btn-ghost        /* Transparent variant */
```

### Alerts
```css
.alert            /* Base container */
.alert-success    /* Green success message */
.alert-error      /* Red error message */
.alert-warning    /* Orange warning message */
.alert-info       /* Blue info message */
```

### Badges
```css
.badge            /* Base badge */
.badge-success    /* Green badge */
.badge-error      /* Red badge */
.badge-warning    /* Orange badge */
.badge-mtn        /* Yellow badge */
```

### Utilities
```css
.text-center      /* Center text */
.text-muted       /* Muted gray text */
.mt-1, .mt-2      /* Margin top */
.mb-1, .mb-2      /* Margin bottom */
.p-1, .p-2        /* Padding */
.flex             /* Flexbox container */
.flex-center      /* Centered flex */
.rounded          /* Border radius */
```

## Real-World Application

### Login Page
- Dark card with yellow button
- Subtle glow on focus
- Clear error messaging (red alert)
- Success confirmation (green alert)

### Pledge Creation
- Form inputs with yellow focus
- Primary yellow submit button
- Secondary gray cancel button
- Validation messages with proper colors

### Dashboard
- Card-based layout with borders
- Yellow accent on important CTAs
- Badge components for status
- Proper visual hierarchy

## Future Variants

### Light Mode (Optional)
```
Background: #ffffff (white)
Text: #1a1a1a (dark)
Accent: #FCD116 (same yellow)
```

### High Contrast (Accessibility)
```
Background: Pure black (#000000)
Text: Pure white (#ffffff)
Accent: Brighter yellow (#FFE500)
```

## Testing Checklist

- [ ] Verify colors on different screens
- [ ] Test focus states on keyboard navigation
- [ ] Check contrast ratios with accessibility tools
- [ ] Test on mobile devices (iOS + Android)
- [ ] Verify animations are smooth
- [ ] Test with screen readers
- [ ] Check button interactions
- [ ] Verify form validation messages
- [ ] Test responsive breakpoints
- [ ] Check dark mode appearance

## Resources

**Color Tools:**
- WebAIM Contrast Checker: webaim.org/resources/contrastchecker
- Accessible Colors: accessible-colors.com

**Font Reference:**
- System fonts provide best performance
- No web fonts needed (faster loading)
- Native appearance on all platforms

**Responsive Design:**
- Mobile First approach
- Progressive enhancement
- Touch-friendly sizes (44px minimum)

---

**Design System Version**: 1.0
**Status**: ✅ Production Ready
**Last Updated**: December 17, 2025

For implementation questions, refer to `MTN_THEME_IMPLEMENTATION_COMPLETE.md`
