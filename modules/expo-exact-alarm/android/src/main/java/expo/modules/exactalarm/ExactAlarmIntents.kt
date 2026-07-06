package expo.modules.exactalarm

import android.content.Context
import android.content.Intent
import java.nio.ByteBuffer
import java.security.MessageDigest

internal object ExactAlarmIntents {
  const val EXTRA_ALARM_ID = "alarm_id"
  const val EXTRA_LABEL = "label"
  const val ACTION_RESCHEDULE_REQUIRED = "expo.modules.exactalarm.RESCHEDULE_REQUIRED"

  // Android request codes are 32-bit. A namespaced SHA-256 prefix is deterministic
  // across process restarts and avoids String.hashCode's common structured collisions.
  fun requestCode(id: String): Int {
    val digest = MessageDigest.getInstance("SHA-256").digest("dawnbrief:alarm:$id".toByteArray())
    return ByteBuffer.wrap(digest, 0, Int.SIZE_BYTES).int
  }

  fun alarmIntent(context: Context, id: String, label: String? = null) =
    Intent(context, AlarmReceiver::class.java).apply {
      putExtra(EXTRA_ALARM_ID, id)
      label?.let { putExtra(EXTRA_LABEL, it) }
    }
}
