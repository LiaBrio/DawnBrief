import type { AlarmRepository } from '../../data/alarmRepository';
import type { Alarm } from '../../domain/alarm';
import { createAlarmStore, type AlarmScheduler } from '../createAlarmStore';

const NOW = new Date(2026, 6, 3, 7, 0);

function alarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    id: 'a1', label: 'Wake', hour: 7, minute: 30, enabled: true,
    repeat: { kind: 'daily' }, sound: 'aurora', snoozeMinutes: 5,
    createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function dependencies(initial: Alarm[] = []) {
  let rows = [...initial];
  const repository: jest.Mocked<AlarmRepository> = {
    initialize: jest.fn().mockResolvedValue(undefined),
    list: jest.fn(async () => [...rows]),
    get: jest.fn(async (id) => rows.find((item) => item.id === id) ?? null),
    save: jest.fn(async (item) => { rows = [...rows.filter(({ id }) => id !== item.id), item]; }),
    remove: jest.fn(async (id) => { rows = rows.filter((item) => item.id !== id); }),
  };
  const scheduler: jest.Mocked<AlarmScheduler> = {
    schedule: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
    consumeRescheduleRequest: jest.fn().mockResolvedValue(null),
  };
  return { repository, scheduler, now: () => NOW };
}

describe('createAlarmStore', () => {
  test('load initializes and lists alarms without scheduling when there is no durable reason', async () => {
    const deps = dependencies([alarm()]);
    const store = createAlarmStore(deps);

    const promise = store.getState().load();
    expect(store.getState().loading).toBe(true);
    await promise;

    expect(deps.repository.initialize).toHaveBeenCalledTimes(1);
    expect(deps.scheduler.consumeRescheduleRequest).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({ alarms: [alarm()], loading: false, error: null });
    expect(deps.scheduler.schedule).not.toHaveBeenCalled();
    expect(deps.scheduler.cancel).not.toHaveBeenCalled();
  });

  test('load reschedules all alarms when a durable reason exists', async () => {
    const enabled = alarm();
    const disabled = alarm({ id: 'a2', enabled: false });
    const deps = dependencies([enabled, disabled]);
    deps.scheduler.consumeRescheduleRequest.mockResolvedValue('timezone_changed');

    await createAlarmStore(deps).getState().load();

    expect(deps.scheduler.schedule).toHaveBeenCalledWith('a1', new Date(2026, 6, 3, 7, 30), 'Wake');
    expect(deps.scheduler.cancel).toHaveBeenCalledWith('a2');
  });

  test('load preserves reschedule error details when durable rescheduling fails', async () => {
    const deps = dependencies([alarm()]);
    deps.scheduler.consumeRescheduleRequest.mockResolvedValue('boot_completed');
    deps.scheduler.schedule.mockRejectedValue(new Error('native failed'));
    const store = createAlarmStore(deps);

    await expect(store.getState().load()).rejects.toBeInstanceOf(AggregateError);

    expect(store.getState().alarms).toEqual([alarm()]);
    expect(store.getState().loading).toBe(false);
    expect(store.getState().error).toBe('alarm_reschedule_failed:a1');
  });

  test('save persists then schedules enabled alarm and refreshes list', async () => {
    const deps = dependencies();
    const item = alarm();

    await createAlarmStore(deps).getState().save(item);

    expect(deps.repository.save).toHaveBeenCalledWith(item);
    expect(deps.scheduler.schedule).toHaveBeenCalledWith('a1', new Date(2026, 6, 3, 7, 30), 'Wake');
    expect(deps.repository.list).toHaveBeenCalledTimes(1);
  });

  test('save cancels disabled alarm', async () => {
    const deps = dependencies();
    await createAlarmStore(deps).getState().save(alarm({ enabled: false }));
    expect(deps.scheduler.cancel).toHaveBeenCalledWith('a1');
    expect(deps.scheduler.schedule).not.toHaveBeenCalled();
  });

  test('save rejects invalid alarms before persistence', async () => {
    const deps = dependencies();
    await expect(createAlarmStore(deps).getState().save(alarm({ hour: 24 }))).rejects.toThrow('hour_out_of_range');
    expect(deps.repository.save).not.toHaveBeenCalled();
  });

  test('schedule failure preserves persisted truth, refreshes, and rejects with stable store error', async () => {
    const deps = dependencies();
    deps.scheduler.schedule.mockRejectedValue(new Error('native down'));
    const store = createAlarmStore(deps);

    await expect(store.getState().save(alarm())).rejects.toThrow('native down');

    expect(deps.repository.save).toHaveBeenCalled();
    expect(deps.repository.list).toHaveBeenCalled();
    expect(store.getState().alarms).toEqual([alarm()]);
    expect(store.getState().error).toBe('alarm_schedule_failed:a1');
  });

  test('toggle is a no-op for missing id', async () => {
    const deps = dependencies();
    await createAlarmStore(deps).getState().toggle('missing', true);
    expect(deps.repository.save).not.toHaveBeenCalled();
  });

  test('toggle preserves createdAt and saves enabled and updatedAt', async () => {
    const existing = alarm({ enabled: false });
    const deps = dependencies([existing]);

    await createAlarmStore(deps).getState().toggle('a1', true);

    expect(deps.repository.save).toHaveBeenCalledWith({
      ...existing, enabled: true, createdAt: existing.createdAt, updatedAt: NOW.toISOString(),
    });
  });

  test('remove cancels before deleting and refreshes', async () => {
    const deps = dependencies([alarm()]);
    const order: string[] = [];
    deps.scheduler.cancel.mockImplementation(async () => { order.push('cancel'); });
    deps.repository.remove.mockImplementation(async () => { order.push('remove'); });

    await createAlarmStore(deps).getState().remove('a1');

    expect(order).toEqual(['cancel', 'remove']);
    expect(deps.repository.list).toHaveBeenCalled();
  });

  test('remove does not delete when cancellation fails', async () => {
    const deps = dependencies([alarm()]);
    deps.scheduler.cancel.mockRejectedValue(new Error('cancel failed'));
    await expect(createAlarmStore(deps).getState().remove('a1')).rejects.toThrow('cancel failed');
    expect(deps.repository.remove).not.toHaveBeenCalled();
  });

  test('rescheduleAll continues after individual failures and rejects an AggregateError', async () => {
    const items = [alarm(), alarm({ id: 'a2', enabled: false }), alarm({ id: 'a3', label: 'Later' })];
    const deps = dependencies(items);
    deps.scheduler.schedule.mockRejectedValueOnce(new Error('first failed')).mockResolvedValue(undefined);
    const store = createAlarmStore(deps);
    store.setState({ alarms: items });

    await expect(store.getState().rescheduleAll()).rejects.toBeInstanceOf(AggregateError);

    expect(deps.scheduler.cancel).toHaveBeenCalledWith('a2');
    expect(deps.scheduler.schedule).toHaveBeenCalledTimes(2);
    expect(deps.scheduler.schedule).toHaveBeenLastCalledWith('a3', expect.any(Date), 'Later');
    expect(store.getState().error).toBe('alarm_reschedule_failed:a1');
  });

  test('a stale concurrent load cannot overwrite the newer load result', async () => {
    const deps = dependencies();
    let resolveFirst!: (rows: Alarm[]) => void;
    let resolveSecond!: (rows: Alarm[]) => void;
    deps.repository.list
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }));
    const store = createAlarmStore(deps);

    const first = store.getState().load();
    const second = store.getState().load();
    await Promise.resolve(); await Promise.resolve();
    resolveSecond([alarm({ id: 'new' })]);
    await second;
    resolveFirst([alarm({ id: 'old' })]);
    await first;

    expect(store.getState().alarms[0].id).toBe('new');
    expect(store.getState().loading).toBe(false);
  });
});
