import { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { AlarmCard } from '@/src/components/AlarmCard';
import { EmptyState } from '@/src/components/EmptyState';
import { NextAlarmHero } from '@/src/components/NextAlarmHero';
import type { Alarm } from '@/src/features/alarms/domain/alarm';
import { palette, tokens } from '@/src/theme/tokens';

const INITIAL_ALARMS: Alarm[] = [
  {
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
  },
  {
    id: 'workday',
    label: '工作日晨报',
    hour: 8,
    minute: 0,
    enabled: false,
    repeat: { kind: 'weekdays', days: [1, 2, 3, 4, 5] },
    sound: 'silk',
    snoozeMinutes: 5,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
];

export default function AlarmScreen() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);
  const [alarms, setAlarms] = useState(INITIAL_ALARMS);
  const now = useMemo(() => new Date(), []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <View>
                <Text style={[styles.kicker, { color: colors.secondary }]}>DawnBrief</Text>
                <Text style={[styles.title, { color: colors.text }]}>闹钟</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="新增闹钟"
                accessibilityHint="创建闹钟流程将在下一阶段接入"
                style={[styles.addButton, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.addButtonText, { color: colors.onAccent }]}>＋</Text>
              </Pressable>
            </View>
            <NextAlarmHero alarms={alarms} now={now} />
          </>
        )}
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            onToggle={(enabled) => {
              setAlarms((current) => current.map((alarm) => (
                alarm.id === item.id
                  ? { ...alarm, enabled, updatedAt: new Date().toISOString() }
                  : alarm
              )));
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.lg,
    marginTop: tokens.spacing.sm,
  },
  kicker: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
    marginTop: -2,
  },
  separator: {
    height: tokens.spacing.md,
  },
});
