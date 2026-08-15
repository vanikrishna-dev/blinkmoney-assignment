import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, type } from '../theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');

const DEFAULT_STEPS = [
  {
    title: 'Welcome',
    body: 'A quick walkthrough of what this screen does.',
    cta: 'Continue',
  },
];

const OnboardingOverlay = ({ visible, onDone, steps }) => {
  const STEPS = (steps && steps.length ? steps : DEFAULT_STEPS).map((s, i, arr) => ({
    eyebrow: `STEP ${i + 1} OF ${arr.length}`,
    cta: i === arr.length - 1 ? 'Got it' : 'Continue',
    ...s,
  }));
  const [step, setStep] = useState(0);
  const progress = useSharedValue(0);
  const enter = useSharedValue(0);
  const cardShift = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setStep(0);
      progress.value = 0;
      cardShift.value = 0;
      enter.value = withTiming(1, { duration: 260 });
    } else {
      enter.value = withTiming(0, { duration: 200 });
    }
  }, [visible, enter, progress, cardShift]);

  useEffect(() => {
    const denom = Math.max(1, STEPS.length - 1);
    progress.value = withSpring(step / denom, {
      damping: 20,
      stiffness: 180,
    });
  }, [step, progress]);

  const next = () => {
    Haptics.selectionAsync();
    if (step >= STEPS.length - 1) {
      onDone();
      return;
    }
    setStep((s) => s + 1);
  };

  const skip = () => {
    Haptics.selectionAsync();
    onDone();
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: enter.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - enter.value) * 40 }],
    opacity: enter.value,
  }));
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const s = STEPS[step];

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={skip}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={skip} />
      </Animated.View>

      <View style={styles.wrap} pointerEvents="box-none">
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, barStyle]} />
          </View>

          <Text style={styles.eyebrow}>{s.eyebrow}</Text>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>

          <View style={styles.actions}>
            <Pressable onPress={skip} hitSlop={12}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
            <Pressable style={styles.ctaBtn} onPress={next}>
              <Text style={styles.ctaText}>{s.cta}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: Math.min(SCREEN_W - spacing.xl * 2, 380),
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
    gap: spacing.md,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.brand,
    borderRadius: 2,
  },
  eyebrow: {
    ...type.caption,
    color: colors.brand,
    letterSpacing: 1.2,
  },
  title: {
    ...type.displayMd,
    fontSize: 26,
    lineHeight: 32,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  skip: {
    ...type.body,
    color: colors.textTertiary,
  },
  ctaBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  ctaText: {
    ...type.title,
    color: colors.brandInk,
  },
});

export default OnboardingOverlay;
