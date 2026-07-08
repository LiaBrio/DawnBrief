import { fireEvent, render, screen } from '@testing-library/react-native';

import { WeekdayPicker } from '../WeekdayPicker';

describe('WeekdayPicker', () => {
  test('adds and removes selected weekdays in ascending order', async () => {
    const onChange = jest.fn();

    await render(<WeekdayPicker selectedDays={[1, 2, 3, 4, 5]} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: '六' }));
    expect(onChange).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6]);

    await fireEvent.press(screen.getByRole('button', { name: '一' }));
    expect(onChange).toHaveBeenLastCalledWith([2, 3, 4, 5]);
  });

  test('prevents empty selections with an inline message', async () => {
    const onChange = jest.fn();

    await render(<WeekdayPicker selectedDays={[1]} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: '一' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('每周重复至少选择一天')).toBeVisible();
  });
});
