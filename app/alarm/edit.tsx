import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';

import { TimePickerField } from '@/src/features/alarms/components/TimePickerField';
import { WeekdayPicker } from '@/src/features/alarms/components/WeekdayPicker';
import type { Alarm } from '@/src/features/alarms/domain/alarm';
import { useAlarmStore } from '@/src/features/alarms/store/useAlarmStore';
import { palette, tokens } from '@/src/theme/tokens';

const SOUNDS: Array<Alarm['sound']> = ['aurora', 'radar', 'silk'];
const SNOOZE_OPTIONS = [5, 9, 15];

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `alarm-${Date.now()}`;
}

export default function EditAlarmScreen() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);
  const params = useLocalSearchParams<{ id?: string }>();
  const alarmId = typeof params.id === 'string' ? params.id : undefined;
  const alarms = useAlarmStore((state) => state.alarms);
  const load = useAlarmStore((state) => state.load);
  const save = useAlarmStore((state) => state.save);
  const existing = useMemo(
    () => alarms.find((alarm) => alarm.id === alarmId) ?? null,
    [alarmId, alarms],
  );

  const [label, setLabel] = useState('晨间闹钟');
  const [note, setNote] = useState('');
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('30');
  const [repeatKind, setRepeatKind] = useState<'daily' | 'weekdays'>('daily');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sound, setSound] = useState<Alarm['sound']>('aurora');
  const [snoozeMinutes, setSnoozeMinutes] = useState(9);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!existing) return;
    setLabel(existing.label);
    setNote(existing.note ?? '');
    setHour(existing.hour.toString().padStart(2, '0'));
    setMinute(existing.minute.toString().padStart(2, '0'));
    setRepeatKind(existing.repeat.kind);
    setDays(existing.repeat.kind === 'weekdays' ? [...existing.repeat.days] : [1, 2, 3, 4, 5]);
    setSound(existing.sound);
    setSnoozeMinutes(existing.snoozeMinutes);
    setEnabled(existing.enabled);
  }, [existing]);

  const persist = async () => {
    const parsedHour = Number.parseInt(hour, 10);
    const parsedMinute = Number.parseInt(minute, 10);
    if (!Number.isInteger(parsedHour) || parsedHour < 0 || parsedHour > 23) {
      setError('小时需要在 0-23 之间');
      return;
    }
    if (!Number.isInteger(parsedMinute) || parsedMinute < 0 || parsedMinute > 59) {
      setError('分钟需要在 0-59 之间');
      return;
    }
    if (repeatKind === 'weekdays' && days.length === 0) {
      setError('每周重复至少选择一天');
      return;
    }

    const timestamp = new Date().toISOString();
    const trimmedLabel = label.trim() || '晨间闹钟';
    const trimmedNote = note.trim();
    const alarm: Alarm = {
      id: existing?.id ?? createId(),
      label: trimmedLabel,
      hour: parsedHour,
      minute: parsedMinute,
      enabled,
      repeat: repeatKind === 'daily' ? { kind: 'daily' } : { kind: 'weekdays', days },
      sound,
      snoozeMinutes,
      note: trimmedNote.length > 0 ? trimmedNote : undefined,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    setSaving(true);
    setError(null);
    try {
      await save(alarm);
      router.back();
    } catch {
      setError('保存失败，请确认权限后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.secondary }]}>DawnBrief</Text>
        <Text style={[styles.title, { color: colors.text }]}>{existing ? '编辑闹钟' : '新建闹钟'}</Text>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.secondary }]}>时间</Text>
      <TimePickerField hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} />

      <Text style={[styles.sectionLabel, { color: colors.secondary }]}>标题</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="起床"
        placeholderTextColor={colors.secondary}
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
      />

      <Text style={[styles.sectionLabel, { color: colors.secondary }]}>备注（显示在日期上方）</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="例如：出差日程、农历生日、重要会议"
        placeholderTextColor={colors.secondary}
        style={[styles.input, styles.noteInput, { backgroundColor: colors.card, color: colors.text }]}
      />

      <Text style={[styles.sectionLabel, { color: colors.secondary }]}>重复</Text>
      <View style={styles.segment}>
        {(['daily', 'weekdays'] as const).map((kind) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            style={[
              styles.segmentButton,
              { backgroundColor: repeatKind === kind ? colors.accent : colors.card },
            ]}
            onPress={() => setRepeatKind(kind)}
          >
            <Text style={[styles.segmentText, { color: repeatKind === kind ? colors.onAccent : colors.text }]}>
              {kind === 'daily' ? '每天' : '每周'}
            </Text>
          </Pressable>
        ))}
      </View>
      {repeatKind === 'weekdays' ? <WeekdayPicker selectedDays={days} onChange={setDays} /> : null}

      <Text style={[styles.sectionLabel, { color: colors.secondary }]}>铃声</Text>
      <View style={styles.segment}>
        {SOUNDS.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            style={[
              styles.segmentButton,
              { backgroundColor: sound === option ? colors.accent : colors.card },
            ]}
            onPress={() => setSound(option)}
          >
            <Text style={[styles.segmentText, { color: sound === option ? colors.onAccent : colors.text }]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.secondary }]}>贪睡</Text>
      <View style={styles.segment}>
        {SNOOZE_OPTIONS.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            style={[
              styles.segmentButton,
              { backgroundColor: snoozeMinutes === option ? colors.accent : colors.card },
            ]}
            onPress={() => setSnoozeMinutes(option)}
          >
            <Text style={[styles.segmentText, { color: snoozeMinutes === option ? colors.onAccent : colors.text }]}>
              {option} 分钟
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.enabledRow, { backgroundColor: colors.card }]}>
        <Text style={[styles.enabledText, { color: colors.text }]}>启用闹钟</Text>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: colors.separator, true: colors.accent }}
          thumbColor={colors.switchThumb}
        />
      </View>

      {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="保存闹钟"
        disabled={saving}
        style={[styles.saveButton, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
        onPress={() => { void persist(); }}
      >
        <Text style={[styles.saveText, { color: colors.onAccent }]}>{saving ? '保存中…' : '保存'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  header: {
    marginBottom: tokens.spacing.lg,
    marginTop: tokens.spacing.lg,
  },
  kicker: {
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  sectionLabel: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderRadius: tokens.radius.card,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    fontSize: 17,
  },
  noteInput: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  segment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  segmentButton: {
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '700',
  },
  enabledRow: {
    marginTop: tokens.spacing.lg,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enabledText: {
    fontSize: 17,
    fontWeight: '700',
  },
  error: {
    marginTop: tokens.spacing.md,
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: tokens.spacing.lg,
    borderRadius: tokens.radius.button,
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
  },
  saveText: {
    fontSize: 18,
    fontWeight: '800',
  },
});
