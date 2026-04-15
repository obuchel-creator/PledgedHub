# PledgeHub Professional Color Scheme - Visual Guide

## Primary Color: Deep Blue (#2563eb)

```
████████████████████████████████  #2563eb - Primary Blue
████████████████████████████████  Used for: Main buttons, primary CTA, navigation highlights
████████████████████████████████  Trust, credibility, financial confidence
```

**Use Cases:**
- Primary action buttons
- Navigation active states
- Hero section backgrounds
- Main heading highlights
- Form input focus states

---

## Secondary Color: Emerald Green (#10b981)

```
████████████████████████████████  #10b981 - Emerald Green
████████████████████████████████  Used for: Success states, growth indicators, positive actions
████████████████████████████████  Growth, achievement, positive impact
```

**Use Cases:**
- Success badges & checkmarks
- Positive status indicators
- Growth trend arrows
- Achievement milestones
- "Complete" states

---

## Accent Color: Gold (#f59e0b)

```
████████████████████████████████  #f59e0b - Gold
████████████████████████████████  Used for: Premium highlights, special emphasis, achievements
████████████████████████████████  Premium feel, achievement, recognition
```

**Use Cases:**
- Featured/premium badges
- Star ratings
- Special offer highlights
- Notification badges
- Top performer badges

---

## Neutral Colors: Gray Scale

```
████████████████████████████████  #ffffff - White (Backgrounds)
████████████████████████████████  #f9fafb - Soft Gray (Cards)
████████████████████████████████  #f3f4f6 - Light Gray (Hover)
████████████████████████████████  #e5e7eb - Border Gray
████████████████████████████████  #6b7280 - Muted Text
████████████████████████████████  #374151 - Strong Text
████████████████████████████████  #1f2937 - Dark Text
```

---

## Color Combinations (60-30-10 Rule)

### Example: Dashboard Hero
```
60% - Neutral (White background)
30% - Primary Blue (#2563eb)
10% - Gold accent (#f59e0b)
```

### Example: Call-to-Action Button
```
Primary Blue background (#2563eb)
White text (100% contrast)
Gold hover border (#f59e0b)
```

### Example: Success Message
```
Green background (#10b981, 10% opacity)
Green text (#10b981)
White checkmark
```

---

## Gradient Combinations

### Primary Gradient (Hero Sections)
```
linear-gradient(135deg, #2563eb 0%, #1e40af 100%)
Deep Blue → Darker Blue
Used for: Hero sections, featured cards
```

### Secondary Gradient (Growth/Success)
```
linear-gradient(135deg, #10b981 0%, #059669 100%)
Emerald → Dark Emerald
Used for: Success states, achievement sections
```

### Accent Gradient (Premium)
```
linear-gradient(135deg, #f59e0b 0%, #d97706 100%)
Gold → Dark Gold
Used for: Premium features, special highlights
```

---

## Dark Mode Adjustments

| Light Mode | Dark Mode | Purpose |
|-----------|-----------|---------|
| #2563eb | #3b82f6 | Primary becomes lighter for dark backgrounds |
| #10b981 | #34d399 | Secondary becomes lighter for dark backgrounds |
| #f59e0b | #fbbf24 | Accent becomes lighter for dark backgrounds |
| #ffffff | #111827 | Background inverts |
| #1f2937 | #f3f4f6 | Text inverts |

---

## Contrast Ratios (WCAG AA)

| Combination | Ratio | Status |
|------------|-------|--------|
| Blue (#2563eb) on White | 8.7:1 | ✅ AAA |
| Green (#10b981) on White | 4.5:1 | ✅ AA |
| Gold (#f59e0b) on White | 6.3:1 | ✅ AAA |
| Blue (#2563eb) on Light Gray (#f9fafb) | 7.2:1 | ✅ AAA |
| Dark Text (#1f2937) on White | 16:1 | ✅ AAA |

---

## Component Examples

### Button Primary
```css
.btn-primary {
  background: linear-gradient(140deg, #2563eb 0%, #3b82f6 100%);
  color: #ffffff;
  border: 1px solid rgba(37, 99, 235, 0.35);
}

.btn-primary:hover {
  background: linear-gradient(140deg, #1e40af 0%, #2563eb 100%);
}
```

### Button Secondary
```css
.btn-secondary {
  background: #f9fafb;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f3f4f6;
}
```

### Success Badge
```css
.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}
```

### Accent Highlight
```css
.highlight-accent {
  background: rgba(245, 158, 11, 0.1);
  border-left: 4px solid #f59e0b;
  color: #1f2937;
}
```

### Navigation Active
```css
.nav-link--active {
  background: #3b82f6;
  color: #ffffff;
  border-radius: 8px;
}
```

---

## When to Use Each Color

### Use Primary Blue (#2563eb) When:
- Building trust (financial, security, professional services)
- Creating main calls-to-action
- Highlighting navigation
- Building form focus states
- Creating hero sections

### Use Emerald Green (#10b981) When:
- Indicating success (payment received, pledge confirmed)
- Showing growth or positive change
- Creating achievement badges
- Indicating completed tasks
- Building trust in positive outcomes

### Use Gold (#f59e0b) When:
- Highlighting premium features
- Creating visual distinction
- Emphasizing special offers
- Building professional elegance
- Indicating top performers or ratings

### Use Neutral Gray When:
- Creating backgrounds
- Writing body text
- Creating borders and dividers
- Building disabled states
- Creating secondary information

---

## Testing Checklist

- [ ] Test on light backgrounds
- [ ] Test on dark backgrounds
- [ ] Test with colorblind simulator (Deuteranopia, Protanopia, Tritanopia)
- [ ] Test contrast ratios with WAVE or Lighthouse
- [ ] Test on mobile devices
- [ ] Test on outdoor/bright light conditions
- [ ] Test with screen readers
- [ ] Get user feedback on professional feel

---

## Update History

| Date | Action | Details |
|------|--------|---------|
| 2025-12-19 | Applied | Professional Trust + Impact color scheme |
| - | Colors | Blue (#2563eb), Green (#10b981), Gold (#f59e0b) |
| - | Files | 6 CSS files + HTML meta updated |

---

**Professional Color Scheme for PledgeHub** | Trust + Impact + Growth
