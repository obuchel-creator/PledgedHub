# Mobile Responsive Breakpoint Visual Guide

## 📱 Breakpoint Reference Card

### 1. MOBILE PHONE (320px - 640px)

```
┌─────────────────────────────────┐
│  PledgeHub        [≡]           │  64px Header
├─────────────────────────────────┤
│                                 │
│  Single Column Layout           │
│  ─────────────────             │
│                                 │
│  [  Full-Width Card  ]          │
│  ≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠           │
│                                 │
│  [  Full-Width Card  ]          │
│  ≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠≠           │
│                                 │
│  ┌────────────────────────┐     │
│  │ [   Full-Width Button  ]│    │
│  └────────────────────────┘     │
│                                 │
│  Hamburger Menu Items:          │
│  ─────────────────────          │
│  • Home                         │
│  • Pledges                      │
│  • Campaigns                    │
│  • Analytics                    │
│                                 │
└─────────────────────────────────┘

Key Characteristics:
✓ Full-width content (100%)
✓ Hamburger menu (≡)
✓ Single column
✓ Padding: 12px
✓ Font: 14-16px
✓ Button height: 44px
✓ Touch targets: 44×44px min
```

### 2. TABLET / LARGE PHONE (641px - 1024px)

```
┌──────────────────────────────────────────────┐
│  PledgeHub              [Menu Items]     [User ▼] │  64px Header
├──────────────────────────────────────────────┤
│                                              │
│  Two Column Layout                          │
│  ───────────────────────                    │
│                                              │
│  [  Card 1  ]    [  Card 2  ]               │
│  ≠≠≠≠≠≠≠≠≠≠≠      ≠≠≠≠≠≠≠≠≠≠≠               │
│                                              │
│  [  Card 3  ]    [  Card 4  ]               │
│  ≠≠≠≠≠≠≠≠≠≠≠      ≠≠≠≠≠≠≠≠≠≠≠               │
│                                              │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  [Button]       │  │  [Button]        │  │
│  └─────────────────┘  └──────────────────┘  │
│                                              │
│  Sidebar (optional):                        │
│  ───────────────────                        │
│  • Quick Links                              │
│  • Recent Items                             │
│  • Filters                                  │
│                                              │
└──────────────────────────────────────────────┘

Key Characteristics:
✓ 2-column grid
✓ Menu visible (not hamburger)
✓ Wider padding: 16px
✓ Better spacing: 16px gaps
✓ Font: 16px
✓ Sidebar support
✓ Responsive images
```

### 3. DESKTOP (1025px+)

```
┌──────────────────────────────────────────────────────────────────┐
│  PledgeHub    Home  Pledges  Campaigns  Analytics     [User ▼]    │ 64px
├───────────────┬────────────────────────────────────────┬─────────┤
│               │                                        │         │
│   Sidebar     │  Three Column Main Content             │ Right   │
│   ──────      │  ─────────────────────────────         │ Panel   │
│               │                                        │         │
│ • Dashboard   │  [  Card 1  ] [  Card 2  ] [  Card 3 ]│ • Stats │
│ • Pledges     │  ≠≠≠≠≠≠≠≠≠≠≠ ≠≠≠≠≠≠≠≠≠≠≠ ≠≠≠≠≠≠≠≠≠  │ • Help  │
│ • Campaigns   │                                        │ • Quick │
│ • Analytics   │  [  Card 4  ] [  Card 5  ] [  Card 6 ]│ Links   │
│ • Settings    │  ≠≠≠≠≠≠≠≠≠≠≠ ≠≠≠≠≠≠≠≠≠≠≠ ≠≠≠≠≠≠≠≠≠  │         │
│ • Admin       │                                        │ • Ads   │
│               │  ┌──────────┐ ┌──────────┐ ┌────────┐ │ • More  │
│               │  │ [Button] │ │ [Button] │ │ [Btn]  │ │         │
│               │  └──────────┘ └──────────┘ └────────┘ │         │
│               │                                        │         │
└───────────────┴────────────────────────────────────────┴─────────┘

Key Characteristics:
✓ 3-column main grid
✓ Left sidebar navigation
✓ Right sidebar (optional)
✓ Full horizontal menu
✓ Max-width container (1200px)
✓ Large padding: 24px
✓ Large gaps: 20px
✓ Font: 16px+
✓ Multi-column layouts
```

---

## 🎨 Component Responsiveness Examples

### BUTTON RESPONSIVENESS

```
Mobile (640px)          Tablet (768px)          Desktop (1200px)
═══════════════         ══════════════          ═══════════════

┌─────────────────┐     ┌──────────┐            ┌────────┐
│ [Full Width]    │     │ [Button] │            │ [Btn]  │
│   44px height   │     │ 44px     │            │ 44px   │
└─────────────────┘     └──────────┘            └────────┘

Padding: 12px           Padding: 14px           Padding: 10px
Width: 100%             Width: auto             Width: auto
```

### FORM RESPONSIVENESS

```
Mobile (640px)                  Desktop (1024px)
═══════════════════             ═════════════════════════

┌──────────────────┐           ┌──────────────┐ ┌──────────────┐
│ Name             │           │ Name         │ │ Email        │
│ [            ]   │           │ [         ]  │ │ [         ]  │
└──────────────────┘           └──────────────┘ └──────────────┘

┌──────────────────┐           ┌──────────────┐ ┌──────────────┐
│ Email            │           │ Phone        │ │ Amount       │
│ [            ]   │           │ [         ]  │ │ [         ]  │
└──────────────────┘           └──────────────┘ └──────────────┘

┌──────────────────┐
│ Phone            │
│ [            ]   │
└──────────────────┘

Single column layout           Two column layout
All fields full-width          Side-by-side fields
```

