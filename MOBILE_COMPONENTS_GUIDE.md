# Mobile Components & Patterns Guide

## 📱 Ready-to-Use Mobile Components

All these components are **automatically responsive** and mobile-friendly. Just use the CSS classes!

---

## 1️⃣ MOBILE BUTTONS

### Touch-Friendly Button (44x44px minimum)
```html
<!-- Standard Button -->
<button class="btn btn-primary">
  Click Me
</button>

<!-- Full Width Button (mobile preferred) -->
<button class="btn btn-primary btn-block">
  Full Width Button
</button>

<!-- Sizes (still 44px minimum height) -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Variants -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-error">Error</button>
<button class="btn btn-outline">Outline</button>
```

### CSS
```css
/* Mobile: 44x44px minimum */
.btn {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
  font-size: 14px;
  border-radius: 8px;
  transition: all 150ms ease-out;
}

/* Full width on mobile */
.btn-block {
  width: 100%;
  display: block;
}

/* Focus visible on mobile */
.btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 2️⃣ MOBILE FORMS

### Basic Form Layout
```html
<form class="form">
  <!-- Single Field -->
  <div class="form-group">
    <label for="email">Email Address</label>
    <input 
      type="email" 
      id="email" 
      placeholder="Enter your email"
      autocomplete="email"
      required
    >
  </div>

  <!-- Single Field -->
  <div class="form-group">
    <label for="password">Password</label>
    <input 
      type="password" 
      id="password" 
      placeholder="Enter password"
      autocomplete="current-password"
      required
    >
  </div>

  <!-- Two-Column Row (responsive) -->
  <div class="form-row">
    <div class="form-group">
      <label for="first_name">First Name</label>
      <input type="text" id="first_name" placeholder="First name">
    </div>
    <div class="form-group">
      <label for="last_name">Last Name</label>
      <input type="text" id="last_name" placeholder="Last name">
    </div>
  </div>

  <!-- Three-Column Row -->
  <div class="form-row" style="grid-template-columns: repeat(3, 1fr);">
    <div class="form-group">
      <label for="day">Day</label>
      <input type="number" id="day" min="1" max="31">
    </div>
    <div class="form-group">
      <label for="month">Month</label>
      <input type="number" id="month" min="1" max="12">
    </div>
    <div class="form-group">
      <label for="year">Year</label>
      <input type="number" id="year" min="1900">
    </div>
  </div>

  <!-- Textarea -->
  <div class="form-group">
    <label for="description">Description</label>
    <textarea 
      id="description" 
      placeholder="Enter description"
      rows="4"
    ></textarea>
  </div>

  <!-- Select Dropdown -->
  <div class="form-group">
    <label for="category">Category</label>
    <select id="category" required>
      <option value="">Select a category</option>
      <option value="education">Education</option>
      <option value="health">Health</option>
      <option value="infrastructure">Infrastructure</option>
    </select>
  </div>

  <!-- Checkbox -->
  <div class="form-group">
    <label style="display: flex; align-items: center; gap: 8px;">
      <input type="checkbox" id="agree" required>
      <span>I agree to the terms and conditions</span>
    </label>
  </div>

  <!-- Radio Buttons -->
  <div class="form-group">
    <label>Payment Method</label>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <label style="display: flex; align-items: center; gap: 8px;">
        <input type="radio" name="payment" value="mtn"> MTN Mobile Money
      </label>
      <label style="display: flex; align-items: center; gap: 8px;">
        <input type="radio" name="payment" value="airtel"> Airtel Money
      </label>
      <label style="display: flex; align-items: center; gap: 8px;">
        <input type="radio" name="payment" value="cash"> Cash
      </label>
    </div>
  </div>

  <!-- Submit Button -->
  <button type="submit" class="btn btn-primary btn-block">
    Submit Form
  </button>

  <!-- Reset Button (optional) -->
  <button type="reset" class="btn btn-secondary btn-block">
    Clear Form
  </button>
</form>
```

### CSS for Forms
```css
/* Form container */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

/* Form group */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

