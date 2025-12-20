# Registration Redirect Fix - Test Guide

## What Was Fixed
The registration form was successfully creating users but NOT automatically redirecting to the dashboard afterward. This has been fixed by:
- Adding `useAuth` hook to access `refreshUser()` 
- Calling `refreshUser()` after registration to sync user data into AuthContext
- Adding a 500ms delay before redirect to allow React state updates
- Using `replace: true` in navigate to clean browser history

## How to Test

### Before Testing
1. Hard refresh your browser: **Ctrl+F5** (or Cmd+Shift+R on Mac)
2. Verify both servers are running:
   - Backend on `http://localhost:5001` 
   - Frontend on `http://localhost:5173`
3. If not running, use: `.\scripts\dev.ps1`

### Test Steps
1. Navigate to `http://localhost:5173/register`
2. Fill out the registration form with **NEW** test credentials (don't use test@example.com):
   ```
   First Name: Demo
   Last Name: User
   Phone: 0701234567 (or +256701234567)
   Email: newuser@test.com
   Password: DemoPass123!
   Confirm Password: DemoPass123!
   ```
3. Click the **Register** button
4. **Observe:** You should immediately see the Dashboard

### Expected Behavior ✅
- Form clears
- **Immediately redirected** to `/dashboard` 
- See dashboard content (Welcome message, pledge cards, etc.)
- Top right shows "✓ Dashboard LOADED" badge

### If It Works
Great! Registration is fully functional. The fix is complete.

### If It Doesn't Work
If you stay on the register page or see an error:

**Check browser console (F12 → Console tab):**
- Look for red errors starting with ❌
- Look for blue logs starting with 🔵
- Check the `handleSubmit called` log
- Check if token was received

**Common issues:**
- `❌ Network error`: Backend not running on :5001
- `❌ No token in result`: Backend not returning token (check logs)
- Dashboard shows but disappears: AuthContext issue, check localStorage['pledgehub_token']

**Report the error message(s) from console if redirect still fails.**

## How It Works Now

```javascript
// After successful registration:
1. User data sent to backend
2. Backend creates user, returns JWT token
3. Token saved to localStorage as 'pledgehub_token'
4. refreshUser() called → fetches current user from backend → updates AuthContext
5. Wait 500ms for React state updates to propagate
6. navigate('/dashboard', { replace: true }) → smooth redirect
7. Dashboard route checks auth, sees token + user data, renders dashboard
```

## Git Commit
This fix is committed as:
```
fix: properly redirect to dashboard after successful registration
```

## Next Steps
Once registration redirect is confirmed working:
- [ ] Test registration with multiple new users
- [ ] Verify token persists on page refresh
- [ ] Test logout → register → login flow
- [ ] Clean up debug logging if desired (remove console.log calls)

---
*Test with fresh credentials each time since email must be unique in database*
