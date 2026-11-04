# Arownd — Native app identity

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Configuration reference; verify platform project files and Supabase dashboard before release.

## Application identity

- Android application ID: com.arownd.app
- iOS bundle identifier: com.arownd.app
- Capacitor application name: Arownd
- Local web bundle directory: dist/client
- Documented native auth callback: com.arownd.app://auth/callback

Keep these identifiers stable after publishing. Changing an app ID generally creates a separate store application.

## Authentication callback

The intended native flow:
1. Receive the launch URL or subsequent URL-open event.
2. Accept only the expected scheme, host, and callback path.
3. Exchange the one-time PKCE code using the Supabase client.
4. Preserve only validated in-app intent and relative redirect values.
5. Reject unrelated URLs and external redirect targets.

Never put access tokens or refresh tokens in redirect URLs.

## Supabase Auth configuration

Before native email confirmation or password recovery can complete, add the exact callback URI to the Supabase Auth redirect allow-list:

~~~text
com.arownd.app://auth/callback
~~~

Keep existing HTTPS production and web redirect URLs. Do not replace the Supabase Site URL with the native scheme. Review email templates to ensure they use the supplied redirect destination where appropriate.

## Verification checklist

- [ ] Confirm Android manifest and iOS URL scheme registration.
- [ ] Confirm cold-start and warm-start callback handling.
- [ ] Test PKCE exchange, email confirmation, password recovery, sign-out, and refresh.
- [ ] Confirm Supabase redirect allow-list settings.
- [ ] Reject unexpected schemes and external redirect targets.
- [ ] Test Android and iOS independently.

## Verification boundary

This document describes the expected identity and flow. It does not certify that dashboard settings, platform builds, or release artifacts have been verified.
