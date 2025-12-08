# DAuth Developer Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Integration Guide](#integration-guide)
4. [API Reference](#api-reference)
5. [Testing Guide](#testing-guide)
6. [Code Examples](#code-examples)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

DAuth is a decentralized authentication system that combines OAuth 2.0 with PKCE (Proof Key for Code Exchange) and blockchain wallet signatures. It provides a secure, passwordless authentication experience using the NCOG wallet.

### Key Features
- 🔐 **OAuth 2.0 with PKCE** - Industry-standard authorization flow with enhanced security
- 🔑 **Wallet-Based Authentication** - Sign in using your NCOG wallet
- 🚀 **Easy Integration** - Auth0-like API for familiar developer experience
- ⚛️ **React Context Provider** - Simple state management across your app
- 🔄 **Token Management** - Automatic token storage and refresh handling
- 🌐 **Multi-Account Support** - Choose from multiple user accounts per wallet

### Architecture Overview

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
└────────┬────────┘
         │
         │ DAuth SDK (auth-node-test)
         │
    ┌────▼─────────────────┐
    │  DAuthProvider       │
    │  (Context Provider)  │
    └────┬─────────────────┘
         │
    ┌────▼────────┐
    │  useDAuth   │
    │   (Hook)    │
    └─────────────┘
         │
    ┌────▼──────────────────────┐
    │  OAuth 2.0 + PKCE Flow    │
    │  + Wallet Signature       │
    └────┬──────────────────────┘
         │
    ┌────▼────────────┐
    │  DAuth Server   │
    │  (Backend API)  │
    └─────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- NCOG Wallet Extension installed in browser
- DAuth backend server running

### Installation

```bash
# Install the DAuth SDK
npm install auth-node-test

# Or with yarn
yarn add auth-node-test
```

### Basic Setup

**1. Wrap your app with DAuthProvider**

```javascript
// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DAuthProvider } from 'auth-node-test';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DAuthProvider
      clientId={import.meta.env.VITE_CLIENT_ID}
      redirectUri={window.location.origin + '/callback'}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DAuthProvider>
  </StrictMode>
);
```

**2. Create environment variables**

```bash
# .env
VITE_CLIENT_ID=your_client_id_here
VITE_API_URL=http://localhost:4000
```

**3. Use the authentication hook**

```javascript
// src/pages/Home.jsx
import { useDAuth } from 'auth-node-test';

export default function Home() {
  const { loginWithRedirect, isAuthenticated, user, logout } = useDAuth();

  if (isAuthenticated) {
    return (
      <div>
        <h1>Welcome {user?.name}!</h1>
        <button onClick={() => logout({ returnTo: '/' })}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => loginWithRedirect()}>
      Login with DAuth
    </button>
  );
}
```

**4. Create callback page**

```javascript
// src/pages/Callback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDAuth } from 'auth-node-test';

export default function Callback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useDAuth();

  useEffect(() => {
    handleRedirectCallback()
      .then(() => navigate('/dashboard'))
      .catch(err => {
        console.error('Callback error:', err);
        navigate('/');
      });
  }, []);

  return <div>Processing authentication...</div>;
}
```

---

## Integration Guide

### Step 1: Provider Configuration

The `DAuthProvider` accepts the following props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `clientId` | string | Yes | OAuth client ID from DAuth server |
| `redirectUri` | string | Yes | Callback URL after authentication |
| `apiUrl` | string | No | Backend API URL (default: auto-detected) |
| `scope` | string | No | OAuth scope (default: 'openid profile email') |

**Example with all options:**

```javascript
<DAuthProvider
  clientId="your_client_id"
  redirectUri={window.location.origin + '/callback'}
  apiUrl="https://api.yourdomain.com"
  scope="openid profile email wallet"
>
  <App />
</DAuthProvider>
```

### Step 2: Authentication Flow

The complete authentication flow works as follows:

```
1. User clicks "Login" → loginWithRedirect()
2. Redirects to /authorize endpoint
3. Server generates PKCE parameters
4. Redirects to /login page
5. User selects account from wallet
6. Requests challenge from server
7. User signs challenge with wallet
8. Server verifies signature
9. Returns authorization code
10. Redirects to /callback
11. Exchanges code for tokens
12. Stores tokens in localStorage
13. User is authenticated
```

### Step 3: Using the useDAuth Hook

The `useDAuth` hook provides access to authentication state and methods:

```javascript
const {
  // State
  isAuthenticated,  // boolean - is user logged in?
  isLoading,        // boolean - is auth state loading?
  user,             // object - user profile data
  error,            // string - any authentication error
  
  // Methods
  loginWithRedirect,       // () => void - start login flow
  logout,                  // (options) => void - logout user
  getTokens,              // () => tokens - get current tokens
  handleRedirectCallback, // () => Promise - handle OAuth callback
} = useDAuth();
```

### Step 4: Protected Routes

Create a protected route component:

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useDAuth } from 'auth-node-test';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useDAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

**Usage:**

```javascript
// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/callback" element={<Callback />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### Step 5: Making Authenticated API Calls

**Create an API service:**

```javascript
// src/services/apiService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
let authToken = null;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to requests
apiClient.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

export const api = {
  get: (endpoint, config) => apiClient.get(endpoint, config),
  post: (endpoint, data, config) => apiClient.post(endpoint, data, config),
  put: (endpoint, data, config) => apiClient.put(endpoint, data, config),
  delete: (endpoint, config) => apiClient.delete(endpoint, config),
};

export default apiClient;
```

**Use in components:**

```javascript
// src/pages/Dashboard.jsx
import { useEffect } from 'react';
import { useDAuth } from 'auth-node-test';
import { setAuthToken, api } from '../services/apiService';

export default function Dashboard() {
  const { isAuthenticated, getTokens } = useDAuth();

  // Set token when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const tokens = getTokens();
      if (tokens?.access_token) {
        setAuthToken(tokens.access_token);
      }
    }
  }, [isAuthenticated, getTokens]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/user/profile');
      console.log('User profile:', response.data);
    } catch (error) {
      console.error('API error:', error);
    }
  };

  return (
    <div>
      <button onClick={fetchUserProfile}>
        Fetch Profile
      </button>
    </div>
  );
}
```

### Step 6: Login Page Implementation

The login page handles wallet connection and account selection:

```javascript
// src/pages/Login.jsx
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { DAuth } from 'auth-node-test';

