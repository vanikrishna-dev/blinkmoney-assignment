import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Paint,
  Blur,
  RoundedRect,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withSpring,
  useFrameCallback,
} from 'react-native-reanimated';
import { buildCoins, COIN_COUNT } from './coinModel';
import { colors, radius } from '../theme/tokens';

const AnimatedCoin = ({ coin, time, lienProgress, reduceMotion }) => {
  const cx = useDerivedValue(() => {
    if (reduceMotion.value === 1) return coin.x;
    return coin.x + Math.sin(time.value * coin.driftSpeedX + coin.driftSeedX) * coin.driftAmpX;
  });
  const cy = useDerivedValue(() => {
    if (reduceMotion.value === 1) return coin.y;
    return coin.y + Math.cos(time.value * coin.driftSpeedY + coin.driftSeedY) * coin.driftAmpY;
  });

  const shineAngle = useDerivedValue(
    () => time.value * coin.spinSpeed + coin.spinPhase
  );
  const shineX = useDerivedValue(
    () => cx.value + Math.cos(shineAngle.value) * (coin.radius * 0.4)
  );
  const shineY = useDerivedValue(
    () => cy.value + Math.sin(shineAngle.value) * (coin.radius * 0.4)
  );

  const ringOpacity = useDerivedValue(() => lienProgress.value);
  const ringHaloOpacity = useDerivedValue(() => lienProgress.value * 0.4);
  const ringRadius = useDerivedValue(() => coin.radius + 4 + lienProgress.value * 2);
  const dimOpacity = useDerivedValue(() => lienProgress.value * 0.35);
  const glowRadius = coin.radius + 6;

  return (
    <Group>
      <Circle cx={cx} cy={cy} r={glowRadius} color={colors.brandGlow} opacity={0.4}>
        <Paint>
          <Blur blur={8} />
        </Paint>
      </Circle>

      <Circle cx={cx} cy={cy} r={coin.radius} color={colors.coinFreeDark} />
      <Circle cx={cx} cy={cy} r={coin.radius - 2} color={colors.coinFree} />

      <Circle cx={shineX} cy={shineY} r={coin.radius * 0.32} color="rgba(255,255,255,0.5)">
        <Paint>
          <Blur blur={3} />
        </Paint>
      </Circle>

      <Circle cx={cx} cy={cy} r={coin.radius} color="rgba(0,0,0,1)" opacity={dimOpacity} />

      <Circle
        cx={cx}
        cy={cy}
        r={ringRadius}
        color={colors.coinPledgedRing}
        style="stroke"
        strokeWidth={2.5}
        opacity={ringOpacity}
      />
      <Circle
        cx={cx}
        cy={cy}
        r={ringRadius}
        color={colors.coinPledgedRing}
        style="stroke"
        strokeWidth={6}
        opacity={ringHaloOpacity}
      >
        <Paint>
          <Blur blur={6} />
        </Paint>
      </Circle>
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
