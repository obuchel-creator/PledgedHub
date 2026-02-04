# SaaS Conversion Quick Reference

## 🎯 Core Concept: Tenant Isolation

Every database query MUST filter by `tenant_id` to prevent data leakage between organizations.

## 📝 Step-by-Step Service Update Pattern

### 1. Function Signature Changes

**BEFORE:**
```javascript
async function getAllPledges(userId) {
  const [pledges] = await pool.execute(
    'SELECT * FROM pledges WHERE user_id = ?',
    [userId]
  );
}
```

**AFTER:**
```javascript
async function getAllPledges(tenantId, userId) {
  const [pledges] = await pool.execute(
    'SELECT * FROM pledges WHERE tenant_id = ? AND user_id = ?',
    [tenantId, userId]
  );
}
```

### 2. All Query Types

#### SELECT Queries
```javascript
// Add tenant_id to WHERE clause (FIRST filter)
'SELECT * FROM pledges WHERE tenant_id = ? AND deleted = 0'

// With joins
'SELECT p.*, c.name as campaign_name 
 FROM pledges p 
 JOIN campaigns c ON p.campaign_id = c.id 
 WHERE p.tenant_id = ? AND c.tenant_id = ? AND p.deleted = 0'
```

#### INSERT Queries
```javascript
// Add tenant_id to INSERT
'INSERT INTO pledges (tenant_id, user_id, amount, ...) VALUES (?, ?, ?, ...)'
```

#### UPDATE Queries
```javascript
// Add tenant_id to WHERE clause for security
'UPDATE pledges SET amount = ? WHERE id = ? AND tenant_id = ?'
```

#### DELETE Queries
```javascript
// Soft delete with tenant validation
'UPDATE pledges SET deleted = 1 WHERE id = ? AND tenant_id = ?'
```

### 3. Route Controller Updates

**BEFORE:**
```javascript
router.get('/pledges', authenticateToken, async (req, res) => {
  const result = await pledgeService.getAllPledges(req.user.id);
  res.json(result);
});
```

**AFTER:**
```javascript
router.get('/pledges', 
  authenticateToken,      // Verify JWT
  extractTenant,          // Get tenant from subdomain/header
  validateTenantAccess,   // Verify user belongs to tenant
  async (req, res) => {
    const tenantId = req.tenant.id;  // From middleware
    const result = await pledgeService.getAllPledges(tenantId, req.user.id);
    res.json(result);
  }
);
```

### 4. Foreign Key Validation

**CRITICAL:** When referencing other tables, validate they belong to the same tenant.

```javascript
async function createPledge(pledgeData, tenantId, userId) {
  // Validate campaign belongs to tenant
  const [campaigns] = await pool.execute(
    'SELECT id FROM campaigns WHERE id = ? AND tenant_id = ?',
    [pledgeData.campaign_id, tenantId]
  );
  
  if (campaigns.length === 0) {
    return { success: false, error: 'Campaign not found or access denied' };
  }
  
  // Now safe to create pledge
  await pool.execute(
    'INSERT INTO pledges (tenant_id, campaign_id, ...) VALUES (?, ?, ...)',
    [tenantId, pledgeData.campaign_id, ...]
  );
}
```

## 🚨 Security Checklist

### For EVERY Service Function:

- [ ] Add `tenantId` parameter (FIRST parameter)
- [ ] Add `tenant_id = ?` to WHERE clause (FIRST condition)
- [ ] Add `tenant_id` to INSERT statements
- [ ] Validate foreign key relationships belong to same tenant
- [ ] Never trust tenant_id from request body
- [ ] Get tenant_id from `req.tenant.id` or `req.user.tenant_id`

### For EVERY Route:

- [ ] Apply `extractTenant` middleware
- [ ] Apply `validateTenantAccess` middleware
- [ ] Pass `req.tenant.id` to service functions
- [ ] Test cross-tenant access attempts

## 📋 Service Update Priority Order

