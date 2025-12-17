# MTN Design System - Visual Examples & HTML Snippets

## 🎨 Live Examples

### Example 1: Login Form

```html
<body class="auth-bg">
  <main>
    <section class="auth-center-card">
      <div style="width: 100%; text-align: center; margin-bottom: 32px;">
        <img src="pledgehub-logo.png" alt="PledgeHub Logo" height="50">
      </div>

      <h2>Sign In to PledgeHub</h2>
      <p class="subtitle">
        Access your pledge account and manage your giving
      </p>

      <form onsubmit="handleLogin(event)">
        <div>
          <label for="email">EMAIL ADDRESS *</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            autofocus
          >
        </div>

        <div>
          <label for="password">PASSWORD *</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••••"
            required
          >
        </div>

        <button type="submit" class="btn btn-primary">
          SIGN IN
        </button>
      </form>

      <a href="/forgot-password" style="display: block; margin-top: 16px;">
        Forgot your password?
      </a>

      <div class="auth-divider">OR CONTINUE WITH</div>

      <div style="display: flex; gap: 12px;">
        <button type="button" class="btn btn-secondary" style="flex: 1;">
          Google
        </button>
        <button type="button" class="btn btn-secondary" style="flex: 1;">
          Facebook
        </button>
      </div>

      <p style="margin-top: 24px;">
        Don't have an account?
        <a href="/register">Create one now</a>
      </p>
    </section>
  </main>
</body>
```

**Visual Result:**
```
┌────────────────────────────────────────────┐
│  Dark Background with Gradient             │
│  ┌──────────────────────────────────────┐  │
│  │  🏢 PledgeHub Logo                   │  │
│  │                                      │  │
│  │  Sign In to PledgeHub                │  │
│  │  Access your pledge account...       │  │
│  │                                      │  │
│  │  EMAIL ADDRESS *                     │  │
│  │  [____________________________]       │  │
│  │                                      │  │
│  │  PASSWORD *                          │  │
│  │  [____________________________]       │  │
│  │                                      │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ 🟨 SIGN IN (MTN Yellow)      │   │  │
│  │  └──────────────────────────────┘   │  │
│  │                                      │  │
│  │      Forgot your password?           │  │
│  │                                      │  │
│  │      ─────── OR CONTINUE WITH ────── │  │
│  │  [Google]             [Facebook]     │  │
│  │                                      │  │
│  │  Don't have account? Create one      │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

### Example 2: Register Form

```jsx
<section class="auth-center-card">
  <h2>Create Your Account</h2>
  <p class="subtitle">Join thousands managing pledges with PledgeHub</p>

  <form onsubmit="handleRegister(event)">
    <div>
      <label>FIRST NAME *</label>
      <input type="text" placeholder="John" required />
    </div>

    <div>
      <label>LAST NAME *</label>
      <input type="text" placeholder="Doe" required />
    </div>

    <div>
      <label>EMAIL ADDRESS *</label>
      <input type="email" placeholder="john@example.com" required />
    </div>

    <div>
      <label>PHONE NUMBER *</label>
      <input type="tel" placeholder="+256 700 000 000" required />
    </div>

    <div>
      <label>PASSWORD *</label>
      <input type="password" placeholder="At least 8 characters" required />
    </div>

    <div>
      <label>CONFIRM PASSWORD *</label>
      <input type="password" placeholder="Confirm your password" required />
    </div>

    <button type="submit" class="btn btn-primary">
      CREATE ACCOUNT
    </button>
  </form>

  <p style="margin-top: 16px;">
    Already have an account? <a href="/login">Sign in</a>
  </p>
</section>
```

---

### Example 3: Error & Success Messages

#### Success Alert
```jsx
<div class="alert alert-success">
  ✓ Your pledge has been created successfully!
