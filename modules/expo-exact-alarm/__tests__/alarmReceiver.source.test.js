const fs = require('fs');
const path = require('path');

describe('AlarmReceiver Android compatibility', () => {
  it('creates notification channels only on Android O and newer', () => {
    const source = fs.readFileSync(
      path.join(
        __dirname,
        '../android/src/main/java/expo/modules/exactalarm/AlarmReceiver.kt',
      ),
      'utf8',
    );

    expect(source).toMatch(
      /if \(Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.O\) \{[\s\S]*?createNotificationChannel\([\s\S]*?\n\s*\}/,
    );
  });

  it('uses the module-owned monochrome notification drawable', () => {
    const source = fs.readFileSync(
      path.join(
        __dirname,
        '../android/src/main/java/expo/modules/exactalarm/AlarmReceiver.kt',
      ),
      'utf8',
    );
    const drawable = path.join(
      __dirname,
      '../android/src/main/res/drawable/ic_stat_dawnbrief_alarm.xml',
    );

    expect(fs.existsSync(drawable)).toBe(true);
    expect(source).toContain('.setSmallIcon(R.drawable.ic_stat_dawnbrief_alarm)');
    expect(source).not.toContain('applicationInfo.icon');
  });
});
