# FLEXS mobile apps (Google Play and App Store)

Added 2026-11-13. The Android and iOS apps are the same React app packaged with [Capacitor](https://capacitorjs.com) 8. They ship the built website inside the app and use the same Supabase backend as flexs.ca. **Nothing has been built, signed or submitted yet**: this repository now contains the native projects and everything below is what remains.

| Item | Value |
| --- | --- |
| App ID / bundle ID | `ca.flexs.app` (change in `capacitor.config.ts`, `android/app/build.gradle` and Xcode before the first store upload; it is permanent afterwards) |
| App name | FLEXS |
| Android project | `android/` (open in Android Studio) |
| iOS project | `ios/App/` (open in Xcode on a Mac) |
| Icon and splash sources | `assets/` (regenerate with `npm run icons`) |

## Build

```sh
npm ci
npm run mobile:sync      # builds the website and copies it into android/ and ios/
npm run mobile:android   # opens Android Studio
npm run mobile:ios       # opens Xcode (macOS only)
```

Run `npm run mobile:sync` after every website change before building a store package. Node 22 or newer is required.

## What the app does differently from the website

- `src/lib/platform.ts`: links sent by email (sign-in, password reset, email change), the Stripe return address and copied profile links always use `https://flexs.ca`, because the app itself runs from a local address.
- `src/components/NativeAppBridge.tsx`: opens verified `https://flexs.ca/...` links inside the app, handles the Android back button and keeps content clear of the notch and home indicator.
- Stripe Checkout opens in the phone's browser and returns to flexs.ca.

## Before store submission (owner actions)

1. **A working production backend and live flexs.ca.** The apps are useless until both exist. See `PROJECT_STATUS.md`.
2. **Developer accounts:** Google Play Console (US$25 once) and Apple Developer Program (US$99 per year), registered to the business.
3. **Android signing:** follow "Android: signed release" below (one key, created once, kept out of Git).
4. **iOS signing:** on a Mac, open `ios/App/App.xcodeproj`, choose the Apple team under Signing & Capabilities, then Product › Archive and upload.
5. **Links that open the app** (optional but recommended; until then emailed links open the website in the browser, which still works):
   - Android: publish `https://flexs.ca/.well-known/assetlinks.json` containing the package `ca.flexs.app` and the SHA-256 fingerprint shown in Play Console › App integrity. Put the file in `public/.well-known/`.
   - iOS: add the Associated Domains capability `applinks:flexs.ca` in Xcode and publish `https://flexs.ca/.well-known/apple-app-site-association` listing `<TeamID>.ca.flexs.app` with paths `/auth/*`, `/app/*`, `/my-requests/*`.
   - Add `https://flexs.ca/auth/callback` and `https://flexs.ca/auth/reset-password` to the Supabase Auth redirect allow-list.
6. **Store listing:** privacy policy URL, support URL, screenshots, data-safety / privacy-nutrition answers (account email, name, phone, messages, uploaded documents, purchase history).
7. **Account deletion:** done on 2026-11-13 (Settings › Account details › Delete my account). In Play Console's data-safety form, give `https://flexs.ca/help/privacy` as the account-deletion web link.
8. **Apple payment review risk:** credits are bought with Stripe. Apple normally requires In-App Purchase for digital goods used in the app; lead-marketplace credits are often accepted as payment for a real-world business service, but this is Apple's decision at review. If rejected, either sell credits on the website only (hide the buy buttons when `isNativeApp()` is true on iOS) or add In-App Purchase.
9. **Push notifications** are not implemented. Notifications currently appear only inside the app.

## Build status — 2026-11-13

- **Android compiles.** `./gradlew assembleDebug bundleRelease` succeeds in a cloud session (Android SDK platform 36, build-tools 36.0.0, Gradle 8.14.3, Android Gradle Plugin 8.13.0, JDK 21): debug APK about 5.1 MB, unsigned release bundle about 3.5 MB, package `ca.flexs.app`, version 1.0 (code 1), target SDK 36, only the INTERNET permission. The release bundle is **unsigned**: Play Console needs it signed with your upload key.
- **Android has not run on a device or emulator.** Cloud sessions have no virtualization. Install the debug APK on a phone to test.
- **iOS has not been compiled.** It needs Xcode on a Mac.
- **In-app account deletion exists** (Settings › Account details › Delete my account), backed by the `delete-account` Edge Function. Tested live.
- **Screen audit:** `scripts/ocr-screen-audit.mjs` opens every screen at phone size, screenshots it, reads it back with OCR (Tesseract, English and French) and compares with the page text; it also flags console errors, failed requests, broken images, sideways overflow and wording that must not ship. On 2026-11-13 all 15 public and 11 signed-in screens passed against the live backend.

```sh
# Local build (Linux or macOS with the Android SDK installed)
npm run mobile:sync
cd android && ./gradlew assembleDebug bundleRelease
# Screen audit against a running preview (needs tesseract-ocr)
npx vite preview --port 4188 &
npm run audit:screens -- http://127.0.0.1:4188 /tmp/flexs-screens
```

## Android: test build on a phone (no computer setup)

1. GitHub › Actions › **Android app build** › Run workflow.
2. When it finishes, download the `flexs-android` file at the bottom of the run and unzip it.
3. Send `app-debug.apk` to the phone (email, Drive or USB), open it, and allow "install unknown apps" for the app you opened it with.

The test build talks to the live backend, so anything done in it is real.

## Android: signed release

Checked on 2026-11-26 in a cloud session with a throwaway key: the bundle and APK come out signed (`apksigner verify`, `jarsigner -verify`), carry the version given on the command line, and without a key the bundle builds unsigned as before.

**1. Create the upload key, once.** On any computer with Java:

```sh
keytool -genkeypair -v -keystore flexs-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Keep `flexs-upload.jks` and its passwords in the business password manager, with a second copy elsewhere. With Play App Signing (the default for new apps) a lost upload key can be replaced by Google support; a leaked one cannot be un-leaked.

**2a. Build on your computer.** Create `android/keystore.properties` (Git ignores it, like `*.jks`):

```properties
storeFile=/full/path/to/flexs-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

```sh
npm run mobile:sync
cd android && ./gradlew bundleRelease -PversionCode=1 -PversionName=1.0
# result: android/app/build/outputs/bundle/release/app-release.aab
```

**2b. Or build on GitHub.** Add four repository secrets (Settings › Secrets and variables › Actions), then run **Android app build** with the version numbers:

| Secret | Value |
| --- | --- |
| `FLEXS_KEYSTORE_BASE64` | output of `base64 -w0 flexs-upload.jks` (macOS: `base64 -i flexs-upload.jks`) |
| `FLEXS_KEYSTORE_PASSWORD` | keystore password |
| `FLEXS_KEY_ALIAS` | `upload` |
| `FLEXS_KEY_PASSWORD` | key password |

**3. Upload** `app-release.aab` in Play Console › Testing › Internal testing first, add your own address as a tester, install from the Play link, run the checklist below, then promote to Production. Listing text and screenshots are in `docs/store/LISTING.md`.

**Every later release:** raise `versionCode` by one (Play refuses a repeat) and set the `versionName` people will see.

**Links that open the app:** after the first upload, copy the SHA-256 fingerprint from Play Console › App integrity › App signing into `public/.well-known/assetlinks.json` (step 5 above). To read the fingerprint of the upload key itself: `keytool -list -v -keystore flexs-upload.jks -alias upload`.

Phone backups of app data are switched off (`android:allowBackup="false"`), so a sign-in session is never copied to another device.

## Phone test checklist

Not done yet: cloud sessions cannot run a phone or an emulator. Do it once on the test build and once on the Play internal-testing build. Use one customer account and one professional account.

| # | Step | Expected |
| --- | --- | --- |
| 1 | Open the app with no network, then turn the network on | Home page appears; no white screen |
| 2 | Switch to French and back (footer) | Text changes; choice kept after closing the app |
| 3 | Type a service on the home page, answer the questions | Each single-choice answer moves on by itself; the form fits the screen with the keyboard open |
| 4 | Finish the request with a new email address | Confirmation screen; the request shows under My requests after sign-in |
| 5 | Sign in with the emailed link | Opens the site in the browser until app links are set up (step 5 above); afterwards opens the app |
| 6 | Sign in with a password, close the app completely, reopen | Still signed in |
| 7 | Android back button on a sub-page, on a dialog, on the home page | Goes back; closes the dialog; leaves the app |
| 8 | Professional: open Leads, open one lead | List scoped to the pro's services; contact details hidden before unlocking |
| 9 | Professional: buy the smallest credit pack (needs Stripe keys, O2) | Stripe opens in the browser; after payment the balance is higher back in the app |
| 10 | Professional: unlock the lead, send a quote and a message | Balance drops by the lead's price; customer sees quote and message |
| 11 | Customer: reply, attach a photo from the gallery and one from the camera | Both upload and open |
| 12 | Professional: upload a document under Profile | Upload completes; file listed |
| 13 | Rotate the phone; use a small phone and a large one | Nothing cut off; content clear of the notch and the bottom bar |
| 14 | Put the app in the background for 10 minutes, come back | Same screen, still signed in |
| 16 | Open the map on the Leads page and a professional's video, if any | Map tiles and video load (the app now carries the site's content security policy) |
| 15 | Settings › Account details › Delete my account (test account) | Account gone; sign-in refused afterwards |

Write the phone model, Android version and any failing step number in `WORKLOG.md`.