</div>
```

**Visual:**
```
┌─────────────────────────────────────────┐
│ 🟢 Background: rgba(16, 185, 129, 0.1) │
│ ✓ Your pledge has been created!         │
│ 🟢 Text: #10b981                        │
└─────────────────────────────────────────┘
```

#### Error Alert
```jsx
<div class="alert alert-error">
  ✗ Invalid email or password
</div>
```

**Visual:**
```
┌─────────────────────────────────────────┐
│ 🔴 Background: rgba(239, 68, 68, 0.1)  │
│ ✗ Invalid email or password             │
│ 🔴 Text: #ff6b6b                        │
└─────────────────────────────────────────┘
```

#### Warning Alert
```jsx
<div class="alert alert-warning">
  ⚠ You have 2 days to complete this pledge
</div>
```

#### Info Alert
```jsx
<div class="alert alert-info">
  ℹ Your payment confirmation has been sent
</div>
```

---

### Example 4: Button Variants

```jsx
{/* Primary Button - Default */}
<button class="btn btn-primary">Sign In</button>

{/* Secondary Button */}
<button class="btn btn-secondary">Cancel</button>

{/* Ghost Button */}
<button class="btn btn-ghost">Learn More</button>

{/* Disabled Button */}
<button class="btn btn-primary" disabled>Signing in...</button>

{/* Full Width Button */}
<button class="btn btn-primary" style="width: 100%;">
  Complete Payment
</button>
```

**Visual Progression:**

Idle State → Hover State → Active State
```
[🟨 Sign In] → [🟨 Sign In] → [🟨 Sign In]
  (shadow)      (lifted)      (pressed)
```

---

### Example 5: Form Input States

```jsx
{/* Default Input */}
<input type="email" placeholder="Enter your email" />

{/* Focused Input */}
<input type="email" placeholder="Enter your email" autofocus />

{/* With Error */}
<input type="email" value="invalid" class="input-error" />
<span style="color: #ff6b6b; font-size: 13px;">Invalid email format</span>

{/* Disabled Input */}
<input type="text" value="John Doe" disabled />

{/* Success State */}
<input type="email" value="john@example.com" class="input-success" />
<span style="color: #10b981; font-size: 13px;">✓ Email verified</span>
```

**Visual States:**

```
Default State:
┌─────────────────────────┐
│ Enter your email        │
│ Border: #333333         │
│ Background: #2a2a2a     │
└─────────────────────────┘

Focus State:
┌─────────────────────────┐
│ john@example.com        │  ← Yellow glow
│ Border: #FCD116         │
│ Background: #333333     │
└─────────────────────────┘

Error State:
┌─────────────────────────┐
│ invalid@              │
│ Border: #ff6b6b         │  ← Red border
│ Background: #2a2a2a     │
└─────────────────────────┘
✗ Invalid email format
```

---

### Example 6: Card Components

```jsx
<div class="card">
  <h3>Active Pledges</h3>
  <p>You have 5 active pledges</p>
  
  <div style="display: flex; justify-content: space-between; margin-top: 16px;">
    <div>
      <span class="text-muted">Total Pledged</span>
      <h4 style="color: #FCD116; margin: 8px 0;">UGX 500,000</h4>
    </div>
    <div>
      <span class="text-muted">Collected</span>
      <h4 style="color: #10b981; margin: 8px 0;">UGX 250,000</h4>
    </div>
  </div>
  
  <button class="btn btn-primary" style="margin-top: 20px; width: 100%;">
    View Details
  </button>
</div>
```

---

### Example 7: Badge Components

```jsx
{/* Status Badges */}
<span class="badge badge-success">Completed</span>
<span class="badge badge-warning">In Progress</span>
<span class="badge badge-error">Overdue</span>
<span class="badge badge-info">Pending</span>
<span class="badge badge-mtn">Featured</span>
```

**Visual:**
```
[✓ Completed]  [⚠ In Progress]  [✗ Overdue]  [ℹ Pending]  [🟨 Featured]
 Green          Orange            Red         Blue         Yellow
