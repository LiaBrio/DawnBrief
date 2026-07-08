import { SafeAreaView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { palette, tokens } from '@/src/theme/tokens';

export default function FeedsScreen() {
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palette(mode);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.kicker, { color: colors.secondary }]}>晨间播报</Text>
        <Text style={[styles.title, { color: colors.text }]}>天气、新闻与 RSS</Text>
        <Text style={[styles.body, { color: colors.secondary }]}>
          将在下一阶段接入天气、新闻与 RSS 源播报配置。这里先保留产品入口和范围说明，避免误导为已经联网可用。
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
