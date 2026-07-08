import { SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { palette, tokens } from '@/src/theme/tokens';

export default function CalendarScreen() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.kicker, { color: colors.secondary }]}>日期与备注</Text>
        <Text style={[styles.title, { color: colors.text }]}>农历提醒规划中</Text>
        <Text style={[styles.body, { color: colors.secondary }]}>
          将在下一阶段接入农历、节气、节假日与日期备注。当前页面只展示范围说明，不提供未完成的日期选择控件。
        </Text>
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
  kicker: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: tokens.spacing.md,
  },
  body: {
    fontSize: 17,
    lineHeight: 25,
  },
});
