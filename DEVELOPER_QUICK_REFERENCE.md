# PledgeHub Developer Quick Reference Card

## 🚀 Quick Start

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Access: http://localhost:5173

---

## 📁 Where Things Are

| Component | Location | Purpose |
|-----------|----------|---------|
| **API Routes** | `backend/routes/` | REST endpoints |
| **Business Logic** | `backend/services/` | Core features |
| **Database** | `backend/models/` | Data models |
| **Auth** | `backend/middleware/authMiddleware.js` | User authentication |
| **Validation** | `backend/utils/requestValidator.js` | Input validation |
| **Logging** | `backend/utils/logger.js` | Application logs |
| **Frontend Pages** | `frontend/src/screens/` | React components |
| **Frontend API Calls** | `frontend/src/contexts/AuthContext.jsx` | API integration |
| **Styles** | `frontend/src/` | CSS/Tailwind |

---

## 🔑 Environment Variables

**Required** (backend/.env):
```bash
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=pledgehub_db
JWT_SECRET=your_secret
SESSION_SECRET=your_secret
```

**Optional**:
```bash
GOOGLE_AI_API_KEY=           # For AI features
GOOGLE_CLIENT_ID=             # For OAuth
FACEBOOK_APP_ID=              # For OAuth
TWILIO_ACCOUNT_SID=           # For SMS
SMTP_USER=                    # For email
```

---

## 🔐 Authentication

### JWT Flow
```
1. User registers/logs in
2. Backend validates credentials
3. Backend generates JWT token
4. Frontend stores token in localStorage
5. Frontend includes token in Authorization header
6. Backend validates token on protected routes
```

### OAuth Flow
```
1. User clicks "Sign in with Google/Facebook"
2. Redirect to provider
3. User authenticates at provider
4. Redirect back to `/api/oauth/callback`
5. Backend creates/finds user
6. Frontend receives JWT token
```

### Protected Route
```javascript
// Backend
app.get('/api/pledges', authenticateToken, async (req, res) => {
  // req.user is available
  const userId = req.user.id;
});

// Frontend
<ProtectedRoute>
  <DashboardScreen />
</ProtectedRoute>
```

---

## 💾 Database

### Connection
```javascript
// Use pool.execute() - NOT pool.query()
const [rows] = await pool.execute(
  'SELECT * FROM pledges WHERE id = ? AND deleted_at IS NULL',
  [pledgeId]
);
```

### Check Results
```javascript
// Always check for null/undefined
if (!rows || rows.length === 0) {
  return { success: false, error: 'Not found' };
}

const pledge = rows[0];
```

### Soft Delete
```javascript
// Don't delete, just mark deleted_at
UPDATE pledges SET deleted_at = NOW() WHERE id = ?

// Always filter deleted records
SELECT * FROM pledges WHERE deleted_at IS NULL
```

---

## ✅ Input Validation

### In Controller
```javascript
const { validateEmail, validatePhone, sendError } = 
  require('../utils/requestValidator');

// Check email
if (!validateEmail(email)) {
  return sendError(res, 400, 'Invalid email format');
}

// Check phone
if (!validatePhone(phone)) {
  return sendError(res, 400, 'Invalid phone format');
}
```

### Response Format
```javascript
// Success
res.status(201).json({
  success: true,
  data: { pledgeId: 1 },
  timestamp: new Date().toISOString()
});

// Error
res.status(400).json({
  success: false,
  error: 'Invalid input',
  details: { field: 'email', reason: 'Invalid format' },
  timestamp: new Date().toISOString()
});
```

---

## 📊 Service Pattern

### Return Format
```javascript
// Always return consistent format
async function createPledge(data) {
  try {
    // Validate
    if (!data.title) {
      return { success: false, error: 'Title required' };
    }
    
    // Process
    const result = await db.insert(data);
    
    // Return
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Error Handling
```javascript
// In route
const result = await pledgeService.createPledge(data);

if (!result.success) {
  return res.status(400).json({
    success: false,
    error: result.error
  });
}

return res.status(201).json({
  success: true,
  data: result.data
});
```

---

## 🪵 Logging

### Use Logger, Not console.log
```javascript
const logger = require('../utils/logger');

