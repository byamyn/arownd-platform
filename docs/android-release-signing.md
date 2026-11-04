# Arownd Android release identity and signing

## Fixed application identity

- Android namespace: `com.arownd.app`
- Android applicationId: `com.arownd.app`
- Capacitor appId: `com.arownd.app`
- Display name: `Arownd`
- First Play release: `versionName=1.0.0`, `versionCode=1`

Do not change the application ID after publishing to Google Play. A different application ID is treated as a different app.

## Create the upload keystore locally

Run this on a trusted computer with a current JDK. Do not create the production signing key in a temporary CI runner, commit it, upload it to chat, or share its passwords.

```bash
keytool -genkeypair -v \
  -keystore arownd-upload-key.jks \
  -storetype JKS \
  -keyalg RSA -keysize 4096 \
  -validity 10000 \
  -alias arownd-upload
```

Choose strong unique passwords and keep the keystore plus passwords in at least two secure backups. The alias in this example is `arownd-upload`; use the exact alias you created.

Create the Base64 value for GitHub Actions:

- Linux: `base64 -w 0 arownd-upload-key.jks > arownd-upload-key.base64`
- macOS: `base64 < arownd-upload-key.jks | tr -d '\\n' > arownd-upload-key.base64`
- PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("arownd-upload-key.jks")) | Set-Content -NoNewline arownd-upload-key.base64`

Never commit either generated file. Add these GitHub Actions repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Entire contents of `arownd-upload-key.base64` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | `arownd-upload` (or the alias actually chosen) |
| `ANDROID_KEY_PASSWORD` | Password for that key |
| `VITE_SUPABASE_URL` | Production Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production Supabase publishable/anon key |

Do not put a Supabase service-role key in these build secrets. The publishable key is intended for client applications.

## First release build

After all six secrets are configured, open **Actions → Android signed release AAB and APK → Run workflow** and use:

- Branch: `main`
- Version name: `1.0.0`
- Version code: `1`

The workflow produces both a signed Android App Bundle (`.aab`) for Google Play and a signed APK (`.apk`) for controlled installation/testing. The AAB is the normal Google Play upload artifact.

For every later Play release, increase `versionCode` (for example 2, 3, 4...) and choose the corresponding `versionName`. Never reuse a version code already uploaded to Play. For tag-based builds, the workflow derives versionName from the tag (for example `v1.0.1`) and uses the GitHub Actions run number as versionCode; verify that it exceeds the last versionCode uploaded to Play.

## Google Play App Signing

When creating the Play Console app, enroll in Play App Signing. This JKS is the upload key; Google Play manages the app-signing key used for distribution. Keep the upload key backed up securely. If the upload key is lost, Google's upload-key reset process may be available, but do not rely on that as your backup plan.

## Push notifications

Firebase/FCM setup is separate from signing. If Arownd uses native push notifications, configure the correct Android Firebase app for package `com.arownd.app`, download its `google-services.json`, and add it to `android/app/google-services.json` through the approved secure project process. Do not fabricate this file; it must come from the Firebase project.
