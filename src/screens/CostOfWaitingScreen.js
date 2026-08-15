import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
  TextInput,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useFrameCallback,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { colors, radius, spacing, type } from '../theme/tokens';
import OnboardingOverlay from '../panels/OnboardingOverlay';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = spacing.lg;
const TRACK_W = SCREEN_W - H_PAD * 2 - spacing.lg * 2;
const KNOB = 26;
const YEAR_SECS = 365 * 24 * 60 * 60;

const YEAR_STOPS = [0.5, 1, 2, 3, 5, 7, 10];
const SIP_MIN = 21;
const SIP_MAX = 1000;

const WAITING_STEPS = [
  {
    title: 'The meter is counting your loss.',
    body: 'Every second you don\'t invest, the number climbs. It shows what you\'ve missed out on by waiting.',
  },
  {
    title: 'Drag the timeline.',
    body: 'Slide the timeline to see what you\'d have if you\'d started 6 months, 1 year, 5 years ago. The meter redraws live.',
  },
  {
    title: 'Freeze it by starting.',
    body: 'Tap "Freeze the meter · Start SIP." The counter locks with a haptic thunk, screen flashes green. That\'s the moment you stop the bleed.',
  },
];

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

const formatYears = (y) => {
  if (y < 1) {
    const months = Math.round(y * 12);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  return `${y % 1 === 0 ? y : y.toFixed(1)} year${y === 1 ? '' : 's'} ago`;
};

const CostOfWaitingScreen = () => {
  const [dailySip, setDailySip] = useState(100);
  const [yearsBack, setYearsBack] = useState(2);
  const [frozen, setFrozen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const projected = useMemo(() => {
    const r = 0.15;
    const days = Math.round(yearsBack * 365);
    const dailyR = r / 365;
    let fv = 0;
    for (let i = 0; i < days; i++) fv = (fv + dailySip) * (1 + dailyR);
    return fv;
  }, [dailySip, yearsBack]);

  const perSecondLoss = useMemo(() => projected / Math.max(1, yearsBack * YEAR_SECS), [projected, yearsBack]);

  const accum = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    accum.value = 0;
  }, [dailySip, yearsBack, accum]);

  useFrameCallback((info) => {
    'worklet';
    if (frozen) return;
    const dt = (info.timeSincePreviousFrame ?? 16) / 1000;
    accum.value += perSecondLoss * dt;
  });

  const meterProps = useAnimatedProps(() => ({
    text: formatRupees(accum.value),
    defaultValue: formatRupees(accum.value),
  }));

  const flashOverlayStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  const handleFreeze = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    flash.value = withTiming(1, { duration: 180 }, () => {
      flash.value = withTiming(0, { duration: 500 });
    });
    setFrozen(true);
  };

  const handleUnfreeze = () => {
    Haptics.selectionAsync();
    setFrozen(false);
    accum.value = 0;
  };

  // Timeline scrubber ------------------------------------------------
  const timeKnob = useSharedValue(0);
  const timeStart = useSharedValue(0);

  useEffect(() => {
    const idx = YEAR_STOPS.indexOf(yearsBack);
    const ratio = idx >= 0 ? idx / (YEAR_STOPS.length - 1) : 0.28;
    timeKnob.value = ratio * (TRACK_W - KNOB);
  }, [yearsBack, timeKnob]);

  const applyYearFromKnob = (px) => {
    const ratio = Math.max(0, Math.min(1, px / (TRACK_W - KNOB)));
    const rawIdx = ratio * (YEAR_STOPS.length - 1);
    const idx = Math.round(rawIdx);
    const val = YEAR_STOPS[idx];
    setYearsBack((prev) => {
      if (prev !== val) {
        Haptics.selectionAsync();
        return val;
      }
      return prev;
    });
  };

  const timelinePan = Gesture.Pan()
    .onStart(() => {
      timeStart.value = timeKnob.value;
    })
    .onUpdate((e) => {
      const next = Math.max(0, Math.min(TRACK_W - KNOB, timeStart.value + e.translationX));
      timeKnob.value = next;
      runOnJS(applyYearFromKnob)(next);
    });

  const timeKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: timeKnob.value }],
  }));

  // Amount scrubber ------------------------------------------------
  const amountKnob = useSharedValue(0);
  const amountStart = useSharedValue(0);

  useEffect(() => {
    const ratio = (dailySip - SIP_MIN) / (SIP_MAX - SIP_MIN);
    amountKnob.value = ratio * (TRACK_W - KNOB);
  }, [dailySip, amountKnob]);

  const applyAmountFromKnob = (px) => {
    const ratio = Math.max(0, Math.min(1, px / (TRACK_W - KNOB)));
    const raw = SIP_MIN + ratio * (SIP_MAX - SIP_MIN);
    const snapped = Math.round(raw / 10) * 10;
    setDailySip((prev) => {
      if (prev !== snapped) {
        Haptics.selectionAsync();
        return snapped;
      }
      return prev;
    });
  };

  const amountPan = Gesture.Pan()
    .onStart(() => {
      amountStart.value = amountKnob.value;
    })
    .onUpdate((e) => {
      const next = Math.max(0, Math.min(TRACK_W - KNOB, amountStart.value + e.translationX));
      amountKnob.value = next;
      runOnJS(applyAmountFromKnob)(next);
    });

  const amountFillStyle = useAnimatedStyle(() => ({
    width: amountKnob.value + KNOB / 2,
  }));
  const amountKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: amountKnob.value }],
  }));

  const timeFillStyle = useAnimatedStyle(() => ({
    width: timeKnob.value + KNOB / 2,
  }));

  // Translations
  const weeksOfSip = Math.max(1, Math.round(projected / (dailySip * 7)));
  const perDay = perSecondLoss * 86400;

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.brandDot} />
              <Text style={styles.brand}>
                Blink<Text style={{ color: colors.brand }}>Money</Text>
              </Text>
            </View>
            <Pressable
              style={styles.demoBtn}
              onPress={() => {
                Haptics.selectionAsync();
                setDemoOpen(true);
              }}
              hitSlop={10}
            >
              <View style={styles.demoBtnDot} />
              <Text style={styles.demoBtnText}>Show demo</Text>
            </Pressable>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>THE COST OF WAITING</Text>
            <Text style={styles.title}>Every second you don't invest,</Text>
            <Text style={[styles.title, styles.titleAccent]}>this number climbs.</Text>
          </View>

          {/* METER */}
          <View style={styles.meterBox}>
            <View style={styles.meterInner}>
              <View style={styles.meterHead}>
                <View style={styles.livePill}>
                  <View style={styles.livePillDot} />
                  <Text style={styles.livePillText}>
                    {frozen ? 'FROZEN' : 'LIVE'}
                  </Text>
                </View>
                <Text style={styles.meterHeadLabel}>lost by waiting</Text>
              </View>

              <AnimatedTextInput
                editable={false}
                animatedProps={meterProps}
                style={[
                  styles.meterValue,
                  frozen && { color: colors.brand },
                ]}
                defaultValue="₹0.00"
              />

              <View style={styles.meterFooter}>
                <Text style={styles.meterFooterLine}>
                  ≈ <Text style={styles.meterFooterEm}>{weeksOfSip} weeks</Text> of your current SIP
                </Text>
                <Text style={styles.meterFooterLine}>
                  Growing by <Text style={styles.meterFooterEm}>{formatRupeesInt(perDay)}/day</Text> right now
                </Text>
              </View>
            </View>
          </View>

          {/* TIMELINE */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardLabel}>YOU COULD HAVE STARTED</Text>
              <Text style={styles.cardValue}>{formatYears(yearsBack)}</Text>
            </View>

            <GestureDetector gesture={timelinePan}>
              <View style={styles.trackArea}>
                <View style={styles.trackBg}>
                  <Animated.View style={[styles.trackFill, timeFillStyle]} />
                </View>
                {/* stop ticks */}
                <View style={styles.tickRow}>
                  {YEAR_STOPS.map((y, i) => (
                    <View
                      key={y}
                      style={[
                        styles.tick,
                        {
                          left: (i / (YEAR_STOPS.length - 1)) * (TRACK_W - KNOB) + KNOB / 2 - 1,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Animated.View style={[styles.knob, timeKnobStyle]}>
                  <View style={styles.knobDot} />
                </Animated.View>
              </View>
            </GestureDetector>

            <View style={styles.tickLabelRow}>
              <Text style={styles.tickLabel}>6mo</Text>
              <Text style={styles.tickLabel}>10y</Text>
            </View>
          </View>

          {/* AMOUNT */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardLabel}>AT A DAILY SIP OF</Text>
              <Text style={styles.cardValue}>{formatRupeesInt(dailySip)}</Text>
            </View>

            <GestureDetector gesture={amountPan}>
              <View style={styles.trackArea}>
                <View style={styles.trackBg}>
                  <Animated.View style={[styles.trackFill, amountFillStyle]} />
                </View>
                <Animated.View style={[styles.knob, amountKnobStyle]}>
                  <View style={styles.knobDot} />
                </Animated.View>
              </View>
            </GestureDetector>

            <View style={styles.tickLabelRow}>
              <Text style={styles.tickLabel}>₹{SIP_MIN}</Text>
              <Text style={styles.tickLabel}>₹{SIP_MAX}</Text>
            </View>
          </View>

          {/* CTA */}
          {!frozen ? (
            <Pressable style={styles.freezeBtn} onPress={handleFreeze}>
              <Text style={styles.freezeBtnText}>Freeze the meter · Start SIP</Text>
            </Pressable>
          ) : (
            <View style={styles.frozenBanner}>
              <View style={styles.frozenIcon}>
                <Text style={styles.frozenIconText}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.frozenBannerTitle}>Meter frozen</Text>
                <Text style={styles.frozenBannerSub}>
                  From here on, you're building — not losing.
                </Text>
              </View>
              <Pressable onPress={handleUnfreeze} hitSlop={12}>
                <Text style={styles.frozenBannerAction}>Reset</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.disclaimer}>
            *Illustrative. Assumes 15% p.a. compounded daily. Past performance is not indicative of future returns. AMFI ARN 330047.
          </Text>
        </ScrollView>

        {/* Screen-wide green flash on freeze */}
        <Animated.View
          pointerEvents="none"
          style={[styles.flashOverlay, flashOverlayStyle]}
        />

        <OnboardingOverlay
          visible={demoOpen}
          onDone={() => setDemoOpen(false)}
          steps={WAITING_STEPS}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? spacing.xl : 0 },
  scroll: { padding: H_PAD, gap: spacing.lg, paddingBottom: 140 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
  brand: { ...type.title, fontSize: 16 },
  titleBlock: { gap: 4, paddingTop: spacing.xs },
  eyebrow: { ...type.caption, color: colors.brand, letterSpacing: 1.2 },
  title: { ...type.displayLg, fontSize: 28, lineHeight: 34 },
  titleAccent: { color: colors.brand, fontStyle: 'italic' },

  meterBox: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  meterInner: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  meterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(190, 233, 85, 0.14)',
    borderWidth: 1,
    borderColor: colors.brand,
  },
  livePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  livePillText: { ...type.caption, color: colors.brand, letterSpacing: 1.4, fontSize: 10 },
  meterHeadLabel: { ...type.caption, color: colors.textTertiary },

  meterValue: {
    ...type.mono,
    color: colors.textPrimary,
    fontSize: 48,
    fontWeight: '900',
    padding: 0,
    margin: 0,
    letterSpacing: -1.2,
    lineHeight: 54,
  },
  meterFooter: {
    gap: 4,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  meterFooterLine: { ...type.body, color: colors.textSecondary, fontSize: 13 },
  meterFooterEm: { color: colors.textPrimary, fontWeight: '700' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: { ...type.caption, color: colors.textTertiary, letterSpacing: 1.2 },
  cardValue: { ...type.displayMd, fontSize: 22, color: colors.textPrimary },

  trackArea: {
    height: KNOB,
    justifyContent: 'center',
    width: TRACK_W,
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    overflow: 'hidden',
    width: TRACK_W,
  },
  trackFill: { height: 6, backgroundColor: colors.brand, borderRadius: 3 },
  tickRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: KNOB,
    justifyContent: 'center',
  },
  tick: {
    position: 'absolute',
    top: KNOB / 2 - 5,
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: colors.border,
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
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  knobDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brandInk },
  tickLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  tickLabel: { ...type.caption, color: colors.textTertiary },

  freezeBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  freezeBtnText: { ...type.title, color: colors.brandInk },
  frozenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(190, 233, 85, 0.10)',
    borderColor: colors.brand,
    borderWidth: 1,
  },
  frozenIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frozenIconText: {
    color: colors.brandInk,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  frozenBannerTitle: { ...type.title, color: colors.brand },
  frozenBannerSub: { ...type.body, color: colors.textSecondary, fontSize: 13 },
  frozenBannerAction: { ...type.body, color: colors.brand, fontWeight: '700' },
  disclaimer: { ...type.caption, color: colors.textTertiary, fontSize: 11, textAlign: 'center' },

  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.brand,
  },

  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    backgroundColor: 'rgba(190, 233, 85, 0.08)',
  },
  demoBtnDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand },
  demoBtnText: { ...type.caption, color: colors.brand, fontWeight: '600' },
});

export default CostOfWaitingScreen;