```

---

### Example 8: Form Layout

```jsx
<section class="auth-center-card">
  <h2>Payment Information</h2>
  
  <form onsubmit="handlePayment(event)">
    {/* Error Message */}
    {error && <div class="alert alert-error">{error}</div>}
    
    {/* Success Message */}
    {success && <div class="alert alert-success">Payment successful!</div>}
    
    {/* Form Fields */}
    <div>
      <label for="amount">Amount (UGX) *</label>
      <input
        id="amount"
        type="number"
        placeholder="Enter amount"
        required
      />
    </div>

    <div>
      <label for="phone">Phone Number *</label>
      <input
        id="phone"
        type="tel"
        placeholder="+256 700 000 000"
        required
      />
    </div>

    <div>
      <label for="method">Payment Method *</label>
      <select id="method" required>
        <option value="">Select method</option>
        <option value="mtn">MTN Mobile Money</option>
        <option value="airtel">Airtel Money</option>
        <option value="bank">Bank Transfer</option>
      </select>
    </div>

    {/* Primary Button */}
    <button type="submit" class="btn btn-primary" disabled={loading}>
      {loading ? 'Processing...' : 'PAY NOW'}
    </button>

    {/* Secondary Button */}
    <button type="button" class="btn btn-secondary">
      CANCEL
    </button>
  </form>
</section>
```

---

### Example 9: Responsive Layout

```css
/* Mobile First - Default */
.auth-center-card {
  max-width: 100%;
  padding: 24px 16px;
  margin: 20px;
}

h1 { font-size: 1.5rem; }
h2 { font-size: 1.25rem; }

button, input {
  width: 100%;
  font-size: 16px; /* Prevents zoom on iOS */
}

/* Tablet (≥ 480px) */
@media (min-width: 480px) {
  .auth-center-card {
    padding: 32px 24px;
  }
  
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.5rem; }
}

/* Desktop (≥ 768px) */
@media (min-width: 768px) {
  .auth-center-card {
    max-width: 420px;
    padding: 50px 40px;
  }
  
  h1 { font-size: 2.5rem; }
  h2 { font-size: 2rem; }
}
```

---

### Example 10: Navigation Bar

```jsx
<nav>
  <div class="container flex flex-between">
    {/* Logo */}
    <a href="/" style="display: flex; align-items: center; gap: 8px;">
      <img src="logo.png" alt="PledgeHub" height="30" />
      <span style="font-weight: 700; color: #FCD116;">PledgeHub</span>
    </a>

    {/* Navigation Links */}
    <div style="display: flex; gap: 24px;">
      <a href="/campaigns" class="active">Campaigns</a>
      <a href="/dashboard">Dashboard</a>
      <a href="/about">About</a>
    </div>

    {/* User Menu */}
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-secondary" style="padding: 8px 16px;">
        Sign In
      </button>
      <button class="btn btn-primary" style="padding: 8px 16px;">
        Create Pledge
      </button>
    </div>
  </div>
</nav>

<style>
  nav a.active {
    color: #FCD116;
    border-bottom: 2px solid #FCD116;
    padding-bottom: 4px;
  }