### Phase 1: Core Services (Week 1)
1. ✅ **tenantService.js** - Already created
2. ⏳ **pledgeService.js** - Highest priority (core business logic)
3. ⏳ **campaignService.js** - Pledges depend on campaigns
4. ⏳ **userService.js** - Team member management
5. ⏳ **paymentTrackingService.js** - Financial data isolation critical

### Phase 2: Communication Services (Week 1-2)
6. ⏳ **emailService.js** - Add tenant context to emails
7. ⏳ **smsService.js** - Track SMS usage per tenant
8. ⏳ **messageGenerator.js** - Tenant-specific templates
9. ⏳ **reminderService.js** - Filter reminders by tenant

### Phase 3: Analytics & Reporting (Week 2)
10. ⏳ **analyticsService.js** - Tenant-scoped analytics
11. ⏳ **advancedAnalyticsService.js** - Multi-tenant dashboards
12. ⏳ **feedbackService.js** - Tenant feedback isolation

### Phase 4: Payment Services (Week 2-3)
13. ⏳ **mobileMoneyService.js** - Tenant payment tracking
14. ⏳ **mtnService.js** - Per-tenant MTN config
15. ⏳ **airtelService.js** - Per-tenant Airtel config
16. ⏳ **paypalService.js** - Tenant Stripe/PayPal accounts

### Phase 5: Advanced Features (Week 3-4)
17. ⏳ **aiService.js** - Track AI usage per tenant
18. ⏳ **chatbotService.js** - Tenant-specific chatbot context
19. ⏳ **monetizationService.js** - Integrate with tenant plans
20. ⏳ **securityService.js** - Tenant-level security settings

## 🧪 Testing Pattern

### Unit Test Example
```javascript
describe('Pledge Service - Multi-Tenant', () => {
  const TENANT_A = 'tenant-a-uuid';
  const TENANT_B = 'tenant-b-uuid';
  
  test('Tenant A cannot access Tenant B pledges', async () => {
    // Create pledge for Tenant A
    await pledgeService.createPledge(
      { amount: 100, donor_name: 'Test' }, 
      TENANT_A, 
      userIdA
    );
    
    // Try to access from Tenant B
    const result = await pledgeService.getAllPledges(TENANT_B);
    expect(result.data.length).toBe(0);  // Should be empty
  });
  
  test('Update pledge with wrong tenant fails', async () => {
    const pledge = await pledgeService.createPledge(data, TENANT_A, userId);
    
    const result = await pledgeService.updatePledge(
      pledge.data.id, 
      { amount: 200 }, 
      TENANT_B  // Wrong tenant
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});
```

### Integration Test Example
```javascript
test('Cross-tenant access blocked via API', async () => {
  // Login as Tenant A user
  const tokenA = await login('user@tenanta.com', 'password');
  
  // Create pledge in Tenant A
  const pledgeA = await createPledge(tokenA, data);
  
  // Login as Tenant B user
  const tokenB = await login('user@tenantb.com', 'password');
  
  // Try to access Tenant A's pledge
  const response = await request(app)
    .get(`/api/pledges/${pledgeA.id}`)
    .set('Authorization', `Bearer ${tokenB}`);
  
  expect(response.status).toBe(404);  // Not found (hidden for security)
});
```

## 🔧 Helper Functions

### Automatic Tenant Filter Injection
```javascript
// Add to db.js or create dbHelper.js
function executeWithTenant(query, params, tenantId) {
  // Auto-inject tenant_id
  if (query.includes('WHERE')) {
    query = query.replace('WHERE', 'WHERE tenant_id = ? AND');
  } else if (query.includes('FROM')) {
    const fromIndex = query.indexOf('FROM');
    const parts = query.split('FROM');
    query = parts[0] + 'FROM' + parts[1] + ' WHERE tenant_id = ?';
  }
  
  return pool.execute(query, [tenantId, ...params]);
}

// Usage
const [pledges] = await executeWithTenant(
  'SELECT * FROM pledges WHERE deleted = 0',
  [],
  tenantId
);
// Becomes: SELECT * FROM pledges WHERE tenant_id = ? AND deleted = 0
```

