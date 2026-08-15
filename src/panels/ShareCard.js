import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/tokens';

const formatMoney = (n) => {
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  const lastThree = s.slice(-3);
  const rest = s.slice(0, -3);
  const withCommas = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  return `₹${withCommas}`;
};

const ShareCard = forwardRef(({ invested, pledged }, ref) => {
  const free = Math.max(0, invested - pledged);
  const dailyEarn = (invested * 0.15) / 365;

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.brandDot} />
        <Text style={styles.brand}>
          Blink<Text style={{ color: colors.brand }}>Money</Text>
        </Text>
      </View>

      <Text style={styles.headline}>
        My money is <Text style={styles.headlineAccent}>still working</Text>
      </Text>
      <Text style={styles.subhead}>Even the part I borrowed against.</Text>

      <View style={styles.hero}>
        <View style={styles.heroBlock}>
          <Text style={styles.heroLabel}>INVESTED</Text>
          <Text style={styles.heroValue}>{formatMoney(invested)}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroBlock}>
          <Text style={styles.heroLabel}>BORROWED</Text>
          <Text style={[styles.heroValue, { color: colors.brand }]}>{formatMoney(pledged)}</Text>
        </View>
      </View>

      <View style={styles.earn}>
        <View style={styles.earnDot} />
        <Text style={styles.earnLabel}>Earning</Text>
        <Text style={styles.earnValue}>{formatMoney(dailyEarn)}/day</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerBig}>Borrow without selling a rupee.</Text>
        <Text style={styles.footerSmall}>blinkmoney.in</Text>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  card: {
    width: 360,
    aspectRatio: 9 / 16,
    padding: spacing.xl,
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  brand: {
    ...type.title,
    fontSize: 16,
    color: colors.textPrimary,
  },
  headline: {
    ...type.displayLg,
    fontSize: 32,
    lineHeight: 38,
  },
  headlineAccent: {
    color: colors.brand,
    fontStyle: 'italic',
  },
  subhead: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: -spacing.md,
  },
  hero: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  heroBlock: {
    flex: 1,
    gap: 4,
  },
  heroDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  heroLabel: {
    ...type.caption,
    color: colors.textTertiary,
  },
  heroValue: {
    ...type.displayMd,
    fontSize: 26,
  },
  earn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(190, 233, 85, 0.1)',
    borderColor: 'rgba(190, 233, 85, 0.25)',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  earnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  earnLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  earnValue: {
    ...type.mono,
    color: colors.brand,
  },
  footer: {
    gap: 4,
  },
  footerBig: {
    ...type.title,
    fontSize: 16,
    color: colors.textPrimary,
  },
  footerSmall: {
    ...type.caption,
    color: colors.textTertiary,
  },
});

export default ShareCard;
