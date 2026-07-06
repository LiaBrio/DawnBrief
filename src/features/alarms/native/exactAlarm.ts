import { requireNativeModule } from 'expo-modules-core';

type ExpoExactAlarmModule = {
  schedule(id: string, triggerAtMillis: number, label: string): Promise<void>;
  cancel(id: string): Promise<void>;
  canSchedule(): Promise<boolean>;
  openSettings(): Promise<void>;
  consumeRescheduleRequest(): Promise<string | null>;
  canPostNotifications(): Promise<boolean>;
  openNotificationSettings(): Promise<void>;
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
  consumeRescheduleRequest(): Promise<string | null> {
    return nativeModule.consumeRescheduleRequest();
  },
  canPostNotifications(): Promise<boolean> {
    return nativeModule.canPostNotifications();
  },
  openNotificationSettings(): Promise<void> {
    return nativeModule.openNotificationSettings();
  },
};
