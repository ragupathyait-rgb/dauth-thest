# DAuth SDK - Setup, Local Linking & Publishing Guide

## 📁 Separating SDK to Separate Folder

### Option 1: Move SDK to Separate Directory (Monorepo Style)

```
your-workspace/
├── dauth-sdk/          # SDK package (new folder)
│   ├── package.json
│   ├── index.js
│   ├── src/
│   │   ├── DAuth.js
│   │   ├── DAuthProvider.jsx
│   │   └── ...
│   └── README.md
└── dauth-frontend/     # Your app (current folder)
    ├── package.json
    └── src/
```

**Steps:**
1. Create new folder: `dauth-sdk` (outside current project)
2. Copy SDK files from `src/sdk/` to `dauth-sdk/`
3. Create `package.json` in `dauth-sdk/` (use `package.json.example` as base)
4. Initialize: `cd dauth-sdk && npm init -y`

---

## 🔗 Local Linking (Development)

### Method 1: npm link (Recommended)

**In SDK folder:**
```bash
cd dauth-sdk
npm link
```

**In your app folder:**
```bash
cd dauth-frontend
npm link @dauth/sdk
```

**Update imports in your app:**
```javascript
// Before (local import)
import { DAuthProvider } from './sdk';

// After (linked package)
import { DAuthProvider } from '@dauth/sdk';
```

**To unlink:**
```bash
# In app folder
npm unlink @dauth/sdk

# In SDK folder (optional)
npm unlink
```

### Method 2: npm install with file path

**In your app's `package.json`:**
```json
{
  "dependencies": {
    "@dauth/sdk": "file:../dauth-sdk"
  }
}
```

Then run:
```bash
npm install
```

**Note:** Changes in SDK require re-running `npm install` in app

### Method 3: Workspaces (For Monorepo)

**In root `package.json` (create at workspace root):**
```json
{
  "name": "dauth-workspace",
  "private": true,
  "workspaces": [
    "dauth-sdk",
    "dauth-frontend"
  ]
}
```

Then:
```bash
npm install
```

---

## 📦 Publishing to npm

### Step 1: Prepare package.json

**In `dauth-sdk/package.json`:**
```json
{
  "name": "@dauth/sdk",
  "version": "1.0.0",
  "description": "DAuth SDK - OAuth 2.0 with PKCE and Wallet Authentication",
  "main": "index.js",
  "type": "module",
  "files": [
    "*.js",
    "*.jsx",
    "hooks/**/*",
    "README.md"
  ],
  "keywords": [
    "oauth2",
    "authentication",
    "wallet",
    "pkce",
    "dauth"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/dauth-sdk.git"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "axios": "^1.0.0"
  }
}
```

**Important fields:**
- `name`: Package name (use scoped like `@your-org/dauth-sdk` or just `dauth-sdk`)
- `files`: What files to include in package
- `version`: Start with 1.0.0
- `main`: Entry point file

### Step 2: Create npm Account

1. Go to https://www.npmjs.com/signup
2. Verify your email
3. Enable 2FA (recommended)

### Step 3: Login to npm

```bash
npm login
```

Enter username, password, email, OTP if 2FA enabled

### Step 4: Test Package Locally

```bash
# In SDK folder
npm pack

# This creates a .tgz file - test it
cd ..
npm install ./dauth-sdk/dauth-sdk-1.0.0.tgz
```

### Step 5: Publish

**Public package:**
```bash
cd dauth-sdk
npm publish --access public
```

**Scoped package (@your-org/sdk):**
```bash
npm publish --access public
```

**Private package (requires npm paid account):**
```bash
npm publish
```

### Step 6: Update Version

After making changes:
```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major

# Then publish
npm publish --access public
```

---

## 📝 Complete Setup Example

### 1. Create SDK Package Structure

```bash
# Create SDK folder
mkdir dauth-sdk
cd dauth-sdk

# Copy SDK files
cp -r ../DAuth\ Frontend/src/sdk/* .

# Create package.json
cp package.json.example package.json
# Edit package.json with your details

# Initialize git (optional)
git init
git add .
git commit -m "Initial SDK release"
```

### 2. SDK package.json Template

```json
{
  "name": "@dauth/sdk",
  "version": "1.0.0",
  "description": "DAuth SDK - OAuth 2.0 with PKCE and Wallet Authentication",
  "main": "index.js",
  "type": "module",
  "files": [
    "*.js",
    "*.jsx",
    "hooks",
    "README.md"
  ],
  "scripts": {
    "prepublishOnly": "echo 'Ready to publish'"
  },
  "keywords": ["oauth2", "authentication", "wallet", "pkce"],
  "author": "Your Name",
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "axios": "^1.0.0"
  },
  "dependencies": {
    "axios": "^1.12.2"
  }
}
```

### 3. Use in Your App

**After publishing:**
```bash
cd dauth-frontend
npm install @dauth/sdk
```

**Or with local link (development):**
```bash
# In SDK folder
npm link

# In app folder
npm link @dauth/sdk
```

---

## ⚠️ Important Notes

1. **Peer Dependencies**: Don't bundle React/Axios - let users install them
2. **Files Field**: Only include files users need (not examples, docs unless needed)
3. **Version**: Follow semantic versioning (major.minor.patch)
4. **Testing**: Test locally before publishing
5. **README**: Include installation and usage instructions

---

## 🚀 Quick Commands Reference

```bash
# Setup SDK for linking
cd dauth-sdk && npm link

# Link in app
cd dauth-frontend && npm link @dauth/sdk

# Unlink
cd dauth-frontend && npm unlink @dauth/sdk

# Publish
cd dauth-sdk && npm publish --access public

# Update version and publish
npm version patch && npm publish --access public
```

---

## 📚 Additional Resources

- npm Docs: https://docs.npmjs.com/
- Semantic Versioning: https://semver.org/
- npm Publishing: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry

