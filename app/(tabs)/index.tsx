import { useEffect, useMemo } from 'react';
import { Link } from 'expo-router';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { AlarmCard } from '@/src/components/AlarmCard';
import { EmptyState } from '@/src/components/EmptyState';
import { NextAlarmHero } from '@/src/components/NextAlarmHero';
import { useAlarmStore } from '@/src/features/alarms/store/useAlarmStore';
import { palette, tokens } from '@/src/theme/tokens';

export default function AlarmScreen() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);
  const alarms = useAlarmStore((state) => state.alarms);
  const loading = useAlarmStore((state) => state.loading);
  const error = useAlarmStore((state) => state.error);
  const load = useAlarmStore((state) => state.load);
  const toggle = useAlarmStore((state) => state.toggle);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    void load();
  }, [load]);

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
              <Link href="/alarm/edit" asChild>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="新增闹钟"
                  style={[styles.addButton, { backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.addButtonText, { color: colors.onAccent }]}>＋</Text>
                </Pressable>
              </Link>
            </View>
            <NextAlarmHero alarms={alarms} now={now} />
            {loading ? <Text style={[styles.inlineMessage, { color: colors.secondary }]}>正在载入闹钟…</Text> : null}
            {error ? <Text style={[styles.inlineMessage, { color: colors.accent }]}>{error}</Text> : null}
          </>
        )}
        ListEmptyComponent={<EmptyState />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            onToggle={(enabled) => { void toggle(item.id, enabled); }}
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
  inlineMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: tokens.spacing.md,
  },
});