export default function Login() {
  const [params] = useSearchParams();
  const [userAccounts, setUserAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Get OAuth parameters from URL
  const client_id = params.get('client_id');
  const redirect_uri = params.get('redirect_uri');
  const state = params.get('state');
  const code_challenge = params.get('code_challenge');

  // Initialize DAuth SDK
  const dauth = useMemo(() => new DAuth({
    clientId: client_id || import.meta.env.VITE_CLIENT_ID,
    redirectUri: `${window.location.origin}/callback`,
  }), [client_id]);

  // Load wallet and accounts
  useEffect(() => {
    const loadWallet = async () => {
      // Check wallet availability
      if (!dauth.isWalletAvailable()) {
        const isAvailable = await dauth.waitForWallet(5000);
        if (!isAvailable) {
          setStatus('NCOG wallet not detected');
          setIsLoading(false);
          return;
        }
      }

      // Get wallet data
      const walletData = await dauth.getWallet();
      if (!walletData?.accountAddress) {
        setStatus('Could not connect to wallet');
        setIsLoading(false);
        return;
      }

      // Get user accounts from blockchain
      const accounts = await dauth.getUserAccounts(walletData.accountAddress);
      setUserAccounts(accounts || []);
      setIsLoading(false);
    };

    loadWallet();
  }, [dauth]);

  // Handle login with selected account
  const handleLogin = async () => {
    if (!selectedAccount) return;

    try {
      setStatus('Requesting challenge...');
      
      // Get challenge from server
      const { challenge } = await dauth.requestWalletChallenge({
        client_id,
        redirect_uri,
        state,
        code_challenge,
      });

      setStatus('Waiting for signature...');
      
      // Sign challenge with wallet
      const signature = await dauth.getSignature(challenge);
      if (!signature) {
        setStatus('Signature rejected');
        return;
      }

      setStatus('Verifying...');
      
      // Verify signature and get authorization code
      const { code } = await dauth.verifyWalletSignature({
        walletAddress: walletData.accountAddress,
        publicKey: walletData.publicKey,
        signature,
        client_id,
        redirect_uri,
        state,
        email: selectedAccount.email,
      });

      // Redirect to callback with code
      window.location.href = `${redirect_uri}?code=${code}&state=${state}`;
    } catch (error) {
      console.error('Login error:', error);
      setStatus('Authentication failed');
    }
  };

  // Render UI...
}
```

---

## API Reference

### DAuthProvider Props

```typescript
interface DAuthProviderProps {
  clientId: string;           // Required: OAuth client ID
  redirectUri: string;        // Required: Callback URL
  apiUrl?: string;           // Optional: Backend API URL
  authUrl?: string;          // Optional: Auth server URL
  scope?: string;            // Optional: OAuth scope
  children: React.ReactNode; // Required: Child components
}
```

### useDAuth Hook

```typescript
interface UseDAuthReturn {
  // Authentication State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  error: string | null;

  // Methods
  loginWithRedirect: () => void;
  logout: (options?: LogoutOptions) => void;
  getTokens: () => Tokens | null;
  handleRedirectCallback: () => Promise<void>;
}

interface UserProfile {
  sub: string;           // Subject (user ID)
  name: string;          // User's name
  email: string;         // User's email
  email_verified: boolean;
  wallet: string;        // Wallet address
  phone_number?: string; // Optional phone
  userId?: string;       // Optional user ID
}

interface Tokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at: number;
}

