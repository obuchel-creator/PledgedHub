# Screen Flashing Issue - Root Cause Analysis & Fix

## Root Cause Identified

The systemic screen flashing issue across the entire application was caused by **multiple issues in the authentication and routing system**:

### Issue 1: Race Condition in AuthContext
**Problem**: 
- AuthContext initialized `loading = !!token` (if token existed, loading would be `true`)
- `useEffect` would then call `refreshUser()` which also set `loading = true` 
- This caused the initial render to show loading state, then redirect, then load user data, then redirect again
- Created a redirect chain: Loading Screen → Login → Dashboard

**Root Cause Flow**:
```
1. App mounts, AuthContext checks localStorage for token
2. If token exists: loading = true initially
3. useEffect runs, calls refreshUser() 
4. Component renders with loading = true (shows "Loading...")
5. User data loads, loading = false
6. Token is validated
7. But if token is invalid, ProtectedRoute redirects to /login
8. If valid, shows protected component
9. This all happens too fast, causing visible flashing
```

### Issue 2: Unprotected Routes That Should Be Protected
**Problem**: 
Routes like `/create` and `/pledges/:id` were not wrapped with `ProtectedRoute`, but these are user actions that should require authentication:
- `/create` - Creating pledges (requires login)
- `/pledges/:id` - Viewing pledge details (requires login)

When users clicked these unprotected routes, the auth system would:
1. Let them navigate to the unprotected route
2. Component would check auth internally
3. Component would redirect to login
4. This caused visible screen flashing

### Issue 3: ProtectedRoute Loading State Handling
**Problem**:
- ProtectedRoute showed minimal "Loading..." text
- No visual separation between loading and redirect states
- Loading screen could flash briefly during token validation

## Solutions Implemented

### Fix 1: Improved AuthContext Loading State Management
**Changes to `frontend/src/context/AuthContext.jsx`**:

1. Always start with `loading = true` on mount to prevent premature renders
2. Add `initialized` flag to track when auth check is complete
3. Only set `loading = false` after `getCurrentUser()` completes or fails
4. Ensures ProtectedRoute can properly block component renders during auth check

```javascript
// Before
const [loading, setLoading] = useState(!!token);

async function refreshUser() {
  setLoading(true); // Redundant - already true if token exists
  // ...
}

// After
const [loading, setLoading] = useState(true); // Always true initially
const [initialized, setInitialized] = useState(false); // Track completion

async function refreshUser() {
  // No redundant loading=true setter
  // Set loading=false and initialized=true in finally
}
```

### Fix 2: Enhanced ProtectedRoute Loading State
**Changes to `frontend/src/components/ProtectedRoute.jsx`**:

1. Improved loading UI with better styling (flex centered, full-height, background)
2. Only shows redirect after `loading` is false (auth check complete)
3. Ensures no component renders during loading phase
4. Clearer separation between loading and authenticated states

```javascript
if (loading) {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div>Loading...</div>
    </div>
  );
}
```

### Fix 3: Protected Missing Routes
**Changes to `frontend/src/App.jsx`**:

Wrapped unprotected routes that should require authentication:
- `/create` - Creating pledges
- `/pledges/:id` - Viewing pledge details

These routes now properly redirect to login if user is not authenticated.

## Test Scenarios

### Scenario 1: Fresh Visit (No Token)
**Expected**: User sees login screen
**Before Fix**: Might see multiple redirects/flashes
**After Fix**: Direct redirect to login, clean transition

### Scenario 2: Returning User (Valid Token)
**Expected**: Loads user data, shows dashboard
**Before Fix**: Dashboard flashes, loading shows, then dashboard again
**After Fix**: Shows loading screen while token validates, then dashboard appears smoothly

### Scenario 3: Expired/Invalid Token
**Expected**: Show loading while checking, then redirect to login
**Before Fix**: Multiple fast redirects visible
**After Fix**: Single redirect after validation complete

### Scenario 4: Navigate Between Protected Routes
**Expected**: Smooth transitions without flashing
**Before Fix**: Each navigation shows flashing/loading
**After Fix**: Smooth transitions with proper loading states

## Files Modified

1. **frontend/src/context/AuthContext.jsx**
   - Fixed loading state initialization
   - Added initialized flag tracking
   - Improved refreshUser() to not double-set loading

2. **frontend/src/components/ProtectedRoute.jsx**
   - Enhanced loading UI styling
   - Improved redirect logic clarity
   - Better visual feedback during auth check

3. **frontend/src/App.jsx**
   - Protected `/create` route
   - Protected `/pledges/:id` route

## Validation Checklist

- [x] AuthContext properly manages loading state
- [x] ProtectedRoute shows loading state during auth check
- [x] ProtectedRoute only renders content after auth check completes
- [x] All protected routes wrapped with ProtectedRoute
- [x] No unprotected routes that should require auth
- [x] Loading screen has proper styling
- [x] Redirect logic only executes after loading completes

## Performance Impact

- **Minimal**: No additional API calls
- **Smooth**: Better loading state prevents re-renders and flashing
- **Professional**: Loading screen properly styled and centered
- **User Experience**: Clear visual feedback during auth checks

## Future Improvements

1. Add loading skeleton screens for specific routes
2. Implement persistent loading state across route transitions
3. Add transitions/animations for smoother UX
4. Consider using a global loading provider for more complex scenarios
5. Add error boundaries to catch auth errors gracefully

## Related Issues Addressed

- ✅ Screens flashing when navigating
- ✅ Redirect chains causing visual flashing
- ✅ Unprotected routes accepting unauthenticated access
- ✅ Race conditions in auth validation

## Commit Summary

**Commit Message**: `fix: resolve systemic screen flashing by improving auth state management and route protection`

**Changes**:
- Improved AuthContext loading state initialization and management
- Enhanced ProtectedRoute with better loading UI and state handling
- Protected /create and /pledges/:id routes that require authentication

This comprehensive fix addresses the root cause of the screen flashing issue rather than just treating symptoms.
