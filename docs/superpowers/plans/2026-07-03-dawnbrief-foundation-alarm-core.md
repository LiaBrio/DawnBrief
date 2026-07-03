# DawnBrief Foundation and Alarm Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable Android-first DawnBrief vertical slice with Apple-inspired light/dark UI, persistent daily/weekly alarms, deterministic next-trigger calculation, and an Android exact-alarm native bridge.

**Architecture:** Expo Router owns navigation and React Native screens; pure TypeScript domain modules own alarm rules and are tested without React Native. A repository interface separates UI state from SQLite, while an Expo local native module wraps Android `AlarmManager`, full-screen notification setup, boot recovery, and permission status.

**Tech Stack:** React Native, Expo Development Build, Expo Router, TypeScript, Jest with `jest-expo`, React Native Testing Library, Expo SQLite, Zustand, Kotlin, Android AlarmManager.

---

## File map

- `app/_layout.tsx`: root theme, status bar, and database bootstrap.
- `app/(tabs)/_layout.tsx`: four-tab navigation shell.
- `app/(tabs)/index.tsx`: alarm list and next-alarm card.
- `app/(tabs)/calendar.tsx`: phase-one informational calendar screen with explicit scope message.
- `app/(tabs)/feeds.tsx`: phase-one informational feeds screen with explicit scope message.
- `app/(tabs)/settings.tsx`: theme and exact-alarm permission status.
- `app/alarm/edit.tsx`: create/edit daily or weekly alarms.
- `src/features/alarms/domain/alarm.ts`: alarm types and invariants.
- `src/features/alarms/domain/nextTrigger.ts`: pure next-trigger calculation.
- `src/features/alarms/data/alarmRepository.ts`: repository contract.
- `src/features/alarms/data/sqliteAlarmRepository.ts`: SQLite persistence.
- `src/features/alarms/store/useAlarmStore.ts`: screen-facing state and commands.
- `src/features/alarms/native/exactAlarm.ts`: typed native bridge adapter.
- `modules/expo-exact-alarm/android/src/main/java/expo/modules/exactalarm/ExpoExactAlarmModule.kt`: Android exact-alarm bridge.
- `modules/expo-exact-alarm/android/src/main/java/expo/modules/exactalarm/AlarmReceiver.kt`: alarm delivery receiver.
- `modules/expo-exact-alarm/android/src/main/java/expo/modules/exactalarm/BootReceiver.kt`: reboot/time-change rescheduling signal.
- `src/theme/tokens.ts`: color, spacing, radius, and typography tokens.
- `src/components/AlarmCard.tsx`: one alarm row.
- `src/components/NextAlarmHero.tsx`: next trigger summary.
- `src/components/EmptyState.tsx`: empty-list guidance.

### Task 1: Scaffold the Expo development-build project

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`
- Create: `jest.config.js`
- Create: `jest.setup.ts`
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Generate the Expo Router TypeScript project**

Run:

```bash
npx create-expo-app@latest work/dawnbrief-scaffold --template tabs
rsync -a --exclude .git work/dawnbrief-scaffold/ ./
npx expo install expo-dev-client expo-sqlite expo-notifications expo-router expo-status-bar
npm install zustand
npm install --save-dev jest jest-expo @testing-library/react-native @types/jest
```

Expected: `package.json` contains Expo Router and the install commands exit 0.

- [ ] **Step 2: Configure Android identity and permissions**

Set `app.json` to:

```json
{
  "expo": {
    "name": "DawnBrief",
    "slug": "dawnbrief",
    "scheme": "dawnbrief",
    "version": "0.1.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "plugins": ["expo-router", "expo-sqlite", "expo-notifications", "./modules/expo-exact-alarm"],
    "android": {
      "package": "com.liabriodawn.dawnbrief",
      "permissions": [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_FULL_SCREEN_INTENT",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.WAKE_LOCK"
      ]
    }
  }
}
```

- [ ] **Step 3: Add the test configuration**

Set `jest.config.js` to:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/work/'],
};
```

Set `jest.setup.ts` to:

```ts
import '@testing-library/react-native/extend-expect';
```