</style>
```

---

## 🎯 Color Usage Guide

### When to Use MTN Yellow (#FCD116)
✅ Primary buttons
✅ Links and interactive elements
✅ Important highlights
✅ Icons for emphasis
✅ Status badges (premium)
✅ Focus states
✅ Loading indicators

### When to Use Success Green (#10b981)
✅ Confirmation messages
✅ Success states
✅ Checkmarks
✅ Verified badges
✅ Positive feedback

### When to Use Error Red (#ff6b6b)
✅ Error messages
✅ Invalid states
✅ Warning icons
✅ Delete confirmations
✅ Negative feedback

### When to Use Info Blue (#3b82f6)
✅ Information messages
✅ Tips and hints
✅ Help text
✅ Notifications

---

## 📱 Responsive Example

### Mobile (< 480px)
```
┌─────────────────┐
│   PledgeHub     │ ← Logo stacked
│                 │
│  Sign In        │ ← Large heading
│  Enter creds    │
│                 │
│ [Email      ]   │ ← Full width
│ [Password   ]   │
│ [SIGN IN    ]   │ ← MTN Yellow
│                 │
│  Forgot?        │
│                 │
│ [Google]        │ ← Stacked buttons
│ [Facebook]      │
└─────────────────┘
```

### Tablet (480px - 768px)
```
┌──────────────────────────────────┐
│   PledgeHub Logo  Sign In  Info   │ ← Horizontal nav
│                                   │
│  Sign In to PledgeHub             │
│                                   │
│ ┌────────────────────────────────┐│
│ │Email         [           ]     ││
│ │Password      [           ]     ││
│ │[    SIGN IN     ]              ││
│ │                                ││
│ │ Forgot?  Or continue with      ││
│ │ [Google] [Facebook]            ││
│ └────────────────────────────────┘│
└──────────────────────────────────┘
```

### Desktop (> 768px)
```
┌───────────────────────────────────────────┐
│ PledgeHub  Home  Campaigns  Dashboard  ▼ │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  🏢 PledgeHub Logo                  │ │
│  │                                     │ │
│  │  Sign In to PledgeHub               │ │
│  │  Access your account and pledges    │ │
│  │                                     │ │
│  │  EMAIL *                            │ │
│  │  [____________________________]      │ │
│  │                                     │ │
│  │  PASSWORD *                         │ │
│  │  [____________________________]      │ │
│  │                                     │ │
│  │  [   🟨 SIGN IN   ]                 │ │
│  │                                     │ │
│  │       Forgot password?              │ │
│  │                                     │ │
│  │   ─── OR CONTINUE WITH ───          │ │
│  │   [Google]  [Facebook]              │ │
│  │                                     │ │
│  │ New? Create account now             │ │
│  └─────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

---

## 🧪 Testing the Design

### Quick Visual Test
1. Open http://localhost:5174/login
2. Verify dark background displays
3. Check yellow button is vibrant
4. Try focusing on input field (yellow border)
5. Hover over button (should lift)
6. Check mobile view (responsive)

### Accessibility Test
1. Tab through form (focus visible)
2. Read error messages aloud
3. Test keyboard enter on buttons
4. Verify color contrast
5. Check form labels

### Browser Test
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Full support

---

## 💾 CSS Classes Quick Reference

```css
/* Buttons */
.btn              /* Base button */
.btn-primary      /* Yellow CTA button */
.btn-secondary    /* Gray alternate button */
.btn-ghost        /* Transparent variant */

/* Alerts */
.alert            /* Base alert */
.alert-success    /* Green success (✓) */
.alert-error      /* Red error (✗) */
.alert-warning    /* Orange warning (⚠) */
.alert-info       /* Blue info (ℹ) */

/* Badges */
.badge            /* Base badge */
.badge-success    /* Green badge */
.badge-error      /* Red badge */
.badge-warning    /* Orange badge */
.badge-mtn        /* Yellow badge */

/* Text Utilities */
.text-center      /* Center text */
.text-muted       /* Gray text */
.text-light       /* Light gray text */

/* Spacing */
.mt-1, .mt-2, .mt-3, .mt-4  /* Margin top */
.mb-1, .mb-2, .mb-3, .mb-4  /* Margin bottom */
.p-1, .p-2, .p-3, .p-4      /* Padding */

/* Flexbox */
.flex             /* Flex container */
.flex-col         /* Flex column */
.flex-center      /* Center content */
.flex-between     /* Space between */
```

---

**Design System Version**: 1.0  
**Last Updated**: December 17, 2025  
**Status**: ✅ Production Ready
