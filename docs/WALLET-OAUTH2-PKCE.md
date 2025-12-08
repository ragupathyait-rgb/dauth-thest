### Wallet-Based OAuth 2.0 Authorization Code with PKCE (A–Z)

This document explains, end-to-end, how the application authenticates users using a wallet-based signature flow layered on the OAuth 2.0 Authorization Code grant with PKCE. No code is included; this is a conceptual and operational guide.

## What You’re Building
- **Goal**: Let a user authenticate by proving control of a wallet (signing a challenge), then exchange an OAuth authorization code for tokens, without passwords.
- **Pattern**: OAuth 2.0 Authorization Code + PKCE, with wallet signature used to authorize issuing the code.

## Core Roles
- **Resource Owner**: The end-user controlling a wallet.
- **Client**: The SPA (React frontend) that initiates login and consumes tokens.
- **Authorization Server**: The Node.js server that issues authorization codes and tokens.
- **Resource Server**: Any API that validates and consumes the access token (out of scope for this doc).

## High-Level Flow
1. User clicks “Login” in the SPA.
2. SPA redirects to the Authorization Server’s `/authorize` with the `client_id`.
3. Authorization Server generates all OAuth parameters server-side:
   - `state`, `redirect_uri`, `response_type`, `scope`
   - PKCE: `code_verifier` and `code_challenge` (S256)
   - It stores these temporarily and redirects the user to the SPA’s `/login` UI with the parameters (but not revealing the `code_verifier`).
4. On the `/login` screen, the SPA requests a signable challenge from the Authorization Server via `/wallet/challenge`.
5. The SPA asks the user’s wallet provider to sign the challenge.
6. The SPA sends the signature (and wallet address) to `/wallet/verify`.
7. Authorization Server verifies the signature against the challenge and issues a short-lived authorization `code`.
8. SPA is redirected to its `redirect_uri` (`/callback`) with `code` and `state`.
9. SPA exchanges the `code` at `/oauth/token`. The server validates PKCE (using the server-held `code_verifier`), then returns tokens.
10. SPA stores tokens and the user is considered authenticated; it navigates to a protected page (e.g., Dashboard).

## Why PKCE Matters Here
- PKCE binds the `authorization_code` to the original login initiation, preventing interception or replay.
- The server generates the `code_verifier` and keeps it transiently; the `code_challenge` is sent to the client UI for continuity, but the verifier itself is never exposed to the browser.

## Endpoints and Responsibilities
- **GET `/authorize`**
  - Validates `client_id` and loads client settings (e.g., `redirect_uri`).
  - Generates `state`, `response_type=code`, `scope`, and PKCE (`code_verifier`, `code_challenge`), stores them with a short TTL (e.g., 2 minutes).
  - Redirects to the SPA `/login` UI with the parameters required to continue.

- **POST `/wallet/challenge`**
  - Receives `client_id`, `redirect_uri`, and `state`.
  - Issues a human-readable challenge string referencing the `state` and timestamp.
  - Merges the challenge into the temporary store for that `state`.

- **POST `/wallet/verify`**
  - Receives `walletAddress`, `signature`, `client_id`, `redirect_uri`, `state`.
  - Validates that the `state` is known and unexpired.
  - Verifies the signature against the challenge.
  - On success, issues a short-lived authorization `code` bound to the stored PKCE values and `client_id`.
  - Returns `code`, `redirect_uri`, `state` to the SPA.

- **POST `/oauth/token`**
  - Receives `code`, `client_id` (and optionally `code_verifier` if design requires; this implementation can validate using the server-held verifier).
  - Validates the `code`, checks `code_challenge` against the effective `code_verifier` (server-held or provided), and ensures the client is valid.
  - Returns `access_token`, `id_token`, `token_type`, and `expires_in`.

## SPA Pages and Responsibilities (Conceptual)
- **Home**: Starts login by navigating to `/authorize` (server owns OAuth params and PKCE).
- **Login**: Displays authorization UI, requests a challenge, prompts user for wallet signature, sends signature for verification, then follows the `redirect_uri` with the issued `code` and `state`.
- **Callback**: Exchanges the `code` for tokens via the Authorization Server and stores them (e.g., local storage). Navigates to the protected page.
- **Dashboard (Protected)**: Requires tokens to view. Provides logout (clears tokens and returns to Home).

## Security Considerations
- **State**: Mitigates CSRF. Must be unpredictable and stored server-side tied to the session/flow.
- **PKCE**: Prevents code interception attacks by binding the authorization code to the initiating client.
- **Short TTLs**: The challenge, PKCE verifier, and authorization code are short-lived to reduce window of attack.
- **Signature Verification**: Must reliably verify that the wallet address controls the signature over the challenge text. Any acceptance should be explicit and auditable.
- **HTTPS**: Always use TLS in real deployments.
- **Token Storage**: Prefer secure, least-privilege storage. Consider token lifetimes and refresh strategies.

## Configuration
- **Client Registration**: The Authorization Server maintains a registry of allowed `client_id` with their `redirect_uri`. The SPA uses the registered `client_id`.
- **Allowed Web Origins**: Ensure your SPA origin is permitted in server CORS configuration.
- **Wallet Provider**: The SPA depends on a wallet provider interface capable of signing arbitrary messages.

## Operational Notes
- **Stateless vs. Ephemeral State**: While tokens are stateless JWTs, the Authorization Server keeps ephemeral state (challenge, PKCE, etc.) mapped to `state` during login. It is purged after a short period.
- **Error Handling**:
  - Invalid or expired `state` → restart login from Home.
  - Signature verification failure → prompt user to retry signature.
  - PKCE mismatch at token exchange → restart the flow; indicates tampering or a stale code.

## Troubleshooting Checklist
- **Blank Login Screen**: Ensure the SPA has a route for `/login` and the server redirects there from `/authorize`.
- **Invalid Client**: Verify `client_id` is registered and `redirect_uri` matches exactly.
- **Challenge Expired**: The 2-minute TTL passed; retry login.
- **Signature Invalid**: Confirm the wallet provider is available and the correct address is used; re-sign the displayed challenge.
- **Invalid Code at `/oauth/token`**: Likely PKCE mismatch or expired code. Restart the flow.

## Lifecycle Summary
- Initiate at Home → `/authorize`.
- Server creates OAuth params + PKCE; SPA `/login` receives them.
- SPA requests challenge → user signs → server verifies.
- Server issues `code` → SPA `/callback` exchanges it for tokens.
- SPA stores tokens → accesses protected routes (e.g., Dashboard).