- [ ] **Step 4: Verify the scaffold**

Run:

```bash
npx tsc --noEmit
npm test -- --runInBand
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app.json tsconfig.json babel.config.js jest.config.js jest.setup.ts app assets
git commit -m "chore: scaffold DawnBrief Expo app"
```

### Task 2: Define alarm types and calculate the next trigger

**Files:**
- Create: `src/features/alarms/domain/alarm.ts`
- Create: `src/features/alarms/domain/nextTrigger.ts`
- Test: `src/features/alarms/domain/__tests__/nextTrigger.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `src/features/alarms/domain/__tests__/nextTrigger.test.ts`:

```ts
import { nextTrigger } from '../nextTrigger';
import type { Alarm } from '../alarm';

const base: Alarm = {
  id: 'alarm-1',
  label: '起床',
  hour: 7,
  minute: 30,
  enabled: true,
  repeat: { kind: 'daily' },
  sound: 'aurora',
  snoozeMinutes: 9,
  createdAt: '2026-07-03T00:00:00.000Z',
  updatedAt: '2026-07-03T00:00:00.000Z',
};

describe('nextTrigger', () => {
  test('uses today when a daily alarm is still ahead', () => {
    expect(nextTrigger(base, new Date('2026-07-03T07:00:00+08:00'))?.toISOString())
      .toBe('2026-07-02T23:30:00.000Z');
  });

  test('uses tomorrow when todays time has passed', () => {
    expect(nextTrigger(base, new Date('2026-07-03T08:00:00+08:00'))?.toISOString())
      .toBe('2026-07-03T23:30:00.000Z');
  });

  test('selects the next configured weekday', () => {
    const alarm = { ...base, repeat: { kind: 'weekdays', days: [1, 3, 5] } as const };
    expect(nextTrigger(alarm, new Date('2026-07-03T08:00:00+08:00'))?.toISOString())
      .toBe('2026-07-05T23:30:00.000Z');
  });

  test('returns null for a disabled alarm', () => {
    expect(nextTrigger({ ...base, enabled: false }, new Date())).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm test -- src/features/alarms/domain/__tests__/nextTrigger.test.ts --runInBand
```

Expected: FAIL because `../nextTrigger` does not exist.

- [ ] **Step 3: Add the domain types**

Create `src/features/alarms/domain/alarm.ts`:

```ts
export type RepeatRule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: readonly number[] };

export type Alarm = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  repeat: RepeatRule;
  sound: 'aurora' | 'radar' | 'silk';
  snoozeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export function assertAlarm(alarm: Alarm): void {
  if (!Number.isInteger(alarm.hour) || alarm.hour < 0 || alarm.hour > 23) throw new Error('hour_out_of_range');
  if (!Number.isInteger(alarm.minute) || alarm.minute < 0 || alarm.minute > 59) throw new Error('minute_out_of_range');
  if (alarm.repeat.kind === 'weekdays' && alarm.repeat.days.some(day => day < 0 || day > 6)) {
    throw new Error('weekday_out_of_range');
  }
}
```

- [ ] **Step 4: Implement the minimal calculation**

Create `src/features/alarms/domain/nextTrigger.ts`:

```ts
import { assertAlarm, type Alarm } from './alarm';

export function nextTrigger(alarm: Alarm, now: Date): Date | null {
  if (!alarm.enabled) return null;
  assertAlarm(alarm);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);
    if (candidate <= now) continue;
    if (alarm.repeat.kind === 'weekdays' && !alarm.repeat.days.includes(candidate.getDay())) continue;
    return candidate;
  }
  return null;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npm test -- src/features/alarms/domain/__tests__/nextTrigger.test.ts --runInBand
npx tsc --noEmit
```

Expected: 4 tests pass and typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/alarms/domain
git commit -m "feat: add alarm scheduling domain"
```

### Task 3: Persist alarms behind a repository interface

**Files:**
- Create: `src/features/alarms/data/alarmRepository.ts`
- Create: `src/features/alarms/data/sqliteAlarmRepository.ts`
- Test: `src/features/alarms/data/__tests__/alarmRepository.contract.test.ts`

- [ ] **Step 1: Write the repository contract test**

Create `src/features/alarms/data/__tests__/alarmRepository.contract.test.ts`:

```ts
import type { AlarmRepository } from '../alarmRepository';
import type { Alarm } from '../../domain/alarm';

export function alarmRepositoryContract(createRepository: () => Promise<AlarmRepository>) {
  test('saves, lists, updates and deletes alarms', async () => {
    const repository = await createRepository();
    const alarm: Alarm = {
      id: 'a1', label: '晨间', hour: 7, minute: 0, enabled: true,
      repeat: { kind: 'daily' }, sound: 'aurora', snoozeMinutes: 9,
      createdAt: '2026-07-03T00:00:00.000Z', updatedAt: '2026-07-03T00:00:00.000Z',
    };
    await repository.save(alarm);
    expect(await repository.list()).toEqual([alarm]);
    await repository.save({ ...alarm, enabled: false });
    expect((await repository.get('a1'))?.enabled).toBe(false);
    await repository.remove('a1');
    expect(await repository.list()).toEqual([]);
  });
}
```

- [ ] **Step 2: Add the repository interface**

Create `src/features/alarms/data/alarmRepository.ts`:

```ts
import type { Alarm } from '../domain/alarm';

export interface AlarmRepository {
  initialize(): Promise<void>;
  list(): Promise<Alarm[]>;
  get(id: string): Promise<Alarm | null>;
  save(alarm: Alarm): Promise<void>;
  remove(id: string): Promise<void>;
}
```

- [ ] **Step 3: Implement SQLite persistence**

Create `src/features/alarms/data/sqliteAlarmRepository.ts`:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Alarm } from '../domain/alarm';
import type { AlarmRepository } from './alarmRepository';

type Row = { id: string; payload: string; updated_at: string };

export class SQLiteAlarmRepository implements AlarmRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async initialize() {
    await this.db.execAsync(`CREATE TABLE IF NOT EXISTS alarms (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`);
  }

  async list() {
    const rows = await this.db.getAllAsync<Row>('SELECT id, payload, updated_at FROM alarms ORDER BY updated_at DESC');
    return rows.map(row => JSON.parse(row.payload) as Alarm);
  }

  async get(id: string) {
    const row = await this.db.getFirstAsync<Row>('SELECT id, payload, updated_at FROM alarms WHERE id = ?', id);
    return row ? JSON.parse(row.payload) as Alarm : null;
  }

  async save(alarm: Alarm) {
    await this.db.runAsync(
      `INSERT INTO alarms (id, payload, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      alarm.id, JSON.stringify(alarm), alarm.updatedAt,
    );
  }

  async remove(id: string) {
    await this.db.runAsync('DELETE FROM alarms WHERE id = ?', id);
  }
}
```

- [ ] **Step 4: Run contract tests with an in-memory test double and typecheck**

Implement a test-only `MemoryAlarmRepository` in the contract test, invoke `alarmRepositoryContract(async () => new MemoryAlarmRepository())`, then run:

```bash
npm test -- src/features/alarms/data/__tests__/alarmRepository.contract.test.ts --runInBand
npx tsc --noEmit
```

Expected: repository contract passes and typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/alarms/data
git commit -m "feat: persist alarms with repository boundary"
```

### Task 4: Add the exact-alarm adapter and Android module

**Files:**
- Create: `src/features/alarms/native/exactAlarm.ts`
- Create: `modules/expo-exact-alarm/expo-module.config.json`
- Create: `modules/expo-exact-alarm/index.ts`
- Create: `modules/expo-exact-alarm/android/src/main/AndroidManifest.xml`
- Create: `modules/expo-exact-alarm/android/src/main/java/expo/modules/exactalarm/ExpoExactAlarmModule.kt`
- Create: `modules/expo-exact-alarm/android/src/main/java/expo/modules/exactalarm/AlarmReceiver.kt`
- Create: `modules/expo-exact-alarm/android/src/main/java/expo/modules/exactalarm/BootReceiver.kt`
- Test: `src/features/alarms/native/__tests__/exactAlarm.test.ts`

- [ ] **Step 1: Write the failing TypeScript adapter test**

Create `src/features/alarms/native/__tests__/exactAlarm.test.ts`:

```ts
jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({
    schedule: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
    canScheduleExactAlarms: jest.fn().mockResolvedValue(true),
  }),
}));

