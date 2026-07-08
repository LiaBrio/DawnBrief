# Android alarm smoke test

Use this checklist after installing a JDK and building a debug APK.

## Automated build status

Latest local command results:

```bash
npm test -- --runInBand
```

Result: passed, 10 test suites / 83 tests.

```bash
npx tsc --noEmit
```

Result: passed.

```bash
cd android
./gradlew test assembleDebug
```

Result: blocked in this environment before Gradle started:

```text
The operation couldn’t be completed. Unable to locate a Java Runtime.
Please visit http://www.java.com for information on installing Java.
```

## Device record

Fill this section during a real emulator/device run.

- Tester:
- Date:
- Device or emulator:
- Android API level:
- DawnBrief commit:
- Notification permission: granted / denied
- Exact alarm permission: allowed / denied
- Battery optimization state:

## Log capture

Run before the trigger window:

```bash
adb logcat -s DawnBriefAlarm AlarmManager NotificationService
```

## Positive trigger test

1. Install the debug build.
2. Open DawnBrief.
3. Grant notification permission.
4. Open DawnBrief settings and confirm exact alarm permission is available, or open system settings and allow exact alarms.
5. Create an enabled alarm two minutes ahead of the current device time.
6. Background the app.
7. Record the exact planned trigger timestamp.
8. Observe whether the full-screen alarm notification appears within one minute of the planned time.

Record:

- Planned trigger timestamp:
- Observed notification timestamp:
- App state: background / locked / foreground
- Result: pass / fail
- Notes:

## Disabled alarm negative test

1. Disable the same alarm.
2. Confirm the switch is off in the alarm list.
3. Schedule or wait through the same trigger window.
4. Confirm no alarm notification is delivered.

Record:

- Planned disabled trigger timestamp:
- Observed behavior:
- Result: pass / fail
- Notes:

## Reboot/time-change reschedule test

1. Create an enabled future alarm.
2. Reboot the device or change timezone/time.
3. Reopen or wait for the app/native receiver to process the durable reschedule signal.
4. Confirm the alarm still triggers at the recalculated next occurrence.

Record:

- Reschedule reason: boot / time changed / timezone changed
- Planned trigger timestamp after reschedule:
- Observed timestamp:
- Result: pass / fail
- Notes:
