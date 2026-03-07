# Accessibility & UX Best Practices for PledgeHub

This project follows these accessibility (a11y) and UX guidelines:

- All forms use semantic labels and ARIA roles for screen reader support.
- Error messages use `role="alert"` and `aria-live="assertive"` for immediate feedback.
- All interactive elements (buttons, links) are keyboard accessible.
- Color contrast is checked for readability; use tools like Lighthouse or axe for audits.
- Focus styles are preserved for all form fields and buttons.
- All icons/images use descriptive `alt` text or `aria-label`.
- Responsive design ensures usability on all devices.

For further improvements, run automated audits and review with real users.

