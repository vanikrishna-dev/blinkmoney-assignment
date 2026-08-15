import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Linking,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { colors, radius, spacing, type } from '../theme/tokens';
import OnboardingOverlay from '../panels/OnboardingOverlay';

const DUEL_STEPS = [
  {
    title: 'A shared coin, not a shared wallet.',
    body: 'You dedicate one coin from your vault to a friend. Both of you SIP toward a shared ₹1,000 goal on that paired coin.',
  },
  {
    title: 'No money moves between you.',
    body: 'This is a streak challenge — whoever hits the target first keeps their streak alive. Your money and their money stay in your own accounts.',
  },
  {
    title: 'The friend can join in 10 seconds.',
    body: 'Tap the WhatsApp invite. They open the link, join with just a name, and you\'re racing. Both coins keep earning 15% p.a. throughout.',
  },
];

const TARGET = 1000;

const CoinArt = ({ progress, size = 88, dim }) => {
  const scale = useDerivedValue(() => 0.7 + progress.value * 0.3);
  const glow = useDerivedValue(() => 0.15 + progress.value * 0.5);
  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dim ? 0.35 : 1,
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: dim ? 0.1 : glow.value }));
  return (
    <View style={{ width: size + 40, height: size + 40, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            backgroundColor: colors.coinFree,
          },
          glowStyle,
        ]}
      />
      <Animated.View style={outerStyle}>
        <View style={[coinStyles.rim, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[coinStyles.bright, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}>
            <View style={[coinStyles.face, { width: size - 12, height: size - 12, borderRadius: (size - 12) / 2 }]}>
              <Text style={coinStyles.rupee}>₹</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const coinStyles = StyleSheet.create({
  rim: {
    backgroundColor: colors.coinFreeRim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bright: {
    backgroundColor: colors.coinFreeBright,
    justifyContent: 'center',
    alignItems: 'center',
  },
  face: {
    backgroundColor: colors.coinFree,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rupee: {
    color: colors.coinInk,
    fontSize: 32,
    fontWeight: '900',
  },
});

const StreakDots = ({ count, style }) => {
  const days = Array.from({ length: 7 }, (_, i) => i);
  return (
    <View style={[styles.streakRow, style]}>
      {days.map((d) => (
        <View
          key={d}
          style={[
            styles.streakDot,
            {
              backgroundColor: d < count ? colors.brand : colors.borderStrong,
              borderColor: d < count ? colors.brand : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
};

const VaultDuelScreen = () => {
  const [friendName, setFriendName] = useState('');
  const [duelStarted, setDuelStarted] = useState(false);
  const [myAmount, setMyAmount] = useState(340);
  const [friendAmount, setFriendAmount] = useState(280);
  const [dayCount] = useState(4);
  const [demoOpen, setDemoOpen] = useState(false);

  const myProgress = useSharedValue(0);
  const friendProgress = useSharedValue(0);

  useEffect(() => {
    myProgress.value = withSpring(Math.min(1, myAmount / TARGET), { damping: 18, stiffness: 130 });
    friendProgress.value = withSpring(Math.min(1, friendAmount / TARGET), { damping: 18, stiffness: 130 });
  }, [myAmount, friendAmount, myProgress, friendProgress]);

  const myBarStyle = useAnimatedStyle(() => ({ width: `${myProgress.value * 100}%` }));
  const friendBarStyle = useAnimatedStyle(() => ({ width: `${friendProgress.value * 100}%` }));

  const status = useMemo(() => {
    if (myAmount >= TARGET && friendAmount >= TARGET) return 'tied';
    if (myAmount >= TARGET) return 'won';
    if (friendAmount >= TARGET) return 'lost';
    return 'active';
  }, [myAmount, friendAmount]);

  const canStart = friendName.trim().length >= 2;

  const startDuel = () => {
    if (!canStart) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDuelStarted(true);
  };

  const nudgeFriend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg = `Hey ${friendName || 'friend'} — I locked a coin for us on BlinkMoney. Race me: first to ₹${TARGET} on our SIP wins. My streak so far: ${dayCount} days.`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) Linking.openURL(url);
    else Alert.alert('WhatsApp not found', 'Install WhatsApp to nudge your friend.');
  };

  const simulateSip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMyAmount((v) => Math.min(TARGET, v + 100));
    setTimeout(() => setFriendAmount((v) => Math.min(TARGET, v + Math.random() > 0.4 ? 100 : 0)), 400);
  };

  const reset = () => {
    Haptics.selectionAsync();
    setMyAmount(0);
    setFriendAmount(0);
    setDuelStarted(false);
    setFriendName('');
  };

  if (!duelStarted) {
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
              <Text style={styles.eyebrow}>VAULT DUEL</Text>
              <Text style={styles.title}>Lock a coin.</Text>
              <Text style={[styles.title, styles.titleAccent]}>Race a friend.</Text>
              <Text style={styles.subtitle}>
                Pick one coin from your vault, dedicate it to a friend. Whoever hits ₹{TARGET} first keeps their streak alive — the other resets. No money on the line, just accountability.
              </Text>
            </View>

            <View style={styles.pairPreview}>
              <View style={styles.pairSide}>
                <CoinArt progress={{ value: 0.6 }} dim={false} />
                <Text style={styles.pairName}>You</Text>
              </View>
              <View style={styles.vs}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <View style={styles.pairSide}>
                <CoinArt progress={{ value: 0.4 }} dim />
                <Text style={styles.pairName}>Friend</Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>WHO ARE YOU CHALLENGING?</Text>
              <TextInput
                value={friendName}
                onChangeText={setFriendName}
                placeholder="Friend's name"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
              />
              <Text style={styles.inputHint}>They'll get a WhatsApp invite. No account needed to accept.</Text>
            </View>

            <Pressable
              style={[styles.primaryBtn, !canStart && styles.primaryBtnDisabled]}
              onPress={startDuel}
              disabled={!canStart}
            >
              <Text
                style={[styles.primaryBtnText, !canStart && styles.primaryBtnTextDisabled]}
              >
                Lock a coin & invite
              </Text>
            </Pressable>

            <View style={styles.factRow}>
              <View style={styles.factDot} />
              <Text style={styles.factText}>
                Both of you still earn returns on the coin. This is a streak flex — no money changes hands.
              </Text>
            </View>
          </ScrollView>
          <OnboardingOverlay
            visible={demoOpen}
            onDone={() => setDemoOpen(false)}
            steps={DUEL_STEPS}
          />
        </SafeAreaView>
      </>
    );
  }

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
            <View style={styles.headerActions}>
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
              <Pressable style={styles.resetBtn} onPress={reset} hitSlop={10}>
                <Text style={styles.resetBtnText}>End duel</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>DUEL ACTIVE</Text>
            <Text style={styles.title}>You vs {friendName || 'Friend'}</Text>
            <Text style={styles.subtitle}>First to ₹{TARGET} on the paired coin. Day {dayCount} of 30.</Text>
          </View>

          <View style={styles.duelStage}>
            <View style={styles.duelSide}>
              <CoinArt progress={myProgress} />
              <Text style={styles.duelName}>You</Text>
              <Text style={styles.duelAmount}>₹{myAmount.toLocaleString('en-IN')}</Text>
              <View style={styles.bar}>
                <Animated.View style={[styles.barFill, myBarStyle]} />
              </View>
              <StreakDots count={dayCount} style={{ marginTop: spacing.sm }} />
            </View>

            <View style={styles.duelSide}>
              <CoinArt progress={friendProgress} dim={status === 'won'} />
              <Text style={styles.duelName}>{friendName || 'Friend'}</Text>
              <Text style={styles.duelAmount}>₹{friendAmount.toLocaleString('en-IN')}</Text>
              <View style={styles.bar}>
                <Animated.View style={[styles.barFill, styles.barFillFriend, friendBarStyle]} />
              </View>
              <StreakDots count={Math.max(0, dayCount - 1)} style={{ marginTop: spacing.sm }} />
            </View>
          </View>

          <View style={styles.stateBanner(status)}>
            <Text style={styles.stateBannerText}>
              {status === 'active' && `${friendName || 'Friend'} is ${friendAmount < myAmount ? 'behind' : 'ahead'} by ₹${Math.abs(myAmount - friendAmount)}`}
              {status === 'won' && `🏆 You reached ₹${TARGET} first!`}
              {status === 'lost' && `${friendName || 'Friend'} reached ₹${TARGET} first.`}
              {status === 'tied' && `Tied at ₹${TARGET}. Both winners.`}
            </Text>
          </View>

          <Pressable style={styles.primaryBtn} onPress={simulateSip}>
            <Text style={styles.primaryBtnText}>Log today's SIP · +₹100</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={nudgeFriend}>
            <Text style={styles.secondaryBtnText}>Nudge {friendName || 'friend'} on WhatsApp</Text>
          </Pressable>

          <View style={styles.factRow}>
            <View style={styles.factDot} />
            <Text style={styles.factText}>
              Both coins keep earning at 15% p.a. This is a streak race, not a bet.
            </Text>
          </View>
        </ScrollView>
        <OnboardingOverlay
          visible={demoOpen}
          onDone={() => setDemoOpen(false)}
          steps={DUEL_STEPS}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? spacing.xl : 0 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 140 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
  brand: { ...type.title, fontSize: 16 },
  titleBlock: { gap: 4, paddingTop: spacing.xs },
  eyebrow: { ...type.caption, color: colors.brand, letterSpacing: 1.2 },
  title: { ...type.displayLg, fontSize: 30, lineHeight: 36 },
  titleAccent: { color: colors.brand, fontStyle: 'italic' },
  subtitle: { ...type.body, color: colors.textSecondary, marginTop: spacing.xs },
  pairPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pairSide: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  pairName: { ...type.body, color: colors.textPrimary, fontSize: 14 },
  vs: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  vsText: { ...type.caption, color: colors.textSecondary, fontWeight: '800' },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  inputLabel: { ...type.caption, color: colors.textTertiary, letterSpacing: 1.2 },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputHint: { ...type.caption, color: colors.textTertiary },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: { ...type.title, color: colors.brandInk },
  primaryBtnTextDisabled: { color: colors.textTertiary },
  secondaryBtn: {
    borderColor: colors.brand,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(190, 233, 85, 0.08)',
  },
  secondaryBtnText: { ...type.body, color: colors.brand, fontWeight: '700' },
  factRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(190, 233, 85, 0.06)',
    borderColor: 'rgba(190, 233, 85, 0.18)',
    borderWidth: 1,
  },
  factDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, marginTop: 6 },
  factText: { ...type.body, color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 19 },
  duelStage: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  duelSide: { flex: 1, alignItems: 'center', gap: 6 },
  duelName: { ...type.body, color: colors.textPrimary, fontSize: 14 },
  duelAmount: { ...type.displayMd, fontSize: 22 },
  bar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: { height: 6, backgroundColor: colors.brand, borderRadius: 3 },
  barFillFriend: { backgroundColor: colors.coinFree },
  streakRow: { flexDirection: 'row', gap: 4 },
  streakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  resetBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  resetBtnText: { ...type.caption, color: colors.textSecondary },
  headerActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
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
  stateBanner: (status) => ({
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor:
      status === 'won' ? colors.brand : status === 'lost' ? colors.danger : colors.border,
    backgroundColor:
      status === 'won'
        ? 'rgba(190, 233, 85, 0.14)'
        : status === 'lost'
        ? 'rgba(255, 90, 90, 0.08)'
        : colors.surface,
  }),
  stateBannerText: { ...type.body, color: colors.textPrimary, textAlign: 'center' },
});

export default VaultDuelScreen;
