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

export function assertAlarm(alarm: Alarm): void {
  if (!Number.isInteger(alarm.hour) || alarm.hour < 0 || alarm.hour > 23) {
    throw new Error('hour_out_of_range');
  }
  if (!Number.isInteger(alarm.minute) || alarm.minute < 0 || alarm.minute > 59) {
    throw new Error('minute_out_of_range');
  }
  if (alarm.repeat.kind !== 'weekdays') return;

  const { days } = alarm.repeat;
  if (days.length === 0) throw new Error('weekdays_empty');
  if (days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error('weekday_out_of_range');
  }
  if (new Set(days).size !== days.length) throw new Error('weekday_duplicate');
}
