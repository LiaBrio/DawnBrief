import { StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';

import { palette, tokens } from '../../../theme/tokens';

export type TimePickerFieldProps = {
  hour: string;
  minute: string;
  onHourChange(value: string): void;
  onMinuteChange(value: string): void;
};

export function TimePickerField({ hour, minute, onHourChange, onMinuteChange }: TimePickerFieldProps) {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);

  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel="小时"
        keyboardType="number-pad"
        maxLength={2}
        value={hour}
        onChangeText={onHourChange}
        placeholder="07"
        placeholderTextColor={colors.secondary}
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
      />
      <Text style={[styles.colon, { color: colors.text }]}>:</Text>
      <TextInput
        accessibilityLabel="分钟"
        keyboardType="number-pad"
        maxLength={2}
        value={minute}
        onChangeText={onMinuteChange}
        placeholder="30"
        placeholderTextColor={colors.secondary}
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 104,
    borderRadius: tokens.radius.card,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    fontSize: 42,
    fontWeight: '300',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 42,
    fontWeight: '300',
    marginHorizontal: tokens.spacing.sm,
  },
});
