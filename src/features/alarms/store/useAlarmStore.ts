import { openDatabaseAsync } from 'expo-sqlite';
import { useStore } from 'zustand';

import { SQLiteAlarmRepository, type AlarmDatabase } from '../data/sqliteAlarmRepository';
import { exactAlarm } from '../native/exactAlarm';
import { createAlarmStore, type AlarmScheduler } from './createAlarmStore';

const databasePromise = openDatabaseAsync('dawnbrief.db');

const databaseProxy: AlarmDatabase = {
  async execAsync(...args) {
    const database = await databasePromise;
    return database.execAsync(...args);
  },
  async getAllAsync<T>(source: string, ...params: unknown[]) {
    const database = await databasePromise;
    return database.getAllAsync<T>(source, ...(params as []));
  },
  async getFirstAsync<T>(source: string, ...params: unknown[]) {
    const database = await databasePromise;
    return database.getFirstAsync<T>(source, ...(params as []));
  },
  async runAsync(source: string, ...params: unknown[]) {
    const database = await databasePromise;
    return database.runAsync(source, ...(params as []));
  },
};

const scheduler: AlarmScheduler = {
  schedule: exactAlarm.schedule,
  cancel: exactAlarm.cancel,
  consumeRescheduleRequest: exactAlarm.consumeRescheduleRequest,
};

export const alarmStore = createAlarmStore({
  repository: new SQLiteAlarmRepository(databaseProxy),
  scheduler,
  now: () => new Date(),
});

export function useAlarmStore<T>(selector: (state: ReturnType<typeof alarmStore.getState>) => T): T {
  return useStore(alarmStore, selector);
}
