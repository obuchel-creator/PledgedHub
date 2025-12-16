# PledgeHub Analytics Dashboard Documentation

## Overview
The Analytics Dashboard provides staff and admin users with real-time insights into pledge activity, collection performance, and trends. It aggregates data from the pledges table and exposes it via secure API endpoints for visualization in the frontend dashboard.

## API Endpoints

### 1. GET `/api/analytics/summary`
- **Description:** Returns key statistics: total pledges, total amount pledged, total paid, pending, overdue, and collection rate.
- **Access:** Staff/Admin only (JWT required)
- **Response Example:**
```json
{
  "success": true,
  "data": {
    "totalPledges": 120,
    "totalAmount": 50000000,
    "paid": 80,
    "pending": 30,
    "overdue": 10,
    "collectionRate": 66
  }
}
```

### 2. GET `/api/analytics/trends`
- **Description:** Returns time-series data for pledges and collections (e.g., per month).
- **Access:** Staff/Admin only
- **Response Example:**
```json
{
  "success": true,
  "data": [
    { "month": "2025-01", "pledges": 10, "amount": 1000000 },
    { "month": "2025-02", "pledges": 15, "amount": 1500000 }
  ]
}
```

### 3. GET `/api/analytics/campaigns`
- **Description:** Returns aggregated stats per campaign.
- **Access:** Staff/Admin only
- **Response Example:**
```json
{
  "success": true,
  "data": [
    { "campaign": "School Library", "pledges": 40, "amount": 20000000, "paid": 25 },
    { "campaign": "Health Drive", "pledges": 30, "amount": 15000000, "paid": 20 }
  ]
}
```

## Usage Instructions
1. Ensure you are logged in as a staff or admin user.
2. Access the dashboard via the frontend (see below for UI details).
3. The dashboard fetches analytics data from the above endpoints and displays charts, tables, and key metrics.

## Frontend Integration
- The dashboard is implemented as a React component (`AnalyticsDashboard.jsx`).
- Uses Axios to fetch data from `/api/analytics/*` endpoints.
- Displays:
  - Key stats (cards)
  - Trends (charts)
  - Campaign breakdown (table)
- Only visible to staff/admin users.

## Example Screenshots
_(Add screenshots after frontend implementation)_

## Development Notes
- All analytics logic is in `backend/services/analyticsService.js`.
- Endpoints are defined in `backend/routes/analyticsRoutes.js`.
- Frontend code is in `frontend/src/AnalyticsDashboard.jsx`.

## Next Steps
- Implement backend endpoints in `analyticsService.js` and `analyticsRoutes.js`.
- Build the frontend dashboard UI.
- Update this documentation with screenshots and usage tips.

