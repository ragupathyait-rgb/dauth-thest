# DAuth Authentication Interface

A modern, decentralized authentication system combining OAuth 2.0 with PKCE and blockchain wallet signatures for secure, passwordless authentication.

## 🚀 Features

- **OAuth 2.0 + PKCE** - Industry-standard authorization with enhanced security
- **Wallet-Based Authentication** - Sign in using NCOG wallet
- **React Context Provider** - Simple state management with Auth0-like API
- **Multi-Account Support** - Choose from multiple user accounts per wallet
- **Token Management** - Automatic token storage and refresh handling
- **Protected Routes** - Easy route protection with authentication checks

## 📚 Documentation

- **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** - Complete integration and testing guide
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common code snippets and API reference
- **[SDK Implementation Notes](./docs/SDK_IMPLEMENTATION_NOTES.md)** - Technical implementation details
- **[OAuth 2.0 + PKCE Flow](./docs/WALLET-OAUTH2-PKCE.md)** - Authentication flow explanation
- **[Token Usage Guide](./docs/TOKEN_USAGE_GUIDE.md)** - How to use tokens in your backend
- **[SDK Setup & Publishing](./docs/SDK_SETUP_AND_PUBLISH.md)** - Package setup guide

## 🏃 Quick Start

### Prerequisites
- Node.js 16+
- NCOG Wallet Extension
- DAuth backend server running

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

```bash
VITE_CLIENT_ID=your_client_id_here
VITE_API_URL=http://localhost:4000
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

## 📖 Usage

### Basic Integration

```javascript
// main.jsx
import { DAuthProvider } from 'auth-node-test';

<DAuthProvider
  clientId={import.meta.env.VITE_CLIENT_ID}
  redirectUri={window.location.origin + '/callback'}
>
  <App />
</DAuthProvider>
```

### Using the Hook

```javascript
import { useDAuth } from 'auth-node-test';

function MyComponent() {
  const { isAuthenticated, user, loginWithRedirect, logout } = useDAuth();

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome {user?.name}!</p>
        <button onClick={() => logout({ returnTo: '/' })}>Logout</button>
      </div>
    );
  }

  return <button onClick={() => loginWithRedirect()}>Login</button>;
}
```

## 🏗️ Project Structure

```
src/
├── pages/
│   ├── Home.jsx          # Landing page with login
│   ├── Login.jsx         # Account selection page
│   ├── Callback.jsx      # OAuth callback handler
│   └── Dashboard.jsx     # Protected dashboard
├── services/
│   └── apiService.js     # API client with token management
├── utils/
│   └── errorLogger.js    # Error logging utility
└── main.jsx              # App entry with DAuthProvider
```

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🧪 Testing

See the [Developer Guide](./docs/DEVELOPER_GUIDE.md#testing-guide) for comprehensive testing instructions including:
- Unit testing
- Integration testing
- End-to-end testing
- Manual testing checklist

## 🔐 Security

DAuth implements multiple security best practices:
- PKCE (Proof Key for Code Exchange) for OAuth flow
- Wallet signature verification
- State parameter validation
- Secure token storage
- Automatic token expiration checking

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Authentication**: auth-node-test SDK (DAuth)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Blockchain**: necjs (NCOG Chain)

## 📝 License

MIT

## 🤝 Support

For issues or questions:
1. Check the [Developer Guide](./docs/DEVELOPER_GUIDE.md)
2. Review [Quick Reference](./docs/QUICK_REFERENCE.md)
3. Check browser console for errors
4. Verify backend server is running
5. Ensure NCOG wallet is installed

## 🔗 Related Resources

- [NCOG Wallet Extension](#)
- [DAuth Backend Server](#)
- [SDK Package (auth-node-test)](https://www.npmjs.com/package/auth-node-test)
