import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import type { Alarm } from '../features/alarms/domain/alarm';
import { nextTrigger } from '../features/alarms/domain/nextTrigger';
import { palette, tokens } from '../theme/tokens';

export type NextAlarmHeroProps = {
  alarms: readonly Alarm[];
  now: Date;
};

function describeTrigger(trigger: Date, now: Date) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(trigger);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  const time = `${trigger.getHours().toString().padStart(2, '0')}:${trigger.getMinutes().toString().padStart(2, '0')}`;
  if (days === 0) return `今天 ${time}`;
  if (days === 1) return `明天 ${time}`;
  return `${days} 天后 ${time}`;
}

export function NextAlarmHero({ alarms, now }: NextAlarmHeroProps) {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);
  const next = alarms
    .map((alarm) => ({ alarm, trigger: nextTrigger(alarm, now) }))
    .filter((entry): entry is { alarm: Alarm; trigger: Date } => entry.trigger !== null)
    .sort((a, b) => a.trigger.getTime() - b.trigger.getTime())[0];

  return (
    <View style={[styles.hero, { backgroundColor: colors.card }]}>
      <Text style={[styles.eyebrow, { color: colors.secondary }]}>下一次响铃</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        {next ? describeTrigger(next.trigger, now) : '暂无已开启闹钟'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.secondary }]}>
        {next ? next.alarm.label : '打开一个闹钟后，这里会显示最近一次提醒。'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: tokens.spacing.xs,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: tokens.spacing.sm,
    fontSize: 16,
  },
});
