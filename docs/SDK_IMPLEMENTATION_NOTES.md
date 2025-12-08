# DAuth SDK - Implementation Notes

## Overview

The DAuth SDK has been implemented following the **Auth0 pattern** for simplicity and developer experience. The SDK provides a clean, context-based React integration that makes authentication seamless.

## Architecture

### Core Components

1. **DAuth Class** (`src/sdk/DAuth.js`)
   - Main SDK class that handles all authentication logic
   - Manages OAuth 2.0 with PKCE flow
   - Handles wallet integration (NCOG provider)
   - Token management and storage
   - All API communication

2. **DAuthProvider** (`src/sdk/DAuthProvider.jsx`)
   - React Context Provider component
   - Wraps the entire application
   - Manages global authentication state
   - Provides authentication methods to all child components
   - Handles token refresh and state synchronization

3. **useDAuth Hook** (`src/sdk/useDAuthHook.js`)
   - React hook to access authentication context
   - Provides: `isAuthenticated`, `user`, `loginWithRedirect`, `logout`, etc.
   - Can be used in any component within the Provider

## Implementation Flow

### 1. Initialization (App Setup)

**Location:** `src/main.jsx`

- The app is wrapped with `DAuthProvider` at the root level
- Provider receives configuration:
  - `clientId`: OAuth client identifier
  - `clientSecret`: Optional client secret
  - `redirectUri`: Callback URL after authentication
  - `apiUrl`: Backend API URL
- Provider creates a single `DAuth` instance and manages its lifecycle

### 2. Authentication State Management

**How it works:**
- Provider checks authentication status on mount
- Uses localStorage to persist tokens
- Listens for storage changes (handles multi-tab scenarios)
- Maintains `isAuthenticated`, `isLoading`, `user`, and `error` states
- Updates states automatically when tokens change

### 3. Login Flow

**Process:**
1. User clicks login button → calls `loginWithRedirect()` or `login()`
2. SDK redirects to backend `/authorize` endpoint with `client_id`
3. Backend generates PKCE parameters and redirects to frontend `/login` page
4. Frontend Login page:
   - Connects to NCOG wallet extension
   - Fetches user accounts from blockchain contract
   - User selects an account
   - Requests challenge from backend
   - User signs challenge with wallet
   - Verifies signature with backend
   - Receives authorization code
5. Redirects to `/callback` with authorization code
6. Callback page exchanges code for tokens
7. Tokens stored in localStorage
8. User redirected to dashboard

### 4. Token Management

**Storage:**
- Tokens stored in localStorage under key `dauth_tokens`
- Includes: `access_token`, `id_token`, `refresh_token`, `expires_in`, `expires_at`
- PKCE verifier and state stored separately during flow
- All tokens cleared on logout

**Validation:**
- Checks token expiration using `expires_at` timestamp
- Automatic token refresh capability (if refresh_token available)
- Token expiration checked on every `isAuthenticated()` call

### 5. Wallet Integration

**NCOG Provider:**
- Detects NCOG wallet extension dynamically
- Waits up to 5 seconds for extension to load
- Requests wallet accounts via `ncog_accounts` method
- Requests signatures via `ncog_personalSign` method
- Handles provider availability gracefully

**User Account Retrieval:**
- Fetches user accounts from blockchain smart contract
- Filters only active accounts
- Maps contract data to user-friendly format
- Handles contract call errors gracefully

### 6. Protected Routes

**Implementation:**
- Components check `isAuthenticated` state
- Redirect to login if not authenticated
- Loading states handled automatically
- User information fetched automatically after authentication

## Key Features Implemented

### 1. **Auth0-like API**
- Same method names and patterns as Auth0
- `loginWithRedirect()` - Initiates login
- `logout()` - Clears session
- `user` object - User information
- `isAuthenticated` - Boolean state
- `isLoading` - Loading state

### 2. **Context-Based State Management**
- Single source of truth for authentication
- No prop drilling needed
- Automatic state synchronization across components
- Multi-tab support via storage events

### 3. **Error Handling**
- Comprehensive error catching at all levels
- User-friendly error messages
- Error state available via `error` property
- Graceful fallbacks for wallet/provider issues

### 4. **Performance Optimizations**
- Memoized context value to prevent unnecessary re-renders
- useCallback for all methods to maintain referential equality
- Lazy initialization of DAuth instance
- Efficient token storage and retrieval

### 5. **Security Features**
- PKCE (Proof Key for Code Exchange) for OAuth flow
- Secure token storage in localStorage
- State parameter validation
- Token expiration checking
- Automatic token cleanup on logout

## Integration Points

### Frontend → Backend Communication

1. **Authorization Endpoint:** `/authorize`
   - Receives: `client_id`
   - Returns: Redirect to `/login` with PKCE params

2. **Wallet Challenge:** `/wallet/challenge`
   - Receives: `client_id`, `redirect_uri`, `state`, `code_challenge`
   - Returns: `{ challenge }`

3. **Wallet Verify:** `/wallet/verify`
   - Receives: `walletAddress`, `publicKey`, `signature`, `client_id`, etc.
   - Returns: `{ code, redirect_uri, state }`

4. **Token Exchange:** `/oauth/token`
   - Receives: `code`, `client_id`, `code_verifier`, `client_secret`
   <!-- - Recidee: 1 -->
   - Returns: `{ access_token, id_token, refresh_token, expires_in }`

