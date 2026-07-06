const fs = require('fs');
const path = require('path');

function readKotlin(name) {
  return fs.readFileSync(
    path.join(__dirname, `../android/src/main/java/expo/modules/exactalarm/${name}.kt`),
    'utf8',
  );
}

describe('ExpoExactAlarm native source contract', () => {
  it('persists boot reschedule requests and consumes them once', () => {
    const bootReceiver = readKotlin('BootReceiver');
    const store = readKotlin('RescheduleRequestStore');
    const module = readKotlin('ExpoExactAlarmModule');

    expect(bootReceiver).toContain('RescheduleRequestStore.record(context, intent.action)');
    expect(store).toMatch(/putBoolean\(KEY_REQUIRED, true\)/);
    expect(store).toMatch(/putString\(KEY_REASON, reason\)/);
    expect(store).toMatch(/@Synchronized\s+fun consume\(context: Context\): String\?/);
    expect(store).toMatch(/remove\(KEY_REQUIRED\)[\s\S]*remove\(KEY_REASON\)[\s\S]*commit\(\)/);
    expect(module).toContain('AsyncFunction("consumeRescheduleRequest")');
    expect(module).toContain('RescheduleRequestStore.consume(context)');
  });

  it('checks Android 13 notification permission and opens app notification settings', () => {
    const module = readKotlin('ExpoExactAlarmModule');

    expect(module).toContain('AsyncFunction("canPostNotifications")');
    expect(module).toMatch(/Build\.VERSION\.SDK_INT < Build\.VERSION_CODES\.TIRAMISU[\s\S]*Manifest\.permission\.POST_NOTIFICATIONS/);
    expect(module).toContain('AsyncFunction("openNotificationSettings")');
    expect(module).toContain('Settings.ACTION_APP_NOTIFICATION_SETTINGS');
    expect(module).toContain('Settings.ACTION_APPLICATION_DETAILS_SETTINGS');
    expect(module).toContain('putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)');
    expect(module).toContain('data = Uri.parse("package:${context.packageName}")');
    expect(module).toContain('addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)');
  });
});