### GRID RESPONSIVENESS

```
Mobile (640px)               Tablet (768px)              Desktop (1200px)
═════════════════            ══════════════              ═══════════════

┌──────────────┐            ┌────────────┐ ┌────────┐   ┌───┐ ┌───┐ ┌───┐
│   Card 1     │            │   Card 1   │ │Card 2  │   │C1 │ │C2 │ │C3 │
└──────────────┘            └────────────┘ └────────┘   └───┘ └───┘ └───┘

┌──────────────┐            ┌────────────┐ ┌────────┐   ┌───┐ ┌───┐ ┌───┐
│   Card 2     │            │   Card 3   │ │Card 4  │   │C4 │ │C5 │ │C6 │
└──────────────┘            └────────────┘ └────────┘   └───┘ └───┘ └───┘

┌──────────────┐
│   Card 3     │
└──────────────┘

1 column                   2 columns                 3 columns
Full width                 Half width               Auto width
```

---

## 📏 Sizing Reference

### TOUCH TARGETS (Mobile)
```
┌────────────────────────────────┐
│                                │
│      44px × 44px minimum       │  ← Apple/Google standard
│                                │
│  Actual button size can be     │
│  larger, but internal spacing  │
│  must allow 44×44px tap area   │
│                                │
└────────────────────────────────┘
```

### SPACING SCALE
```
Mobile              Tablet              Desktop
══════              ══════              ═══════

Gap: 12px           Gap: 16px           Gap: 20px
Padding: 12px       Padding: 16px       Padding: 24px
Margin: 8px         Margin: 12px        Margin: 16px

All spacing increases with screen size
for better visual hierarchy
```

### FONT SIZES
```
Mobile    Tablet    Desktop   Usage
══════    ══════    ═══════   ═════
12px      14px      16px      Small text / captions
14px      15px      16px      Body text
16px      17px      18px      Regular headings
18px      20px      24px      Large headings
24px      30px      36px      Section titles
30px      36px      48px      Page titles
```

---

## 🔄 Navigation Patterns

### MOBILE HAMBURGER MENU
```
┌──────────────────────┐
│ PledgeHub [≡]        │  ← Hamburger when < 768px
├──────────────────────┤
│ ☰ Menu               │  ← Mobile menu
│ • Home               │
│ • Pledges            │
│ • Campaigns          │
│ • Analytics          │
│ • Profile            │
│ • Logout             │
└──────────────────────┘
```

### TABLET/DESKTOP MENU
```
┌─────────────────────────────────────────────┐
│ PledgeHub  Home  Pledges  Campaigns  ..  [User▼]│ ← Horizontal when > 768px
├─────────────────────────────────────────────┤
│ Main content...                             │
└─────────────────────────────────────────────┘
```

---

## 📊 Media Query Breakpoints Used

```css
/* iPhone SE, small Android */
@media (max-width: 480px) { }

/* Most smartphones */
@media (max-width: 640px) { }

/* Small tablets, landscape phone */
@media (min-width: 641px) { }

/* iPad, large tablets */
@media (max-width: 1024px) { }

/* Desktop computers */
@media (min-width: 1025px) { }

/* Large desktop monitors */
@media (min-width: 1280px) { }
```

---

## ✅ Responsive Checklist

For Each Component, Verify:

### Mobile (640px)
- [ ] Full width (100%)
- [ ] Single column
- [ ] 44px+ touch targets
- [ ] 12px padding
- [ ] 16px+ font
- [ ] No horizontal scroll
- [ ] Content stacked

### Tablet (768px-1024px)
- [ ] 2-column layout
- [ ] Wider padding (16px)
- [ ] Better spacing
- [ ] Readable text
- [ ] Forms usable

### Desktop (1025px+)
- [ ] 3-column or more
- [ ] Full menu visible
- [ ] 24px padding
- [ ] Max-width container
- [ ] Sidebar optional

---

## 🎯 Visual Testing Workflow

```
1. Start small (mobile)
   └─ Test at 375px

2. Tablet size
   └─ Test at 768px

3. Desktop
   └─ Test at 1200px

4. Landscape
   └─ Test rotated

5. Real devices
   └─ iPhone + Android
```

---

## 📱 Quick Device Dimensions

| Device | Width | Height | DPR |
|--------|-------|--------|-----|
| iPhone SE | 375px | 667px | 2x |
| iPhone 12 | 390px | 844px | 3x |
| iPhone 14 Pro | 393px | 852px | 3x |
| Galaxy S21 | 360px | 800px | 2x |
| Galaxy S22 | 360px | 800px | 2x |
| iPad Mini | 768px | 1024px | 2x |
| iPad Pro 11" | 834px | 1194px | 2x |
| iPad Pro 12.9" | 1024px | 1366px | 2x |
| Desktop | 1920px | 1080px | 1x |

---

## 🎨 Color Contrast on Mobile

Ensure readability:

```
Text Color          Background        Contrast    Mobile ✓
════════════        ══════════        ════════    ════════
#111827 (dark)      #ffffff (white)   21:1        ✓ AA+
#374151 (gray)      #ffffff (white)   9.3:1       ✓ AA+
#ffffff (white)     #2563eb (blue)    7:1         ✓ AA
#ffffff (white)     #1e40af (dark)    14:1        ✓ AA+

All color combinations pass WCAG 2.1 AA on mobile
```

---

**This visual guide helps developers understand responsive layouts at each breakpoint.**

**Print this guide for reference when developing!** 📋
