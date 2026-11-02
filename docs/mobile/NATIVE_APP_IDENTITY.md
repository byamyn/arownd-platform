# Arownd Native App Identity

## Confirmed application identity

- Android application ID: `com.arownd.app`
- iOS bundle identifier: `com.arownd.app`
- Capacitor application name: `Arownd`
- Local web bundle directory: `dist/client`
- Native authentication callback URI: `com.arownd.app://auth/callback`

The same reverse-domain identifier is used on both platforms so that Android and iOS builds share one stable application identity.

## Implemented native callback flow

The app now listens for Capacitor's launch URL and `appUrlOpen` event, accepts only `com.arownd.app://auth/callback`, and exchanges the one-time PKCE code on-device. Web callbacks continue to use Supabase's normal URL detection. Password recovery and account-type redirects are preserved, and external redirect destinations are rejected.

The Android activity is configured for warm-start deep links (`singleTask`), and the native bootstrap step registers the custom URL scheme in Android's manifest and iOS `Info.plist`.

## Supabase Auth redirect configuration

Before native email confirmation or password recovery can complete, add this exact URI to the Supabase Auth URL Configuration redirect allow-list:

`com.arownd.app://auth/callback`

Keep the existing HTTPS production callback and web redirect URLs. Do not replace the production Site URL with the native scheme. Configure the email templates to use the supplied redirect destination (`{{ .RedirectTo }}`) where the template currently hardcodes the Site URL.

## Native callback requirements

The native runtime must register the `com.arownd.app` URL scheme on Android and iOS and consume launch URLs plus subsequent URL-open events. For PKCE, the app must exchange the one-time `code` query parameter using the Supabase client before navigating to the validated in-app destination. Never place access tokens or refresh tokens in a redirect URL.

The callback handler must also preserve the existing `reset`, `intent`, and safe relative `redirect` parameters. Only accept the expected scheme, host, and callback path. Reject unrelated URLs and external redirect targets.

## Build output

TanStack Start SPA mode emits its shell as `dist/client/index.html` for Capacitor. The regular web production build remains SSR and retains its existing output/deployment path.
