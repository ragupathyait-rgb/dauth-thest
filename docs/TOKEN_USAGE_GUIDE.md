# Token Usage Guide - Simplified

## Overview

After authentication with DAuth, you get an **access token**. This token needs to be sent to your backend API, and your backend verifies it with the DAuth server.

## Flow (Simplified)

```
1. User logs in → DAuth SDK gets access token
2. Frontend sends token in Authorization header to your backend
3. Your backend verifies token with DAuth server
4. Backend returns protected data
```

## Frontend Implementation

### Step 1: Get Token from DAuth SDK

```javascript
import { useDAuth } from "@dauth/sdk";

const { getTokens, isAuthenticated } = useDAuth();

// Get the token
const tokens = getTokens();
const accessToken = tokens?.access_token;
```

### Step 2: Set Token for API Requests

```javascript
import { setAuthToken } from "../services/apiService";

// Set token once after authentication
useEffect(() => {
  if (isAuthenticated) {
    const tokens = getTokens();
    if (tokens?.access_token) {
      setAuthToken(tokens.access_token);
    }
  }
}, [isAuthenticated]);
```

### Step 3: Make API Calls

```javascript
import { api } from "../services/apiService";

// Token is automatically included in headers
const response = await api.get("/api/user/profile");
const data = response.data;
```

## Backend Implementation

Your backend needs to:

1. **Extract token from header:**
   ```
   Authorization: Bearer <access_token>
   ```

2. **Verify token with DAuth server:**
   - Make a request to DAuth's token verification endpoint
   - Or validate the JWT if it's a JWT token
   - Check token expiration

3. **Return protected data** if token is valid

### Example Backend Verification (Node.js/Express)

```javascript
// Middleware to verify DAuth token
async function verifyDAuthToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify token with DAuth server
    const response = await axios.get(`${DAUTH_API_URL}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Token is valid, attach user info to request
    req.user = response.data;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Use in routes
app.get('/api/user/profile', verifyDAuthToken, (req, res) => {
  res.json({ user: req.user });
});
```

## Files Created

- **`src/services/apiService.js`** - API service that automatically adds token to requests
- **`src/pages/Dashboard.jsx`** - Updated with example usage

## Key Points

✅ Token is automatically sent in `Authorization: Bearer <token>` header  
✅ Backend must verify token with DAuth server  
✅ Token expires - handle refresh or re-authentication  
✅ Clear token on logout

