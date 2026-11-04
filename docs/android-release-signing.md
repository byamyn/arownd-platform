# Arownd — Android release signing

> **Project:** Arownd  
> **Owner:** byamyn  
> **Repository:** [byamyn/arownd-platform](https://github.com/byamyn/arownd-platform)  
> **Status:** Release procedure template; verify current Play Console and workflow settings before use.

## Fixed application identity

- Android namespace: com.arownd.app
- Android applicationId: com.arownd.app
- Capacitor appId: com.arownd.app
- Display name: Arownd

Do not change the application ID after publishing. A different ID is treated as a different application by app stores.

## Upload keystore

Generate the production upload keystore only on a trusted device with a current JDK. Keep the keystore and passwords outside the repository, chat, and temporary CI workspaces.

Example command:

~~~bash
keytool -genkeypair -v \
  -keystore arownd-upload-key.jks \
  -storetype JKS \
  -keyalg RSA -keysize 4096 \
  -validity 10000 \
  -alias arownd-upload
~~~

Back up the keystore securely in at least two controlled locations. Record the actual alias and versioning policy in private release records.

## GitHub Actions secrets

Verify exact names against the current workflow before configuring them.

| Secret | Purpose |
|---|---|
| ANDROID_KEYSTORE_BASE64 | Base64-encoded upload keystore |
| ANDROID_KEYSTORE_PASSWORD | Keystore password |
| ANDROID_KEY_ALIAS | Alias stored in the keystore |
| ANDROID_KEY_PASSWORD | Private-key password |
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_PUBLISHABLE_KEY | Public client key |

Never put SUPABASE_SERVICE_ROLE_KEY in a mobile build. A publishable key is not a substitute for RLS.

## Release checklist

1. Confirm the target branch and reviewed commit.
2. Confirm the app ID and signing identity.
3. Verify required Actions secrets are configured without printing their values.
4. Confirm the version name and monotonically increasing version code.
5. Run the release workflow and inspect its result.
6. Test the signed artifact on supported devices before distribution.
7. Preserve the signing key and recovery procedure securely.

## Google Play App Signing

Enroll in Play App Signing when creating the Play Console app. The local JKS is the upload key; Google Play manages the app-signing key used for distribution. Do not assume a key reset is a substitute for secure backups.

## Push notifications

Firebase/FCM configuration is separate from app signing. Use the Firebase configuration generated for package com.arownd.app. Never fabricate google-services.json or commit private service credentials.

## Verification boundary

This guide does not confirm that Play Console registration, signing secrets, Firebase configuration, or a release build are complete. Verify those independently before publishing.
