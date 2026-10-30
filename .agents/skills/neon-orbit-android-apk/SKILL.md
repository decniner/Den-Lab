---
name: neon-orbit-android-apk
description: Build and package NEON ORBIT's mobile-first edition as an installable Android APK, including offline WebView assets, full-screen behavior, and the GitHub Actions release flow.
---

# NEON ORBIT Android APK

Use this skill when asked to build, update, test, or deliver the Android APK for NEON ORBIT's mobile edition.

## Project shape

- Keep the phone edition in `mobile/`; it is designed for portrait and changing device aspect ratios. Preserve the desktop game in the repository root.
- The Android shell is a WebView that loads `file:///android_asset/game/index.html` and hides the system bars for immersive play.
- To package the mobile edition offline, stage its runtime files (`index.html`, CSS, JavaScript, manifest, service worker, `assets/`, and `icons/`) under `android/app/src/main/assets/game/`. Do not copy the desktop root files into the APK.
- Check the repository's current Gradle, Android SDK, and JDK configuration before building. The current GitHub Actions workflow uses JDK 17, Gradle 8.9, and Android 35.

## Build and verify

1. Read repository instructions and inspect the current mobile page, Android wrapper, build workflow, and output/release conventions before changing anything.
2. Run the focused mobile viewport test and JavaScript syntax checks after gameplay or layout changes. Confirm that the mobile manifest and referenced icons/assets are present.
3. Build the debug APK using the repository's Gradle workflow. Verify that the APK was produced, that its packaged `assets/game/index.html` is the mobile edition, and that Android packaging completed successfully. Do not call a debug-signed APK Play Store-ready.
4. If no local Android toolchain is configured, use the repository's existing GitHub Actions workflow rather than installing a large toolchain without a clear need. Inspect the run result and download/release asset before reporting completion.
5. Publish or replace a GitHub Release asset only when the user asks to save or publish the APK there. Preserve existing release assets unless replacing them is necessary to fulfill that request. The current release convention is tag `android-apk` and asset `neon-orbit-mobile.apk`.

Report the exact APK download location, whether it is a debug build, and the checks that actually passed. Keep generated APKs out of tracked source unless the user explicitly asks for a binary in the repository tree.