import { exactAlarm } from '../exactAlarm';

test('reports exact alarm capability', async () => {
  await expect(exactAlarm.canSchedule()).resolves.toBe(true);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm test -- src/features/alarms/native/__tests__/exactAlarm.test.ts --runInBand
```

Expected: FAIL because `../exactAlarm` does not exist.

- [ ] **Step 3: Implement the typed adapter**

Create `src/features/alarms/native/exactAlarm.ts`:

```ts
import { requireNativeModule } from 'expo-modules-core';

type NativeExactAlarm = {
  schedule(id: string, triggerAtMillis: number, label: string): Promise<void>;
  cancel(id: string): Promise<void>;
  canScheduleExactAlarms(): Promise<boolean>;
  openExactAlarmSettings(): Promise<void>;
};

const native = requireNativeModule<NativeExactAlarm>('ExpoExactAlarm');

export const exactAlarm = {
  schedule: (id: string, triggerAt: Date, label: string) => native.schedule(id, triggerAt.getTime(), label),
  cancel: (id: string) => native.cancel(id),
  canSchedule: () => native.canScheduleExactAlarms(),
  openSettings: () => native.openExactAlarmSettings(),
};
```

- [ ] **Step 4: Implement native scheduling**

Create `ExpoExactAlarmModule.kt` with these exported functions:

```kotlin
package expo.modules.exactalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoExactAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoExactAlarm")

    AsyncFunction("canScheduleExactAlarms") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S || manager.canScheduleExactAlarms()
    }

    AsyncFunction("schedule") { id: String, triggerAtMillis: Double, label: String ->
      val context = appContext.reactContext ?: error("react_context_unavailable")
      val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(context, AlarmReceiver::class.java).putExtra("alarm_id", id).putExtra("label", label)
      val pending = PendingIntent.getBroadcast(context, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      manager.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAtMillis.toLong(), pending), pending)
    }

    AsyncFunction("cancel") { id: String ->
      val context = appContext.reactContext ?: error("react_context_unavailable")
      val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(context, AlarmReceiver::class.java)
      val pending = PendingIntent.getBroadcast(context, id.hashCode(), intent, PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE)
      if (pending != null) manager.cancel(pending)
    }

    AsyncFunction("openExactAlarmSettings") {
      val context = appContext.reactContext ?: return@AsyncFunction
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }
  }
}
```

- [ ] **Step 5: Register receivers and notification behavior**

Declare `AlarmReceiver` and `BootReceiver` in the module manifest. `AlarmReceiver` must create a high-importance `alarm` channel, post a category-alarm notification with a full-screen intent to `MainActivity`, and include `alarm_id`. `BootReceiver` must listen for `BOOT_COMPLETED`, `TIME_SET`, and `TIMEZONE_CHANGED`, then start the app rescheduling worker. Keep receiver logic focused; audio playback is scheduled for the later alarm-experience plan.

- [ ] **Step 6: Run tests and generate the Android project**

Run:

```bash
npm test -- src/features/alarms/native/__tests__/exactAlarm.test.ts --runInBand
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleDebug
```

Expected: adapter test passes and Gradle creates `android/app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 7: Commit**

