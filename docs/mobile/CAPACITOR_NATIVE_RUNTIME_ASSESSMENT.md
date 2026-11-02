# Capacitor Native Runtime Assessment

Status: first native setup slice. The app identity and Capacitor web asset configuration are now recorded; native runtime packages, platform projects, and authentication handling are not yet enabled.

## Confirmed repository architecture

- The web application is a TanStack Start SSR application.
- `vite.config.ts` registers the TanStack Start server entry as `src/server.ts`.
- `src/server.ts` forwards requests to the TanStack Start server entry and applies locale handling.
- Vercel exposes one catch-all serverless handler at `api/index.ts`; `vercel.json` rewrites application routes to it.
- `src/start.ts` installs Supabase bearer-token attachment as global function middleware and installs TanStack CSRF middleware for server-function requests.
- The Supabase browser client persists sessions, refreshes tokens, and uses PKCE.
- The current auth callback is a web route. It waits for the Supabase session to appear and then navigates within the web router.
- `capacitor.config.json` now fixes the shared application ID to `com.arownd.app` and points Capacitor at `dist/client`.
- No Android/iOS native projects or native Capacitor packages have been added yet.

## Native transport decision gate

Do not enable permissive CORS or disable CSRF to make a local WebView work.

Before shipping a local-bundle Capacitor app, verify all of the following:

1. Enumerate every TanStack server function and server-only route used by the client, including generated RPC endpoints.
2. Establish whether those calls can be replaced by direct Supabase client operations or require a dedicated native API transport.
3. If a native API transport is required, enforce a narrow origin policy and validate the Supabase access token server-side for every protected operation. Never trust a client-supplied user ID or an arbitrary Origin header.
4. Keep browser cookie/session behavior unchanged and test native PKCE code exchange, email confirmation, password recovery, sign-out, and token refresh.
5. Test Android and iOS separately; do not assume their WebView origins or deep-link callbacks are identical.

## Current safe implementation boundary

The existing native runtime detection and PWA suppression can remain isolated from web behavior. Do not add a production `server.url` remote-WebView shortcut, permissive CSRF bypass, or placeholder deep-link scheme. Those would conceal rather than solve the local-bundle/native-auth integration.

## Next implementation slice

- Add pinned Capacitor core, CLI, App, Android, and iOS packages with a regenerated npm lockfile.
- Verify the SPA build produces `dist/client/index.html` before running `cap sync`.
- Implement deep-link handling using the official Capacitor App URL-open event and Supabase PKCE exchange.
- Configure and test the Supabase redirect allow-list entry `com.arownd.app://auth/callback` without changing the production Site URL.
- Add native push, geolocation, and lifecycle adapters behind platform-specific modules.
- Generate Android/iOS projects and validate release builds on their respective toolchains.