5. **User Info:** `/userinfo`
   - Receives: `Authorization: Bearer <token>`
   - Returns: User profile information

### Blockchain Integration

- **Contract:** User Registry Contract
- **Method:** `getUserDetailsForWallet(address)`
- **Purpose:** Retrieve user accounts associated with wallet address
- **Response:** Array of user objects with status, name, email, etc.

## File Structure

```
src/
├── sdk/
│   ├── DAuth.js                 # Main SDK class
│   ├── DAuthProvider.jsx        # React Context Provider
│   ├── DAuthContext.js          # Context definition
│   ├── useDAuthHook.js          # Hook to access context
│   ├── hooks/
│   │   ├── useDAuth.js          # Legacy hook (manual SDK usage)
│   │   └── useRequireAuth.js    # Route protection hook
│   ├── index.js                 # Main exports
│   ├── examples/                # Usage examples
│   └── README.md                 # Documentation
├── pages/
│   ├── Home.jsx                 # Login page (uses useDAuth)
│   ├── Login.jsx                 # Account selection page
│   ├── Callback.jsx              # OAuth callback handler
│   └── Dashboard.jsx             # Protected page (uses useDAuth)
├── main.jsx                      # App entry with Provider
└── App.jsx                        # Router setup
```

## Dependencies

### Required
- React (^18.0.0 or ^19.0.0)
- React Router DOM (for routing)
- Axios (for HTTP requests)
- necjs (for blockchain contract calls)

### Browser Requirements
- Modern browser with ES6+ support
- Web Crypto API (for PKCE)
- NCOG Wallet Extension (for wallet functionality)

## Configuration

### Environment Variables
- `VITE_CLIENT_ID`: OAuth client ID
- `VITE_CLIENT_SECRET`: OAuth client secret (optional)
- `VITE_API_URL`: Backend API base URL
- `VITE_REDIRECT_URI`: Callback URL (optional, defaults to `/callback`)

### Provider Props
- `clientId` (required): OAuth client identifier
- `clientSecret` (optional): Client secret for confidential clients
- `redirectUri` (required): Callback URL after authentication
- `apiUrl` (optional): Backend API URL
- `authUrl` (optional): Authorization server URL (defaults to apiUrl)
- `scope` (optional): OAuth scope (default: 'openid profile email')
- `tokenStorageKey` (optional): localStorage key for tokens
- `pkceStorageKey` (optional): localStorage key for PKCE verifier
- `stateStorageKey` (optional): localStorage key for state

## Security Considerations

1. **Token Storage:** Tokens stored in localStorage (client-side only)
2. **PKCE:** Prevents authorization code interception
3. **State Validation:** Prevents CSRF attacks
4. **Token Expiration:** Automatic expiration checking
5. **Secure Redirects:** Only redirects to configured redirect_uri
6. **Wallet Verification:** Signature verification on backend

## Error Scenarios Handled

1. **Wallet Not Available:** Graceful detection and user messaging
2. **Network Errors:** Retry logic and error states
3. **Token Expiration:** Automatic detection and refresh capability
4. **Invalid State:** State parameter validation
5. **No User Accounts:** Clear messaging to user
6. **Contract Errors:** Error handling in blockchain calls

## Extension Points

The SDK is designed to be extensible:

1. **Custom Storage:** Can modify token storage mechanism
2. **Custom Providers:** Can add support for other wallet providers
3. **Custom Hooks:** Can create custom hooks for specific use cases
4. **Middleware:** Can add middleware for token refresh, logging, etc.

## Performance Notes

- Single DAuth instance per application
- Context value memoized to prevent re-renders
- All methods wrapped in useCallback for stability
- Efficient token storage and retrieval
- Minimal re-renders on state changes

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with Web Crypto API)
- Mobile browsers: Full support (if NCOG extension available)

## Testing Considerations

1. **Mock NCOG Provider:** For unit testing without extension
2. **Token Management:** Test token storage and retrieval
3. **State Management:** Test authentication state changes
4. **Error Handling:** Test all error scenarios
5. **Multi-tab:** Test storage event handling

## Migration from Old Pattern

If migrating from the old `authService.js` pattern:

1. Replace manual SDK initialization with Provider
2. Replace `useDAuth(config)` with `useDAuth()` (no config needed)
3. Remove manual token management (handled by Provider)
4. Update imports to use new pattern
5. See `src/sdk/MIGRATION.md` for detailed steps

## Support & Documentation

- Main Documentation: `src/sdk/README.md`
- Quick Start: `src/sdk/QUICK_START.md`
- Auth0 Pattern Guide: `src/sdk/AUTH0_PATTERN.md`
- Migration Guide: `src/sdk/MIGRATION.md`
- Examples: `src/sdk/examples/`

## Version Information

- SDK Version: 1.0.0
- Pattern: Auth0-like Provider/Hook pattern
- OAuth Flow: OAuth 2.0 Authorization Code + PKCE
- Wallet Support: NCOG Provider
- Blockchain: NCOG Chain (via necjs)

---

**Note:** This SDK follows industry best practices for OAuth 2.0 implementation and React state management. The Auth0-like pattern ensures familiarity for developers who have worked with modern authentication libraries.

