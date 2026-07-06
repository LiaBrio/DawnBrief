import type { SQLiteDatabase } from 'expo-sqlite';

import { assertAlarm, type Alarm } from '../domain/alarm';
import type { AlarmRepository } from './alarmRepository';

type AlarmRow = {
  id: string;
  payload: string;
};

type AlarmDatabase = Pick<
  SQLiteDatabase,
  'execAsync' | 'getAllAsync' | 'getFirstAsync' | 'runAsync'
>;

const CREATE_ALARMS_TABLE = `
  CREATE TABLE IF NOT EXISTS alarms (
    id TEXT PRIMARY KEY NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

function decodeAlarm(row: AlarmRow): Alarm {
  try {
    const alarm = JSON.parse(row.payload) as Alarm;
    assertAlarm(alarm);
    return alarm;
  } catch (cause) {
    const error = new Error(`alarm_payload_invalid:${row.id}`) as Error & { cause?: unknown };
    error.cause = cause;
    throw error;
  }
}

export class SQLiteAlarmRepository implements AlarmRepository {
  constructor(private readonly database: AlarmDatabase) {}

  async initialize(): Promise<void> {
    await this.database.execAsync(CREATE_ALARMS_TABLE);
  }

  async list(): Promise<Alarm[]> {
    const rows = await this.database.getAllAsync<AlarmRow>(
      'SELECT id, payload FROM alarms ORDER BY updated_at DESC',
    );
    return rows.map(decodeAlarm);
  }

  async get(id: string): Promise<Alarm | null> {
    const row = await this.database.getFirstAsync<AlarmRow>(
      'SELECT id, payload FROM alarms WHERE id = ?',
      id,
    );
    return row === null ? null : decodeAlarm(row);
  }

  async save(alarm: Alarm): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO alarms (id, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         payload = excluded.payload,
         updated_at = excluded.updated_at`,
      alarm.id,
      JSON.stringify(alarm),
      alarm.updatedAt,
    );
  }

  async remove(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM alarms WHERE id = ?', id);
  }
}