interface LogoutOptions {
  returnTo?: string;  // URL to redirect after logout
}
```

### DAuth Class Methods

```typescript
class DAuth {
  constructor(config: DAuthConfig);
  
  // Wallet Methods
  isWalletAvailable(): boolean;
  waitForWallet(timeout: number): Promise<boolean>;
  getWallet(): Promise<WalletData>;
  getUserAccounts(walletAddress: string): Promise<UserAccount[]>;
  getSignature(message: string): Promise<string>;
  
  // Authentication Methods
  requestWalletChallenge(params: ChallengeParams): Promise<{ challenge: string }>;
  verifyWalletSignature(params: VerifyParams): Promise<{ code: string }>;
  exchangeCodeForTokens(code: string): Promise<Tokens>;
  
  // Token Methods
  getTokens(): Tokens | null;
  setTokens(tokens: Tokens): void;
  clearTokens(): void;
  isTokenExpired(): boolean;
}
```

### Backend API Endpoints

#### 1. Authorization Endpoint
```
GET /authorize?client_id={clientId}
```

**Response:** Redirects to `/login` with OAuth parameters

---

#### 2. Wallet Challenge
```
POST /wallet/challenge
Content-Type: application/json

{
  "client_id": "string",
  "redirect_uri": "string",
  "state": "string",
  "code_challenge": "string"
}
```

**Response:**
```json
{
  "challenge": "Sign this message to authenticate: {timestamp}"
}
```

---

#### 3. Wallet Verify
```
POST /wallet/verify
Content-Type: application/json

{
  "walletAddress": "string",
  "publicKey": "string",
  "signature": "string",
  "client_id": "string",
  "redirect_uri": "string",
  "state": "string",
  "email": "string"
}
```

**Response:**
```json
{
  "code": "authorization_code_here",
  "redirect_uri": "string",
  "state": "string"
}
```

---

#### 4. Token Exchange
```
POST /oauth/token
Content-Type: application/json

