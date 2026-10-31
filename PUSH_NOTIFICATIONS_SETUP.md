# Arownd native push notifications setup

This integration uses Capacitor Push Notifications on Android, Firebase Cloud Messaging (FCM) for delivery, and a Supabase Edge Function to send messages when a row is inserted into `public.notifications`.

## Current Android application ID

The repository currently declares `com.sooqy.app` in `capacitor.config.ts`. Register this exact application ID in Firebase. Do not change the application ID as part of push setup: changing it would affect installation identity and OAuth deep links.

## 1. Create the Firebase Android app

1. Create or select a Firebase project.
2. Add an Android app with package name `com.sooqy.app`.
3. Download its `google-services.json` file.
4. Put the file at `android/app/google-services.json` before building the Android app.

The file contains Firebase app configuration identifiers, not the service-account private key. Do not put a service-account JSON file in the repository.

## 2. Configure the FCM server credential in Supabase

In Firebase Console, open Project settings → Service accounts and create a private key for a service account that is allowed to send Firebase Cloud Messaging messages.

In Supabase Dashboard → Edge Functions → Secrets, add:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete contents of the downloaded service-account JSON file, as one secret value.
- `PUSH_WEBHOOK_SECRET`: a long random secret (at least 32 random bytes).

Never add either value to GitHub, frontend environment variables, app code, or a support message. The Edge Function already receives `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase runtime.

## 3. Connect new in-app notifications to the push sender

In Supabase Dashboard → Database → Webhooks, create a webhook with:

- Name: `arownd-send-push`
- Table: `public.notifications`
- Events: `INSERT` only
- Method: `POST`
- URL: `https://nagzoafkitfsqlcwsdau.supabase.co/functions/v1/send-push-notification`
- Header: `x-push-webhook-secret: <the same PUSH_WEBHOOK_SECRET value>`
- Content type: `application/json`

Do not enable UPDATE or DELETE events. The webhook must only forward newly inserted notification rows.

## 4. Build and install the Android app

The repository includes `@capacitor/push-notifications` and the app-side registration handlers. The mobile build must run Capacitor sync after dependency installation. Make sure the Firebase file is present before the Android Gradle build.

On the app, sign in, open Notifications, and tap **Enable notifications**. Android 13+ will show the system permission prompt. The app stores the device token against the signed-in account using authenticated Supabase RPCs. Signing out attempts to detach that account's registered devices.

## 5. Test

1. Install the newly built APK on a real Android device with Google Play services.
2. Enable notifications from the in-app Notifications screen and grant Android's permission.
3. Confirm that the device token is stored in `public.push_device_tokens` for the signed-in account.
4. Insert a test notification for that same account using the existing trusted application flow.
5. Confirm that a system notification appears while the app is backgrounded, and that tapping it opens the relevant in-app notification/order screen.

The web/PWA app continues to use the existing in-app notifications and Supabase Realtime. This native FCM implementation is for Android; iOS requires an iOS target, APNs configuration, and Apple signing/capability setup.

## Security notes

- Device tokens are not readable through the client Data API; clients can only register/unregister their own devices through authenticated RPCs.
- The FCM service-account private key stays in Supabase Edge Function secrets.
- The Edge Function has JWT verification disabled because Database Webhooks call it; it therefore validates the dedicated `x-push-webhook-secret` header before doing any work.
- Push payloads contain only notification text and small navigation identifiers, not receipts, addresses, phone numbers, or payment details.
