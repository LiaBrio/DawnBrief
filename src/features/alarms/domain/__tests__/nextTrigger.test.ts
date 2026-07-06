import { assertAlarm, type Alarm } from '../alarm';
import { nextTrigger } from '../nextTrigger';

const base: Alarm = {
  id: 'alarm-1',
  label: '起床',
  hour: 7,
  minute: 30,
  enabled: true,
  repeat: { kind: 'daily' },
  sound: 'aurora',
  snoozeMinutes: 9,
  createdAt: '2026-07-03T00:00:00.000Z',
  updatedAt: '2026-07-03T00:00:00.000Z',
};

function localDate(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(year, month - 1, day, hour, minute, 45, 678);
}

function expectLocalDate(
  actual: Date | null,
  expected: readonly [number, number, number, number, number],
) {
  expect(actual).not.toBeNull();
  expect([
    actual!.getFullYear(),
    actual!.getMonth() + 1,
    actual!.getDate(),
    actual!.getHours(),
    actual!.getMinutes(),
  ]).toEqual(expected);
  expect(actual!.getSeconds()).toBe(0);
  expect(actual!.getMilliseconds()).toBe(0);
}

describe('nextTrigger', () => {
  test('uses today when a daily alarm is still ahead', () => {
    expectLocalDate(nextTrigger(base, localDate(2026, 7, 3, 7, 0)), [2026, 7, 3, 7, 30]);
  });

  test('uses tomorrow when the daily alarm time has passed', () => {
    expectLocalDate(nextTrigger(base, localDate(2026, 7, 3, 8, 0)), [2026, 7, 4, 7, 30]);
  });

  test('selects the next configured weekday', () => {
    const alarm: Alarm = { ...base, repeat: { kind: 'weekdays', days: [1, 3, 5] } };

    expectLocalDate(nextTrigger(alarm, localDate(2026, 7, 4, 8, 0)), [2026, 7, 6, 7, 30]);
  });

  test('skips to next week when todays weekly alarm time has passed', () => {
    const alarm: Alarm = { ...base, repeat: { kind: 'weekdays', days: [5] } };

    expectLocalDate(nextTrigger(alarm, localDate(2026, 7, 3, 8, 0)), [2026, 7, 10, 7, 30]);
  });

  test('returns null for a disabled alarm', () => {
    expect(nextTrigger({ ...base, enabled: false }, localDate(2026, 7, 3, 7, 0))).toBeNull();
  });

  test('does not mutate now', () => {
    const now = localDate(2026, 7, 3, 7, 0);
    const timestamp = now.getTime();

    nextTrigger(base, now);

    expect(now.getTime()).toBe(timestamp);
  });
});

describe('assertAlarm', () => {
  test.each([
    ['alarm object', null, 'alarm_invalid'],
    ['id', { ...base, id: '' }, 'id_invalid'],
    ['label', { ...base, label: '' }, 'label_invalid'],
    ['enabled', { ...base, enabled: 'yes' }, 'enabled_invalid'],
    ['sound', { ...base, sound: 'bells' }, 'sound_invalid'],
    ['snooze minutes', { ...base, snoozeMinutes: -1 }, 'snooze_minutes_invalid'],
    ['created timestamp', { ...base, createdAt: 'not-a-date' }, 'created_at_invalid'],
    ['updated timestamp', { ...base, updatedAt: '2026-07-01' }, 'updated_at_invalid'],
    ['repeat', { ...base, repeat: { kind: 'weekly' } }, 'repeat_kind_invalid'],
  ])('rejects invalid %s', (_name, alarm, message) => {
    expect(() => assertAlarm(alarm)).toThrow(message);
  });

  test.each([
    ['fractional hour', { ...base, hour: 7.5 }, 'hour_out_of_range'],
    ['hour below range', { ...base, hour: -1 }, 'hour_out_of_range'],
    ['hour above range', { ...base, hour: 24 }, 'hour_out_of_range'],
    ['fractional minute', { ...base, minute: 30.5 }, 'minute_out_of_range'],
    ['minute below range', { ...base, minute: -1 }, 'minute_out_of_range'],
    ['minute above range', { ...base, minute: 60 }, 'minute_out_of_range'],
  ])('rejects %s', (_name, alarm, message) => {
    expect(() => assertAlarm(alarm)).toThrow(message);
  });

  test.each([[-1], [7], [1.5]])('rejects invalid weekday %s', (day) => {
    const alarm: Alarm = { ...base, repeat: { kind: 'weekdays', days: [day] } };

    expect(() => assertAlarm(alarm)).toThrow('weekday_out_of_range');
  });

  test('rejects an empty weekday list', () => {
    const alarm: Alarm = { ...base, repeat: { kind: 'weekdays', days: [] } };

    expect(() => assertAlarm(alarm)).toThrow('weekdays_empty');
  });

  test('rejects duplicate weekdays', () => {
    const alarm: Alarm = { ...base, repeat: { kind: 'weekdays', days: [1, 1] } };

    expect(() => assertAlarm(alarm)).toThrow('weekday_duplicate');
  });

  test('accepts a fully valid alarm', () => {
    expect(() => assertAlarm(base)).not.toThrow();
  });
});
