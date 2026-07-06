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
});