## 📊 Migration Verification

### Check Data Isolation
```sql
-- Verify all tables have tenant_id
SELECT 
  TABLE_NAME,
  COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME = 'tenant_id'
  AND TABLE_SCHEMA = 'pledgehub_db';

-- Verify no orphaned records
SELECT 'users' as table_name, COUNT(*) as orphaned_count
FROM users WHERE tenant_id IS NULL
UNION ALL
SELECT 'pledges', COUNT(*) FROM pledges WHERE tenant_id IS NULL
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns WHERE tenant_id IS NULL;

-- Should return 0 for all tables
```

## 🎨 Frontend Changes

### 1. Subdomain Detection
```javascript
// src/utils/tenantContext.js
export function getTenantFromUrl() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  if (parts.length >= 2 && parts[0] !== 'www') {
    return parts[0];  // e.g., "acme" from "acme.pledgehub.com"
  }
  
  return null;
}

// Add to API calls
const headers = {
  'Authorization': `Bearer ${token}`,
  'X-Tenant-ID': getTenantFromUrl()
};
```

### 2. Signup Flow Component
```jsx
// src/screens/SignupScreen.jsx
function SignupScreen() {
  const [subdomain, setSubdomain] = useState('');
  const [available, setAvailable] = useState(null);
  
  const checkAvailability = async (value) => {
    const response = await fetch(
      `/api/saas/check-subdomain/${value}`
    );
    const data = await response.json();
    setAvailable(data.available);
  };
  
  return (
    <form onSubmit={handleSignup}>
      <input 
        value={subdomain}
        onChange={(e) => {
          setSubdomain(e.target.value);
          checkAvailability(e.target.value);
        }}
      />
      {available === false && <span>❌ Not available</span>}
      {available === true && <span>✅ Available</span>}
      
      <span>.pledgehub.com</span>
    </form>
  );
}
```

## 🚀 Quick Commands

```powershell
# Run migration
node backend/scripts/saas-migration.js

# Test signup
$body = @{
    organizationName = "My Company"
    subdomain = "myco"
    email = "admin@myco.com"
    password = "SecurePass123"
    name = "Admin User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/saas/signup" `
  -Method POST -Body $body -ContentType "application/json"

# Check tenant
Invoke-RestMethod -Uri "http://localhost:5001/api/saas/tenant" `
  -Headers @{ Authorization = "Bearer $token"; "X-Tenant-ID" = "tenant-uuid" }

# View plans
Invoke-RestMethod -Uri "http://localhost:5001/api/saas/plans"
```

## 📚 Additional Resources

- **Full implementation**: See `SAAS_FOUNDATION_COMPLETE.md`
- **Example service**: See `backend/services/EXAMPLE_tenantAwarePledgeService.js`
- **Migration script**: `backend/scripts/saas-migration.js`
- **Tenant middleware**: `backend/middleware/tenantMiddleware.js`
- **Pricing config**: `backend/config/saasPlans.js`

## ⚡ Common Pitfalls

1. **Forgetting tenant_id in WHERE clause** → Data leakage
2. **Trusting tenant_id from request body** → Security vulnerability
3. **Not validating foreign keys** → Cross-tenant references
4. **Hardcoding tenant in tests** → Tests pass but code broken
5. **Missing tenant middleware** → Routes accessible without tenant
6. **Caching without tenant key** → Shared cache between tenants

## 🎓 Pro Tips

- Use TypeScript for type safety (tenant_id required in interfaces)
- Add database views with tenant filters for read-heavy tables
- Implement row-level security in MySQL 8.0+
- Use Redis for tenant cache with proper TTL
- Monitor slow queries - add composite indexes on `(tenant_id, ...)`
- Set up alerts for cross-tenant access attempts
- Log all tenant switches for audit
