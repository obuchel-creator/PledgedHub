# Registration Diagnostics - What to Check

## Now that dev servers are restarted with enhanced diagnostics:

### Step 1: Open Browser Console
1. Go to http://localhost:5173/register
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. You should see blue logs like:
   - `🟢 RegisterScreen: Component rendered`
   - `✓ RegisterScreen LOADED` (badge in top-right corner)

### Step 2: Try Registering
Fill out the form with:
```
First Name: TestUser
Last Name: Dec20
Phone: 0701234567
Email: testuser123@example.com
Password: TestPass123!
Confirm: TestPass123!
```

Then click **Register**

### Step 3: Watch for Status Updates
You should see messages appear on the form:
- ⏳ Validating form...
- ⏳ Creating account...
- ⏳ Sending to server...
- ✅ Account created! Loading user data...
- ✅ Redirecting to dashboard...

**OR** error messages appear:
- ❌ Validation failed
- ❌ Server error: [specific error]
- ❌ Request timeout after 10 seconds

### Step 4: Check Console for Details
Look at the Console tab for these specific logs:

**If successful**, you'll see:
```
🔵 RegisterScreen: handleSubmit called!
📝 RegisterScreen: Submitting registration with payload: {...}
🔵 [API] Calling POST to /api/register...
🌐 [API] POST Request starting: http://localhost:5001/api/register
🌐 [API] Calling fetch...
🌐 [API] Fetch returned, status: 201
✅ [API] Registration successful, token: eyJhbG...
✅ RegisterScreen: Token received, saving and refreshing user
✅ User context refreshed
✅ RegisterScreen: Redirecting to dashboard
```

**If it fails**, you'll see ONE of these patterns:

**Pattern A: Fetch never returns (hangs)**
```
🌐 [API] Calling fetch...
(nothing after this for 10+ seconds)
❌ Request timeout after 10 seconds
```
→ **Backend not running or network issue**

**Pattern B: Bad response from server**
```
🌐 [API] Fetch returned, status: 400
🌐 [API] Response text: {"error":"Invalid email..."}
❌ [API] POST Error Response: {status: 400, msg: "Invalid email..."}
```
→ **Server returned error - check the error message**

**Pattern C: No token in response**
```
✅ [API] POST Response: {success: true, user: {...}}
❌ [API] No token in response
```
→ **Backend not returning token in response**

### Step 5: Report What You See

Copy **everything** from the Console tab and tell me:
1. What status messages appeared on the form?
2. What are the last 10 console logs (blue 🔵, green ✅, or red ❌)?
3. Do you see "Request timeout" message?
4. What error message is displayed on the form?

---

## Example: What Success Looks Like

**Form:** Shows "✅ Account created! Loading user data..." then "✅ Redirecting to dashboard..."
**Console:** All logs ending with green ✅
**Result:** Redirected to dashboard

---

## Example: What Different Failures Look Like

**Timeout after 10 seconds:**
- Status: "Request timeout after 10 seconds"
- Console: `🌐 [API] Calling fetch...` then nothing for 10 seconds
- **Cause:** Backend not responding

**Invalid input:**
- Status: "❌ Validation failed"
- Console: Shows validation error
- **Cause:** Form data didn't pass validation (check phone format, password length, etc.)

**Bad request (400):**
- Status: "❌ Server error: ..."
- Console: Shows status 400 and error message from backend
- **Cause:** Backend rejected the request (email exists, invalid data, etc.)

---

**Open the console (F12 → Console), try registering, and let me know what you see!**
