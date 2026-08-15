import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useFrameCallback,
  withTiming,
} from 'react-native-reanimated';
import { TextInput } from 'react-native';
import { colors, radius, spacing, type } from '../theme/tokens';
import { perSecondEarn } from '../vault/coinModel';

Animated.addWhitelistedNativeProps?.({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const formatRupees = (n) => {
  'worklet';
  const abs = Math.abs(n);
  const [whole, frac] = abs.toFixed(2).split('.');
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const withCommas = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  return `₹${withCommas}.${frac}`;
};

const formatRupeesInt = (n) => {
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  const lastThree = s.slice(-3);
  const rest = s.slice(0, -3);
  const withCommas = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  return `₹${withCommas}`;
};

const LiveCounter = ({ invested, pledged, annualRate = 0.15 }) => {
  const earnedAccum = useSharedValue(0);
  const perSec = perSecondEarn(invested, annualRate);

  useEffect(() => {
    earnedAccum.value = 0;
  }, [invested, earnedAccum]);

  useFrameCallback((info) => {
    'worklet';
    const dt = (info.timeSincePreviousFrame ?? 16) / 1000;
    earnedAccum.value = earnedAccum.value + perSec * dt;
  });

  const animatedProps = useAnimatedProps(() => ({
    text: formatRupees(earnedAccum.value),
    defaultValue: formatRupees(earnedAccum.value),
  }));

  const free = Math.max(0, invested - pledged);

  return (
    <View style={styles.wrap}>
      <View style={styles.rowTop}>
        <View style={styles.stat}>
          <Text style={styles.label}>INVESTED</Text>
          <Text style={styles.value}>{formatRupeesInt(invested)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.label}>PLEDGED</Text>
          <Text style={[styles.value, styles.valuePledged]}>{formatRupeesInt(pledged)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.label}>FREE</Text>
          <Text style={styles.value}>{formatRupeesInt(free)}</Text>
        </View>
      </View>

      <View style={styles.earnStrip}>
        <View style={styles.dot} />
        <Text style={styles.earnLabel}>Earning right now</Text>
        <AnimatedTextInput
          style={styles.earnValue}
          editable={false}
          animatedProps={animatedProps}
          defaultValue="₹0.00"
        />
      </View>
      <Text style={styles.footnote}>
        Even pledged coins keep earning. Your money never leaves the market.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  label: {
    ...type.caption,
    color: colors.textTertiary,
  },
  value: {
    ...type.displayMd,
    color: colors.textPrimary,
    fontSize: 20,
  },
  valuePledged: {
    color: colors.brand,
  },
  earnStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  earnLabel: {
    ...type.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  earnValue: {
    ...type.mono,
    color: colors.brand,
    fontSize: 15,
    padding: 0,
    margin: 0,
    minWidth: 100,
    textAlign: 'right',
  },
  footnote: {
    ...type.caption,
    color: colors.textTertiary,
    fontSize: 11,
  },
});

export default LiveCounter;
