# DawnBrief

DawnBrief is an Android-first smart alarm vertical slice built with Expo, React Native, SQLite, Zustand, and a local Android exact-alarm module. The UI follows a calm Apple-inspired card style while keeping unfinished capabilities clearly labeled as follow-on work.

## Current vertical slice

- Android-focused Expo development-build app.
- Persistent daily and weekly alarms backed by SQLite.
- Deterministic next-trigger calculation.
- Android native exact-alarm scheduling bridge with notification and boot/time-change reschedule signals.
- Alarm list, next-alarm summary, create/edit form, enable/disable switch, sound choice, snooze duration, weekly picker, and date-note field.
- Placeholder tabs for lunar calendar/date notes and weather/news/RSS that explicitly state they are not wired yet.

## Prerequisites

- Node.js compatible with the installed Expo SDK.
- npm.
- Android Studio with an Android SDK and emulator/device.
- A local JDK/Java Runtime available on `PATH` for Gradle builds.

## Setup

```bash
npm install
```

## Run on Android

```bash
npx expo run:android
```

On Android 13+, grant notification permission. On Android 12+, also allow exact alarms for DawnBrief in system settings if prompted or shown as unavailable in the app settings tab.

## Verification

```bash
npm test -- --runInBand
npx tsc --noEmit
cd android
./gradlew test assembleDebug
```

Latest local verification in this workspace:

- `npm test -- --runInBand`: passed, 10 suites / 83 tests.
- `npx tsc --noEmit`: passed.
- `android ./gradlew test assembleDebug`: blocked before Gradle execution because this machine has no Java Runtime installed.

Manual Android alarm smoke-test steps are documented in [docs/testing/android-alarm-smoke-test.md](docs/testing/android-alarm-smoke-test.md).

## Out of scope for this vertical slice

The following are intentionally not complete yet and should be covered by follow-on plans:

- Lunar-calendar date selection and holiday rules.
- Weather provider integration.
- News provider integration.
- User-managed RSS source fetching and parsing.
- TTS broadcast composition and playback.
- Real ringing audio loop and volume behavior.
- Snooze foreground/background service behavior.
- Full boot-rescheduling end-to-end verification on device.
