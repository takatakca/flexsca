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
3. **Android signing:** create an upload keystore in Android Studio (Build › Generate Signed App Bundle). Keep it out of Git. Upload the `.aab` to Play Console.
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

## Not verified

On a real phone, test sign-in, posting a request, unlocking a lead, messaging, file upload, buying credits and deleting the account.
