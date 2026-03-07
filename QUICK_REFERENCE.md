# PledgeHub - Quick Reference

## 🚀 Quick Start

### Start Backend
```bash
cd backend
npm run dev
# Backend: http://localhost:5001
```

### Start Frontend
```bash
cd frontend
npm run dev
# Frontend: http://localhost:5174
```

### Seed Database
```bash
cd backend
node scripts/seed.js
```

## 📝 Common Tasks

### Create a New Pledge
1. Navigate to http://localhost:5174
2. Click "Record Pledge" in Dashboard
3. Fill in pledge details
4. Submit

### Edit a Pledge
1. Go to pledge detail page
2. Click "Edit" button (must be logged in)
3. Update fields
4. Click "Save Changes"

### Delete a Pledge
1. Go to pledge detail page
2. Click "Delete" button (must be logged in)
3. Confirm deletion

### Register/Login
- Register: http://localhost:5174/register
- Login: http://localhost:5174/login

## 🛠️ Development Commands

### Backend
```bash
npm run dev         # Start development server
npm test            # Run tests
npm run coverage    # Generate coverage report
```

### Frontend
```bash
npm run dev         # Start Vite dev server
npm run build       # Build for production
npm run preview     # Preview production build
```

## 📊 Key Files

### Backend
- `server.js` - Main server entry point
- `config/db.js` - Database configuration
- `controllers/pledgeController.js` - Pledge CRUD operations
- `controllers/authController.js` - Authentication logic
- `middleware/authMiddleware.js` - JWT verification

### Frontend
- `src/App.jsx` - Main app with routes
- `src/services/api.js` - API client
- `src/context/AuthContext.jsx` - Authentication state
- `src/screens/DashboardScreen.jsx` - Main dashboard
- `src/screens/PledgeDetailScreen.jsx` - Pledge details with edit/delete
- `src/components/Toast.jsx` - Toast notifications

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pledgehub_db
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001/api
```

## 🗄️ Database

### Connection
- Host: localhost
- Port: 3306 (MySQL default)
- Database: pledgehub_db

### Tables
- **users** - User accounts
- **pledges** - Pledge records
- **payments** - Payment/donation records

## 🎨 UI Components

### Colors
- Primary Blue: #3b82f6
- Success Green: #10b981
- Error Red: #dc2626
- Warning Orange: #f59e0b
- Dark Text: #0f172a
- Light Text: #64748b

### Breakpoints
- Desktop: > 768px
- Tablet: ≤ 768px
- Mobile: ≤ 480px

## 🔗 API Endpoints

### Auth
```
POST /api/auth/register  - Register user
POST /api/auth/login     - Login user
GET  /api/auth/me        - Get current user (protected)
```

### Pledges
```
GET    /api/pledges     - List all pledges
GET    /api/pledges/:id - Get single pledge
POST   /api/pledges     - Create pledge (protected)
PUT    /api/pledges/:id - Update pledge (protected)
DELETE /api/pledges/:id - Delete pledge (protected)
```

### Payments
```
GET  /api/payments      - List payments
POST /api/payments      - Create payment
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5001 is available
netstat -ano | findstr :5001

# Kill process if needed
taskkill /PID <PID> /F

# Try starting again
npm run dev
```

### Frontend won't start
```bash
# Check if port 5174 is available
netstat -ano | findstr :5174

# Kill process if needed
taskkill /PID <PID> /F

# Try starting again
npm run dev
```

### Database connection error
1. Check MySQL is running
2. Verify credentials in backend/.env
3. Ensure pledgehub_db database exists
4. Run: `mysql -u root -p` and `CREATE DATABASE pledgehub_db;`

### CORS errors
- Backend CORS is configured for development (allows all origins)
- Check VITE_API_URL in frontend/.env matches backend URL

### JWT errors
- Clear localStorage: `localStorage.clear()` in browser console
- Re-login to get new token

## 💡 Tips

### Testing API
Use PowerShell scripts in `backend/scripts/`:
```powershell
.\api_test.ps1  # Test all endpoints
```

### View Logs
- Backend logs: Console output
- Frontend logs: Browser console (F12)

### Clear State
```javascript
// In browser console
localStorage.clear()      // Clear auth tokens
location.reload()         // Refresh page
```

### Database Reset
```bash
cd backend
mysql -u root -p pledgehub_db < sql/init.sql
node scripts/seed.js
```

## 📚 Documentation

- Full implementation details: `IMPLEMENTATION_SUMMARY.md`
- Toast component: `frontend/src/components/README_TOAST.md`
- API documentation: Check controller files for detailed comments
- Database schema: `backend/sql/init.sql`

## 🎯 Features Status

### ✅ Implemented
- User authentication (JWT)
- Create pledges
- Edit pledges
- Delete pledges
- View pledges
- Make donations
- Dashboard with statistics
- Mobile responsive design
- Toast notifications
- Loading states
- Error handling
- Rate limiting
- Input validation

### 🔮 Future Ideas
- Email notifications
- Payment gateway integration
- File uploads
- Social sharing
- Advanced analytics
- Export to CSV
- Search & filters
- User roles
- Comments system
- Dark mode

## 🚨 Security Checklist

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (5 attempts/15min)
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React auto-escaping)
- ✅ HTTPS ready (configure in production)
- ✅ Secure headers (configure in production)

## 📱 Mobile Testing

Test on:
- Chrome DevTools mobile emulation
- Actual mobile devices
- Different screen sizes (320px, 375px, 414px, 768px)

## 🎉 Success!

Your PledgeHub app is ready to use! 🚀

For questions or issues, check the implementation summary or examine the code comments.

