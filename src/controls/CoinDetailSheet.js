import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, type } from '../theme/tokens';
import { totalEarnedSince, dailyEarnPerCoin } from '../vault/coinModel';

const { height: SCREEN_H } = Dimensions.get('window');

const formatMoney = (n, digits = 2) => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const [whole, frac] = abs.toFixed(digits).split('.');
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const withCommas = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  return `${sign}₹${withCommas}${digits > 0 ? '.' + frac : ''}`;
};

const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const CoinDetailSheet = ({ coin, visible, onClose }) => {
  const translateY = useSharedValue(SCREEN_H);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdrop.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
    } else {
      backdrop.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_H, { duration: 220 });
    }
  }, [visible, translateY, backdrop]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!coin) return null;

  const totalEarned = totalEarnedSince(coin);
  const daily = dailyEarnPerCoin(coin);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={[styles.coinBadge, coin.pledged && styles.coinBadgePledged]}>
            <View style={styles.coinInner} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Coin #{coin.id + 1}</Text>
            <Text style={styles.subtitle}>
              {coin.pledged ? 'Pledged · Still earning' : 'Free · Available to pledge'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Row label="Invested on" value={formatDate(coin.investedAt)} />
          <Divider />
          <Row label="Original value" value={formatMoney(coin.value, 2)} />
          <Divider />
          <Row label="Earned since" value={formatMoney(totalEarned, 2)} accent />
          <Divider />
          <Row label="Earning today" value={`${formatMoney(daily, 4)}/day`} />
        </View>

        <View style={styles.factBox}>
          <View style={styles.factDot} />
          <Text style={styles.factText}>
            {coin.pledged
              ? 'This coin is pledged as collateral. It stays invested and continues to earn returns — you have simply borrowed against its value.'
              : 'This coin is free. You can pledge it to unlock borrowing power without selling it.'}
          </Text>
        </View>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Got it</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const Row = ({ label, value, accent }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, accent && styles.rowValueAccent]}>{value}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
    gap: spacing.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  coinBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.coinFree,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.coinFreeDark,
  },
  coinBadgePledged: {
    borderColor: colors.coinPledgedRing,
    borderWidth: 3,
  },
  coinInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  title: {
    ...type.displayMd,
    fontSize: 22,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  rowLabel: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  rowValue: {
    ...type.mono,
    color: colors.textPrimary,
  },
  rowValueAccent: {
    color: colors.brand,
  },
  factBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(190, 233, 85, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(190, 233, 85, 0.18)',
  },
  factDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: colors.brand,
  },
  factText: {
    ...type.body,
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  closeBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeBtnText: {
    ...type.title,
    color: colors.brandInk,
  },
});

export default CoinDetailSheet;
