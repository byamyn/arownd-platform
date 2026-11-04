# Arownd — Capacitor native runtime assessment

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Architecture and risk assessment; native build/release status must be verified independently.

## Repository architecture

The repository contains web, Android, and iOS project directories and Capacitor configuration. The configured app identity is com.arownd.app, and the web bundle directory is dist/client.

Relevant integration points:
- capacitor.config.json
- src/server.ts and src/start.ts
- api/index.ts and vercel.json
- Supabase browser client and authentication callback routes
- android/ and ios/ native projects

The presence of native project files does not prove that current Android/iOS builds, authentication flows, push notifications, or store submissions have passed validation.

## Authentication and transport constraints

Do not weaken browser CSRF protections or enable permissive CORS to make a native WebView work.

Before shipping a local-bundle Capacitor app:

1. Enumerate all TanStack server functions and server-only routes used by the client.
2. Decide which operations can use Supabase client APIs and which require a trusted server transport.
3. Validate Supabase access tokens server-side for protected operations.
4. Never trust a client-supplied user ID or arbitrary Origin header.
5. Keep browser cookie/session behavior intact.
6. Test native PKCE exchange, email confirmation, password recovery, sign-out, and token refresh separately on Android and iOS.
7. Verify deep-link allow-lists and reject unexpected schemes and external redirect targets.

## Native identity

- App ID: com.arownd.app
- App name: Arownd
- Local web bundle: dist/client
- Documented auth callback: com.arownd.app://auth/callback

Verify the callback implementation and Supabase redirect allow-list in the current code and dashboard before release. Never place access or refresh tokens in redirect URLs.

## Release gates

- [ ] Build Android from the reviewed commit.
- [ ] Build iOS on a supported macOS/Xcode environment.
- [ ] Test cold-start and warm-start deep links.
- [ ] Test PKCE and session lifecycle on both platforms.
- [ ] Test permission denial and unavailable-device cases for native plugins.
- [ ] Test push registration and token revocation.
- [ ] Confirm signing identities and secure backup.
- [ ] Verify privacy disclosures and store requirements.
- [ ] Measure performance on representative mobile devices.

## Security boundary

Do not add a production remote-WebView shortcut, broad CSRF bypass, permissive CORS rule, or placeholder callback scheme as a workaround. Any native transport change requires server-side authentication, authorization, and tests.