{
  "code": "string",
  "client_id": "string",
  "code_verifier": "string",
  "client_secret": "string" // optional
}
```

**Response:**
```json
{
  "access_token": "string",
  "id_token": "string",
  "refresh_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

#### 5. User Info
```
GET /userinfo
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "sub": "user@example.com",
  "name": "John Doe",
  "email": "user@example.com",
  "email_verified": true,
  "wallet": "0x...",
  "phone_number": "1234567890"
}
```

---

## Testing Guide

### Unit Testing

**Testing the useDAuth Hook:**

```javascript
// __tests__/useDAuth.test.js
import { renderHook, act } from '@testing-library/react';
import { DAuthProvider, useDAuth } from 'auth-node-test';

describe('useDAuth Hook', () => {
  const wrapper = ({ children }) => (
    <DAuthProvider
      clientId="test_client_id"
      redirectUri="http://localhost:3000/callback"
    >
      {children}
    </DAuthProvider>
  );

  it('should initialize with unauthenticated state', () => {
    const { result } = renderHook(() => useDAuth(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle login redirect', () => {
    const { result } = renderHook(() => useDAuth(), { wrapper });
    
    act(() => {
      result.current.loginWithRedirect();
    });
    
    // Verify redirect occurred
    expect(window.location.href).toContain('/authorize');
  });
});
```

### Integration Testing

**Testing the Login Flow:**

```javascript
// __tests__/integration/login.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DAuthProvider } from 'auth-node-test';
import Login from '../pages/Login';

// Mock wallet
global.window.ncogProvider = {
  request: jest.fn(),
};

describe('Login Flow', () => {
  it('should display user accounts and allow selection', async () => {
    // Mock wallet response
    window.ncogProvider.request.mockResolvedValue({
      accountAddress: '0x123...',
      publicKey: 'pubkey123',
    });

    render(
      <BrowserRouter>
        <DAuthProvider clientId="test" redirectUri="/callback">
          <Login />
        </DAuthProvider>
      </BrowserRouter>
    );

    // Wait for accounts to load
    await waitFor(() => {
      expect(screen.getByText(/Choose an Account/i)).toBeInTheDocument();
    });

    // Select account
    const accountButton = screen.getByText(/John Doe/i);
    fireEvent.click(accountButton);

    // Verify selection
    expect(screen.getByText(/Continue with Selected Account/i)).toBeEnabled();
  });
});
```

### End-to-End Testing

**Using Playwright or Cypress:**

```javascript
// e2e/auth.spec.js
describe('DAuth Authentication', () => {
  it('should complete full login flow', async () => {
    // Visit home page
    await page.goto('http://localhost:3000');
    
    // Click login button
    await page.click('button:has-text("Login with DAuth")');
    
    // Should redirect to login page
    await page.waitForURL('**/login**');
    
    // Mock wallet extension
    await page.evaluate(() => {
      window.ncogProvider = {
        request: async ({ method }) => {
          if (method === 'ncog_accounts') {
            return ['0x123...'];
          }
          if (method === 'ncog_personalSign') {
            return 'signature_here';
          }
        },
      };
    });
    
    // Select account
    await page.click('[data-testid="account-0"]');
    await page.click('button:has-text("Continue")');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    // Verify authenticated
    expect(await page.textContent('h1')).toContain('Dashboard');
  });
});
```

### Manual Testing Checklist

- [ ] **Login Flow**
  1. Navigate to home page
  2. Click "Login with DAuth"
  3. Verify redirect to `/login`
  4. Check wallet connection
  5. Select an account
  6. Sign the challenge
  7. Verify redirect to `/callback`
  8. Confirm redirect to dashboard
  9. Check user data is displayed

- [ ] **Token Management**
  1. Login successfully
  2. Open DevTools → Application → Local Storage
  3. Verify `dauth_tokens` exists
  4. Check token structure (access_token, id_token, expires_at)
  5. Logout
  6. Verify tokens are cleared

- [ ] **Protected Routes**
  1. Try accessing `/dashboard` without login
  2. Verify redirect to home
  3. Login
  4. Access `/dashboard`
  5. Verify access granted

- [ ] **API Calls**
  1. Login successfully
  2. Open Network tab in DevTools
  3. Make an API call
  4. Verify `Authorization: Bearer {token}` header
  5. Check response is successful

- [ ] **Error Handling**
  1. Test without wallet extension
  2. Test with no accounts
  3. Test signature rejection
  4. Test expired tokens
  5. Test network errors

### Testing Backend Token Verification

**Example Node.js/Express middleware:**

```javascript
// middleware/verifyDAuthToken.js
const axios = require('axios');

async function verifyDAuthToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify token with DAuth server
    const response = await axios.get(`${process.env.DAUTH_API_URL}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Attach user info to request
    req.user = response.data;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = verifyDAuthToken;
```

**Usage:**

```javascript
// routes/api.js
const express = require('express');
const verifyDAuthToken = require('../middleware/verifyDAuthToken');

const router = express.Router();

router.get('/user/profile', verifyDAuthToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
```

**Test the middleware:**

```javascript
// __tests__/verifyDAuthToken.test.js
const request = require('supertest');
const app = require('../app');

describe('DAuth Token Verification', () => {
  it('should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/user/profile');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('No token provided');
  });

  it('should accept valid token', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer valid_token_here');
    
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
  });
});
```

---

## Code Examples

### Example 1: Simple Login/Logout

```javascript
import { useDAuth } from 'auth-node-test';

function AuthButton() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useDAuth();

  if (isAuthenticated) {
    return (
      <div>
        <span>Hello, {user?.name}!</span>
        <button onClick={() => logout({ returnTo: '/' })}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => loginWithRedirect()}>
      Login
    </button>
  );
}
```

### Example 2: Protected Component

```javascript
import { useDAuth } from 'auth-node-test';
import { Navigate } from 'react-router-dom';

function ProtectedPage() {
  const { isAuthenticated, isLoading } = useDAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <div>Protected content here</div>;
}
```

### Example 3: Fetch User Profile

```javascript
import { useEffect, useState } from 'react';
import { useDAuth } from 'auth-node-test';
import { api, setAuthToken } from '../services/apiService';

