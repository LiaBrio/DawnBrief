import { createStore, type StoreApi } from 'zustand/vanilla';

import type { AlarmRepository } from '../data/alarmRepository';
import { assertAlarm, type Alarm } from '../domain/alarm';
import { nextTrigger } from '../domain/nextTrigger';

export interface AlarmScheduler {
  schedule(id: string, trigger: Date, label: string): Promise<void>;
  cancel(id: string): Promise<void>;
  consumeRescheduleRequest(): Promise<string | null>;
}

export type AlarmStoreState = {
  alarms: Alarm[];
  loading: boolean;
  error: string | null;
  load(): Promise<void>;
  save(alarm: Alarm): Promise<void>;
  remove(id: string): Promise<void>;
  toggle(id: string, enabled: boolean): Promise<void>;
  rescheduleAll(): Promise<void>;
};

export type AlarmStoreDependencies = {
  repository: AlarmRepository;
  scheduler: AlarmScheduler;
  now: () => Date;
};

export function createAlarmStore(
  { repository, scheduler, now }: AlarmStoreDependencies,
): StoreApi<AlarmStoreState> {
  let loadGeneration = 0;

  const synchronize = async (item: Alarm): Promise<void> => {
    const trigger = nextTrigger(item, now());
    if (item.enabled && trigger) {
      await scheduler.schedule(item.id, trigger, item.label);
    } else {
      await scheduler.cancel(item.id);
    }
  };

  const reschedule = async (items: readonly Alarm[]): Promise<void> => {
    const failures: Array<{ id: string; error: unknown }> = [];
    for (const item of items) {
      try {
        await synchronize(item);
      } catch (error) {
        failures.push({ id: item.id, error });
      }
    }
    if (failures.length > 0) {
      const ids = failures.map(({ id }) => id).join(',');
      store.setState({ error: `alarm_reschedule_failed:${ids}` });
      throw new AggregateError(
        failures.map(({ error }) => error),
        `alarm_reschedule_failed:${ids}`,
      );
    }
    store.setState({ error: null });
  };

  const store = createStore<AlarmStoreState>((set, get) => ({
    alarms: [],
    loading: false,
    error: null,

    async load() {
      const generation = ++loadGeneration;
      set({ loading: true, error: null });
      try {
        await repository.initialize();
        const alarms = await repository.list();
        if (generation !== loadGeneration) return;

        set({ alarms });
        const reason = await scheduler.consumeRescheduleRequest();
        if (generation !== loadGeneration) return;
        if (reason !== null) await reschedule(alarms);
      } catch (error) {
        if (generation === loadGeneration) set({ error: 'alarm_load_failed' });
        throw error;
      } finally {
        if (generation === loadGeneration) set({ loading: false });
      }
    },

    async save(item) {
      assertAlarm(item);
      await repository.save(item);
      try {
        await synchronize(item);
      } catch (error) {
        const alarms = await repository.list();
        set({ alarms, error: `alarm_schedule_failed:${item.id}` });
        throw error;
      }
      const alarms = await repository.list();
      set({ alarms, error: null });
    },

    async remove(id) {
      await scheduler.cancel(id);
      await repository.remove(id);
      const alarms = await repository.list();
      set({ alarms, error: null });
    },

    async toggle(id, enabled) {
      const item = await repository.get(id);
      if (item === null) return;
      await get().save({ ...item, enabled, updatedAt: now().toISOString() });
    },

    async rescheduleAll() {
      await reschedule(get().alarms);
    },
  }));

  return store;
}
