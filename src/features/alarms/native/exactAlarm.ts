import { requireNativeModule } from 'expo-modules-core';

type ExpoExactAlarmModule = {
  schedule(id: string, triggerAtMillis: number, label: string): Promise<void>;
  cancel(id: string): Promise<void>;
  canSchedule(): Promise<boolean>;
  openSettings(): Promise<void>;
};

const nativeModule = requireNativeModule<ExpoExactAlarmModule>('ExpoExactAlarm');

export const exactAlarm = {
  schedule(id: string, trigger: Date, label: string): Promise<void> {
    return nativeModule.schedule(id, trigger.getTime(), label);
  },
  cancel(id: string): Promise<void> {
    return nativeModule.cancel(id);
  },
  canSchedule(): Promise<boolean> {
    return nativeModule.canSchedule();
  },
  openSettings(): Promise<void> {
    return nativeModule.openSettings();
  },
};
