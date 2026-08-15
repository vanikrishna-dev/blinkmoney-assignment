import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, type } from '../theme/tokens';
import { COIN_COUNT } from '../vault/coinModel';

const KNOB = 34;
const TRACK_HEIGHT = 8;
const MAX_LTV = 0.5; // 50% of invested per BlinkMoney

const formatRupees = (n) => {
  const abs = Math.abs(Math.round(n));
  const s = abs.toString();
  const lastThree = s.slice(-3);
  const rest = s.slice(0, -3);
  const withCommas = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  return `₹${withCommas}`;
};

const tickHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const BorrowSlider = ({ invested, trackWidth, pledged, onChange }) => {
  const maxPledgable = Math.floor(invested * MAX_LTV);
  const usable = Math.max(trackWidth - KNOB, 1);

  const knobX = useSharedValue(0);
  const startX = useSharedValue(0);
  const lastLienCount = useSharedValue(0);

  useEffect(() => {
    const ratio = maxPledgable > 0 ? pledged / maxPledgable : 0;
    knobX.value = withSpring(ratio * usable, { damping: 18, stiffness: 180 });
  }, [pledged, maxPledgable, usable, knobX]);

  const emit = (px) => {
    'worklet';
    const clamped = Math.max(0, Math.min(usable, px));
    const ratio = clamped / usable;
    const amt = Math.round((ratio * maxPledgable) / 100) * 100;
    const coinBoundary = Math.round((amt / (invested || 1)) * COIN_COUNT);
    if (coinBoundary !== lastLienCount.value) {
      lastLienCount.value = coinBoundary;
      runOnJS(tickHaptic)();
    }
    runOnJS(onChange)(amt);
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = knobX.value;
    })
    .onUpdate((e) => {
      const next = startX.value + e.translationX;
      const clamped = Math.max(0, Math.min(usable, next));
      knobX.value = clamped;
      emit(clamped);
    })
    .onEnd(() => {
      knobX.value = withSpring(knobX.value, { damping: 22, stiffness: 220 });
    });

  const tap = Gesture.Tap()
    .maxDuration(200)
    .onEnd((e) => {
      const target = Math.max(0, Math.min(usable, e.x - KNOB / 2));
      knobX.value = withSpring(target, { damping: 18, stiffness: 200 });
      emit(target);
    });

  const gesture = Gesture.Simultaneous(pan, tap);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: knobX.value + KNOB / 2,
  }));

  const fillPct = useDerivedValue(() =>
    maxPledgable > 0 ? Math.round((knobX.value / usable) * MAX_LTV * 100) : 0
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>BORROW AGAINST YOUR MONEY</Text>
        <Text style={styles.limit}>Up to {formatRupees(maxPledgable)}</Text>
      </View>

      <GestureDetector gesture={gesture}>
        <View style={styles.trackArea}>
          <View style={[styles.track, { width: trackWidth }]}>
            <Animated.View style={[styles.fill, fillStyle]} />
          </View>
          <Animated.View style={[styles.knob, knobStyle]}>
            <View style={styles.knobDot} />
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.readoutRow}>
        <View style={styles.readoutBlock}>
          <Text style={styles.readoutLabel}>Borrowing</Text>
          <Text style={styles.readoutValue}>{formatRupees(pledged)}</Text>
        </View>
        <View style={styles.readoutBlock}>
          <Text style={styles.readoutLabel}>Interest @ 9.99% p.a.</Text>
          <Text style={styles.readoutValueMuted}>
            {formatRupees(pledged * 0.0999 / 12)}/mo
          </Text>
        </View>
      </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...type.caption,
    color: colors.textTertiary,
  },
  limit: {
    ...type.caption,
    color: colors.brand,
  },
  trackArea: {
    height: KNOB,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.borderStrong,
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
    backgroundColor: colors.brand,
    borderRadius: TRACK_HEIGHT / 2,
  },
  knob: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  knobDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandInk,
  },
  readoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  readoutBlock: {
    gap: 4,
  },
  readoutLabel: {
    ...type.caption,
    color: colors.textTertiary,
  },
  readoutValue: {
    ...type.displayMd,
    fontSize: 22,
    color: colors.textPrimary,
  },
  readoutValueMuted: {
    ...type.body,
    color: colors.textSecondary,
  },
});

export default BorrowSlider;
