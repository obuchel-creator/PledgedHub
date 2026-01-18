# PledgeHub Frontend UI/Design System Guide

## Feedback & Toast Pattern

All user feedback (success, error, info, warning) is delivered via the `Toast` component for a unified, accessible, and professional experience. Inline alert divs are deprecated.

**Usage Example:**
```jsx
<Toast message="Profile updated successfully!" type="success" duration={3500} onClose={() => setShowToast(false)} />
```
- `type`: 'success', 'error', 'info', 'warning'
- `duration`: milliseconds (default 4000)
- `onClose`: callback when toast closes

## Accessibility
- All forms use proper labels, aria attributes, and keyboard navigation.
- Toasts use `role="alert"` for screen reader support.
- Loading states use `aria-busy`, `role="status"` where appropriate.

## Theming
- All colors, backgrounds, and gradients use CSS variables (see `:root` in global styles).
- Components and screens must respect dark/light mode and design tokens.

## Component Usage
- **Toast**: All feedback
- **Button**: Use `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost` classes
- **Card**: Use `.card`, `.card--elevated`, `.card--glass` for containers
- **Form**: Use `.form-input`, `.form-label`, `.form-group` for consistent spacing and style

## Micro-interactions
- All actions (save, submit, error, success) trigger a Toast for feedback
- Buttons show loading state when processing
- Forms reset feedback on change

## Example Feedback Pattern
```jsx
const [message, setMessage] = useState('');
const [showToast, setShowToast] = useState(false);

// On action
setMessage('Saved!');
setShowToast(true);

// In render
{showToast && message && (
  <Toast message={message} type="success" duration={3500} onClose={() => setShowToast(false)} />
)}
```

## Updating/Adding Components
- Always use Toast for feedback
- Use design tokens for color, spacing, and typography
- Ensure accessibility for all interactive elements

---
_Last updated: January 2026_
