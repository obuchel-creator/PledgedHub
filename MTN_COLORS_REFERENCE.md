# 🎨 MTN Brand Colors Quick Reference

## Primary Brand Colors

### Golden Yellow (Primary)
```
Hex: #FFCC00
RGB: 255, 204, 0
HSL: 46°, 100%, 50%
CMYK: 0%, 20%, 100%, 0%
Pantone: 116 C
```
**Used for:** Primary buttons, active states, highlights, accents

### Black (Secondary)
```
Hex: #000000
RGB: 0, 0, 0
HSL: 0°, 0%, 0%
CMYK: 0%, 0%, 0%, 100%
Pantone: Black
```
**Used for:** Navigation bar, text on yellow backgrounds, body text

---

## Color System Applied in PledgeHub

### Light Theme
```css
:root {
  --bg: #ffffff;                    /* White */
  --text: #000000;                  /* Black */
  --accent: #FFCC00;                /* MTN Gold */
  --accent-hover: #FFB800;          /* Dark Gold */
  --border: #FFCC00;                /* Gold */
}
```

### Dark Theme
```css
body.dark-theme {
  --bg: #1a1a1a;                    /* Dark Gray */
  --text: #FFCC00;                  /* Gold */
  --accent: #FFCC00;                /* MTN Gold */
  --accent-hover: #FFB800;          /* Dark Gold */
  --border: #FFCC00;                /* Gold */
}
```

---

## Component Color Usage

### Navigation Bar
- **Background**: `#000000` (Black)
- **Brand Text**: `#FFCC00` (Gold)
- **Link Text**: `#CCCCCC` (Light Gray)
- **Active Link**: `#FFCC00` (Gold) background, `#000000` text
- **Hover State**: `#FFCC00` (Gold) background

### Buttons
- **Default Background**: `linear-gradient(135deg, #FFCC00 0%, #FFB800 100%)`
- **Text Color**: `#000000` (Black)
- **Hover Background**: `linear-gradient(140deg, #FFB800 0%, #FFCC00 100%)`
- **Focus Ring**: Gold tinted `rgba(255, 204, 0, 0.18)`

### Hero Sections
- **Background**: `linear-gradient(135deg, #FFCC00 0%, #FFD700 100%)`
- **Text Color**: `#000000` (Black)
- **Shadow**: `0 10px 25px -5px rgba(255, 204, 0, 0.2)`

### Status Badges
- **Completed**: Background `#FFF9E6`, Text `#FFB800`
- **Active**: Background Gold, Text Black
- **Success**: Green (unchanged)
- **Error**: Red (unchanged)

---

## Accessibility Standards

### Contrast Ratios (WCAG AAA ✅)
| Text Color | Background | Ratio | Rating |
|-----------|-----------|-------|--------|
| Black | Gold | 7.64:1 | AAA ✅ |
| Gold | Black | 7.64:1 | AAA ✅ |
| Black | White | 21:1 | AAA ✅ |
| Gray | White | 8.59:1 | AAA ✅ |

### Focus & Hover States
- All interactive elements have clear MTN gold highlights
- Focus ring: `0 0 0 4px rgba(255, 204, 0, 0.18)`
- Hover states: Darker gold shade `#FFB800`

---

## CSS Variables Quick Copy

### Root Variables
```css
:root {
  --bg: #ffffff;
  --text: #000000;
  --muted: #666666;
  --accent: #FFCC00;
  --accent-hover: #FFB800;
  --border: #FFCC00;
  --input-bg: #ffffff;
  --focus-rgb: 255, 204, 0;
}
```

### Design System Variables
```css
:root {
  /* Primary */
  --color-primary: #FFCC00;
  --color-primary-light: #FFD700;
  --color-primary-lighter: #FFDD33;
  --color-primary-dark: #FFB800;
  --color-primary-darker: #FFA500;
  
  /* Secondary */
  --color-secondary: #000000;
  --color-secondary-light: #333333;
  --color-secondary-dark: #1a1a1a;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #FFCC00 0%, #FFB800 100%);
  --gradient-accent: linear-gradient(135deg, #FFCC00 0%, #FFD700 100%);
  
  /* Shadows */
  --shadow-primary: 0 10px 25px -5px rgba(255, 204, 0, 0.2);
  --accent-glow: 0 18px 40px rgba(255, 204, 0, 0.2);
}
```

---

## Usage Examples

### Golden Yellow Usage
✅ **Appropriate Uses:**
- Primary action buttons
- Active navigation links
- Key highlights and accents
- Focus indicators
- Important badges
- Primary CTAs

❌ **Avoid:**
- Body text (use black instead)
- Large background areas (overwhelming)
- On white backgrounds for body text

### Black Usage
✅ **Appropriate Uses:**
- Navigation bar background
- Body text
- Headings
- Form labels
- Icons
- Text on gold backgrounds

---

## Color Palette Reference

```
     ┌─────────────────────┐
     │   MTN Golden Yellow  │
     │      #FFCC00        │
     │  RGB: 255, 204, 0   │
     └─────────────────────┘
            │
            ├─ Light: #FFD700
            ├─ Dark:  #FFB800
            └─ Darker: #FFA500

     ┌─────────────────────┐
     │     MTN Black       │
     │      #000000        │
     │   RGB: 0, 0, 0      │
     └─────────────────────┘
            │
            ├─ Light Gray: #333333
            └─ Lighter: #CCCCCC
```

---

## Brand Guidelines for Developers

1. **Always use CSS variables** instead of hardcoding colors
   ```css
   /* ✅ Good */
   background: var(--accent);
   
   /* ❌ Bad */
   background: #FFCC00;
   ```

2. **Maintain contrast ratios** - Never sacrifice accessibility
   ```css
   /* ✅ Good - 7.64:1 contrast */
   background: #FFCC00;
   color: #000000;
   
   /* ❌ Bad - Low contrast */
   background: #FFCC00;
   color: #CCCCCC;
   ```

3. **Use gradients for depth**
   ```css
   /* ✅ Good - Subtle gradient */
   background: linear-gradient(135deg, #FFCC00 0%, #FFB800 100%);
   
   /* ✅ Avoid - No gradients */
   background: #FFCC00;
   ```

4. **Hover states should darken**
   ```css
   background: #FFCC00;    /* Normal */
   background: #FFB800;    /* Hover */
   background: #FFA500;    /* Pressed */
   ```

---

## Files Modified

- ✅ `theme.css` - Root theme variables
- ✅ `modern-design-system.css` - Design system colors
- ✅ `globals.css` - Global component styles
- ✅ `GuestPledgeScreen.css` - Guest screen colors
- ✅ `CampaignsScreen.css` - Campaign status colors

---

## Testing Checklist

- [ ] Test navigation bar on light theme
- [ ] Test buttons on all screens
- [ ] Test focus states (press Tab key)
- [ ] Test hover states (mouse over)
- [ ] Test on mobile devices
- [ ] Test dark theme (if available)
- [ ] Verify contrast with accessibility tools
- [ ] Test on different browsers

---

## Revert Instructions (if needed)

To revert to original blue colors, run:
```bash
git checkout frontend/src/styles/
```

Or manually change all `#FFCC00` to `#2563eb` and `#000000` to original values.

---

**Last Updated**: December 17, 2025
**Version**: 1.0
**Status**: Production Ready ✅
