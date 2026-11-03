# Android release signing

The `Android signed release AAB` workflow creates a signed Android App Bundle artifact. It does not upload to Google Play automatically.

Configure these repository **Actions secrets** before running the workflow:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded upload keystore file.
- `ANDROID_KEYSTORE_PASSWORD`: keystore password.
- `ANDROID_KEY_ALIAS`: upload key alias.
- `ANDROID_KEY_PASSWORD`: private-key password.
- `VITE_SUPABASE_URL`: public Supabase project URL used by the web build.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: public publishable key used by the web build.

Create and safeguard the upload keystore locally, then encode it for the secret value. Never commit the keystore, paste it into an issue/chat, or place its passwords in repository files. Keep an offline encrypted backup. If the upload key is lost or compromised, follow the Play Console upload-key reset process; do not create a new app-signing identity casually.

Run the workflow manually from Actions or push a version tag matching `v*`. It validates all secrets before building and publishes the AAB as a workflow artifact. The workflow run number is used as the Android versionCode; verify it is greater than the last versionCode uploaded to Play Console before each release.

Google Play App Signing should be enabled in Play Console. This artifact is a signed upload bundle, not proof of policy compliance or store approval.
