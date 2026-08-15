import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, type } from '../theme/tokens';
import VaultCanvas from '../vault/VaultCanvas';
import { computeLienCount } from '../vault/coinModel';
import LiveCounter from '../panels/LiveCounter';
import BorrowSlider from '../controls/BorrowSlider';
import CoinDetailSheet from '../controls/CoinDetailSheet';
import ShareCard from '../panels/ShareCard';
import OnboardingOverlay from '../panels/OnboardingOverlay';
import { COIN_COUNT } from '../vault/coinModel';

const { width: WINDOW_W } = Dimensions.get('window');
const HORIZONTAL_PAD = spacing.lg;
const CONTENT_W = WINDOW_W - HORIZONTAL_PAD * 2;
const VAULT_HEIGHT = 320;

const LienVisionScreen = () => {
  const [invested] = useState(25000);
  const [pledged, setPledged] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(true);
  const shareRef = useRef(null);

  const perCoin = invested / COIN_COUNT;

  const lienCount = useMemo(
    () => computeLienCount({ pledgedAmount: pledged, invested }),
    [pledged, invested]
  );

  const handleCoinTap = useCallback((coin) => {
    Haptics.selectionAsync();
    setSelectedCoin(coin);
    setSheetOpen(true);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const uri = await captureRef(shareRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your vault' });
      } else {
        Alert.alert('Saved', 'Share sheet is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Could not share', e?.message ?? 'Unknown error');
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces
        >
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
                setOnboardOpen(true);
              }}
              hitSlop={10}
            >
              <View style={styles.demoBtnDot} />
              <Text style={styles.demoBtnText}>Show demo</Text>
            </Pressable>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>LIEN VISION</Text>
            <Text style={styles.title}>Your money, still yours.</Text>
            <Text style={styles.subtitle}>
              Watch every rupee stay in the market — even the ones you borrow against.
            </Text>
          </View>

          <View style={styles.vaultWrap}>
            <View style={styles.vaultHeader}>
              <View>
                <Text style={styles.vaultHeaderLabel}>YOUR VAULT</Text>
                <Text style={styles.vaultHeaderValue}>
                  ₹{invested.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.vaultHeaderMeta}>
                <Text style={styles.vaultHeaderMetaLabel}>{COIN_COUNT} coins</Text>
                <Text style={styles.vaultHeaderMetaSub}>
                  ~₹{Math.round(perCoin).toLocaleString('en-IN')} each
                </Text>
              </View>
            </View>
            <VaultCanvas
              width={CONTENT_W}
              height={VAULT_HEIGHT}
              invested={invested}
              lienCount={lienCount}
              onCoinTap={handleCoinTap}
              reduceMotionEnabled={reduceMotion}
            />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    {
                      backgroundColor: colors.coinFree,
                      borderWidth: 1,
                      borderColor: colors.coinFreeRim,
                    },
                  ]}
                />
                <Text style={styles.legendText}>Free</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    {
                      backgroundColor: 'transparent',
                      borderWidth: 2,
                      borderColor: colors.coinPledgedRing,
                    },
                  ]}
                />
                <Text style={styles.legendText}>Pledged</Text>
              </View>
              <Text style={styles.legendHint}>Tap any coin</Text>
            </View>
          </View>

          <LiveCounter invested={invested} pledged={pledged} />

          <BorrowSlider
            invested={invested}
            trackWidth={CONTENT_W - spacing.lg * 2}
            pledged={pledged}
            onChange={setPledged}
          />

          <Pressable style={styles.shareBtn} onPress={() => setShareOpen(true)}>
            <View style={styles.shareIcon}>
              <View style={styles.shareIconDot} />
              <View style={styles.shareIconDot} />
              <View style={styles.shareIconDot} />
            </View>
            <Text style={styles.shareBtnText}>Share proof</Text>
          </Pressable>

          <Text style={styles.footnote}>
            *Demo values. Actual returns depend on fund performance. AMFI ARN 330047.
          </Text>
        </ScrollView>

        <CoinDetailSheet
          coin={selectedCoin}
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />

        <OnboardingOverlay
          visible={onboardOpen}
          onDone={() => setOnboardOpen(false)}
          steps={[
            {
              title: 'This is your money.',
              body: 'Every glowing coin is a real piece of your ₹25,000 investment. 18 coins, worth about ₹1,389 each.',
            },
            {
              title: 'Borrow without selling.',
              body: 'Drag the borrow slider below the vault. Watch specific coins get a green ring — those are the ones you\'re borrowing against.',
            },
            {
              title: 'They still earn.',
              body: 'Pledged coins keep glowing, keep drifting, keep growing at 15% p.a. Your money never leaves the market — you just borrowed against its value. Tap any coin to inspect.',
            },
          ]}
        />

        <Modal
          transparent
          visible={shareOpen}
          animationType="fade"
          onRequestClose={() => setShareOpen(false)}
          statusBarTranslucent
        >
          <View style={styles.shareBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShareOpen(false)} />
            <View style={styles.sharePanel}>
              <ViewShot ref={shareRef} options={{ format: 'png', quality: 1 }}>
                <ShareCard invested={invested} pledged={pledged} />
              </ViewShot>
              <View style={styles.shareActions}>
                <Pressable
                  style={[styles.shareActionBtn, styles.shareActionBtnPrimary]}
                  onPress={handleShare}
                >
                  <Text style={styles.shareActionBtnPrimaryText}>Share to WhatsApp / …</Text>
                </Pressable>
                <Pressable
                  style={styles.shareActionBtn}
                  onPress={() => setShareOpen(false)}
                >
                  <Text style={styles.shareActionBtnText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? spacing.xl : 0 },
  scroll: {
    padding: HORIZONTAL_PAD,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
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
  brand: { ...type.title, fontSize: 16 },
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
  demoBtnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
  },
  demoBtnText: { ...type.caption, color: colors.brand, fontWeight: '600' },
  titleBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  eyebrow: {
    ...type.caption,
    color: colors.brand,
    letterSpacing: 1.2,
  },
  title: {
    ...type.displayLg,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
  },
  vaultWrap: { gap: spacing.sm },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  vaultHeaderLabel: {
    ...type.caption,
    color: colors.textTertiary,
    letterSpacing: 1.2,
  },
  vaultHeaderValue: {
    ...type.displayMd,
    fontSize: 22,
    color: colors.textPrimary,
  },
  vaultHeaderMeta: {
    alignItems: 'flex-end',
  },
  vaultHeaderMetaLabel: {
    ...type.body,
    color: colors.textPrimary,
    fontSize: 14,
  },
  vaultHeaderMetaSub: {
    ...type.caption,
    color: colors.textTertiary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: { ...type.caption, color: colors.textSecondary },
  legendHint: {
    ...type.caption,
    color: colors.textTertiary,
    marginLeft: 'auto',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    shadowColor: colors.brand,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  shareIcon: {
    flexDirection: 'row',
    gap: 3,
  },
  shareIconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.brandInk,
  },
  shareBtnText: { ...type.title, color: colors.brandInk },
  footnote: {
    ...type.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    fontSize: 11,
  },
  shareBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sharePanel: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  shareActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shareActionBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareActionBtnPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  shareActionBtnPrimaryText: { ...type.body, color: colors.brandInk, fontWeight: '700' },
  shareActionBtnText: { ...type.body, color: colors.textPrimary },
});

export default LienVisionScreen;
