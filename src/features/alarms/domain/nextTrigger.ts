import { assertAlarm, type Alarm } from './alarm';

export function nextTrigger(alarm: Alarm, now: Date): Date | null {
  if (!alarm.enabled) return null;
  assertAlarm(alarm);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);

    if (candidate <= now) continue;
    if (alarm.repeat.kind === 'weekdays' && !alarm.repeat.days.includes(candidate.getDay())) {
      continue;
    }
    return candidate;
  }

  return null;
}
