const COIN_COUNT = 40;

const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export const buildCoins = ({ invested, canvasWidth, canvasHeight, seed = 42 }) => {
  const perCoinValue = invested / COIN_COUNT;
  const rand = seededRandom(seed);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const margin = 40;
  const w = Math.max(canvasWidth - margin * 2, 100);
  const h = Math.max(canvasHeight - margin * 2, 100);

  return Array.from({ length: COIN_COUNT }, (_, i) => {
    const ageDays = COIN_COUNT - i;
    return {
      id: i,
      value: perCoinValue,
      investedAt: now - ageDays * dayMs,
      ageDays,
      x: margin + rand() * w,
      y: margin + rand() * h,
      driftSeedX: rand() * Math.PI * 2,
      driftSeedY: rand() * Math.PI * 2,
      driftSpeedX: 0.35 + rand() * 0.4,
      driftSpeedY: 0.3 + rand() * 0.4,
      driftAmpX: 6 + rand() * 8,
      driftAmpY: 5 + rand() * 7,
      spinSpeed: 0.3 + rand() * 0.5,
      spinPhase: rand() * Math.PI * 2,
      radius: 18 + rand() * 4,
    };
  });
};

export const computeLienCount = ({ pledgedAmount, invested }) => {
  if (invested <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, pledgedAmount / invested));
  return Math.round(ratio * COIN_COUNT);
};

export const isPledged = (coinIndex, lienCount) => coinIndex < lienCount;

export const dailyEarnPerCoin = (coin, annualRate = 0.15) => {
  return (coin.value * annualRate) / 365;
};

export const perSecondEarn = (invested, annualRate = 0.15) => {
  return (invested * annualRate) / (365 * 24 * 60 * 60);
};

export const totalEarnedSince = (coin, annualRate = 0.15) => {
  const days = coin.ageDays;
  return dailyEarnPerCoin(coin, annualRate) * days;
};

export { COIN_COUNT };
