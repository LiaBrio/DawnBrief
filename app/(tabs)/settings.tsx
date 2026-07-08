import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { exactAlarm } from '@/src/features/alarms/native/exactAlarm';
import { palette, tokens } from '@/src/theme/tokens';

type PermissionState = 'checking' | 'available' | 'unavailable';

export default function SettingsScreen() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);
  const [exactAlarmState, setExactAlarmState] = useState<PermissionState>('checking');

  useEffect(() => {
    let mounted = true;
    exactAlarm.canSchedule()
      .then((available) => {
        if (mounted) setExactAlarmState(available ? 'available' : 'unavailable');
      })
      .catch(() => {
        if (mounted) setExactAlarmState('unavailable');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const statusText = exactAlarmState === 'checking'
    ? '正在检查'
    : exactAlarmState === 'available'
      ? '已允许'
      : '需要开启';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>设置</Text>
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={[styles.label, { color: colors.text }]}>精确闹钟权限</Text>
            <Text style={[styles.description, { color: colors.secondary }]}>
              Android 需要允许精确闹钟，DawnBrief 才能准点响铃。
            </Text>
          </View>
          <Text style={[styles.status, { color: colors.accent }]}>{statusText}</Text>
        </View>
        {exactAlarmState === 'unavailable' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="打开精确闹钟设置"
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => exactAlarm.openSettings()}
          >
            <Text style={[styles.buttonText, { color: colors.onAccent }]}>打开系统设置</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: tokens.spacing.md,
  },
  card: {
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: tokens.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  rowCopy: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: tokens.spacing.xs,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
  },
  status: {
    fontSize: 15,
    fontWeight: '800',
  },
  button: {
    marginTop: tokens.spacing.lg,
    borderRadius: tokens.radius.button,
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
