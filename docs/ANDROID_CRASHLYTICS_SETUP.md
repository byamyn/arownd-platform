# Firebase Crashlytics setup for Android

Crashlytics is a no-cost Firebase product and can be used on the Spark plan. It can collect Android crash, non-fatal, and Application Not Responding (ANR) reports.

## One-time Firebase Console setup

1. Open the Firebase Console and create or select the Arownd Firebase project.
2. Add an Android app using the exact application ID: `com.sooqy.app` (this is the current Android applicationId in this repository).
3. Download the generated `google-services.json`.
4. Place the file at `android/app/google-services.json` in the local project before building the APK.
5. In Firebase Console, open Crashlytics and enable it for the Android app.
6. Build and install a fresh APK. Generate a test report only through a controlled debug build; do not add a crash button to the production UI.

The file is intentionally ignored by Git. Do not commit it. It contains app configuration that should stay with the Android build environment.

## What is already prepared in this repository

- The root Android Gradle build declares the Crashlytics Gradle plugin.
- The app Gradle build adds the Firebase Crashlytics SDK and applies Google Services + Crashlytics only when `google-services.json` exists.
- Without that file, builds remain independent of Firebase and log a clear message that Crashlytics is inactive.

## Important limitation

Crashlytics reports Android ANRs and their native/main-thread diagnostics. It does not guarantee a report for every short visual freeze. Keep the in-app diagnostic timeline enabled as well, and reproduce the keyboard issue on the affected device after installing the Firebase-enabled APK.

Official references:
- https://firebase.google.com/docs/crashlytics/android/get-started
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