```bash
git add src/features/alarms/native modules/expo-exact-alarm app.json android
git commit -m "feat: bridge Android exact alarms"
```

### Task 5: Build the alarm store and rescheduling flow

**Files:**
- Create: `src/features/alarms/store/useAlarmStore.ts`
- Test: `src/features/alarms/store/__tests__/useAlarmStore.test.ts`

- [ ] **Step 1: Write a failing store test**

Test that `load()` reads alarms, `save()` persists and schedules enabled alarms, `toggle()` cancels disabled alarms, and `remove()` cancels before deleting. Inject `AlarmRepository`, `now`, and exact-alarm adapter so the test uses spies rather than Android.

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm test -- src/features/alarms/store/__tests__/useAlarmStore.test.ts --runInBand
```

Expected: FAIL because the store factory does not exist.

- [ ] **Step 3: Implement the store factory**

Create `useAlarmStore.ts` with:

```ts
import { create } from 'zustand';
import type { Alarm } from '../domain/alarm';
import { nextTrigger } from '../domain/nextTrigger';
import type { AlarmRepository } from '../data/alarmRepository';

type Scheduler = { schedule(id: string, date: Date, label: string): Promise<void>; cancel(id: string): Promise<void> };
type State = {
  alarms: Alarm[];
  loading: boolean;
  load(): Promise<void>;
  save(alarm: Alarm): Promise<void>;
  remove(id: string): Promise<void>;
  toggle(id: string, enabled: boolean): Promise<void>;
};

