export type RepeatRule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: readonly number[] };

export type Alarm = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  repeat: RepeatRule;
  sound: 'aurora' | 'radar' | 'silk';
  snoozeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

export function assertAlarm(alarm: unknown): asserts alarm is Alarm {
  if (!isRecord(alarm)) throw new Error('alarm_invalid');
  if (typeof alarm.id !== 'string' || alarm.id.length === 0) throw new Error('id_invalid');
  if (typeof alarm.label !== 'string' || alarm.label.length === 0) throw new Error('label_invalid');
  if (
    typeof alarm.hour !== 'number' ||
    !Number.isInteger(alarm.hour) ||
    alarm.hour < 0 ||
    alarm.hour > 23
  ) {
    throw new Error('hour_out_of_range');
  }
  if (
    typeof alarm.minute !== 'number' ||
    !Number.isInteger(alarm.minute) ||
    alarm.minute < 0 ||
    alarm.minute > 59
  ) {
    throw new Error('minute_out_of_range');
  }
  if (typeof alarm.enabled !== 'boolean') throw new Error('enabled_invalid');
  if (alarm.sound !== 'aurora' && alarm.sound !== 'radar' && alarm.sound !== 'silk') {
    throw new Error('sound_invalid');
  }
  if (
    typeof alarm.snoozeMinutes !== 'number' ||
    !Number.isInteger(alarm.snoozeMinutes) ||
    alarm.snoozeMinutes < 0
  ) {
    throw new Error('snooze_minutes_invalid');
  }
  if (!isIsoTimestamp(alarm.createdAt)) throw new Error('created_at_invalid');
  if (!isIsoTimestamp(alarm.updatedAt)) throw new Error('updated_at_invalid');
  if (!isRecord(alarm.repeat)) throw new Error('repeat_invalid');
  if (alarm.repeat.kind === 'daily') return;
  if (alarm.repeat.kind !== 'weekdays') throw new Error('repeat_kind_invalid');

  const { days } = alarm.repeat;
  if (!Array.isArray(days)) throw new Error('weekdays_invalid');
  if (days.length === 0) throw new Error('weekdays_empty');
  if (days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error('weekday_out_of_range');
  }
  if (new Set(days).size !== days.length) throw new Error('weekday_duplicate');
}
