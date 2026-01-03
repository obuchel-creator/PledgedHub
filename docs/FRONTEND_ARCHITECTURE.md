# PledgeHub Frontend Architecture & API Usage

## Overview
PledgeHub frontend is built with React + Vite, using React Router for navigation and hooks for state management. All API calls are made via fetch/axios to the backend REST API, with JWT authentication.

## Folder Structure
- src/screens/: Page components (Login, Register, PledgeList, MobileMoneyPayment, etc.)
- src/components/: Shared UI components (Logo, NavBar, etc.)
- src/context/: Context providers (AuthContext)
- src/utils/: Utility functions (api.js for fetchWithAuth, postWithAuth, etc.)
- src/__tests__/: Integration and unit tests

## Routing
- React Router v7 is used for navigation.
- Protected routes require authentication (JWT in localStorage/AuthContext).

## State Management
- React hooks (useState, useEffect, useContext) are used for local and global state.
- AuthContext manages user authentication and token.

## API Usage
- All API calls use fetchWithAuth/postWithAuth/putWithAuth for JWT support.
- Endpoints:
  - /api/auth/login, /api/auth/register, /api/oauth/callback
  - /api/pledges (CRUD)
  - /api/payments/mobile-money (MTN/Airtel)
  - /api/reminders/upcoming, /api/notifications/reminder/:pledgeId
  - /api/messages/reminder (AI messaging)
  - /api/analytics/dashboard
  - /api/accounting/dashboard, /api/accounting/reports/:type

## Error Handling
- All screens show error messages for failed API calls or validation errors.
- Loading states are displayed during async operations.

## Testing
- React Testing Library + Jest for integration/unit tests.
- API calls are mocked for isolation.

## Best Practices
- All features follow spec-driven development.
- Forms are validated before submission.
- UI is accessible and responsive.

## References
- See API_DOCUMENTATION.md for backend API details.
