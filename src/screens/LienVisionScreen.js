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
  const shareRef = useRef(null);

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
              style={styles.motionToggle}
              onPress={() => {
                Haptics.selectionAsync();
                setReduceMotion((v) => !v);
              }}
              hitSlop={10}
            >
              <Text style={styles.motionToggleText}>
                {reduceMotion ? 'Motion off' : 'Motion on'}
              </Text>
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
                <View style={[styles.legendSwatch, { backgroundColor: colors.coinFree }]} />
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
  motionToggle: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  motionToggleText: { ...type.caption, color: colors.textSecondary },
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
