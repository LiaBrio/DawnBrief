import { StyleSheet, Text, View, useColorScheme } from 'react-native';

import { palette, tokens } from '../theme/tokens';

export function EmptyState() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={styles.icon}>☀️</Text>
      <Text style={[styles.title, { color: colors.text }]}>还没有闹钟</Text>
      <Text style={[styles.body, { color: colors.secondary }]}>
        新建一个晨间提醒后，DawnBrief 会在响铃时准备天气、新闻和 RSS 播报。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.xl,
  },
  icon: {
    fontSize: 36,
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: tokens.spacing.sm,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
