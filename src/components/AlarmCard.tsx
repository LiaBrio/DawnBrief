import { memo } from 'react';
import { StyleSheet, Switch, Text, View, useColorScheme } from 'react-native';

import type { Alarm, RepeatRule } from '../features/alarms/domain/alarm';
import { palette, tokens } from '../theme/tokens';

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export type AlarmCardProps = {
  alarm: Alarm;
  onToggle(enabled: boolean): void;
};

function formatTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function formatRepeat(repeat: RepeatRule) {
  if (repeat.kind === 'daily') return '每天';
  return repeat.days.map((day) => WEEKDAY_LABELS[day]).join('、');
}

export const AlarmCard = memo(function AlarmCard({ alarm, onToggle }: AlarmCardProps) {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.copy}>
        <Text
          style={[styles.time, { color: alarm.enabled ? colors.text : colors.secondary }]}
          accessibilityLabel={`闹钟时间 ${formatTime(alarm.hour, alarm.minute)}`}
        >
          {formatTime(alarm.hour, alarm.minute)}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
            {alarm.label}
          </Text>
          <Text style={[styles.repeat, { color: colors.secondary }]} numberOfLines={1}>
            {formatRepeat(alarm.repeat)}
          </Text>
        </View>
      </View>
      <Switch
        value={alarm.enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.separator, true: colors.accent }}
        thumbColor={colors.switchThumb}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    borderRadius: tokens.radius.card,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    paddingRight: tokens.spacing.md,
  },
  time: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '300',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  repeat: {
    flex: 1,
    fontSize: 15,
  },
});
