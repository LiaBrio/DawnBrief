package expo.modules.exactalarm

import android.content.Context

internal object RescheduleRequestStore {
  private const val PREFERENCES_NAME = "expo_exact_alarm"
  private const val KEY_REQUIRED = "reschedule_required"
  private const val KEY_REASON = "reschedule_reason"

  @Synchronized
  fun record(context: Context, reason: String?) {
    preferences(context).edit()
      .putBoolean(KEY_REQUIRED, true)
      .putString(KEY_REASON, reason)
      .apply()
  }

  @Synchronized
  fun consume(context: Context): String? {
    val preferences = preferences(context)
    if (!preferences.getBoolean(KEY_REQUIRED, false)) return null
    val reason = preferences.getString(KEY_REASON, null)
    preferences.edit()
      .remove(KEY_REQUIRED)
      .remove(KEY_REASON)
      .commit()
    return reason
  }

  private fun preferences(context: Context) =
    context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
}
