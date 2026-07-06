import { requireNativeModule } from 'expo-modules-core';

export type ExpoExactAlarmModule = {
  schedule(id: string, triggerAtMillis: number, label: string): Promise<void>;
  cancel(id: string): Promise<void>;
  canSchedule(): Promise<boolean>;
  openSettings(): Promise<void>;
};

export default requireNativeModule<ExpoExactAlarmModule>('ExpoExactAlarm');
