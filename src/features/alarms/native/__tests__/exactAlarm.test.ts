const mockNativeModule = {
  schedule: jest.fn(),
  cancel: jest.fn(),
  canSchedule: jest.fn(),
  openSettings: jest.fn(),
};

(globalThis.expo!.modules as Record<string, unknown>).ExpoExactAlarm = mockNativeModule;

const { exactAlarm } = require('../exactAlarm') as typeof import('../exactAlarm');

describe('exactAlarm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads the ExpoExactAlarm native module', () => {
    expect(exactAlarm).toBeDefined();
  });

  it('schedules using epoch milliseconds and forwards alarm metadata', async () => {
    mockNativeModule.schedule.mockResolvedValue(undefined);
    const trigger = new Date('2026-07-06T07:30:00.123Z');

    await exactAlarm.schedule('morning', trigger, 'Morning alarm');

    expect(mockNativeModule.schedule).toHaveBeenCalledWith(
      'morning',
      trigger.getTime(),
      'Morning alarm',
    );
  });

  it('cancels by alarm id', async () => {
    mockNativeModule.cancel.mockResolvedValue(undefined);
    await exactAlarm.cancel('morning');
    expect(mockNativeModule.cancel).toHaveBeenCalledWith('morning');
  });

  it('reports exact-alarm capability', async () => {
    mockNativeModule.canSchedule.mockResolvedValue(true);
    await expect(exactAlarm.canSchedule()).resolves.toBe(true);
  });

  it('opens the platform exact-alarm settings', async () => {
    mockNativeModule.openSettings.mockResolvedValue(undefined);
    await exactAlarm.openSettings();
    expect(mockNativeModule.openSettings).toHaveBeenCalledWith();
  });
});
