const { withAndroidManifest } = require('@expo/config-plugins');

const PERMISSIONS = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.RECEIVE_BOOT_COMPLETED',
];

const RECEIVERS = [
  {
    $: {
      'android:name': 'expo.modules.exactalarm.AlarmReceiver',
      'android:exported': 'false',
    },
  },
  {
    $: {
      'android:name': 'expo.modules.exactalarm.BootReceiver',
      'android:enabled': 'true',
      'android:exported': 'true',
    },
    'intent-filter': [
      {
        action: [
          { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
          { $: { 'android:name': 'android.intent.action.TIME_SET' } },
          { $: { 'android:name': 'android.intent.action.TIMEZONE_CHANGED' } },
        ],
      },
    ],
  },
];

function applyExactAlarmManifest(androidManifest) {
  const manifest = androidManifest.manifest;
  manifest['uses-permission'] = manifest['uses-permission'] || [];
  const permissionNames = new Set(
    manifest['uses-permission'].map((permission) => permission.$['android:name']),
  );
  for (const name of PERMISSIONS) {
    if (!permissionNames.has(name)) manifest['uses-permission'].push({ $: { 'android:name': name } });
  }

  const application = manifest.application[0];
  application.receiver = application.receiver || [];
  const receiverNames = new Set(application.receiver.map((receiver) => receiver.$['android:name']));
  for (const receiver of RECEIVERS) {
    if (!receiverNames.has(receiver.$['android:name'])) application.receiver.push(receiver);
  }
  return androidManifest;
}

function withExactAlarm(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    configWithManifest.modResults = applyExactAlarmManifest(configWithManifest.modResults);
    return configWithManifest;
  });
}

module.exports = withExactAlarm;
module.exports.applyExactAlarmManifest = applyExactAlarmManifest;