export function createAlarmStore(repository: AlarmRepository, scheduler: Scheduler, now = () => new Date()) {
  return create<State>((set, get) => ({
    alarms: [], loading: false,
    async load() {
      set({ loading: true });
      await repository.initialize();
      set({ alarms: await repository.list(), loading: false });
    },
    async save(alarm) {
      await repository.save(alarm);
      const trigger = nextTrigger(alarm, now());
      if (trigger) await scheduler.schedule(alarm.id, trigger, alarm.label);
      else await scheduler.cancel(alarm.id);
      set({ alarms: await repository.list() });
    },
    async remove(id) {
      await scheduler.cancel(id);
      await repository.remove(id);
      set({ alarms: await repository.list() });
    },
    async toggle(id, enabled) {
      const alarm = get().alarms.find(item => item.id === id);
      if (!alarm) return;
      await get().save({ ...alarm, enabled, updatedAt: now().toISOString() });
    },
  }));
}
```

- [ ] **Step 4: Run store and domain tests**

Run:

```bash
npm test -- src/features/alarms --runInBand
npx tsc --noEmit
```

Expected: all alarm tests pass and typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/alarms/store
git commit -m "feat: coordinate alarm persistence and scheduling"
```

### Task 6: Create the Apple-inspired alarm UI

**Files:**
- Create: `src/theme/tokens.ts`
- Create: `src/components/AlarmCard.tsx`
- Create: `src/components/NextAlarmHero.tsx`
- Create: `src/components/EmptyState.tsx`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/calendar.tsx`
- Create: `app/(tabs)/feeds.tsx`
- Create: `app/(tabs)/settings.tsx`
- Test: `src/components/__tests__/AlarmCard.test.tsx`

- [ ] **Step 1: Write the failing AlarmCard test**

Create a test rendering an enabled 07:30 alarm and assert that `07:30`, `起床`, `每天`, and an enabled switch are visible. Fire the switch and assert `onToggle(false)`.

- [ ] **Step 2: Run the component test and verify failure**

Run:

```bash
npm test -- src/components/__tests__/AlarmCard.test.tsx --runInBand
```

Expected: FAIL because `AlarmCard` does not exist.

- [ ] **Step 3: Add reusable tokens**

Create `src/theme/tokens.ts`:

```ts
export const tokens = {
  spacing: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 },
  radius: { card: 24, button: 18, pill: 999 },
  light: { background: '#F2F2F7', card: '#FFFFFF', text: '#111113', secondary: '#6E6E73', accent: '#FF9500' },
  dark: { background: '#000000', card: '#1C1C1E', text: '#F5F5F7', secondary: '#98989D', accent: '#FF9F0A' },
};
```

- [ ] **Step 4: Implement list components and screen**

`AlarmCard` uses a borderless card, 52px tabular time, secondary label/repeat text, and native `Switch`. `NextAlarmHero` shows “下一次响铃” and a relative day/time. `index.tsx` renders `FlatList`, an orange circular add button, and `EmptyState` when no alarms exist. Use `useColorScheme()` to select light/dark tokens; do not hard-code colors outside `tokens.ts`.

- [ ] **Step 5: Implement the tab shell**

Configure tabs named `闹钟`, `日历`, `资讯`, `设置`. Calendar and feeds screens explicitly state “将在下一阶段接入农历/节气” and “将在下一阶段接入天气、新闻与 RSS”, so the vertical slice never presents unfinished controls as functional. Settings displays exact-alarm permission state and a button that calls `exactAlarm.openSettings()` when unavailable.

- [ ] **Step 6: Run component tests and typecheck**

Run:

```bash
npm test -- src/components --runInBand
npx tsc --noEmit
```

Expected: component tests pass and typecheck exits 0.

- [ ] **Step 7: Commit**

```bash
git add app src/components src/theme
git commit -m "feat: add DawnBrief alarm interface"
```

### Task 7: Add create/edit alarm flow

**Files:**
- Create: `app/alarm/edit.tsx`
- Create: `src/features/alarms/components/TimePickerField.tsx`
- Create: `src/features/alarms/components/WeekdayPicker.tsx`
- Test: `src/features/alarms/components/__tests__/WeekdayPicker.test.tsx`

- [ ] **Step 1: Write a failing weekday picker test**

Render the picker with `[1, 2, 3, 4, 5]`, press `六`, and assert the callback receives `[1, 2, 3, 4, 5, 6]`; press `一` and assert the callback receives `[2, 3, 4, 5]`.

- [ ] **Step 2: Implement `WeekdayPicker`**

Render seven circular buttons labeled `日一二三四五六`, with selected days using the orange accent. Sort the emitted day array ascending and prevent an empty selection by showing an inline validation message.

- [ ] **Step 3: Implement the edit screen**

The screen must support label, Android time picker, daily/weekly mode, weekday selection, sound choice, snooze duration, and enabled state. On save, construct an `Alarm`, call the store `save`, and return to the list. Generate IDs with `crypto.randomUUID()` and preserve `createdAt` when editing.

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
npm test -- src/features/alarms/components --runInBand
npx tsc --noEmit
```