function UserProfile() {
  const { isAuthenticated, getTokens } = useDAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      const tokens = getTokens();
      setAuthToken(tokens?.access_token);
      
      api.get('/api/user/profile')
        .then(res => setProfile(res.data))
        .catch(err => console.error(err));
    }
  }, [isAuthenticated, getTokens]);

  return (
    <div>
      {profile && (
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 4: Multi-Tab Sync

```javascript
import { useEffect } from 'react';
import { useDAuth } from 'auth-node-test';

function App() {
  const { isAuthenticated, logout } = useDAuth();

  useEffect(() => {
    // Listen for storage changes (multi-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'dauth_tokens' && !e.newValue) {
        // Tokens cleared in another tab
        logout({ returnTo: '/' });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [logout]);

  return <div>Your app content</div>;
}
```

### Example 5: Custom Error Handling

```javascript
import { useDAuth } from 'auth-node-test';
import { useEffect } from 'react';

function ErrorHandler() {
  const { error } = useDAuth();

  useEffect(() => {
    if (error) {
      // Log to error tracking service
      console.error('DAuth Error:', error);
      
      // Show user-friendly message
      alert('Authentication error. Please try again.');
    }
  }, [error]);

  return null;
}
```

---

## Troubleshooting

### Common Issues

#### 1. Wallet Not Detected

**Problem:** "NCOG wallet extension not detected"

**Solutions:**
- Install NCOG wallet extension
- Ensure extension is enabled
- Refresh the page
- Check browser console for errors
- Try waiting longer (increase timeout in `waitForWallet()`)

```javascript
const isAvailable = await dauth.waitForWallet(10000); // 10 seconds
```

---

#### 2. No Accounts Found

**Problem:** "No active accounts found for this wallet address"

**Solutions:**
- Ensure wallet has an active account
- Check if account is registered on blockchain
- Verify contract address is correct
- Check wallet is connected to correct network

---

#### 3. Token Expired

**Problem:** API calls return 401 Unauthorized

**Solutions:**
- Implement token refresh logic
- Check token expiration before API calls
- Re-authenticate user

```javascript
const tokens = getTokens();
if (tokens && Date.now() >= tokens.expires_at * 1000) {
  // Token expired, re-authenticate
  logout({ returnTo: '/' });
}
```

---

#### 4. CORS Errors

**Problem:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions:**
- Configure backend CORS settings
- Ensure `redirectUri` matches exactly
- Check API URL is correct

**Backend CORS config (Express):**

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

---

#### 5. Redirect Loop

**Problem:** App keeps redirecting between pages

**Solutions:**
- Check `isLoading` state before redirecting
- Ensure callback page handles errors
- Verify OAuth parameters are correct

```javascript
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    navigate('/');
  }
}, [isAuthenticated, isLoading]);
```

---

### Debug Mode

Enable debug logging:

```javascript
// In your app initialization
localStorage.setItem('dauth_debug', 'true');

// This will log all DAuth operations to console
```

### Browser DevTools

**Check tokens:**
1. Open DevTools (F12)
2. Go to Application tab
3. Local Storage → your domain
4. Look for `dauth_tokens`

**Check network requests:**
1. Open DevTools Network tab
2. Filter by "Fetch/XHR"
3. Look for `/authorize`, `/wallet/challenge`, `/oauth/token`
4. Check request/response details

---

## Best Practices

### Security

1. **Never expose client secret in frontend**
2. **Always use HTTPS in production**
3. **Validate tokens on backend**
4. **Set appropriate token expiration**
5. **Clear tokens on logout**
6. **Use secure storage (consider httpOnly cookies for production)**

### Performance

1. **Memoize DAuth instance**
2. **Use React.memo for auth components**
3. **Lazy load protected routes**
4. **Cache user profile data**

### User Experience

1. **Show loading states**
2. **Handle errors gracefully**
3. **Provide clear error messages**
4. **Support multi-tab synchronization**
5. **Remember user's last page**

---

## Additional Resources

- [SDK Implementation Notes](./SDK_IMPLEMENTATION_NOTES.md)
- [OAuth 2.0 + PKCE Flow](./WALLET-OAUTH2-PKCE.md)
- [Token Usage Guide](./TOKEN_USAGE_GUIDE.md)
- [SDK Setup & Publishing](./SDK_SETUP_AND_PUBLISH.md)

---

## Support

For issues or questions:
- Check existing documentation
- Review code examples
- Check browser console for errors
- Verify backend server is running
- Ensure NCOG wallet is installed and configured

---

**Last Updated:** December 2024  
**SDK Version:** 1.0.6 (auth-node-test)  
**License:** MIT
