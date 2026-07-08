import { fireEvent, render, screen } from '@testing-library/react-native';

import { AlarmCard } from '../AlarmCard';
import type { Alarm } from '../../features/alarms/domain/alarm';

const alarm: Alarm = {
  id: 'morning',
  label: '起床',
  hour: 7,
  minute: 30,
  enabled: true,
  repeat: { kind: 'daily' },
  sound: 'aurora',
  snoozeMinutes: 9,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('AlarmCard', () => {
  test('renders an enabled alarm and toggles it off', async () => {
    const onToggle = jest.fn();

    await render(<AlarmCard alarm={alarm} onToggle={onToggle} />);

    expect(screen.getByText('07:30')).toBeVisible();
    expect(screen.getByText('起床')).toBeVisible();
    expect(screen.getByText('每天')).toBeVisible();
    expect(screen.getByRole('switch')).toBeTruthy();

    await fireEvent(screen.getByRole('switch'), 'valueChange', false);

    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