Expected: picker tests pass and typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add app/alarm src/features/alarms/components
git commit -m "feat: create and edit basic alarms"
```

### Task 8: Verify the Android vertical slice

**Files:**
- Create: `docs/testing/android-alarm-smoke-test.md`
- Modify: `README.md`

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm test -- --runInBand
npx tsc --noEmit
cd android && ./gradlew test assembleDebug
```

Expected: Jest passes with zero failures, TypeScript exits 0, and Gradle reports `BUILD SUCCESSFUL`.

- [ ] **Step 2: Perform the emulator smoke test**

Install the debug APK, grant notifications and exact-alarm access, create an alarm two minutes ahead, background the app, and confirm the full-screen notification appears within one minute of the planned time. Disable the alarm and repeat to confirm it no longer fires.

- [ ] **Step 3: Document reproducible verification**

Create `docs/testing/android-alarm-smoke-test.md` containing device/API level, permission state, exact planned and observed trigger timestamps, background state, pass/fail, and captured logcat command:

```bash
adb logcat -s DawnBriefAlarm AlarmManager NotificationService
```

- [ ] **Step 4: Update README**

Document prerequisites (Node, Android Studio/JDK), `npm install`, `npx expo run:android`, `npm test -- --runInBand`, permission setup, current vertical-slice features, and explicitly list lunar calendar, holiday rules, weather, RSS, TTS, ringing audio, snooze service, and boot rescheduling as out of scope for this vertical slice and covered by the named follow-on plans below.

- [ ] **Step 5: Commit verification docs**

```bash
git add README.md docs/testing/android-alarm-smoke-test.md
git commit -m "docs: add Android alarm verification guide"
```

## Follow-on plans

After this plan is verified, create and execute separate plans in this order:

1. `dawnbrief-ringing-experience`: foreground service, audio focus, gradual ringtone, stop and snooze actions, full-screen alarm UI, and reboot rescheduling.
2. `dawnbrief-calendar-rules`: lunar conversion, leap-month behavior, solar terms, statutory holidays, adjusted workdays, date notes, and next-trigger integration.
3. `dawnbrief-morning-briefing`: location/manual city, weather cache, recommended and custom RSS/Atom feeds, HTML sanitation, TTS queue, and offline fallback.
4. `dawnbrief-release-hardening`: OEM battery guidance, accessibility, privacy copy, performance, signed builds, and multi-device smoke matrix.
