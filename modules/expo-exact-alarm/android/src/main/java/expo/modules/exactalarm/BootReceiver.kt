package expo.modules.exactalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action !in SUPPORTED_ACTIONS) return
    // This is deliberately a signal, not a claim that alarms were restored. A future
    // JS task or worker can consume it and rebuild schedules from persisted alarms.
    RescheduleRequestStore.record(context, intent.action)
    context.sendBroadcast(Intent(ExactAlarmIntents.ACTION_RESCHEDULE_REQUIRED).apply {
      setPackage(context.packageName)
      putExtra("reason", intent.action)
    })
  }

  private companion object {
    val SUPPORTED_ACTIONS = setOf(
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED
    )
  }
}
