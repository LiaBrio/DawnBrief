const { applyExactAlarmManifest } = require('../withExactAlarm');

describe('applyExactAlarmManifest', () => {
  it('adds required permissions and receivers', () => {
    const manifest = { manifest: { application: [{ $: { 'android:name': '.MainApplication' } }] } };

    applyExactAlarmManifest(manifest);

    expect(manifest.manifest['uses-permission'].map((item) => item.$['android:name'])).toEqual(
      expect.arrayContaining([
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.USE_FULL_SCREEN_INTENT',
        'android.permission.RECEIVE_BOOT_COMPLETED',
      ]),
    );
    expect(manifest.manifest.application[0].receiver).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          $: expect.objectContaining({
            'android:name': 'expo.modules.exactalarm.AlarmReceiver',
            'android:exported': 'false',
          }),
        }),
        expect.objectContaining({
          $: expect.objectContaining({
            'android:name': 'expo.modules.exactalarm.BootReceiver',
            'android:exported': 'true',
          }),
        }),
      ]),
    );
  });

  it('is idempotent', () => {
    const manifest = { manifest: { application: [{}] } };
    applyExactAlarmManifest(manifest);
    applyExactAlarmManifest(manifest);

    const permissions = manifest.manifest['uses-permission'].map((item) => item.$['android:name']);
    const receivers = manifest.manifest.application[0].receiver.map(
      (item) => item.$['android:name'],
    );
    expect(new Set(permissions).size).toBe(permissions.length);
    expect(new Set(receivers).size).toBe(receivers.length);
  });
});