/* Input fields */
.form-group input,
.form-group textarea,
.form-group select {
  font-size: 16px; /* Prevents iOS zoom */
  padding: 12px;
  min-height: 44px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  font-family: inherit;
}

/* Focus state */
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Responsive form row */
.form-row {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: single column */
  gap: 12px;
}

@media (min-width: 641px) {
  .form-row {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1025px) {
  .form-row {
    grid-template-columns: repeat(2, 1fr); /* Desktop: 2 columns */
  }
}

/* Form group spacing on desktop */
@media (min-width: 768px) {
  .form {
    padding: 24px;
    gap: 20px;
  }
}
```

---

## 3️⃣ MOBILE CARDS

### Card with Content
```html
<!-- Basic Card -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>

<!-- Card with Image -->
<div class="card">
  <img src="image.jpg" alt="Card image">
  <h3>Card with Image</h3>
  <p>Description of the image or content</p>
  <div class="card-actions">
    <button class="btn btn-secondary btn-sm">Edit</button>
    <button class="btn btn-primary btn-sm">View</button>
  </div>
</div>

<!-- Card with Stats -->
<div class="card">
  <div class="card-stat">
    <div class="stat-value">500,000</div>
    <div class="stat-label">Total Pledges</div>
  </div>
  <div class="card-stat">
    <div class="stat-value">300,000</div>
    <div class="stat-label">Collected</div>
  </div>
  <div class="stat-label">60% Collection Rate</div>
</div>

<!-- Stat Card (for dashboards) -->
<div class="card stat-card">
  <div class="stat-icon">📊</div>
  <div class="stat-content">
    <h4>Total Pledges</h4>
    <p class="stat-value">1,234</p>
    <p class="stat-change" style="color: green;">↑ +12% from last month</p>
  </div>
</div>
```

### CSS for Cards
```css
.card {
  padding: 16px;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 8px 0;
}

.card h3 {
  margin-top: 0;
  margin-bottom: 12px;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: stack */
  gap: 8px;
  margin-top: 16px;
}

@media (min-width: 641px) {
  .card-actions {
    grid-template-columns: 1fr 1fr; /* Tablet: side-by-side */
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
  min-width: 48px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-change {
  font-size: 14px;
  margin-top: 4px;
}
```

---

## 4️⃣ MOBILE GRIDS

### Responsive Grid (1-2-3 columns)
```html
<!-- Auto-responsive grid -->
<div class="grid grid-cols-3">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
  <div class="card">Item 4</div>
  <div class="card">Item 5</div>
  <div class="card">Item 6</div>
</div>
```

### Grid with Two Columns
```html
<div class="grid grid-cols-2">
  <div class="card">
    <h3>Left Column</h3>
    <p>Content here</p>
  </div>
  <div class="card">
    <h3>Right Column</h3>
    <p>Content here</p>
  </div>
</div>
```

### CSS for Grids
```css
.grid {
  display: grid;
  grid-auto-flow: row;
  gap: 12px;
  width: 100%;
}

.grid.grid-cols-1 {
  grid-template-columns: 1fr;
}

.grid.grid-cols-2 {
  grid-template-columns: 1fr; /* Mobile: 1 column */
}

.grid.grid-cols-3 {
  grid-template-columns: 1fr; /* Mobile: 1 column */
}

/* Tablet */
@media (min-width: 641px) {
  .grid {
    gap: 16px;
  }

  .grid.grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid.grid-cols-3 {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on tablet */
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .grid {
    gap: 20px;
  }

  .grid.grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 5️⃣ MOBILE LISTS

### Simple List
```html
<ul class="list">
  <li class="list-item">First item</li>
  <li class="list-item">Second item</li>
  <li class="list-item">Third item</li>
</ul>
```

### List with Icons
```html
<ul class="list">
  <li class="list-item">
    <span class="list-icon">✓</span>
    <span>Completed item</span>
  </li>
  <li class="list-item">
    <span class="list-icon">→</span>
    <span>Pending item</span>
  </li>
</ul>
```

### CSS for Lists
```css
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.list-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  touch-action: manipulation;
}

.list-item:last-child {
  border-bottom: none;
}

.list-icon {
  font-size: 18px;
  min-width: 24px;
  text-align: center;
}

.list-item:active {
  background-color: var(--bg-secondary);
}
```

---

## 6️⃣ MOBILE NAVIGATION

### Mobile Menu
```html
<nav class="navbar">
  <div class="navbar-container">
    <div class="navbar-brand">
      <span class="navbar-logo">PledgeHub</span>
    </div>
    <button class="navbar-toggle" id="menuToggle">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <ul class="navbar-menu" id="navMenu">
      <li><a href="/">Home</a></li>
      <li><a href="/pledges">Pledges</a></li>
      <li><a href="/campaigns">Campaigns</a></li>
      <li><a href="/analytics">Analytics</a></li>
    </ul>
  </div>
</nav>
```

### CSS for Navigation
```css
.navbar {
  background: white;
  border-bottom: 1px solid var(--border-default);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  height: 64px;
}

.navbar-brand {
  font-weight: bold;
  font-size: 18px;
  color: var(--color-primary);
}

.navbar-toggle {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
}

.navbar-toggle span {
  width: 24px;
  height: 3px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all 200ms ease-out;
}

.navbar-menu {
  display: none; /* Hidden on mobile */
  position: absolute;
  top: 64px;
  left: 0;
  right: 0;
  background: white;
  list-style: none;
  padding: 0;
  margin: 0;
  flex-direction: column;
  border-top: 1px solid var(--border-default);
}

.navbar-menu.active {
  display: flex;
}

.navbar-menu li {
  border-bottom: 1px solid var(--border-default);
}

.navbar-menu a {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  min-height: 44px;
  color: var(--text-primary);
  text-decoration: none;
  transition: background 150ms ease-out;
}

.navbar-menu a:active {
  background-color: var(--bg-secondary);
}

/* Desktop menu */
@media (min-width: 768px) {
  .navbar-toggle {
    display: none;
  }

  .navbar-menu {
    position: static;
    display: flex;
    flex-direction: row;
    background: none;
    border-top: none;
  }

  .navbar-menu li {
    border-bottom: none;
  }
}
```

---

## 7️⃣ MOBILE MODALS

### Simple Modal
```html
<!-- Modal Trigger -->
<button class="btn btn-primary" onclick="openModal()">
  Open Modal
</button>

<!-- Modal -->
<div class="modal" id="myModal" style="display: none;">
  <div class="modal-overlay" onclick="closeModal()"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h3>Modal Title</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>

<script>
function openModal() {
  document.getElementById('myModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('myModal').style.display = 'none';
}
</script>
```

### CSS for Modals
```css
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  align-items: center;
  justify-content: center;
  animation: fadeIn 150ms ease-out;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%; /* Mobile: 90% width */
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 201;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-default);
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-default);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
}

@media (min-width: 641px) {
  .modal-content {
    width: 80%;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 🎯 Mobile-First Development Pattern

Always follow this pattern when building mobile components:

```html
<!-- 1. Mobile First: Single column, simple layout -->
<div class="layout">
  <aside>Content</aside>
  <main>Main</main>
  <aside>Content</aside>
</div>

<style>
/* 2. Mobile: Single column */
.layout {
  display: flex;
  flex-direction: column;
}

/* 3. Tablet: Two columns */
@media (min-width: 641px) {
  .layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}

/* 4. Desktop: Three columns */
@media (min-width: 1025px) {
  .layout {
    grid-template-columns: 1fr 2fr 1fr;
  }
}
</style>
```

---

## ✅ Component Checklist

When creating a mobile component, ensure:

- [ ] Minimum touch target: 44x44px
- [ ] Font size: ≥ 16px (prevents iOS zoom)
- [ ] Padding: ≥ 12px on mobile
- [ ] Single column layout on mobile
- [ ] Responsive grid (2+ columns on tablet)
- [ ] No horizontal scrolling
- [ ] Clear focus states (outline)
- [ ] Good color contrast
- [ ] Fast transitions (150ms)
- [ ] Tested on real devices

---

**Last Updated**: January 2025
**Mobile Version**: 2.0
**Ready for Production**: ✅ Yes
