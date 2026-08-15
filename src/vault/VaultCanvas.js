import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RoundedRect,
  Text as SkText,
  matchFont,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withSpring,
  useFrameCallback,
} from 'react-native-reanimated';
import { buildCoins, COIN_COUNT } from './coinModel';
import { colors, radius } from '../theme/tokens';

const RUPEE_FONT = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
  fontSize: 22,
  fontStyle: 'normal',
  fontWeight: '900',
});

const AnimatedCoin = ({ coin, time, lienProgress, reduceMotion }) => {
  const cx = useDerivedValue(() => {
    if (reduceMotion.value === 1) return coin.x;
    return coin.x + Math.sin(time.value * coin.driftSpeedX + coin.driftSeedX) * coin.driftAmpX;
  });
  const cy = useDerivedValue(() => {
    if (reduceMotion.value === 1) return coin.y;
    return coin.y + Math.cos(time.value * coin.driftSpeedY + coin.driftSeedY) * coin.driftAmpY;
  });

  const ringOpacity = useDerivedValue(() => lienProgress.value);
  const ringHaloOpacity = useDerivedValue(() => lienProgress.value * 0.35);
  const ringRadius = useDerivedValue(() => coin.radius + 4 + lienProgress.value * 2);
  const ringHaloRadius = useDerivedValue(() => coin.radius + 9 + lienProgress.value * 2);
  const dimOpacity = useDerivedValue(() => lienProgress.value * 0.4);
  const glowRadius = coin.radius + 8;

  const shadowY = useDerivedValue(() => cy.value + 3);
  const topLightY = useDerivedValue(() => cy.value - coin.radius * 0.5);
  const topLightY2 = useDerivedValue(() => cy.value - coin.radius * 0.6);
  const bottomShadowY = useDerivedValue(() => cy.value + coin.radius * 0.45);
  const rupeeX = useDerivedValue(() => cx.value - 7.5);
  const rupeeY = useDerivedValue(() => cy.value + 7.5);

  return (
    <Group>
      {/* soft outer glow */}
      <Circle cx={cx} cy={cy} r={glowRadius + 6} color={colors.coinGlow} opacity={0.1} />
      <Circle cx={cx} cy={cy} r={glowRadius} color={colors.coinGlow} opacity={0.22} />

      {/* drop shadow underneath (fake depth) */}
      <Circle cx={cx} cy={shadowY} r={coin.radius + 1} color="rgba(0,0,0,0.55)" />

      {/* outer metallic rim (dark bronze) */}
      <Circle cx={cx} cy={cy} r={coin.radius} color={colors.coinFreeRim} />
      {/* rim highlight (thin bright ring) */}
      <Circle
        cx={cx}
        cy={cy}
        r={coin.radius - 1.5}
        color={colors.coinFreeBright}
      />
      {/* recessed face */}
      <Circle cx={cx} cy={cy} r={coin.radius - 4} color={colors.coinFree} />

      {/* top light gradient — layered semi-transparent white circles offset up */}
      <Circle
        cx={cx}
        cy={topLightY}
        r={coin.radius * 0.62}
        color="rgba(255,255,255,0.22)"
      />
      <Circle
        cx={cx}
        cy={topLightY2}
        r={coin.radius * 0.38}
        color="rgba(255,255,255,0.28)"
      />


      {/* ₹ symbol dead-center */}
      <SkText
        x={rupeeX}
        y={rupeeY}
        text="₹"
        font={RUPEE_FONT}
        color={colors.coinInk}
      />

      {/* dim overlay when pledged */}
      <Circle cx={cx} cy={cy} r={coin.radius - 0.5} color="#000000" opacity={dimOpacity} />

      {/* pledged ring halo */}
      <Circle
        cx={cx}
        cy={cy}
        r={ringHaloRadius}
        color={colors.coinPledgedRing}
        style="stroke"
        strokeWidth={2}
        opacity={ringHaloOpacity}
      />
      {/* pledged ring core */}
      <Circle
        cx={cx}
        cy={cy}
        r={ringRadius}
        color={colors.coinPledgedRing}
        style="stroke"
        strokeWidth={2.5}
        opacity={ringOpacity}
      />
    </Group>
  );
};

// Fixed-count component so we can safely call the same number of hooks each render
const VaultCanvas = ({ width, height, invested, lienCount, onCoinTap, reduceMotionEnabled }) => {
  const time = useSharedValue(0);
  const reduceMotion = useSharedValue(reduceMotionEnabled ? 1 : 0);

  useEffect(() => {
    reduceMotion.value = reduceMotionEnabled ? 1 : 0;
  }, [reduceMotionEnabled, reduceMotion]);

  useFrameCallback((info) => {
    'worklet';
    time.value += (info.timeSincePreviousFrame ?? 16) / 1000;
  });

  // COIN_COUNT is a compile-time constant, so this loop keeps hook count stable.
  const lienProgress = [];
  for (let i = 0; i < COIN_COUNT; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    lienProgress.push(useSharedValue(0));
  }

  const coins = useMemo(
    () => buildCoins({ invested, canvasWidth: width, canvasHeight: height }),
    [invested, width, height]
  );

  useEffect(() => {
    coins.forEach((_, i) => {
      const target = i < lienCount ? 1 : 0;
      lienProgress[i].value = withSpring(target, {
        damping: 14,
        stiffness: 120,
        mass: 0.6,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lienCount, coins.length]);

  const coinsRef = useRef(coins);
  useEffect(() => {
    coinsRef.current = coins;
  }, [coins]);

  const handlePress = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    let hit = null;
    let hitDist = Infinity;
    coinsRef.current.forEach((coin) => {
      const dx = locationX - coin.x;
      const dy = locationY - coin.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < coin.radius + 8 && d < hitDist) {
        hitDist = d;
        hit = coin;
      }
    });
    if (hit && onCoinTap) {
      const pledged = hit.id < lienCount;
      onCoinTap({ ...hit, pledged });
    }
  };

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Canvas style={{ width, height }}>
        <RoundedRect x={0} y={0} width={width} height={height} r={radius.xl} color={colors.surfaceMuted} />
        {coins.map((coin, i) => (
          <AnimatedCoin
            key={coin.id}
            coin={coin}
            time={time}
            lienProgress={lienProgress[i]}
            reduceMotion={reduceMotion}
          />
        ))}
      </Canvas>
      <Pressable style={StyleSheet.absoluteFill} onPress={handlePress} android_disableSound />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
});

export default VaultCanvas;
export { COIN_COUNT };
