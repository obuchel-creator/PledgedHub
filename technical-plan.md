# Technical Plan – PledgeHub

## Architecture Overview
- Backend: Node.js + Express + MySQL
- Frontend: React + Vite
- AI: Google Gemini Pro
- Mobile Money: MTN, Airtel APIs
- Accounting: Double-entry, financial reports

## API Contracts
- RESTful endpoints under /api
- All requests/response formats documented here

## Security
- JWT authentication, Passport OAuth
- Rate limiting, CSRF, XSS, SQL injection prevention

## Integration Points
- Mobile money, email/SMS, AI, accounting

## Testing
- Integration and unit tests required for all features
