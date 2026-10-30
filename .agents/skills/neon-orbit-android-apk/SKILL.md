---
name: neon-orbit-android-apk
description: Use when building, updating, testing, packaging, or releasing the NEON ORBIT mobile edition for Android, including movement feel, performance, fullscreen behavior, offline assets, and APK delivery.
---

# NEON ORBIT Android APK

Use this skill to maintain and deliver the mobile-first NEON ORBIT game as an installable Android APK.

## Current implementation baseline

The mobile edition lives in `mobile/`; keep the macOS and Windows browser game in the repository root independent. `mobile/core.js` is the mobile gameplay simulation and `mobile/game.js` is its browser renderer and input layer.

The latest verified baseline is Games commit `af384184649170df7e531996045ce081fb4e1149`, with the mobile browser build at `https://neon-orbit-decniner.spunkymoose36.chatgpt.site/mobile/?build=27`. The Android release uses tag `android-apk` and asset `neon-orbit-mobile.apk`.

Current movement and performance behavior:

- Player velocity eases toward keyboard or analog-stick targets with a quick exponential response. Normal steering tops out at 240 world units per second; dash targets 850. Keep starts, release, and direction reversals fluid while retaining immediate control.
- The simulation catches up by at most 0.15 seconds per rendered frame, split into steps no larger than 0.05 seconds. Preserve this bound when changing frame timing.
- Canvas device-pixel ratio is capped at 2 to limit mobile rendering cost while keeping the device aspect ratio.
- A long deterministic run did not show unbounded growth in enemies, projectiles, or pickups. Recheck entity lifetimes and rendering cost before adding per-frame effects or collections.

## Project and Android packaging

- The Android shell is a WebView that loads `file:///android_asset/game/index.html` and hides the system bars for immersive play.
- For offline packaging, stage the mobile runtime files (`index.html`, CSS, JavaScript, manifest, service worker, `assets/`, and `icons/`) under `android/app/src/main/assets/game/`. Do not package the desktop root files.
- Inspect the current Gradle, Android SDK, JDK configuration, workflow, and release convention before building. The current workflow uses JDK 17, Gradle 8.9, and Android 35.

## Make and verify changes

1. Read repository guidance and inspect the relevant mobile simulation, renderer, Android wrapper, tests, and workflow before editing.
2. For gameplay or responsiveness changes, run the focused mobile tests and syntax checks. The regression suite covers viewport adaptation, bounded frame catch-up, smooth acceleration/braking/reversal, core gameplay, audio, and crew voices:
   `node --test tests/core.test.js tests/audio.test.js tests/voices.test.js mobile/tests/mobile-viewport.test.cjs mobile/tests/performance.test.cjs mobile/tests/movement.test.cjs`
   Run `node --check mobile/core.js` and `node --check mobile/game.js` after JavaScript edits.
3. Confirm the manifest, icon references, and offline assets exist. Build with the repository's Android workflow; use its existing GitHub Actions workflow when no local Android toolchain is configured instead of installing a large toolchain without need.
4. Verify the Actions run completed successfully and that the APK contains the mobile edition at `assets/game/index.html`. Inspect the release asset after publishing. A debug-signed APK is for sideloading and is not Play Store-ready.
5. Update the GitHub Release only when the user asks to save or publish the APK there. Use tag `android-apk` and asset `neon-orbit-mobile.apk`; preserve unrelated release assets.

Report the exact APK location, whether it is debug-signed, and the checks that actually passed. Keep generated APKs out of tracked source unless the user explicitly requests a binary in the repository tree.
