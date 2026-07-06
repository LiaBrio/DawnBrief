package expo.modules.exactalarm

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoExactAlarmModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val alarmManager: AlarmManager
    get() = context.getSystemService(AlarmManager::class.java)

  override fun definition() = ModuleDefinition {
    Name("ExpoExactAlarm")

    AsyncFunction("schedule") { id: String, triggerAtMillis: Double, label: String ->
      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        ?: throw IllegalStateException("Application launch intent is unavailable")
      val operation = PendingIntent.getBroadcast(
        context,
        ExactAlarmIntents.requestCode(id),
        ExactAlarmIntents.alarmIntent(context, id, label),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      val showIntent = PendingIntent.getActivity(
        context,
        ExactAlarmIntents.requestCode("show:$id"),
        launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAtMillis.toLong(), showIntent), operation)
    }

    AsyncFunction("cancel") { id: String ->
      val operation = PendingIntent.getBroadcast(
        context,
        ExactAlarmIntents.requestCode(id),
        ExactAlarmIntents.alarmIntent(context, id),
        PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
      )
      operation?.let {
        alarmManager.cancel(it)
        it.cancel()
      }
    }

    AsyncFunction("canSchedule") {
      Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
    }

    AsyncFunction("consumeRescheduleRequest") {
      RescheduleRequestStore.consume(context)
    }

    AsyncFunction("canPostNotifications") {
      Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(
          context,
          Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
    }

    AsyncFunction("openSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
          data = Uri.parse("package:${context.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        })
      }
    }

    AsyncFunction("openNotificationSettings") {
      val action = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Settings.ACTION_APP_NOTIFICATION_SETTINGS
      } else {
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS
      }
      context.startActivity(Intent(action).apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        }
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      })
    }
  }
}
