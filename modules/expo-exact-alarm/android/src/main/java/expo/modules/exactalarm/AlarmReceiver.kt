package expo.modules.exactalarm

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
    ) return

    val id = intent.getStringExtra(ExactAlarmIntents.EXTRA_ALARM_ID) ?: return
    val label = intent.getStringExtra(ExactAlarmIntents.EXTRA_LABEL) ?: "Alarm"
    val manager = context.getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH).apply {
          description = "Scheduled alarm alerts"
          lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
        }
      )
    }
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      putExtra(ExactAlarmIntents.EXTRA_ALARM_ID, id)
      putExtra(ExactAlarmIntents.EXTRA_LABEL, label)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    } ?: return
    val fullScreenIntent = PendingIntent.getActivity(
      context,
      ExactAlarmIntents.requestCode("notification:$id"),
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(context.applicationInfo.icon)
      .setContentTitle(label)
      .setContentText("Alarm")
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(true)
      .setContentIntent(fullScreenIntent)
      .setFullScreenIntent(fullScreenIntent, true)
      .build()
    manager.notify(ExactAlarmIntents.requestCode("notification:$id"), notification)
  }

  private companion object {
    const val CHANNEL_ID = "dawnbrief_alarms"
  }
}
