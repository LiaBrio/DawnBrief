import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { palette, tokens } from '../../../theme/tokens';

const DAYS = [
  { value: 0, label: '日' },
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
] as const;

export type WeekdayPickerProps = {
  selectedDays: readonly number[];
  onChange(days: number[]): void;
};

export function WeekdayPicker({ selectedDays, onChange }: WeekdayPickerProps) {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);
  const [error, setError] = useState<string | null>(null);

  return (
    <View>
      <View style={styles.row}>
        {DAYS.map(({ value, label }) => {
          const selected = selectedDays.includes(value);
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              style={[
                styles.day,
                { backgroundColor: selected ? colors.accent : colors.card },
                { borderColor: selected ? colors.accent : colors.separator },
              ]}
              onPress={() => {
                const next = selected
                  ? selectedDays.filter((day) => day !== value)
                  : [...selectedDays, value].sort((a, b) => a - b);
                if (next.length === 0) {
                  setError('每周重复至少选择一天');
                  return;
                }
                setError(null);
                onChange(next);
              }}
            >
              <Text style={[styles.label, { color: selected ? colors.onAccent : colors.text }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.xs,
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    marginTop: tokens.spacing.sm,
    fontSize: 13,
    fontWeight: '600',
  },
});