logger.error('Database error', { error, sql });
logger.warn('Slow query', { duration: 5000 });
logger.info('User created', { userId, email });
logger.debug('Processing payment', { pledgeId, amount });
```

### Log Levels
```bash
# In .env
LOG_LEVEL=DEBUG      # Show all
LOG_LEVEL=INFO       # Show INFO+
LOG_LEVEL=ERROR      # Show ERROR only
```

---

## 🛣️ Adding a New Endpoint

1. **Create service** (`backend/services/newFeature.js`)
   ```javascript
   async function doSomething(data) {
     return { success: true, data: result };
   }
   module.exports = { doSomething };
   ```

2. **Create route** (`backend/routes/newFeatureRoutes.js`)
   ```javascript
   const express = require('express');
   const router = express.Router();
   const { authenticateToken } = require('../middleware/authMiddleware');
   const service = require('../services/newFeature');

   router.post('/', authenticateToken, async (req, res) => {
     const result = await service.doSomething(req.body);
     if (!result.success) {
       return res.status(400).json(result);
     }
     return res.status(201).json(result);
   });

   module.exports = router;
   ```

3. **Register in server.js**
   ```javascript
   const newFeatureRoutes = require('./routes/newFeatureRoutes');
   app.use('/api/new-feature', authenticateToken, newFeatureRoutes);
   ```

4. **Add frontend hook** (`frontend/src/hooks/useNewFeature.js`)
   ```javascript
   import axios from 'axios';
   export function useNewFeature() {
     const doSomething = async (data) => {
       const res = await axios.post('/api/new-feature', data, {
         headers: { Authorization: `Bearer ${token}` }
       });
       return res.data;
     };
     return { doSomething };
   }
   ```

---

## 🧪 Testing an Endpoint

```bash
# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "test@example.com",
    "password": "Test123!",
    "phone": "+256700000000"
  }'

# Login (copy token from response)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Use token
curl http://localhost:5001/api/pledges \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🐛 Debugging Tips

| Issue | Solution |
|-------|----------|
| API not responding | Check backend is running: `npm run dev` |
| CORS error | Check CORS config in `server.js` |
| Database error | Check MySQL running, verify .env |
| 401 Unauthorized | Check token in localStorage, try login again |
| 404 Not Found | Check route is registered in `server.js` |
| Validation error | Check `requestValidator.js` for rules |
| Can't find module | Run `npm install` in backend folder |
| Port already in use | Change `PORT` in .env or kill process |

---

## 📋 Common Tasks

### Add Role-Based Access
```javascript
// In route
app.post('/api/admin/something', 
  authenticateToken,  // Check user is logged in
  requireAdmin,       // Check user is admin
  handler
);

// In middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
}
```

### Send Email
```javascript
const emailService = require('../services/emailService');

await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Pledge Reminder',
  text: 'Please pay your pledge',
  html: '<h1>Pledge Reminder</h1>'
});
```

### Log to Database
```javascript
// Create an audit table
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(100),
  user_id INT,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Log action
await pool.execute(
  'INSERT INTO audit_log (action, user_id, data) VALUES (?, ?, ?)',
  ['pledge_created', userId, JSON.stringify(pledge)]
);
```

---

## ⚡ Performance Tips

1. **Use indexes** on frequently queried columns
2. **Limit results** with OFFSET/LIMIT for large datasets
3. **Cache** frequently accessed data
4. **Batch operations** instead of loops
5. **Use JOIN** instead of multiple queries
6. **Monitor logs** for slow queries

---

## 🔒 Security Checklist

- [ ] No hardcoded passwords/secrets
- [ ] Input validation on all endpoints
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (sanitize output)
- [ ] CSRF tokens on forms
- [ ] Rate limiting on sensitive endpoints
- [ ] HTTPS in production
- [ ] Secrets in environment variables only
- [ ] Database backups configured
- [ ] Error logging (without sensitive data)

---

## 📞 Getting Help

1. Check `CODE_QUALITY_REPORT.md` for known issues
2. Check `SETUP_GUIDE_FIXED.md` for setup problems
3. Check `docs/API_DOCUMENTATION.md` for API details
4. Check console/logs for error messages
5. Check database directly: `mysql -u root -p pledgehub_db`

---

## 🚀 Ready to Code!

You now have all the information you need to:
- Add new features
- Fix bugs
- Improve the application
- Deploy to production

**Happy coding!** 🎉

*Reference Card v1.0 | December 2025*
